/**
 * elements-manager.js - Moduł zarządzania wieloma elementami na mockupie
 * Zaktualizowany o obsługę zapisu elementów na serwerze
 */

const ElementsManager = (function () {
  // Inicjalizacja debugowania
  if (window.Debug) {
    Debug.info(
      "ELEMENTS_MANAGER",
      "Inicjalizacja modułu zarządzania elementami"
    );
  }

  // Stan modułu
  let elements = []; // Tablica obiektów elementów
  let activeElementIndex = -1; // Indeks aktualnie wybranego elementu
  let nextElementId = 1; // ID dla następnego elementu
  let currentMockupId = null; // Aktualne ID mockupu
  let saveInProgress = false; // Flaga zapobiegająca wielokrotnym zapisom

  // Referencje do elementów DOM dla renderowania
  let elementPreviews = {}; // Obiekt przechowujący elementy podglądu
  let uploadHandlersOverridden = false; // Flaga zapobiegająca wielokrotnym nadpisaniom

  /**
   * Struktura obiektu elementu:
   * {
   *   id: Number,            // Unikalny identyfikator
   *   src: String,           // Źródło obrazu (URL danych lub ścieżka)
   *   name: String,          // Nazwa elementu (np. "Element 1")
   *   transformations: {     // Stan transformacji
   *     x: Number,           // Pozycja X
   *     y: Number,           // Pozycja Y
   *     rotation: Number,    // Rotacja w stopniach
   *     zoom: Number,        // Poziom powiększenia w procentach
   *     layerIndex: Number   // Z-index dla porządkowania warstw
   *   }
   * }
   */

  /**
   * Inicjalizuje moduł
   */
  function init() {
    if (window.Debug) {
      Debug.info("ELEMENTS_MANAGER", "Inicjalizacja modułu");
    }

    // Utwórz elementy UI do zarządzania wieloma elementami
    createElementsManagerUI();

    // Skonfiguruj nasłuchiwacze zdarzeń
    setupEventListeners();

    // Nadpisz istniejące handlery uploadów, aby zintegrować z naszym systemem
    overrideUploadHandlers();

    // Nasłuchuj zmian mockupu, aby załadować powiązane elementy
    document.addEventListener("mockupChanged", handleMockupChanged);
  }

  /**
   * Obsługuje zdarzenie zmiany mockupu
   * @param {CustomEvent} e - zdarzenie mockupChanged
   */
  async function handleMockupChanged(e) {
    const mockupId = e.detail.mockupId;

    if (window.Debug) {
      Debug.debug("ELEMENTS_MANAGER", `Mockup zmieniony na ID=${mockupId}`);
    }

    // Zapisz elementy dla poprzedniego mockupu, jeśli mamy aktualny mockup
    if (currentMockupId && elements.length > 0 && window.Storage) {
      try {
        if (window.Debug) {
          Debug.debug(
            "ELEMENTS_MANAGER",
            `Zapisywanie elementów dla poprzedniego mockupu ID=${currentMockupId}`
          );
        }
        await Storage.saveElementsForMockup(currentMockupId, elements);
      } catch (error) {
        console.error(
          "Błąd zapisywania elementów dla poprzedniego mockupu:",
          error
        );
      }
    }

    // Aktualizuj aktualne ID mockupu
    currentMockupId = mockupId;

    // Załaduj elementy dla nowego mockupu
    await loadElementsForCurrentMockup();
  }

  function getAllElements() {
    // Zwróć kopię tablicy elements posortowaną według indeksu warstwy
    return [...elements].sort(
      (a, b) => a.transformations.layerIndex - b.transformations.layerIndex
    );
  }

  /**
   * Ładuje elementy dla aktualnego mockupu
   */
  async function loadElementsForCurrentMockup() {
    if (!currentMockupId || !window.Storage) return;

    if (window.Debug) {
      Debug.debug(
        "ELEMENTS_MANAGER",
        `Ładowanie elementów dla mockupu ID=${currentMockupId}`
      );
    }

    try {
      // Pokaż wskaźnik ładowania
      showLoadingIndicator("Ładowanie elementów...");

      // Zachowaj aktualne elementy (przed ładowaniem)
      const currentElements = [...elements];
      const hadElements = currentElements.length > 0;

      // ZMODYFIKOWANA LOGIKA: Jeśli mamy elementy - zawsze je przenoś między mockupami
      if (hadElements) {
        // Przenoś elementy między mockupami
        if (window.Debug) {
          Debug.info(
            "ELEMENTS_MANAGER",
            `Przenoszenie ${currentElements.length} elementów do nowego mockupu ID=${currentMockupId}`
          );
        }

        // Zachowaj aktualne elementy
        elements = currentElements;

        // Zapisz te elementy dla nowego mockupu
        if (window.Storage) {
          try {
            await Storage.saveElementsForMockup(currentMockupId, elements);
            if (window.Debug) {
              Debug.debug(
                "ELEMENTS_MANAGER",
                `Zapisano elementy dla nowego mockupu ID=${currentMockupId}`
              );
            }
          } catch (error) {
            console.error("Błąd zapisywania przeniesionych elementów:", error);
          }
        }
      } else {
        // Nie mamy elementów, sprawdź czy są zapisane dla tego mockupu
        const savedElements = await Storage.loadElementsForMockup(
          currentMockupId
        );

        // Jeśli są zapisane elementy, użyj ich
        if (savedElements && savedElements.length > 0) {
          elements = savedElements;

          // Znajdź najwyższe ID elementu
          nextElementId = 1;
          elements.forEach((element) => {
            if (element.id >= nextElementId) {
              nextElementId = element.id + 1;
            }
          });

          if (window.Debug) {
            Debug.info(
              "ELEMENTS_MANAGER",
              `Załadowano ${elements.length} elementów dla mockupu ID=${currentMockupId}`
            );
          }
        } else {
          // Brak zapisanych elementów
          elements = [];
          if (window.Debug) {
            Debug.debug(
              "ELEMENTS_MANAGER",
              `Brak elementów dla mockupu ID=${currentMockupId}`
            );
          }
        }
      }

      // Ustaw aktywny element na pierwszy, jeśli mamy elementy
      activeElementIndex = elements.length > 0 ? 0 : -1;

      // Aktualizuj UI i podglądy
      updateElementsList();
      createOrUpdateElementPreviews();

      // Zastosuj transformacje, jeśli mamy elementy
      if (elements.length > 0 && activeElementIndex >= 0) {
        applyActiveElementTransformations();
      }

      // Pokaż kontrolki
      Elements.controls.style.display = "block";
      Elements.dragInstruction.style.display = "block";

      // Ustaw UserImage jako załadowany
      if (window.UserImage) {
        UserImage.setImageLoaded(true);
      }

      // Ukryj wskaźnik ładowania
      hideLoadingIndicator();
    } catch (error) {
      console.error("Błąd ładowania elementów:", error);
      hideLoadingIndicator();

      // Pokaż powiadomienie o błędzie, jeśli moduł UI jest dostępny
      if (window.UI && UI.showNotification) {
        UI.showNotification("Błąd ładowania elementów: " + error.message, 5000);
      }
    }
  }
  /**
   * Zapisuje aktualne elementy na serwerze
   * @returns {Promise} - Promise rozwiązywane po zakończeniu zapisu
   */
  async function saveCurrentElements() {
    if (!currentMockupId || !window.Storage || saveInProgress) return;

    if (window.Debug) {
      Debug.debug(
        "ELEMENTS_MANAGER",
        `Zapisywanie ${elements.length} elementów dla mockupu ID=${currentMockupId}`
      );
    }

    try {
      saveInProgress = true;

      // Opcjonalnie: Pokaż wskaźnik zapisu
      showSavingIndicator();

      await Storage.saveElementsForMockup(currentMockupId, elements);

      // Opcjonalnie: Pokaż wskaźnik sukcesu
      hideSavingIndicator();
      showSaveSuccessIndicator();

      saveInProgress = false;
    } catch (error) {
      console.error("Błąd zapisywania elementów:", error);
      saveInProgress = false;

      // Ukryj wskaźniki
      hideSavingIndicator();

      // Pokaż powiadomienie o błędzie, jeśli moduł UI jest dostępny
      if (window.UI && UI.showNotification) {
        UI.showNotification(
          "Błąd zapisywania elementów: " + error.message,
          5000
        );
      }
    }
  }

  /**
   * Tworzy elementy UI dla zarządzania elementami
   */
  function createElementsManagerUI() {
    if (window.Debug) {
      Debug.debug("ELEMENTS_MANAGER", "Tworzenie UI zarządzania elementami");
    }

    // Utwórz panel elementów
    const elementsPanel = document.createElement("div");
    elementsPanel.id = "elements-panel";
    elementsPanel.className = "elements-panel";

    // Nagłówek panelu
    elementsPanel.innerHTML = `
      <div class="elements-panel-header">
        <h3>Elementy</h3>
      </div>
      <div class="elements-list" id="elements-list">
        <div class="no-elements-message">Brak dodanych elementów. Kliknij + aby dodać element lub przeciągnij obraz na główny obszar.</div>
      </div>
    `;

    // Znajdź sekcję kontrolek i wstaw nasz panel przed nią
    const controlsSection = document.getElementById("controls");
    if (controlsSection && controlsSection.parentNode) {
      controlsSection.parentNode.insertBefore(elementsPanel, controlsSection);
    } else {
      // Awaryjnie - znajdź sekcję edytora
      const editorSection = document.querySelector(".editor-section");
      if (editorSection) {
        // Wstaw na początku sekcji edytora
        if (editorSection.firstChild) {
          editorSection.insertBefore(elementsPanel, editorSection.firstChild);
        } else {
          editorSection.appendChild(elementsPanel);
        }
      } else {
        console.error(
          "Nie można znaleźć .editor-section, aby dodać panel elementów"
        );
      }
    }

    // Dodaj CSS dla panelu elementów
    addElementsManagerStyles();
  }

  /**
   * Dodaje style CSS dla menedżera elementów
   */
  function addElementsManagerStyles() {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .elements-panel {
        margin-bottom: 20px;
        background-color: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #dee2e6;
        overflow: hidden;
      }
      
      .elements-panel-header {
        padding: 10px 15px;
        background-color: #e9ecef;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .elements-panel-header h3 {
        margin: 0;
        font-size: 16px;
      }
      
      .elements-panel-actions {
        display: flex;
        gap: 5px;
      }
      
      .action-btn {
        width: 28px;
        height: 28px;
        border-radius: 4px;
        background-color: #3498db;
        color: white;
        border: none;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .action-btn:hover {
        background-color: #2980b9;
      }
      
      .elements-list {
        padding: 10px;
        max-height: 200px;
        overflow-y: auto;
      }
      
      .element-item {
        display: flex;
        align-items: center;
        padding: 8px;
        border-radius: 4px;
        margin-bottom: 5px;
        background-color: white;
        border: 1px solid #ddd;
        cursor: pointer;
      }
      
      .element-item.active {
        border-color: #3498db;
        background-color: #ecf0f1;
      }
      
      .element-thumbnail {
        width: 40px;
        height: 40px;
        background-color: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;
        margin-right: 10px;
      }
      
      .element-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      
      .element-details {
        flex: 1;
      }
      
      .element-name {
        font-weight: bold;
        margin-bottom: 3px;
      }
      
      .element-controls {
        display: flex;
        gap: 5px;
      }
      
      .element-control-btn {
        width: 24px;
        height: 24px;
        font-size: 12px;
        padding: 0;
        border-radius: 3px;
      }
      
      .delete-btn {
        background-color: #e74c3c;
      }
      
      .delete-btn:hover {
        background-color: #c0392b;
      }
      
      .no-elements-message {
        text-align: center;
        color: #7f8c8d;
        padding: 20px 10px;
        font-style: italic;
      }
      
      /* Style podglądu elementów */
      .editor-container {
        position: relative;
      }
      
      .element-preview {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        max-width: 100%;
        max-height: 100%;
        z-index: 5;
        pointer-events: none;
      }
      
      .element-preview.active {
        pointer-events: auto;
        cursor: move;
      }
    `;
    document.head.appendChild(styleElement);
  }

  /**
   * Konfiguruje nasłuchiwacze zdarzeń dla menedżera elementów
   */
  function setupEventListeners() {
    if (window.Debug) {
      Debug.debug("ELEMENTS_MANAGER", "Konfigurowanie nasłuchiwaczy zdarzeń");
    }

    // Obsługa zdarzenia załadowania obrazu użytkownika - dla kompatybilności ze starym kodem
    document.addEventListener("userImageLoaded", function () {
      if (window.Debug) {
        Debug.debug("ELEMENTS_MANAGER", "Otrzymano zdarzenie userImageLoaded");
      }

      // Oznacz, że inicjalizacja miała miejsce, aby zapobiec podwójnemu przetwarzaniu
      window._elementsManagerInitialized = true;
    });

    // Obsługa zdarzeń transformChange tylko dla aktywnego elementu
    document.addEventListener("transformChange", function (e) {
      if (activeElementIndex !== -1) {
        const element = elements[activeElementIndex];

        if (element) {
          updateElementTransformation(
            activeElementIndex,
            e.detail.type,
            e.detail.value
          );
          // Aktualizuj podgląd
          updateElementPreview(activeElementIndex);
        }
      }
    });

    // Dodaj obsługę dla zdarzenia resetTransformations
    document.addEventListener("resetTransformations", function () {
      if (window.Debug) {
        Debug.debug(
          "ELEMENTS_MANAGER",
          "Obsługa zdarzenia resetTransformations"
        );
      }

      // Pomiń, jeśli nie ma elementów lub nie ma aktywnego elementu
      if (elements.length === 0 || activeElementIndex === -1) return;

      // Zresetuj transformacje aktywnego elementu do wartości domyślnych
      const activeElement = elements[activeElementIndex];
      if (activeElement) {
        if (window.Debug) {
          Debug.debug(
            "ELEMENTS_MANAGER",
            `Resetowanie transformacji elementu ID ${activeElement.id}`
          );
        }

        // Resetuj do wartości domyślnych z EditorConfig
        activeElement.transformations.x = EditorConfig.defaults.positionX;
        activeElement.transformations.y = EditorConfig.defaults.positionY;
        activeElement.transformations.rotation = EditorConfig.defaults.rotation;
        activeElement.transformations.zoom = EditorConfig.defaults.zoom;

        // Aktualizuj podgląd
        updateElementPreview(activeElementIndex);

        // Jeśli moduł Transformations jest dostępny, zsynchronizuj jego stan z naszym elementem
        if (window.Transformations) {
          const transformState = Transformations.getState();

          // Synchronizuj stan
          transformState.currentX = activeElement.transformations.x;
          transformState.currentY = activeElement.transformations.y;
          transformState.currentRotation =
            activeElement.transformations.rotation;
          transformState.currentZoom = activeElement.transformations.zoom;

          // Zastosuj transformacje
          Transformations.updateTransform();
        }

        // Zapisz zmiany na serwerze
        saveCurrentElements();
      }
    });

    // Dodaj również obsługę dla zdarzenia centerImage
    document.addEventListener("centerImage", function () {
      if (window.Debug) {
        Debug.debug("ELEMENTS_MANAGER", "Obsługa zdarzenia centerImage");
      }

      // Pomiń, jeśli nie ma elementów lub nie ma aktywnego elementu
      if (elements.length === 0 || activeElementIndex === -1) return;

      // Wyśrodkuj aktywny element
      const activeElement = elements[activeElementIndex];
      if (activeElement) {
        if (window.Debug) {
          Debug.debug(
            "ELEMENTS_MANAGER",
            `Centrowanie elementu ID ${activeElement.id}`
          );
        }

        // Ustaw pozycję na środek (0,0)
        activeElement.transformations.x = 0;
        activeElement.transformations.y = 0;

        // Aktualizuj podgląd
        updateElementPreview(activeElementIndex);

        // Jeśli moduł Transformations jest dostępny, zsynchronizuj jego stan z naszym elementem
        if (window.Transformations) {
          const transformState = Transformations.getState();

          // Synchronizuj stan
          transformState.currentX = activeElement.transformations.x;
          transformState.currentY = activeElement.transformations.y;

          // Zastosuj transformacje
          Transformations.updateTransform();

          // Aktualizuj kontrolki UI
          if (window.UI) {
            UI.updateControlsFromState(transformState);
          }
        }

        // Zapisz zmiany na serwerze
        saveCurrentElements();
      }
    });
  }

  /**
   * Nadpisuje istniejące handlery uploadów
   */
  function overrideUploadHandlers() {
    if (uploadHandlersOverridden) {
      return; // Zapobiegaj wielokrotnym nadpisaniom
    }

    if (window.Debug) {
      Debug.debug(
        "ELEMENTS_MANAGER",
        "Nadpisywanie istniejących handlerów uploadu"
      );
    }

    if (window.UserImage) {
      // Poczekaj, aż wszystkie elementy zostaną załadowane
      setTimeout(() => {
        // Nadpisz tylko, jeśli UserImage ma te metody
        if (typeof window.UserImage.handleFileSelect === "function") {
          // Utwórz nasze nadpisanie dla wyboru pliku
          const originalHandleFileSelect = window.UserImage.handleFileSelect;
          window.UserImage.handleFileSelect = function (e) {
            if (window.Debug) {
              Debug.debug("ELEMENTS_MANAGER", "Przechwycono wybór pliku");
            }
            // Zapobiegaj uruchomieniu oryginalnego handlera
            e.stopPropagation();

            // Użyj naszego handlera, który dodaje elementy
            handleUploadedFiles(e.target.files);

            // Oznacz jako obsłużone, aby zapobiec podwójnemu przetwarzaniu
            e._handled = true;
          };
        }

        if (typeof window.UserImage.handleDrop === "function") {
          // Utwórz nasze nadpisanie dla upuszczenia
          const originalHandleDrop = window.UserImage.handleDrop;
          window.UserImage.handleDrop = function (e) {
            if (window.Debug) {
              Debug.debug(
                "ELEMENTS_MANAGER",
                "Przechwycono zdarzenie upuszczenia"
              );
            }
            e.preventDefault();
            e.stopPropagation();

            const dt = e.dataTransfer;
            const files = dt.files;
            handleUploadedFiles(files);

            // Zresetuj wygląd obszaru upuszczania
            if (Elements.dropArea) {
              Elements.dropArea.classList.remove("highlight");
            }
            if (Elements.uploadText) {
              Elements.uploadText.style.display = "block";
            }
            if (Elements.dropText) {
              Elements.dropText.style.display = "none";
            }

            // Oznacz jako obsłużone, aby zapobiec podwójnemu przetwarzaniu
            e._handled = true;
          };
        }

        uploadHandlersOverridden = true;

        if (window.Debug) {
          Debug.info(
            "ELEMENTS_MANAGER",
            "Handlery uploadu pomyślnie nadpisane"
          );
        }
      }, 500); // Poczekaj, aż wszystko zostanie poprawnie załadowane
    }

    // Podłącz się także bezpośrednio do głównych elementów uploadu
    setTimeout(() => {
      const uploadInput = document.getElementById("image-upload");
      const dropArea = document.getElementById("drop-area");

      if (uploadInput) {
        uploadInput.addEventListener("change", function (e) {
          if (window.Debug) {
            Debug.debug(
              "ELEMENTS_MANAGER",
              "Uruchomiono bezpośredni handler dla input file"
            );
          }
          handleUploadedFiles(e.target.files);
        });
      }

      if (dropArea) {
        dropArea.addEventListener("drop", function (e) {
          if (window.Debug) {
            Debug.debug(
              "ELEMENTS_MANAGER",
              "Uruchomiono bezpośredni handler dla drop area"
            );
          }
          e.preventDefault();
          e.stopPropagation();
          const dt = e.dataTransfer;
          const files = dt.files;
          handleUploadedFiles(files);
        });
      }
    }, 1000);
  }

  /**
   * Obsługuje pliki z głównego interfejsu uploadu
   * @param {FileList} files - Przesłane pliki
   */
  async function handleUploadedFiles(files) {
    if (window.Debug) {
      Debug.debug(
        "ELEMENTS_MANAGER",
        "Obsługa przesłanych plików z głównego interfejsu"
      );
    }

    if (!files || files.length === 0) return;

    // Sprawdź, czy już przetwarzamy te pliki, aby zapobiec duplikacji
    if (window._currentlyProcessingFiles) {
      if (window.Debug) {
        Debug.debug(
          "ELEMENTS_MANAGER",
          "Pomijanie duplikatów przetwarzania plików"
        );
      }
      return;
    }

    // Ustaw flagę, aby zapobiec podwójnemu przetwarzaniu
    window._currentlyProcessingFiles = true;

    try {
      // Pokaż komunikat ładowania
      const loadingMsg = document.createElement("div");
      loadingMsg.style.position = "fixed";
      loadingMsg.style.top = "50%";
      loadingMsg.style.left = "50%";
      loadingMsg.style.transform = "translate(-50%, -50%)";
      loadingMsg.style.background = "rgba(0, 0, 0, 0.8)";
      loadingMsg.style.color = "white";
      loadingMsg.style.padding = "20px";
      loadingMsg.style.borderRadius = "10px";
      loadingMsg.style.zIndex = "9999";
      loadingMsg.textContent = "Wgrywanie obrazu...";
      document.body.appendChild(loadingMsg);

      // Przetwórz obraz jak poprzednio, ale dodaj go jako element
      const file = files[0];
      if (file.type.match("image.*")) {
        // Utwórz obiekt FormData
        const formData = new FormData();
        formData.append("image", file);

        // Prześlij na serwer
        const response = await fetch("/api/upload/user-image", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        document.body.removeChild(loadingMsg);

        if (result.success) {
          if (window.Debug) {
            Debug.debug(
              "ELEMENTS_MANAGER",
              "Obraz przesłany pomyślnie, dodawanie jako element"
            );
          }

          // Dla kompatybilności wstecznej, najpierw ustaw źródło podglądu obrazu
          if (Elements.imagePreview) {
            Elements.imagePreview.src = result.imageData;
            // Ukryj oryginalny podgląd obrazu, ponieważ teraz używamy elementów
            Elements.imagePreview.style.display = "none";
          }

          // Dodaj tylko element, jeśli nie mamy już elementu z tym źródłem
          if (!elements.some((e) => e.src === result.imageData)) {
            // Dodaj obraz jako nowy element
            addNewElement(result.imageData);
          } else if (window.Debug) {
            Debug.debug(
              "ELEMENTS_MANAGER",
              "Element z tym źródłem już istnieje, pomijanie"
            );
          }

          // Pokaż kontrolki
          Elements.controls.style.display = "block";
          Elements.dragInstruction.style.display = "block";

          // Ustaw UserImage jako załadowany
          if (window.UserImage) {
            UserImage.setImageLoaded(true);
          }

          // Wyślij zdarzenie dla kompatybilności
          const event = new CustomEvent("userImageLoaded");
          document.dispatchEvent(event);
        } else {
          alert("Błąd: " + (result.error || " Nie udało się przesłać obrazu"));
        }
      } else {
        document.body.removeChild(loadingMsg);
        alert("Proszę wybrać plik ze zdjęciem");
      }

      // Wyczyść flagę przetwarzania
      window._currentlyProcessingFiles = false;
    } catch (error) {
      console.error("Błąd przesyłania obrazu:", error);
      alert("Wystąpił błąd podczas przesyłania obrazu.");
    }
  }

  /**
   * Dodaje nowy element do mockupu
   * @param {string} src - Źródło obrazu (URL danych)
   */
  function addNewElement(src) {
    if (window.Debug) {
      Debug.debug("ELEMENTS_MANAGER", "Dodawanie nowego elementu");
    }

    // Utwórz nowy obiekt elementu
    const newElement = {
      id: nextElementId++,
      src: src,
      name: `Element ${elements.length + 1}`,
      transformations: {
        x: 0,
        y: 0,
        rotation: 0,
        zoom: 100,
        layerIndex: elements.length, // Umieść na wierzchu
      },
    };

    // Dodaj do tablicy elementów
    elements.push(newElement);

    // Ustaw jako aktywny element
    activeElementIndex = elements.length - 1;

    // Aktualizuj UI
    updateElementsList();

    // Utwórz lub zaktualizuj podglądy elementów
    createOrUpdateElementPreviews();

    // Zastosuj transformacje do kontrolek UI
    applyActiveElementTransformations();

    // Ustaw UserImage jako załadowany, jeśli jeszcze nie jest
    if (window.UserImage && !UserImage.isImageLoaded()) {
      UserImage.setImageLoaded(true);
    }

    // Pokaż kontrolki, jeśli nie są jeszcze widoczne
    Elements.controls.style.display = "block";
    Elements.dragInstruction.style.display = "block";

    // Zapisz na serwerze
    saveCurrentElements();
  }

  /**
   * Tworzy lub aktualizuje podglądy elementów w edytorze
   */
  function createOrUpdateElementPreviews() {
    if (window.Debug) {
      Debug.debug(
        "ELEMENTS_MANAGER",
        "Tworzenie/aktualizacja podglądów elementów"
      );
    }

    // Pobierz kontener edytora
    const editorContainer = document.querySelector(".editor-container");
    if (!editorContainer) return;

    // Usuń istniejące podglądy
    const existingPreviews = document.querySelectorAll(".element-preview");
    existingPreviews.forEach((el) => el.remove());

    // Wyczyść referencje
    elementPreviews = {};

    // Utwórz nowe podglądy dla każdego elementu - posortowane według warstwy
    const sortedElements = [...elements].sort(
      (a, b) => a.transformations.layerIndex - b.transformations.layerIndex
    );

    sortedElements.forEach((element, index) => {
      const img = document.createElement("img");
      img.src = element.src;
      img.className = "element-preview";
      img.dataset.elementId = element.id;

      // Ustaw z-index w oparciu o warstwę
      img.style.zIndex = 5 + element.transformations.layerIndex;

      // Zastosuj transformacje
      applyTransformationToElement(img, element.transformations);

      // Dodaj klasę active i zdarzenia przeciągania tylko dla aktywnego elementu
      if (elements.indexOf(element) === activeElementIndex) {
        img.classList.add("active");

        // Dodaj zdarzenia myszy dla przeciągania (tylko dla aktywnego elementu)
        img.addEventListener("mousedown", function (e) {
          if (window.Transformations) {
            Transformations.startDrag(e);
          }
        });
      }

      // Dodaj do dokumentu
      editorContainer.appendChild(img);

      // Zapisz referencję
      elementPreviews[element.id] = img;
    });

    // Ukryj oryginalny podgląd obrazu
    if (Elements.imagePreview) {
      Elements.imagePreview.style.display = "none";
    }
  }

  /**
   * Zastosuj transformację do podglądu elementu
   * @param {HTMLElement} img - Obraz podglądu elementu
   * @param {Object} transform - Obiekt transformacji
   */
  function applyTransformationToElement(img, transform) {
    // Użyj tej samej formuły transformacji, co w module Transformations
    const linearZoomFactor = transform.zoom * 0.01;

    img.style.transform = `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px)) rotate(${transform.rotation}deg) scale(${linearZoomFactor})`;
  }

  /**
   * Aktualizuje listę elementów UI
   */
  function updateElementsList() {
    if (window.Debug) {
      Debug.debug("ELEMENTS_MANAGER", "Aktualizacja listy elementów UI");
    }

    const listContainer = document.getElementById("elements-list");
    if (!listContainer) return;

    if (elements.length === 0) {
      listContainer.innerHTML = `<div class="no-elements-message">Brak dodanych elementów. Kliknij + aby dodać element lub przeciągnij obraz na główny obszar.</div>`;
      return;
    }

    let html = "";

    // Utwórz elementy w odwrotnej kolejności (najwyższa warstwa najpierw)
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      const isActive = i === activeElementIndex;

      html += `
        <div class="element-item ${
          isActive ? "active" : ""
        }" data-index="${i}" data-id="${element.id}">
          <div class="element-thumbnail">
            <img src="${element.src}" alt="${element.name}">
          </div>
          <div class="element-details">
            <div class="element-name">${element.name}</div>
          </div>
          <div class="element-controls">
            <button class="action-btn element-control-btn element-up-btn" title="Warstwa wyżej" ${
              i === elements.length - 1 ? "disabled" : ""
            }>↑</button>
            <button class="action-btn element-control-btn element-down-btn" title="Warstwa niżej" ${
              i === 0 ? "disabled" : ""
            }>↓</button>
            <button class="action-btn element-control-btn delete-btn" title="Usuń element">×</button>
          </div>
        </div>
      `;
    }

    listContainer.innerHTML = html;

    // Dodaj nasłuchiwacze zdarzeń do elementów
    setupElementItemListeners();
  }

  /**
   * Konfiguruje nasłuchiwacze zdarzeń dla elementów na liście
   */
  function setupElementItemListeners() {
    // Wybór elementu
    const elementItems = document.querySelectorAll(".element-item");
    elementItems.forEach((item) => {
      item.addEventListener("click", function (e) {
        if (e.target.tagName !== "BUTTON") {
          const index = parseInt(this.getAttribute("data-index"));
          setActiveElement(index);
        }
      });
    });

    // Przyciski warstwy w górę
    const upButtons = document.querySelectorAll(".element-up-btn");
    upButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.stopPropagation();
        const item = this.closest(".element-item");
        const index = parseInt(item.getAttribute("data-index"));
        moveElementLayer(index, "up");
      });
    });

    // Przyciski warstwy w dół
    const downButtons = document.querySelectorAll(".element-down-btn");
    downButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.stopPropagation();
        const item = this.closest(".element-item");
        const index = parseInt(item.getAttribute("data-index"));
        moveElementLayer(index, "down");
      });
    });

    // Przyciski usuwania
    const deleteButtons = document.querySelectorAll(".delete-btn");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.stopPropagation();
        const item = this.closest(".element-item");
        const index = parseInt(item.getAttribute("data-index"));

        // Potwierdź usunięcie - pozwól na usunięcie ostatniego elementu
        if (confirm("Czy na pewno chcesz usunąć ten element?")) {
          deleteElement(index);
        }
      });
    });
  }

  /**
   * Ustawia aktywny element
   * @param {number} index - Indeks elementu do aktywacji
   */
  function setActiveElement(index) {
    if (window.Debug) {
      Debug.debug(
        "ELEMENTS_MANAGER",
        `Ustawianie aktywnego elementu na indeks ${index}`
      );
    }

    if (index === activeElementIndex || index < 0 || index >= elements.length) {
      return;
    }

    // Ustaw nowy aktywny indeks
    activeElementIndex = index;

    // Aktualizuj UI
    updateElementsList();

    // Aktualizuj podglądy elementów
    createOrUpdateElementPreviews();

    // Zastosuj transformacje
    applyActiveElementTransformations();
  }

  /**
   * Zastosuj transformacje aktywnego elementu do UI
   */
  function applyActiveElementTransformations() {
    if (activeElementIndex === -1) return;

    const element = elements[activeElementIndex];
    if (!element) return;

    if (window.Debug) {
      Debug.debug(
        "ELEMENTS_MANAGER",
        "Zastosowanie transformacji aktywnego elementu",
        element.transformations
      );
    }

    // Aktualizuj stan transformacji
    if (window.Transformations) {
      const transformState = Transformations.getState();

      // Aktualizuj wartości stanu
      transformState.currentX = element.transformations.x;
      transformState.currentY = element.transformations.y;
      transformState.currentRotation = element.transformations.rotation;
      transformState.currentZoom = element.transformations.zoom;

      // Zastosuj transformacje
      Transformations.updateTransform();

      // Aktualizuj kontrolki UI
      if (window.UI) {
        UI.updateControlsFromState(transformState);
      }
    }
  }

  /**
   * Aktualizuje podgląd elementu na podstawie indeksu
   * @param {number} index - Indeks elementu do aktualizacji
   */
  function updateElementPreview(index) {
    if (index < 0 || index >= elements.length) return;

    const element = elements[index];
    const elementId = element.id;

    // Pobierz element podglądu
    const preview = elementPreviews[elementId];
    if (preview) {
      // Zastosuj transformacje
      applyTransformationToElement(preview, element.transformations);
    }
  }

  /**
   * Aktualizuje transformację elementu
   * @param {number} index - Indeks elementu do aktualizacji
   * @param {string} type - Typ transformacji (rotation, zoom, positionX, positionY)
   * @param {number} value - Nowa wartość dla transformacji
   */
  function updateElementTransformation(index, type, value) {
    if (index < 0 || index >= elements.length) return;

    const element = elements[index];

    if (window.Debug) {
      Debug.debug(
        "ELEMENTS_MANAGER",
        `Aktualizacja elementu ${index} ${type} na ${value}`
      );
    }

    // Aktualizuj odpowiednią właściwość transformacji
    switch (type) {
      case "rotation":
        element.transformations.rotation = value;
        break;
      case "zoom":
        element.transformations.zoom = value;
        break;
      case "positionX":
        element.transformations.x = value;
        break;
      case "positionY":
        element.transformations.y = value;
        break;
    }

    // Zapisz zmiany na serwerze z debounce, aby uniknąć zbyt wielu zapisów
    clearTimeout(element._saveTimeout);
    element._saveTimeout = setTimeout(() => {
      saveCurrentElements();
    }, 1000); // Dłuższy debounce dla zapisów na serwerze
  }

  /**
   * Zmienia pozycję warstwy elementu
   * @param {number} index - Indeks elementu do przesunięcia
   * @param {string} direction - Kierunek przesunięcia ("up" lub "down")
   */
  function moveElementLayer(index, direction) {
    if (window.Debug) {
      Debug.debug(
        "ELEMENTS_MANAGER",
        `Przesuwanie elementu ${index} ${direction}`
      );
    }

    if (index < 0 || index >= elements.length) return;

    // Określ nowy indeks na podstawie kierunku
    let newIndex;
    if (direction === "up" && index < elements.length - 1) {
      newIndex = index + 1;
    } else if (direction === "down" && index > 0) {
      newIndex = index - 1;
    } else {
      return; // Brak prawidłowego ruchu
    }

    // Zamień elementy
    const temp = elements[index];
    elements[index] = elements[newIndex];
    elements[newIndex] = temp;

    // Aktualizuj indeksy warstw
    for (let i = 0; i < elements.length; i++) {
      elements[i].transformations.layerIndex = i;
    }

    // Aktualizuj indeks aktywnego elementu, jeśli potrzeba
    if (activeElementIndex === index) {
      activeElementIndex = newIndex;
    } else if (activeElementIndex === newIndex) {
      activeElementIndex = index;
    }

    // Aktualizuj UI
    updateElementsList();

    // Aktualizuj elementy podglądu
    createOrUpdateElementPreviews();

    // Zapisz zmiany na serwerze
    saveCurrentElements();
  }

  /**
   * Usuwa element
   * @param {number} index - Indeks elementu do usunięcia
   */
  function deleteElement(index) {
    if (window.Debug) {
      Debug.debug("ELEMENTS_MANAGER", `Usuwanie elementu o indeksie ${index}`);
    }

    if (index < 0 || index >= elements.length) return;

    // Usuń element
    elements.splice(index, 1);

    // Zresetuj stan, jeśli usunęliśmy ostatni element
    if (elements.length === 0) {
      activeElementIndex = -1;

      // Ukryj kontrolki
      if (Elements.controls) {
        Elements.controls.style.display = "none";
      }

      if (Elements.dragInstruction) {
        Elements.dragInstruction.style.display = "none";
      }

      // Pokaż ponownie obszar uploadu
      if (Elements.uploadText) {
        Elements.uploadText.style.display = "block";
      }

      // Uczyń oryginalny podgląd obrazu ponownie widocznym
      if (Elements.imagePreview) {
        Elements.imagePreview.style.display = "block";
        Elements.imagePreview.src = "./img/placeholder.png"; // Zresetuj do placeholdera
      }

      // Ustaw UserImage jako niezaładowany
      if (window.UserImage) {
        UserImage.setImageLoaded(false);
      }

      // Wyczyść podglądy elementów
      createOrUpdateElementPreviews();

      // Aktualizuj listę elementów, aby pokazać komunikat "brak elementów"
      updateElementsList();

      // Zapisz pustą tablicę elementów na serwerze
      saveCurrentElements();

      return;
    }

    // Aktualizuj indeks aktywnego elementu
    if (activeElementIndex === index) {
      // Ustaw aktywny na następny element lub ostatni
      activeElementIndex = Math.min(index, elements.length - 1);
    } else if (activeElementIndex > index) {
      // Dostosuj aktywny indeks, jeśli usunęliśmy element przed nim
      activeElementIndex--;
    }

    // Ponownie indeksuj wszystkie elementy
    for (let i = 0; i < elements.length; i++) {
      elements[i].transformations.layerIndex = i;
    }

    // Aktualizuj UI
    updateElementsList();

    // Aktualizuj podgląd
    createOrUpdateElementPreviews();

    // Zastosuj transformacje, jeśli mamy elementy
    if (elements.length > 0 && activeElementIndex >= 0) {
      applyActiveElementTransformations();
    }

    // Zapisz zmiany na serwerze
    saveCurrentElements();
  }

  /**
   * Pokaż wskaźnik ładowania dla elementów
   * @param {string} message - Wiadomość do wyświetlenia
   */
  function showLoadingIndicator(message = "Ładowanie...") {
    // Utwórz lub zaktualizuj wskaźnik ładowania
    let loadingIndicator = document.getElementById(
      "elements-loading-indicator"
    );

    if (!loadingIndicator) {
      loadingIndicator = document.createElement("div");
      loadingIndicator.id = "elements-loading-indicator";
      loadingIndicator.style.position = "fixed";
      loadingIndicator.style.top = "50%";
      loadingIndicator.style.left = "50%";
      loadingIndicator.style.transform = "translate(-50%, -50%)";
      loadingIndicator.style.background = "rgba(0, 0, 0, 0.7)";
      loadingIndicator.style.color = "white";
      loadingIndicator.style.padding = "15px 30px";
      loadingIndicator.style.borderRadius = "5px";
      loadingIndicator.style.zIndex = "9999";
      document.body.appendChild(loadingIndicator);
    }

    loadingIndicator.textContent = message;
    loadingIndicator.style.display = "block";
  }

  /**
   * Ukryj wskaźnik ładowania
   */
  function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById(
      "elements-loading-indicator"
    );
    if (loadingIndicator) {
      loadingIndicator.style.display = "none";
    }
  }

  /**
   * Pokaż wskaźnik zapisywania
   */
  function showSavingIndicator() {
    // Dodaj mały wskaźnik zapisywania w rogu
    let savingIndicator = document.getElementById("elements-saving-indicator");

    if (!savingIndicator) {
      savingIndicator = document.createElement("div");
      savingIndicator.id = "elements-saving-indicator";
      savingIndicator.style.position = "fixed";
      savingIndicator.style.bottom = "10px";
      savingIndicator.style.right = "10px";
      savingIndicator.style.background = "rgba(0, 0, 0, 0.7)";
      savingIndicator.style.color = "white";
      savingIndicator.style.padding = "5px 10px";
      savingIndicator.style.borderRadius = "3px";
      savingIndicator.style.fontSize = "12px";
      savingIndicator.style.zIndex = "9998";
      document.body.appendChild(savingIndicator);
    }

    savingIndicator.textContent = "Zapisywanie...";
    savingIndicator.style.display = "block";
  }

  /**
   * Ukryj wskaźnik zapisywania
   */
  function hideSavingIndicator() {
    const savingIndicator = document.getElementById(
      "elements-saving-indicator"
    );
    if (savingIndicator) {
      savingIndicator.style.display = "none";
    }
  }

  /**
   * Krótko pokaż wskaźnik pomyślnego zapisu
   */
  function showSaveSuccessIndicator() {
    let successIndicator = document.getElementById(
      "elements-success-indicator"
    );

    if (!successIndicator) {
      successIndicator = document.createElement("div");
      successIndicator.id = "elements-success-indicator";
      successIndicator.style.position = "fixed";
      successIndicator.style.bottom = "10px";
      successIndicator.style.right = "10px";
      successIndicator.style.background = "rgba(40, 167, 69, 0.7)";
      successIndicator.style.color = "white";
      successIndicator.style.padding = "5px 10px";
      successIndicator.style.borderRadius = "3px";
      successIndicator.style.fontSize = "12px";
      successIndicator.style.zIndex = "9998";
      document.body.appendChild(successIndicator);
    }

    successIndicator.textContent = "Zapisano!";
    successIndicator.style.display = "block";

    // Ukryj po 2 sekundach
    setTimeout(() => {
      successIndicator.style.display = "none";
    }, 2000);
  }

  // Dodaj handler beforeunload, aby zapisać elementy przed zamknięciem strony
  window.addEventListener("beforeunload", function (e) {
    if (currentMockupId && elements.length > 0 && window.Storage) {
      if (window.Debug) {
        Debug.debug(
          "ELEMENTS_MANAGER",
          "Zapisywanie elementów przed zamknięciem strony"
        );
      }

      // To jest operacja synchroniczna przed zamknięciem strony,
      // więc używamy navigator.sendBeacon dla lepszej niezawodności
      const data = new Blob([JSON.stringify({ elements })], {
        type: "application/json",
      });
      navigator.sendBeacon(`/api/mockup-elements/${currentMockupId}`, data);
    }
  });

  // Publiczny interfejs
  return {
    init,
    addNewElement,
    getAllElements,
    getActiveElement: function () {
      return activeElementIndex !== -1 ? elements[activeElementIndex] : null;
    },
    getElementCount: function () {
      return elements.length;
    },
    // Nowe metody
    saveCurrentElements,
    loadElementsForCurrentMockup,
  };
})();

// Eksport jako obiekt globalny
window.ElementsManager = ElementsManager;
