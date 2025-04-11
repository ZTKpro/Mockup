/**
 * config.js - Plik zawierający konfiguracje i stałe
 */

// Inicjalizacja debugowania
if (window.Debug) {
  Debug.info("CONFIG", "Inicjalizacja modułu konfiguracji");
}

// Obiekt przechowujący konfigurację aplikacji
const EditorConfig = {
  // Domyślne wartości transformacji
  defaults: {
    rotation: 0,
    zoom: 100,
    positionX: 0,
    positionY: 0,
    layerFront: false,
    backgroundColor: "#FFFFFF",
  },

  // Limity dla transformacji
  limits: {
    rotation: { min: -180, max: 180 },
    zoom: { min: 10, max: 300 },
    position: { min: -150, max: 150 },
  },

  // Opcje eksportu obrazu
  export: {
    defaultFormat: "png",
    defaultSize: 1200,
    availableSizes: [1200, 1000, 800, 600],
    jpgQuality: 0.9,
  },

  // Współczynniki kalibracji
  calibration: {
    defaultXPositionFactor: 1.65,
    defaultYPositionFactor: 1.65,
    defaultZoomFactor: 0.64,
  },
};

// Logowanie szczegółów konfiguracji
if (window.Debug) {
  Debug.debug("CONFIG", "Konfiguracja aplikacji załadowana", {
    defaults: EditorConfig.defaults,
    limits: EditorConfig.limits,
    export: EditorConfig.export,
    calibration: EditorConfig.calibration,
  });
}

// Eksport konfiguracji jako obiekt globalny
window.EditorConfig = EditorConfig;
