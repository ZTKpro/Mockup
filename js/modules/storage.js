/**
 * storage.js - Plik zawierający funkcje do zarządzania pamięcią lokalną i serwerową
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

  /**
   * Zapisuje elementy dla określonego mockupu na serwerze
   * @param {number} mockupId - ID mockupu
   * @param {Array} elements - Tablica obiektów elementów
   * @returns {Promise} - Promise rozwiązujący się do sukcesu/porażki
   */
  async function saveElementsForMockup(mockupId, elements) {
    if (!mockupId) {
      if (window.Debug) {
        Debug.warn(
          "STORAGE",
          "Nieprawidłowe ID mockupu dla zapisywania elementów",
          mockupId
        );
      }
      return Promise.reject(new Error("Nieprawidłowe ID mockupu"));
    }

    if (window.Debug) {
      Debug.debug(
        "STORAGE",
        `Zapisywanie ${elements.length} elementów dla mockupu ID=${mockupId} na serwer`
      );
    }

    try {
      // Klonuj elementy aby uniknąć problemów z referencjami
      const elementsToSave = JSON.parse(JSON.stringify(elements));

      // Wyślij na serwer
      const response = await fetch(`/api/mockup-elements/${mockupId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ elements: elementsToSave }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Nieznany błąd zapisywania elementów");
      }

      if (window.Debug) {
        Debug.debug(
          "STORAGE",
          `Pomyślnie zapisano elementy na serwerze dla mockupu ID=${mockupId}`
        );
      }

      return result;
    } catch (error) {
      if (window.Debug) {
        Debug.error("STORAGE", "Błąd zapisywania elementów na serwerze", error);
      }
      console.error("Błąd zapisywania elementów na serwerze:", error);
      return Promise.reject(error);
    }
  }

  /**
   * Wczytuje elementy dla określonego mockupu z serwera
   * @param {number} mockupId - ID mockupu
   * @returns {Promise<Array>} - Promise rozwiązujący się do tablicy obiektów elementów
   */
  async function loadElementsForMockup(mockupId) {
    if (!mockupId) {
      if (window.Debug) {
        Debug.warn(
          "STORAGE",
          "Nieprawidłowe ID mockupu dla wczytywania elementów",
          mockupId
        );
      }
      return Promise.resolve(null);
    }

    if (window.Debug) {
      Debug.debug(
        "STORAGE",
        `Wczytywanie elementów dla mockupu ID=${mockupId} z serwera`
      );
    }

    try {
      // Pobierz z serwera
      const response = await fetch(`/api/mockup-elements/${mockupId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Nieznany błąd wczytywania elementów");
      }

      if (window.Debug) {
        const elementsCount = result.elements ? result.elements.length : 0;
        Debug.debug(
          "STORAGE",
          `Wczytano ${elementsCount} elementów z serwera dla mockupu ID=${mockupId}`
        );
      }

      return result.elements || [];
    } catch (error) {
      if (window.Debug) {
        Debug.error("STORAGE", "Błąd wczytywania elementów z serwera", error);
      }
      console.error("Błąd wczytywania elementów z serwera:", error);
      return Promise.resolve([]);
    }
  }

  /**
   * Usuwa elementy dla określonego mockupu z serwera
   * @param {number} mockupId - ID mockupu
   * @returns {Promise} - Promise rozwiązujący się do sukcesu/porażki
   */
  async function deleteElementsForMockup(mockupId) {
    if (!mockupId) return Promise.resolve();

    if (window.Debug) {
      Debug.debug(
        "STORAGE",
        `Usuwanie elementów dla mockupu ID=${mockupId} z serwera`
      );
    }

    try {
      // Usuń z serwera
      const response = await fetch(`/api/mockup-elements/${mockupId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Nieznany błąd usuwania elementów");
      }

      if (window.Debug) {
        Debug.debug(
          "STORAGE",
          `Pomyślnie usunięto elementy z serwera dla mockupu ID=${mockupId}`
        );
      }

      return result;
    } catch (error) {
      if (window.Debug) {
        Debug.error("STORAGE", "Błąd usuwania elementów z serwera", error);
      }
      console.error("Błąd usuwania elementów z serwera:", error);
      return Promise.reject(error);
    }
  }

  // Publiczny interfejs modułu
  return {
    saveCurrentMockupParameters,
    loadMockupParameters,
    saveParametersToLocalStorage,
    loadParametersFromLocalStorage,
    saveCalibration,
    loadCalibration,

    // Nowe metody dla elementów
    saveElementsForMockup,
    loadElementsForMockup,
    deleteElementsForMockup,
  };
})();

// Eksport modułu Storage jako obiekt globalny
window.Storage = Storage;
