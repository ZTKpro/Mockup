/**
 * userImage.js - Plik zawierający funkcje do obsługi obrazu użytkownika
 */

const UserImage = (function () {
  // Stan modułu
  let userImageLoaded = false;

  /**
   * Obsługuje wybór pliku przez użytkownika
   * @param {Event} e - Zdarzenie zmiany input[type=file]
   */
  async function handleFileSelect(e) {
    if (window.Debug) {
      Debug.info("USER_IMAGE", "Wybrano plik przez użytkownika");
    }

    const files = e.target.files;

    if (window.Debug) {
      Debug.debug(
        "USER_IMAGE",
        `Wybrano ${files.length} plików`,
        files.length > 0
          ? {
              name: files[0].name,
              size: files[0].size,
              type: files[0].type,
            }
          : null
      );
    }

    await handleFiles(files);
  }

  /**
   * Obsługuje upuszczenie pliku na obszar drag & drop
   * @param {DragEvent} e - Zdarzenie upuszczenia pliku
   */
  async function handleDrop(e) {
    e.preventDefault();
    const dt = e.dataTransfer;
    const files = dt.files;

    if (window.Debug) {
      Debug.info("USER_IMAGE", `Upuszczono ${files.length} plików`);

      if (files.length > 0) {
        Debug.debug("USER_IMAGE", "Informacje o upuszczonym pliku", {
          name: files[0].name,
          size: files[0].size,
          type: files[0].type,
        });
      }
    }

    if (files.length) {
      await handleFiles(files);
    }

    // Przywróć normalny wygląd obszaru upuszczania
    unhighlight();
  }

  /**
   * Obsługuje pliki przekazane przez użytkownika (wybrane lub upuszczone)
   * @param {FileList} files - Lista plików
   */
  async function handleFiles(files) {
    if (window.Debug) {
      Debug.debug("USER_IMAGE", "Rozpoczęcie obsługi plików", {
        count: files.length,
        type: files.length > 0 ? files[0].type : null,
      });
    }

    if (files.length && files[0].type.match("image.*")) {
      try {
        // Pokaż komunikat o ładowaniu
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

        if (window.Debug) {
          Debug.debug("USER_IMAGE", "Wyświetlono komunikat o ładowaniu");
        }

        // Utwórz obiekt FormData
        const formData = new FormData();
        formData.append("image", files[0]);

        // Wyślij plik na serwer
        if (window.Debug) {
          Debug.debug("USER_IMAGE", "Przesyłanie obrazu do serwera", {
            name: files[0].name,
            size: files[0].size,
            type: files[0].type,
          });
        }

        const response = await fetch("/api/upload/user-image", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        document.body.removeChild(loadingMsg);

        if (window.Debug) {
          Debug.debug("USER_IMAGE", "Wynik przesłania obrazu", {
            success: result.success,
            hasImageData: !!result.imageData,
          });
        }

        if (result.success) {
          // Użyj danych obrazu w formacie base64 zamiast ścieżki do pliku
          Elements.imagePreview.src = result.imageData;

          if (window.Debug) {
            Debug.debug(
              "USER_IMAGE",
              "Przypisano obraz do elementu imagePreview"
            );
          }

          // Po załadowaniu obrazu
          Elements.imagePreview.onload = function () {
            if (window.Debug) {
              Debug.info("USER_IMAGE", "Obraz użytkownika został załadowany");
              Debug.debug("USER_IMAGE", "Wymiary obrazu", {
                width: Elements.imagePreview.naturalWidth,
                height: Elements.imagePreview.naturalHeight,
              });
            }

            // Pokaż kontrolki i instrukcje
            Elements.controls.style.display = "block";
            Elements.dragInstruction.style.display = "block";

            // Ustaw flagę, że obraz użytkownika jest załadowany
            userImageLoaded = true;

            // Wyemituj zdarzenie informujące o załadowaniu obrazu
            const event = new CustomEvent("userImageLoaded");
            document.dispatchEvent(event);

            if (window.Debug) {
              Debug.debug(
                "USER_IMAGE",
                "Wyemitowano zdarzenie userImageLoaded"
              );
            }
          };
        } else {
          if (window.Debug) {
            Debug.error("USER_IMAGE", "Błąd przesyłania obrazu", result.error);
          }
          alert("Error: " + (result.error || "Failed to upload image"));
        }
      } catch (error) {
        if (window.Debug) {
          Debug.error(
            "USER_IMAGE",
            "Wyjątek podczas przesyłania obrazu",
            error
          );
        } else {
          console.error("Error uploading image:", error);
        }
        alert("Wystąpił błąd podczas przesyłania obrazu.");
      }
    } else {
      if (window.Debug) {
        Debug.warn("USER_IMAGE", "Nieprawidłowy typ pliku lub brak pliku", {
          count: files.length,
          type: files.length > 0 ? files[0].type : null,
        });
      }
      alert("Proszę wybrać plik ze zdjęciem");
    }
  }

  /**
   * Reaguje na rozpoczęcie przeciągania pliku nad obszarem drop
   */
  function highlight() {
    if (window.Debug) {
      Debug.debug("USER_IMAGE", "Plik przeciągany nad obszarem upuszczania");
    }

    Elements.dropArea.classList.add("highlight");
    Elements.uploadText.style.display = "none";
    Elements.dropText.style.display = "block";
  }

  /**
   * Reaguje na opuszczenie obszaru drop lub upuszczenie pliku
   */
  function unhighlight() {
    if (window.Debug) {
      Debug.debug(
        "USER_IMAGE",
        "Plik opuścił obszar upuszczania lub został upuszczony"
      );
    }

    Elements.dropArea.classList.remove("highlight");
    Elements.uploadText.style.display = "block";
    Elements.dropText.style.display = "none";
  }

  /**
   * Inicjalizuje moduł i binduje zdarzenia
   */
  function init() {
    if (window.Debug) {
      Debug.info("USER_IMAGE", "Inicjalizacja modułu obrazu użytkownika");
    }

    // Obsługa uploadu pliku przez kliknięcie
    Elements.uploadInput.addEventListener("change", handleFileSelect);

    // Obsługa przeciągnij i upuść
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      Elements.dropArea.addEventListener(eventName, preventDefault);
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      Elements.dropArea.addEventListener(eventName, highlight);
    });

    ["dragleave", "drop"].forEach((eventName) => {
      Elements.dropArea.addEventListener(eventName, unhighlight);
    });

    Elements.dropArea.addEventListener("drop", handleDrop);

    if (window.Debug) {
      Debug.debug(
        "USER_IMAGE",
        "Zainicjalizowano nasłuchiwacze zdarzeń drag & drop"
      );
    }
  }

  /**
   * Zapobiega domyślnemu zachowaniu przeglądarki
   * @param {Event} e - Zdarzenie
   */
  function preventDefault(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Zwróć publiczny interfejs modułu
  return {
    init,
    isImageLoaded: function () {
      return userImageLoaded;
    },
    setImageLoaded: function (value) {
      if (window.Debug) {
        Debug.debug("USER_IMAGE", `Zmiana stanu załadowania obrazu: ${value}`);
      }
      userImageLoaded = value;
    },
  };
})();

// Eksport modułu jako obiekt globalny
window.UserImage = UserImage;
