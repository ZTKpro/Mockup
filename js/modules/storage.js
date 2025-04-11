/**
 * storage.js - Plik zawierający funkcje do zarządzania pamięcią lokalną
 */

const Storage = (function () {
  // Inicjalizacja debugowania
  if (window.Debug) {
    Debug.info("STORAGE", "Inicjalizacja modułu Storage");
  }

  // Klucze stosowane w localStorage
  const KEYS = {
    MOCKUP_PARAMETERS: "mockupParameters",
    CALIBRATION: "imageCalibration",
  };

  // Przechowuje parametry dla każdego mockupu
  let mockupParameters = {};

  /**
   * Zapisuje parametry obecnie edytowanego mockupu
   * @param {number} mockupId - ID mockupu
   * @param {object} state - Obiekt stanu edytora
   */
  function saveCurrentMockupParameters(mockupId, state) {
    if (mockupId && state.userImageLoaded) {
      if (window.Debug) {
        Debug.debug(
          "STORAGE",
          `Zapisywanie parametrów dla mockupu ID=${mockupId}`,
          state
        );
      }

      mockupParameters[mockupId] = {
        rotation: state.currentRotation,
        zoom: state.currentZoom,
        positionX: state.currentX,
        positionY: state.currentY,
        layerFront: state.isLayerFront,
        backgroundColor: state.currentBackgroundColor,
      };

      // Zapisz do localStorage
      saveParametersToLocalStorage();
    } else {
      if (window.Debug) {
        Debug.warn(
          "STORAGE",
          `Niepoprawne dane dla zapisu parametrów mockupu ID=${mockupId}`,
          {
            mockupId: mockupId,
            userImageLoaded: state ? state.userImageLoaded : undefined,
          }
        );
      }
    }
  }

  /**
   * Wczytuje parametry dla określonego mockupu
   * @param {number} mockupId - ID mockupu
   * @returns {object|null} - Parametry mockupu lub null
   */
  function loadMockupParameters(mockupId) {
    if (mockupId && mockupParameters[mockupId]) {
      if (window.Debug) {
        Debug.debug(
          "STORAGE",
          `Wczytano parametry dla mockupu ID=${mockupId}`,
          mockupParameters[mockupId]
        );
      }
      return mockupParameters[mockupId];
    }

    if (window.Debug) {
      Debug.debug(
        "STORAGE",
        `Brak zapisanych parametrów dla mockupu ID=${mockupId}`
      );
    }
    return null;
  }

  /**
   * Zapisuje wszystkie parametry mockupów do localStorage
   */
  function saveParametersToLocalStorage() {
    if (window.Debug) {
      Debug.debug(
        "STORAGE",
        "Zapisywanie parametrów mockupów do localStorage",
        {
          mockupCount: Object.keys(mockupParameters).length,
        }
      );
    }
    localStorage.setItem(
      KEYS.MOCKUP_PARAMETERS,
      JSON.stringify(mockupParameters)
    );
  }

  /**
   * Wczytuje parametry mockupów z localStorage
   */
  function loadParametersFromLocalStorage() {
    const savedParams = localStorage.getItem(KEYS.MOCKUP_PARAMETERS);
    if (savedParams) {
      try {
        mockupParameters = JSON.parse(savedParams);
        if (window.Debug) {
          Debug.debug("STORAGE", "Wczytano parametry mockupów z localStorage", {
            mockupCount: Object.keys(mockupParameters).length,
          });
        }
      } catch (e) {
        if (window.Debug) {
          Debug.error(
            "STORAGE",
            "Błąd parsowania zapisanych parametrów mockupów",
            e
          );
        }
        console.error("Error parsing saved mockup parameters:", e);
        mockupParameters = {};
      }
    } else {
      if (window.Debug) {
        Debug.debug(
          "STORAGE",
          "Brak zapisanych parametrów mockupów w localStorage"
        );
      }
    }
  }

  /**
   * Zapisuje wartości kalibracji do localStorage
   * @param {object} calibration - Obiekt zawierający parametry kalibracji
   */
  function saveCalibration(calibration) {
    if (window.Debug) {
      Debug.debug(
        "STORAGE",
        "Zapisywanie kalibracji do localStorage",
        calibration
      );
    }
    localStorage.setItem(KEYS.CALIBRATION, JSON.stringify(calibration));
  }

  /**
   * Wczytuje wartości kalibracji z localStorage
   * @returns {object|null} - Parametry kalibracji lub null
   */
  function loadCalibration() {
    const savedCalibration = localStorage.getItem(KEYS.CALIBRATION);
    if (savedCalibration) {
      try {
        const calibration = JSON.parse(savedCalibration);
        if (window.Debug) {
          Debug.debug(
            "STORAGE",
            "Wczytano kalibrację z localStorage",
            calibration
          );
        }
        return calibration;
      } catch (e) {
        if (window.Debug) {
          Debug.error("STORAGE", "Błąd parsowania zapisanej kalibracji", e);
        }
        console.error("Error parsing saved calibration:", e);
        return null;
      }
    }
    if (window.Debug) {
      Debug.debug("STORAGE", "Brak zapisanej kalibracji w localStorage");
    }
    return null;
  }

  // Publiczny interfejs modułu
  return {
    saveCurrentMockupParameters,
    loadMockupParameters,
    saveParametersToLocalStorage,
    loadParametersFromLocalStorage,
    saveCalibration,
    loadCalibration,
  };
})();

// Eksport modułu Storage jako obiekt globalny
window.Storage = Storage;
