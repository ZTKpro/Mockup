/**
 * mockups.js - Plik zawierający funkcje do zarządzania mockupami
 */

const Mockups = (function () {
  // Inicjalizacja debugowania
  if (window.Debug) {
    Debug.info("MOCKUPS", "Inicjalizacja modułu mockupów");
  }

  // Stan modułu
  let mockupsData = []; // Dane wszystkich mockupów
  let mockupThumbnails = []; // Elementy DOM miniatur mockupów
  let selectedMockups = []; // Aktualnie wybrane mockupy

  // Informacje o aktualnym mockupie
  let currentMockupState = {
    path: "",
    name: "",
    id: 0,
    model: "",
  };

  /**
   * Pobiera listę dostępnych mockupów z serwera
   * @returns {Promise<Array>} - Lista mockupów
   */
  async function fetchMockups() {
    if (window.Debug) {
      Debug.debug("MOCKUPS", "Pobieranie listy mockupów z serwera");
    }

    try {
      const response = await fetch("/api/mockups");
      const data = await response.json();

      if (data.success) {
        mockupsData = data.mockups;

        if (window.Debug) {
          Debug.debug("MOCKUPS", `Pobrano ${mockupsData.length} mockupów`);
        }

        return data.mockups;
      } else {
        if (window.Debug) {
          Debug.error("MOCKUPS", "Błąd pobierania mockupów", data.error);
        }
        console.error("Error fetching mockups:", data.error);
        return [];
      }
    } catch (error) {
      if (window.Debug) {
        Debug.error("MOCKUPS", "Wyjątek podczas pobierania mockupów", error);
      }
      console.error("Error scanning mockups:", error);
      return [];
    }
  }

  /**
   * Generuje HTML dla galerii mockupów
   * @param {Array} mockups - Lista mockupów do wyświetlenia
   */
  function generateMockupThumbnails(mockups) {
    if (window.Debug) {
      Debug.debug(
        "MOCKUPS",
        `Generowanie miniatur dla ${mockups.length} mockupów`
      );
    }

    Elements.mockupGallery.innerHTML = ""; // Wyczyść galerię

    if (mockups.length === 0) {
      if (window.Debug) {
        Debug.debug("MOCKUPS", "Brak mockupów do wyświetlenia");
      }

      // Pokaż tylko przycisk dodawania, jeśli nie ma mockupów
      const addButtonHTML = `
        <div class="mockup-thumbnail window-frame add-mockup-button" title="Dodaj nowy mockup">
          <div class="window-content">
            <div class="add-button-content">+</div>
          </div>
        </div>
      `;
      Elements.mockupGallery.innerHTML = addButtonHTML;
    } else {
      // Grupuj mockupy według modelu
      const mockupsByModel = {};
      mockups.forEach((mockup) => {
        const model = mockup.model || "Inne";
        if (!mockupsByModel[model]) {
          mockupsByModel[model] = [];
        }
        mockupsByModel[model].push(mockup);
      });

      if (window.Debug) {
        Debug.debug(
          "MOCKUPS",
          `Pogrupowano mockupy według ${
            Object.keys(mockupsByModel).length
          } modeli`
        );
      }

      // Generuj filtry modeli
      generateModelFilters(Object.keys(mockupsByModel).sort(), mockupsByModel);

      // Generuj grupy mockupów według modelu
      Object.keys(mockupsByModel)
        .sort()
        .forEach((model) => {
          const mockupsForModel = mockupsByModel[model];

          if (window.Debug) {
            Debug.debug(
              "MOCKUPS",
              `Generowanie grupy dla modelu "${model}" z ${mockupsForModel.length} mockupami`
            );
          }

          const modelGroupHTML = `
            <div class="model-group" data-model="${model}">
              <div class="model-header">
                <div class="model-name">
                  <input type="checkbox" class="group-select-checkbox" id="group-select-${model.replace(
                    /\s+/g,
                    "-"
                  )}" data-model="${model}">
                  <label for="group-select-${model.replace(
                    /\s+/g,
                    "-"
                  )}">${model} <span class="model-count">(${
            mockupsForModel.length
          })</span></label>
                </div>
                <span class="model-collapse-icon">▼</span>
              </div>
              <div class="model-mockups">
                ${generateMockupsHTML(mockupsForModel)}
              </div>
            </div>
          `;

          Elements.mockupGallery.innerHTML += modelGroupHTML;
        });

      // Dodaj przycisk do dodawania nowych mockupów
      const addButtonHTML = `
        <div class="mockup-thumbnail window-frame add-mockup-button" title="Dodaj nowy mockup">
          <div class="window-content">
            <div class="add-button-content">+</div>
          </div>
        </div>
      `;

      Elements.mockupGallery.innerHTML += addButtonHTML;

      // Ustaw pierwszy mockup jako aktywny, jeśli jest dostępny
      if (mockups.length > 0) {
        if (window.Debug) {
          Debug.debug(
            "MOCKUPS",
            `Ustawienie pierwszego mockupu (ID=${mockups[0].id}) jako aktywnego`
          );
        }

        changeMockup(
          mockups[0].path,
          mockups[0].name,
          mockups[0].id,
          mockups[0].model || "Inne"
        );
      }
    }

    // Skonfiguruj nasłuchiwacze zdarzeń
    setupModelGroupListeners();
    setupThumbnailListeners();
    setupSelectionButtons();
    setupGroupSelectionCheckboxes();
  }

  /**
   * Generuje HTML dla filtrów modeli
   * @param {Array} models - Lista dostępnych modeli
   * @param {Object} mockupsByModel - Mockupy pogrupowane według modelu
   */
  function generateModelFilters(models, mockupsByModel) {
    if (window.Debug) {
      Debug.debug("MOCKUPS", `Generowanie filtrów dla ${models.length} modeli`);
    }

    // if (!Elements.modelFilters) return;

    const searchHTML = `
      <div class="filter-header">Filtruj według modelu:</div>
      <div class="model-search-container">
        <input type="text" id="model-search" class="model-search-input" placeholder="Wyszukaj model...">
      </div>
    `;

    Elements.modelFilters.innerHTML = searchHTML;

    // Dodaj nasłuchiwacz dla pola wyszukiwania
    setTimeout(() => {
      const searchInput = document.getElementById("model-search");

      if (searchInput) {
        searchInput.addEventListener("input", function () {
          const searchTerm = this.value.toLowerCase().trim();

          if (window.Debug) {
            Debug.debug(
              "MOCKUPS",
              `Filtrowanie modeli według tekstu: "${searchTerm}"`
            );
          }

          // Pokaż/ukryj grupy modeli na podstawie wyszukanego terminu
          document.querySelectorAll(".model-group").forEach((group) => {
            const modelName = group.getAttribute("data-model").toLowerCase();

            if (searchTerm === "" || modelName.includes(searchTerm)) {
              group.style.display = "block";
            } else {
              group.style.display = "none";
            }
          });
        });
      }
    }, 100);
  }

  /**
   * Generuje HTML dla mockupów danego modelu
   * @param {Array} mockups - Lista mockupów do wyświetlenia
   * @returns {string} - Kod HTML
   */
  function generateMockupsHTML(mockups) {
    if (window.Debug) {
      Debug.debug("MOCKUPS", `Generowanie HTML dla ${mockups.length} mockupów`);
    }

    let html = "";

    mockups.forEach((mockup) => {
      // Użyj modelu jako wyświetlanej nazwy
      const displayName = mockup.model
        .replace(/\*/g, "")
        .replace(/#/g, "")
        .trim();

      html += `
        <div class="mockup-thumbnail window-frame" 
             data-mockup="${mockup.path}" 
             data-id="${mockup.id}" 
             data-name="${displayName}" 
             data-model="${mockup.model}">
          <input type="checkbox" class="mockup-checkbox" id="checkbox-mockup-${mockup.id}" />
          <div class="window-title-bar">${displayName}</div>
          <div class="window-content">
            <img src="${mockup.path}" alt="${displayName}" />
          </div>
        </div>
      `;
    });

    return html;
  }

  /**
   * Konfiguruje nasłuchiwacze zdarzeń dla grup modeli
   */
  function setupModelGroupListeners() {
    if (window.Debug) {
      Debug.debug("MOCKUPS", "Konfiguracja nasłuchiwaczy dla grup modeli");
    }

    const modelHeaders = document.querySelectorAll(".model-header");
    modelHeaders.forEach((header) => {
      header.addEventListener("click", function () {
        const model = this.closest(".model-group").getAttribute("data-model");
        const mockupsContainer = this.nextElementSibling;
        const icon = this.querySelector(".model-collapse-icon");

        if (window.Debug) {
          Debug.debug(
            "MOCKUPS",
            `Przełączenie widoczności grupy modelu "${model}"`
          );
        }

        mockupsContainer.classList.toggle("collapsed");
        icon.classList.toggle("collapsed");
      });
    });
  }

  /**
   * Konfiguruje nasłuchiwacze zdarzeń dla miniatur
   */
  function setupThumbnailListeners() {
    if (window.Debug) {
      Debug.debug(
        "MOCKUPS",
        "Konfiguracja nasłuchiwaczy dla miniatur mockupów"
      );
    }

    mockupThumbnails = document.querySelectorAll(".mockup-thumbnail");

    // Obsługa kliknięć na miniaturki
    mockupThumbnails.forEach((thumbnail) => {
      thumbnail.addEventListener("click", function (e) {
        // Ignoruj kliknięcie, jeśli kliknięto na checkbox lub jest to przycisk dodawania
        if (
          e.target.type === "checkbox" ||
          this.classList.contains("add-mockup-button")
        )
          return;

        const mockupPath = this.getAttribute("data-mockup");
        const mockupId = parseInt(this.getAttribute("data-id"), 10);
        const mockupName = this.getAttribute("data-name");
        const mockupModel = this.getAttribute("data-model") || "Inne";

        if (window.Debug) {
          Debug.debug(
            "MOCKUPS",
            `Kliknięto miniaturę mockupu ID=${mockupId}, model="${mockupModel}"`
          );
        }

        changeMockup(mockupPath, mockupName, mockupId, mockupModel);
        updateMockupThumbnailSelection(mockupPath);
      });
    });

    // Obsługa checkboxów
    const checkboxes = document.querySelectorAll(".mockup-checkbox");
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", function (e) {
        e.stopPropagation(); // Zatrzymaj propagację zdarzenia

        const mockupDiv = this.closest(".mockup-thumbnail");
        const mockupPath = mockupDiv.getAttribute("data-mockup");
        const mockupId = parseInt(mockupDiv.getAttribute("data-id"), 10);
        const mockupName = mockupDiv.getAttribute("data-name");
        const mockupModel = mockupDiv.getAttribute("data-model") || "Inne";

        if (window.Debug) {
          Debug.debug(
            "MOCKUPS",
            `Zmiana stanu checkboxa mockupu ID=${mockupId} na ${
              this.checked ? "zaznaczony" : "odznaczony"
            }`
          );
        }

        if (this.checked) {
          // Dodaj do wybranych mockupów
          if (!selectedMockups.some((m) => m.path === mockupPath)) {
            selectedMockups.push({
              path: mockupPath,
              id: mockupId,
              name: mockupName,
              model: mockupModel,
            });
          }
        } else {
          // Usuń z wybranych mockupów
          selectedMockups = selectedMockups.filter(
            (mockup) => mockup.path !== mockupPath
          );
        }

        // Aktualizuj stan checkboxa dla grupy na podstawie zaznaczonych checkboxów
        updateGroupCheckboxState(mockupModel);

        if (window.Debug) {
          Debug.debug(
            "MOCKUPS",
            `Aktualnie wybrane mockupy: ${selectedMockups.length}`,
            selectedMockups
          );
        }
        console.log("Wybrane mockupy:", selectedMockups);
      });
    });

    // Dodaj obsługę przycisku dodawania mockupów
    const addMockupButton = document.querySelector(".add-mockup-button");
    if (addMockupButton) {
      addMockupButton.addEventListener("click", function () {
        if (window.Debug) {
          Debug.info("MOCKUPS", "Kliknięto przycisk dodawania mockupów");
        }
        window.location.href = "dodaj.html";
      });
    }
  }

  /**
   * Konfiguruje nasłuchiwacze dla przycisków zaznaczania
   */
  function setupSelectionButtons() {
    if (window.Debug) {
      Debug.debug("MOCKUPS", "Konfiguracja przycisków zaznaczania");
    }

    // Przycisk zaznacz wszystkie
    if (Elements.selectAllButton) {
      Elements.selectAllButton.addEventListener("click", function () {
        if (window.Debug) {
          Debug.info("MOCKUPS", "Kliknięto 'Zaznacz wszystkie'");
        }

        const checkboxes = document.querySelectorAll(".mockup-checkbox");
        checkboxes.forEach((checkbox) => {
          checkbox.checked = true;

          // Emituj zdarzenie zmiany dla każdego checkboxa
          const event = new Event("change", { bubbles: true });
          checkbox.dispatchEvent(event);
        });
      });
    }

    // Przycisk odznacz wszystkie
    if (Elements.deselectAllButton) {
      Elements.deselectAllButton.addEventListener("click", function () {
        if (window.Debug) {
          Debug.info("MOCKUPS", "Kliknięto 'Odznacz wszystkie'");
        }

        const checkboxes = document.querySelectorAll(".mockup-checkbox");
        checkboxes.forEach((checkbox) => {
          checkbox.checked = false;

          // Emituj zdarzenie zmiany dla każdego checkboxa
          const event = new Event("change", { bubbles: true });
          checkbox.dispatchEvent(event);
        });
      });
    }
  }

  /**
   * Konfiguruje nasłuchiwacze dla checkboxów grup
   */
  function setupGroupSelectionCheckboxes() {
    if (window.Debug) {
      Debug.debug("MOCKUPS", "Konfiguracja checkboxów dla grup");
    }

    const groupCheckboxes = document.querySelectorAll(".group-select-checkbox");

    groupCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        const model = this.getAttribute("data-model");
        const isChecked = this.checked;
        const modelGroup = document.querySelector(
          `.model-group[data-model="${model}"]`
        );

        if (window.Debug) {
          Debug.debug(
            "MOCKUPS",
            `Zmiana stanu checkboxa grupy "${model}" na ${
              isChecked ? "zaznaczony" : "odznaczony"
            }`
          );
        }

        if (modelGroup) {
          const checkboxes = modelGroup.querySelectorAll(".mockup-checkbox");

          checkboxes.forEach((cb) => {
            cb.checked = isChecked;

            // Emituj zdarzenie zmiany dla aktualizacji tablicy selectedMockups
            const event = new Event("change", { bubbles: true });
            cb.dispatchEvent(event);
          });
        }
      });
    });
  }

  /**
   * Aktualizuje stan checkboxa grupy na podstawie checkboxów pojedynczych mockupów
   * @param {string} model - Nazwa modelu
   */
  function updateGroupCheckboxState(model) {
    if (window.Debug) {
      Debug.debug(
        "MOCKUPS",
        `Aktualizacja stanu checkboxa grupy dla modelu "${model}"`
      );
    }

    const groupCheckbox = document.querySelector(
      `.group-select-checkbox[data-model="${model}"]`
    );
    if (!groupCheckbox) return;

    const modelGroup = document.querySelector(
      `.model-group[data-model="${model}"]`
    );
    if (!modelGroup) return;

    const allCheckboxes = modelGroup.querySelectorAll(".mockup-checkbox");
    const checkedCheckboxes = modelGroup.querySelectorAll(
      ".mockup-checkbox:checked"
    );

    // Ustaw stan checkboxa grupy na podstawie pojedynczych checkboxów
    if (checkedCheckboxes.length === 0) {
      groupCheckbox.checked = false;
      groupCheckbox.indeterminate = false;

      if (window.Debug) {
        Debug.debug(
          "MOCKUPS",
          `Stan checkboxa grupy "${model}": niezaznaczony`
        );
      }
    } else if (checkedCheckboxes.length === allCheckboxes.length) {
      groupCheckbox.checked = true;
      groupCheckbox.indeterminate = false;

      if (window.Debug) {
        Debug.debug("MOCKUPS", `Stan checkboxa grupy "${model}": zaznaczony`);
      }
    } else {
      groupCheckbox.checked = false;
      groupCheckbox.indeterminate = true;

      if (window.Debug) {
        Debug.debug(
          "MOCKUPS",
          `Stan checkboxa grupy "${model}": częściowo zaznaczony`
        );
      }
    }
  }

  /**
   * Aktualizuje zaznaczenie miniaturki
   * @param {string} selectedMockup - Ścieżka zaznaczonego mockupu
   */
  function updateMockupThumbnailSelection(selectedMockup) {
    if (window.Debug) {
      Debug.debug(
        "MOCKUPS",
        `Aktualizacja zaznaczenia miniaturki: ${selectedMockup}`
      );
    }

    mockupThumbnails.forEach((thumbnail) => {
      // Pomijamy przycisk dodawania przy aktualizowaniu zaznaczenia
      if (!thumbnail.classList.contains("add-mockup-button")) {
        if (thumbnail.getAttribute("data-mockup") === selectedMockup) {
          thumbnail.classList.add("active");
        } else {
          thumbnail.classList.remove("active");
        }
      }
    });
  }

  /**
   * Zmienia aktualny mockup
   * @param {string} mockupPath - Ścieżka do pliku mockupu
   * @param {string} mockupName - Nazwa mockupu
   * @param {number} mockupId - ID mockupu
   * @param {string} mockupModel - Model mockupu
   */
  function changeMockup(mockupPath, mockupName, mockupId, mockupModel) {
    if (window.Debug) {
      Debug.info(
        "MOCKUPS",
        `Zmiana mockupu na ID=${mockupId}, model="${mockupModel || "Inne"}"`,
        { path: mockupPath, name: mockupName }
      );
    }

    // Zapisz parametry aktualnego mockupu przed zmianą
    const event = new CustomEvent("mockupChanging", {
      detail: {
        previousId: currentMockupState.id,
      },
    });
    document.dispatchEvent(event);

    // Zmień mockup
    currentMockupState = {
      path: mockupPath,
      name: mockupName || "Mockup",
      id: mockupId || 0,
      model: mockupModel || "Inne",
    };

    // Zachowaj stan widoczności kontrolek
    const controlsWereVisible = Elements.controls.style.display === "block";
    const instructionsWereVisible =
      Elements.dragInstruction.style.display === "block";

    Elements.mockupImage.src = mockupPath;

    // Obsługa błędów
    Elements.mockupImage.onerror = function () {
      if (window.Debug) {
        Debug.error("MOCKUPS", `Nie można załadować mockupu: ${mockupPath}`);
      }
      console.error(`Nie można załadować mockupu: ${mockupPath}`);
      alert(
        `Nie można załadować mockupu: ${mockupPath}. Używanie placeholdera.`
      );
      Elements.mockupImage.src =
        "https://via.placeholder.com/400x800/ffffff/000000?text=Mockup+Niedostępny";
    };

    // Po załadowaniu mockupu, wczytaj jego parametry
    Elements.mockupImage.onload = function () {
      if (window.Debug) {
        Debug.debug("MOCKUPS", `Mockup załadowany: ${mockupPath}`);
      }

      // Wyemituj zdarzenie zmiany mockupu
      const event = new CustomEvent("mockupChanged", {
        detail: {
          mockupId: currentMockupState.id,
          mockupPath: currentMockupState.path,
          mockupName: currentMockupState.name,
          mockupModel: currentMockupState.model,
        },
      });
      document.dispatchEvent(event);

      // Przywróć widoczność kontrolek
      if (UserImage.isImageLoaded()) {
        Elements.controls.style.display = "block";
        Elements.dragInstruction.style.display = "block";
      }
    };

    // Przywróć kontrolki natychmiast, jeśli obraz jest załadowany
    if (UserImage.isImageLoaded()) {
      setTimeout(function () {
        Elements.controls.style.display = "block";
        Elements.dragInstruction.style.display = "block";
      }, 50);
    }
  }

  /**
   * Inicjalizuje moduł mockupów
   */
  async function init() {
    if (window.Debug) {
      Debug.info("MOCKUPS", "Inicjalizacja modułu mockupów");
    }

    // Pobierz dostępne mockupy
    const availableMockups = await fetchMockups();

    // Generuj miniatury
    generateMockupThumbnails(availableMockups);

    // Obsługa przycisku pobierania zaznaczonych mockupów
    if (Elements.downloadSelectedMockups) {
      Elements.downloadSelectedMockups.addEventListener("click", function () {
        if (selectedMockups.length === 0) {
          if (window.Debug) {
            Debug.warn("MOCKUPS", "Próba pobrania bez zaznaczonych mockupów");
          }
          alert("Najpierw wybierz mockupy do pobrania!");
          return;
        }

        if (!UserImage.isImageLoaded()) {
          if (window.Debug) {
            Debug.warn(
              "MOCKUPS",
              "Próba pobrania bez załadowanego obrazu użytkownika"
            );
          }
          alert("Najpierw wgraj zdjęcie!");
          return;
        }

        if (window.Debug) {
          Debug.info(
            "MOCKUPS",
            `Rozpoczęcie pobierania ${selectedMockups.length} zaznaczonych mockupów`
          );
        }

        // Wyemituj zdarzenie pobierania wielu mockupów
        const event = new CustomEvent("downloadSelectedMockups", {
          detail: {
            mockups: selectedMockups,
          },
        });
        document.dispatchEvent(event);
      });
    }
  }

  // Zwróć publiczny interfejs modułu
  return {
    init,
    fetchMockups,
    generateMockupThumbnails,
    changeMockup,
    updateMockupThumbnailSelection,
    getSelectedMockups: function () {
      return [...selectedMockups];
    },
    getCurrentMockup: function () {
      return { ...currentMockupState };
    },
  };
})();

// Eksport modułu jako obiekt globalny
window.Mockups = Mockups;
