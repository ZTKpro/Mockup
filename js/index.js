/**
 * index.js - Główny plik aplikacji integrujący wszystkie moduły
 */

document.addEventListener("DOMContentLoaded", function () {
  // Inicjalizacja wszystkich modułów
  function initializeApp() {
    console.log("Inicjalizacja aplikacji edytora etui na telefon");

    // Inicjalizacja obsługi transformacji
    Transformations.init();

    // Inicjalizacja obsługi zdarzeń UI
    UI.init();

    // Inicjalizacja obsługi obrazu użytkownika
    UserImage.init();

    // Wczytaj parametry z localStorage
    Storage.loadParametersFromLocalStorage();

    // Inicjalizacja mockupów
    Mockups.init();

    // Inicjalizacja eksportu
    Export.init();

    // Konfiguracja nasłuchiwaczy zdarzeń
    setupEventListeners();
  }

  /**
   * Konfiguruje nasłuchiwacze zdarzeń komunikacji między modułami
   */
  function setupEventListeners() {
    // Obsługa zmiany mockupu
    document.addEventListener("mockupChanging", function (e) {
      // Zapisz parametry poprzedniego mockupu przed zmianą
      if (e.detail.previousId && UserImage.isImageLoaded()) {
        Storage.saveCurrentMockupParameters(
          e.detail.previousId,
          Transformations.getState()
        );
      }
    });

    document.addEventListener("mockupChanged", function (e) {
      // Wczytaj parametry dla nowego mockupu
      if (UserImage.isImageLoaded()) {
        const params = Storage.loadMockupParameters(e.detail.mockupId);
        Transformations.loadTransformationParams(params);
      }
    });

    // Obsługa załadowania obrazu użytkownika
    document.addEventListener("userImageLoaded", function () {
      // Wczytaj parametry dla aktualnego mockupu
      const currentMockup = Mockups.getCurrentMockup();
      const params = Storage.loadMockupParameters(currentMockup.id);
      Transformations.loadTransformationParams(params);
    });

    // Obsługa zmian transformacji
    document.addEventListener("transformChange", function (e) {
      const state = Transformations.getState();

      switch (e.detail.type) {
        case "rotation":
          Transformations.rotateImage(e.detail.value - state.currentRotation);
          break;
        case "zoom":
          Transformations.zoomImage(e.detail.value - state.currentZoom);
          break;
        case "positionX":
          Transformations.moveImage(e.detail.value, state.currentY);
          break;
        case "positionY":
          Transformations.moveImage(state.currentX, e.detail.value);
          break;
        case "layerOrder":
          Transformations.setLayerOrder(e.detail.value);
          break;
        case "backgroundColor":
          Transformations.setBackgroundColor(e.detail.value);
          break;
      }

      // Zapisz parametry po zmianie
      const currentMockup = Mockups.getCurrentMockup();
      if (currentMockup.id && UserImage.isImageLoaded()) {
        Storage.saveCurrentMockupParameters(
          currentMockup.id,
          Transformations.getState()
        );
      }
    });

    // Obsługa resetowania transformacji
    document.addEventListener("resetTransformations", function () {
      Transformations.resetTransformations();

      // Zapisz parametry po resecie
      const currentMockup = Mockups.getCurrentMockup();
      if (currentMockup.id && UserImage.isImageLoaded()) {
        Storage.saveCurrentMockupParameters(
          currentMockup.id,
          Transformations.getState()
        );
      }
    });

    // Obsługa centrowania obrazu
    document.addEventListener("centerImage", function () {
      Transformations.centerImage();

      // Zapisz parametry po centrowaniu
      const currentMockup = Mockups.getCurrentMockup();
      if (currentMockup.id && UserImage.isImageLoaded()) {
        Storage.saveCurrentMockupParameters(
          currentMockup.id,
          Transformations.getState()
        );
      }
    });

    // Zapisz parametry przed zamknięciem strony
    window.addEventListener("beforeunload", function () {
      const currentMockup = Mockups.getCurrentMockup();
      if (currentMockup.id && UserImage.isImageLoaded()) {
        Storage.saveCurrentMockupParameters(
          currentMockup.id,
          Transformations.getState()
        );
      }
    });
  }

  // Rozpocznij inicjalizację aplikacji
  initializeApp();
});
