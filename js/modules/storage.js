/**
 * storage.js - Plik zawierający funkcje do zarządzania pamięcią lokalną
 */

const Storage = (function() {
  // Klucze stosowane w localStorage
  const KEYS = {
    MOCKUP_PARAMETERS: "mockupParameters",
    CALIBRATION: "imageCalibration"
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
      mockupParameters[mockupId] = {
        rotation: state.currentRotation,
        zoom: state.currentZoom,
        positionX: state.currentX,
        positionY: state.currentY,
        layerFront: state.isLayerFront,
        backgroundColor: state.currentBackgroundColor
      };
      
      // Zapisz do localStorage
      saveParametersToLocalStorage();
    }
  }
  
  /**
   * Wczytuje parametry dla określonego mockupu
   * @param {number} mockupId - ID mockupu
   * @returns {object|null} - Parametry mockupu lub null
   */
  function loadMockupParameters(mockupId) {
    if (mockupId && mockupParameters[mockupId]) {
      return mockupParameters[mockupId];
    }
    return null;
  }
  
  /**
   * Zapisuje wszystkie parametry mockupów do localStorage
   */
  function saveParametersToLocalStorage() {
    localStorage.setItem(KEYS.MOCKUP_PARAMETERS, JSON.stringify(mockupParameters));
  }
  
  /**
   * Wczytuje parametry mockupów z localStorage
   */
  function loadParametersFromLocalStorage() {
    const savedParams = localStorage.getItem(KEYS.MOCKUP_PARAMETERS);
    if (savedParams) {
      try {
        mockupParameters = JSON.parse(savedParams);
      } catch (e) {
        console.error("Error parsing saved mockup parameters:", e);
        mockupParameters = {};
      }
    }
  }
  
  /**
   * Zapisuje wartości kalibracji do localStorage
   * @param {object} calibration - Obiekt zawierający parametry kalibracji
   */
  function saveCalibration(calibration) {
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
        return JSON.parse(savedCalibration);
      } catch (e) {
        console.error("Error parsing saved calibration:", e);
        return null;
      }
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
    loadCalibration
  };
})();

// Eksport modułu Storage jako obiekt globalny
window.Storage = Storage;
