/**
 * index.js - Główny plik aplikacji integrujący wszystkie moduły
 */

document.addEventListener("DOMContentLoaded", function () {
  // Inicjalizacja debugowania
  if (window.Debug) {
    Debug.info(
      "MAIN",
      "Rozpoczęcie inicjalizacji aplikacji edytora etui na telefon"
    );
  }

  // Inicjalizacja wszystkich modułów
  function initializeApp() {
    if (window.Debug) {
      Debug.info("MAIN", "Inicjalizacja głównych komponentów aplikacji");
    } else {
      console.log("Inicjalizacja aplikacji edytora etui na telefon");
    }

    // Inicjalizacja obsługi transformacji
    if (window.Debug) {
      Debug.debug("MAIN", "Inicjalizacja modułu transformacji");
    }
    Transformations.init();

    // Inicjalizacja obsługi zdarzeń UI
    if (window.Debug) {
      Debug.debug("MAIN", "Inicjalizacja modułu UI");
    }
    UI.init();

    // Inicjalizacja obsługi obrazu użytkownika
    if (window.Debug) {
      Debug.debug("MAIN", "Inicjalizacja modułu obrazu użytkownika");
    }
    UserImage.init();

    // Wczytaj parametry z localStorage
    if (window.Debug) {
      Debug.debug("MAIN", "Wczytywanie parametrów z localStorage");
    }
    Storage.loadParametersFromLocalStorage();

    // Inicjalizacja mockupów
    if (window.Debug) {
      Debug.debug("MAIN", "Inicjalizacja modułu mockupów");
    }
    Mockups.init();

    // Inicjalizacja eksportu
    if (window.Debug) {
      Debug.debug("MAIN", "Inicjalizacja modułu eksportu");
    }
    Export.init();

    // Konfiguracja nasłuchiwaczy zdarzeń
    if (window.Debug) {
      Debug.debug("MAIN", "Rozpoczęcie konfiguracji nasłuchiwaczy zdarzeń");
    }
    setupEventListeners();

    if (window.Debug) {
      Debug.info("MAIN", "Inicjalizacja aplikacji zakończona pomyślnie");
    }
  }

  /**
   * Konfiguruje nasłuchiwacze zdarzeń komunikacji między modułami
   */
  function setupEventListeners() {
    if (window.Debug) {
      Debug.info("MAIN", "Konfiguracja globalnych nasłuchiwaczy zdarzeń");
    }

    // Obsługa zmiany mockupu
    document.addEventListener("mockupChanging", function (e) {
      if (window.Debug) {
        Debug.debug("MAIN:EVENT", "Zdarzenie mockupChanging", {
          previousId: e.detail.previousId,
        });
      }

      // Zapisz parametry poprzedniego mockupu przed zmianą
      if (e.detail.previousId && UserImage.isImageLoaded()) {
        if (window.Debug) {
          Debug.debug("MAIN", "Zapisywanie parametrów mockupu przed zmianą", {
            mockupId: e.detail.previousId,
            hasImage: UserImage.isImageLoaded(),
          });
        }
        Storage.saveCurrentMockupParameters(
          e.detail.previousId,
          Transformations.getState()
        );
      }
    });

    document.addEventListener("mockupChanged", function (e) {
      if (window.Debug) {
        Debug.debug("MAIN:EVENT", "Zdarzenie mockupChanged", {
          mockupId: e.detail.mockupId,
          mockupPath: e.detail.mockupPath,
          mockupName: e.detail.mockupName,
          mockupModel: e.detail.mockupModel,
        });
      }

      // Wczytaj parametry dla nowego mockupu
      if (UserImage.isImageLoaded()) {
        if (window.Debug) {
          Debug.debug("MAIN", "Wczytywanie parametrów dla nowego mockupu", {
            mockupId: e.detail.mockupId,
            hasImage: UserImage.isImageLoaded(),
          });
        }
        const params = Storage.loadMockupParameters(e.detail.mockupId);
        Transformations.loadTransformationParams(params);
      }
    });

    // Obsługa załadowania obrazu użytkownika
    document.addEventListener("userImageLoaded", function () {
      if (window.Debug) {
        Debug.debug("MAIN:EVENT", "Zdarzenie userImageLoaded");
      }

      // Wczytaj parametry dla aktualnego mockupu
      const currentMockup = Mockups.getCurrentMockup();
      if (window.Debug) {
        Debug.debug("MAIN", "Wczytywanie parametrów po załadowaniu obrazu", {
          mockupId: currentMockup.id,
          mockupModel: currentMockup.model,
        });
      }
      const params = Storage.loadMockupParameters(currentMockup.id);
      Transformations.loadTransformationParams(params);
    });

    // Obsługa zmian transformacji
    document.addEventListener("transformChange", function (e) {
      if (window.Debug) {
        Debug.debug("MAIN:EVENT", "Zdarzenie transformChange", {
          type: e.detail.type,
          value: e.detail.value,
        });
      }

      const state = Transformations.getState();

      switch (e.detail.type) {
        case "rotation":
          if (window.Debug) {
            Debug.debug("MAIN", "Zmiana rotacji", {
              from: state.currentRotation,
              to: e.detail.value,
            });
          }
          Transformations.rotateImage(e.detail.value - state.currentRotation);
          break;
        case "zoom":
          if (window.Debug) {
            Debug.debug("MAIN", "Zmiana powiększenia", {
              from: state.currentZoom,
              to: e.detail.value,
            });
          }
          Transformations.zoomImage(e.detail.value - state.currentZoom);
          break;
        case "positionX":
          if (window.Debug) {
            Debug.debug("MAIN", "Zmiana pozycji X", {
              from: state.currentX,
              to: e.detail.value,
            });
          }
          Transformations.moveImage(e.detail.value, state.currentY);
          break;
        case "positionY":
          if (window.Debug) {
            Debug.debug("MAIN", "Zmiana pozycji Y", {
              from: state.currentY,
              to: e.detail.value,
            });
          }
          Transformations.moveImage(state.currentX, e.detail.value);
          break;
        case "layerOrder":
          if (window.Debug) {
            Debug.debug("MAIN", "Zmiana kolejności warstw", {
              layerFront: e.detail.value,
            });
          }
          Transformations.setLayerOrder(e.detail.value);
          break;
        case "backgroundColor":
          if (window.Debug) {
            Debug.debug("MAIN", "Zmiana koloru tła", {
              color: e.detail.value,
            });
          }
          Transformations.setBackgroundColor(e.detail.value);
          break;
      }

      // Zapisz parametry po zmianie
      const currentMockup = Mockups.getCurrentMockup();
      if (currentMockup.id && UserImage.isImageLoaded()) {
        if (window.Debug) {
          Debug.debug("MAIN", "Zapisywanie parametrów po transformacji", {
            mockupId: currentMockup.id,
            type: e.detail.type,
          });
        }
        Storage.saveCurrentMockupParameters(
          currentMockup.id,
          Transformations.getState()
        );
      }
    });

    // Obsługa resetowania transformacji
    document.addEventListener("resetTransformations", function () {
      if (window.Debug) {
        Debug.debug("MAIN:EVENT", "Zdarzenie resetTransformations");
      }

      Transformations.resetTransformations();

      // Zapisz parametry po resecie
      const currentMockup = Mockups.getCurrentMockup();
      if (currentMockup.id && UserImage.isImageLoaded()) {
        if (window.Debug) {
          Debug.debug(
            "MAIN",
            "Zapisywanie parametrów po resecie transformacji",
            {
              mockupId: currentMockup.id,
            }
          );
        }
        Storage.saveCurrentMockupParameters(
          currentMockup.id,
          Transformations.getState()
        );
      }
    });

    // Obsługa centrowania obrazu
    document.addEventListener("centerImage", function () {
      if (window.Debug) {
        Debug.debug("MAIN:EVENT", "Zdarzenie centerImage");
      }

      Transformations.centerImage();

      // Zapisz parametry po centrowaniu
      const currentMockup = Mockups.getCurrentMockup();
      if (currentMockup.id && UserImage.isImageLoaded()) {
        if (window.Debug) {
          Debug.debug("MAIN", "Zapisywanie parametrów po centrowaniu obrazu", {
            mockupId: currentMockup.id,
          });
        }
        Storage.saveCurrentMockupParameters(
          currentMockup.id,
          Transformations.getState()
        );
      }
    });

    // Zapisz parametry przed zamknięciem strony
    window.addEventListener("beforeunload", function () {
      if (window.Debug) {
        Debug.debug(
          "MAIN:EVENT",
          "Zdarzenie beforeunload - zapisywanie stanu przed zamknięciem"
        );
      }

      const currentMockup = Mockups.getCurrentMockup();
      if (currentMockup.id && UserImage.isImageLoaded()) {
        if (window.Debug) {
          Debug.debug(
            "MAIN",
            "Zapisywanie parametrów przed zamknięciem strony",
            {
              mockupId: currentMockup.id,
            }
          );
        }
        Storage.saveCurrentMockupParameters(
          currentMockup.id,
          Transformations.getState()
        );
      }
    });

    if (window.Debug) {
      Debug.info("MAIN", "Konfiguracja nasłuchiwaczy zdarzeń zakończona");
    }
  }

  // Rozpocznij inicjalizację aplikacji
  initializeApp();
});
