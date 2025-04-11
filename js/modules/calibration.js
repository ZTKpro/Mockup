/**
 * calibration.js - Module for handling image generation calibration
 * Zmodyfikowany, aby zapewnić spójne renderowanie na różnych urządzeniach
 */

const Calibration = (function () {
  // Debug logging if available
  if (window.Debug) {
    Debug.info("CALIBRATION", "Inicjalizacja modułu kalibracji");
  }

  // DOM element references
  let calibrationBubble;
  let calibrationPanel;
  let calibrationClose;
  let calibrationSave;
  let calibrationReset;
  let xPositionFactor;
  let yPositionFactor;
  let zoomFactor;
  let xPositionFactorValue;
  let yPositionFactorValue;
  let zoomFactorValue;
  let presetButtons;
  let standardizedModeCheckbox;

  // Standardowe współczynniki kalibracji (te same co w export.js)
  const STANDARD_CALIBRATION = {
    xPositionFactor: 1.0,
    yPositionFactor: 1.0,
    zoomFactor: 2,
    baseDPI: 100,
  };

  // Default calibration values - now matched to standard
  const defaultCalibration = {
    xPositionFactor: STANDARD_CALIBRATION.xPositionFactor,
    yPositionFactor: STANDARD_CALIBRATION.yPositionFactor,
    zoomFactor: STANDARD_CALIBRATION.zoomFactor,
    useStandardized: true, // Nowa opcja dla używania standardowych wartości
  };

  // Current calibration values
  let calibration = { ...defaultCalibration };

  /**
   * Initialize the module and assign DOM element references
   */
  function init() {
    if (window.Debug) {
      Debug.info("CALIBRATION", "Inicjalizacja elementów DOM dla kalibracji");
    }

    // Get DOM elements for calibration
    calibrationBubble = document.getElementById("calibration-bubble");
    calibrationPanel = document.getElementById("calibration-panel");
    calibrationClose = document.getElementById("calibration-close");
    calibrationSave = document.getElementById("calibration-save");
    calibrationReset = document.getElementById("calibration-reset");

    // Get calibration field elements
    xPositionFactor = document.getElementById("x-position-factor");
    yPositionFactor = document.getElementById("y-position-factor");
    zoomFactor = document.getElementById("zoom-factor");
    standardizedModeCheckbox = document.getElementById("standardized-mode");

    // Get display value elements
    xPositionFactorValue = document.getElementById("x-position-factor-value");
    yPositionFactorValue = document.getElementById("y-position-factor-value");
    zoomFactorValue = document.getElementById("zoom-factor-value");

    // Get preset buttons
    presetButtons = document.querySelectorAll(".calibration-preset-button");

    if (!calibrationBubble || !calibrationPanel) {
      if (window.Debug) {
        Debug.error(
          "CALIBRATION",
          "Elementy panelu kalibracji nie znalezione",
          {
            calibrationBubble: !!calibrationBubble,
            calibrationPanel: !!calibrationPanel,
          }
        );
      }
      console.error("Elementy panelu kalibracji nie znalezione");
      return;
    }

    // Add standardized mode checkbox if not present
    addStandardizedModeOption();

    setupEventListeners();
    loadCalibration();
    monkeyPatchGenerateAndDownloadImage();

    if (window.Debug) {
      Debug.info("CALIBRATION", "Moduł kalibracji zainicjalizowany pomyślnie");
    }
  }

  /**
   * Add standardized mode option to the calibration panel
   */
  function addStandardizedModeOption() {
    if (!standardizedModeCheckbox && calibrationPanel) {
      // Create the container for standardized mode option
      const standardizedSection = document.createElement("div");
      standardizedSection.className = "calibration-section";
      standardizedSection.innerHTML = `
        <div class="calibration-section-title">Tryb jednolitego renderowania</div>
        <div class="calibration-option">
          <label class="toggle-switch">
            <input type="checkbox" id="standardized-mode" checked>
            <span class="toggle-slider"></span>
          </label>
          <span class="calibration-option-label">Używaj jednolitych wartości (zalecane)</span>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 5px;">
          Ta opcja zapewnia identyczne renderowanie na wszystkich urządzeniach.
          Zalecane jest pozostawienie jej włączonej.
        </p>
      `;

      // Insert before the actions section
      const actionsSection = calibrationPanel.querySelector(
        ".calibration-actions"
      );
      if (actionsSection) {
        calibrationPanel.insertBefore(standardizedSection, actionsSection);
        standardizedModeCheckbox = document.getElementById("standardized-mode");

        // Add event listener for the checkbox
        if (standardizedModeCheckbox) {
          standardizedModeCheckbox.addEventListener("change", function () {
            const isChecked = this.checked;

            // Enable/disable calibration inputs based on standardized mode
            toggleCalibrationInputs(!isChecked);

            if (window.Debug) {
              Debug.debug(
                "CALIBRATION",
                `Tryb jednolitego renderowania: ${
                  isChecked ? "włączony" : "wyłączony"
                }`
              );
            }
          });
        }
      }
    }
  }

  /**
   * Toggle calibration inputs enabled/disabled state
   * @param {boolean} enabled - Whether inputs should be enabled
   */
  function toggleCalibrationInputs(enabled) {
    const inputs = [xPositionFactor, yPositionFactor, zoomFactor];
    const presetButtons = document.querySelectorAll(
      ".calibration-preset-button"
    );

    inputs.forEach((input) => {
      if (input) input.disabled = !enabled;
    });

    presetButtons.forEach((button) => {
      button.disabled = !enabled;
    });

    // Update the appearance
    const factorContainers = document.querySelectorAll(
      ".calibration-factor-container"
    );
    factorContainers.forEach((container) => {
      if (enabled) {
        container.style.opacity = "1";
      } else {
        container.style.opacity = "0.6";
      }
    });

    // Update presets section
    const presetsSection = document.querySelector(".calibration-presets");
    if (presetsSection) {
      presetsSection.style.opacity = enabled ? "1" : "0.6";
    }
  }

  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    if (window.Debug) {
      Debug.debug(
        "CALIBRATION",
        "Konfiguracja nasłuchiwaczy zdarzeń kalibracji"
      );
    }

    // Open calibration panel
    if (calibrationBubble) {
      calibrationBubble.addEventListener("click", function () {
        if (window.Debug) {
          Debug.debug("CALIBRATION", "Otwieranie panelu kalibracji");
        }
        calibrationPanel.classList.add("active");
      });
    }

    // Close calibration panel
    if (calibrationClose) {
      calibrationClose.addEventListener("click", function () {
        if (window.Debug) {
          Debug.debug("CALIBRATION", "Zamykanie panelu kalibracji");
        }
        calibrationPanel.classList.remove("active");
      });
    }

    // Save calibration settings
    if (calibrationSave) {
      calibrationSave.addEventListener("click", saveCalibration);
    }

    // Reset calibration settings
    if (calibrationReset) {
      calibrationReset.addEventListener("click", resetToDefaultCalibration);
    }

    // X position factor input
    if (xPositionFactor) {
      xPositionFactor.addEventListener("input", function () {
        if (window.Debug) {
          Debug.debug(
            "CALIBRATION",
            `X position factor changed: ${this.value}`
          );
        }
        xPositionFactorValue.textContent = this.value;
      });
    }

    // Y position factor input
    if (yPositionFactor) {
      yPositionFactor.addEventListener("input", function () {
        if (window.Debug) {
          Debug.debug(
            "CALIBRATION",
            `Y position factor changed: ${this.value}`
          );
        }
        yPositionFactorValue.textContent = this.value;
      });
    }

    // Zoom factor input
    if (zoomFactor) {
      zoomFactor.addEventListener("input", function () {
        if (window.Debug) {
          Debug.debug("CALIBRATION", `Zoom factor changed: ${this.value}`);
        }
        zoomFactorValue.textContent = this.value;
      });
    }

    // Preset buttons
    if (presetButtons) {
      presetButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const x = parseFloat(this.getAttribute("data-x"));
          const y = parseFloat(this.getAttribute("data-y"));
          const zoom = parseFloat(this.getAttribute("data-zoom"));

          if (window.Debug) {
            Debug.debug("CALIBRATION", "Preset selected", {
              x,
              y,
              zoom,
            });
          }

          xPositionFactor.value = x;
          yPositionFactor.value = y;
          zoomFactor.value = zoom;

          xPositionFactorValue.textContent = x;
          yPositionFactorValue.textContent = y;
          zoomFactorValue.textContent = zoom;
        });
      });
    }
  }

  /**
   * Load calibration values from localStorage
   */
  function loadCalibration() {
    if (window.Debug) {
      Debug.debug("CALIBRATION", "Wczytywanie kalibracji z localStorage");
    }

    const savedCalibration = localStorage.getItem("imageCalibration");
    if (savedCalibration) {
      try {
        calibration = JSON.parse(savedCalibration);

        // Add standardized mode if not present in saved calibration
        if (calibration.useStandardized === undefined) {
          calibration.useStandardized = true;
        }

        // Update form fields
        if (xPositionFactor && yPositionFactor && zoomFactor) {
          xPositionFactor.value = calibration.xPositionFactor;
          yPositionFactor.value = calibration.yPositionFactor;
          zoomFactor.value = calibration.zoomFactor;
        }

        // Update displayed values
        if (xPositionFactorValue && yPositionFactorValue && zoomFactorValue) {
          xPositionFactorValue.textContent = calibration.xPositionFactor;
          yPositionFactorValue.textContent = calibration.yPositionFactor;
          zoomFactorValue.textContent = calibration.zoomFactor;
        }

        // Update standardized mode checkbox
        if (standardizedModeCheckbox) {
          standardizedModeCheckbox.checked = calibration.useStandardized;
          toggleCalibrationInputs(!calibration.useStandardized);
        }

        if (window.Debug) {
          Debug.debug(
            "CALIBRATION",
            "Wczytano zapisane wartości kalibracji",
            calibration
          );
        }

        // Make calibration globally available
        window.calibration = calibration.useStandardized
          ? STANDARD_CALIBRATION
          : calibration;

        console.log("Wczytano zapisane wartości kalibracji:", calibration);
      } catch (e) {
        if (window.Debug) {
          Debug.error("CALIBRATION", "Błąd wczytywania kalibracji", e);
        }
        console.error("Błąd wczytywania kalibracji:", e);
        resetToDefaultCalibration();
      }
    } else {
      if (window.Debug) {
        Debug.debug(
          "CALIBRATION",
          "Nie znaleziono zapisanej kalibracji, używanie domyślnych wartości"
        );
      }

      // Set default values
      calibration = { ...defaultCalibration };

      // Make calibration globally available - use standard values
      window.calibration = STANDARD_CALIBRATION;
    }
  }

  /**
   * Save calibration values
   */
  function saveCalibration() {
    if (!xPositionFactor || !yPositionFactor || !zoomFactor) {
      console.error("Elementy formularza kalibracji nie znalezione");
      return;
    }

    // Get standardized mode setting
    const useStandardized = standardizedModeCheckbox
      ? standardizedModeCheckbox.checked
      : true;

    // Get values from form fields
    calibration.xPositionFactor = parseFloat(xPositionFactor.value);
    calibration.yPositionFactor = parseFloat(yPositionFactor.value);
    calibration.zoomFactor = parseFloat(zoomFactor.value);
    calibration.useStandardized = useStandardized;

    if (window.Debug) {
      Debug.info("CALIBRATION", "Zapisywanie wartości kalibracji", calibration);
    }

    // Save to localStorage
    localStorage.setItem("imageCalibration", JSON.stringify(calibration));

    // Make calibration globally available - respect standardized mode setting
    window.calibration = useStandardized ? STANDARD_CALIBRATION : calibration;

    console.log("Zapisano wartości kalibracji:", calibration);
    console.log("Aktywne wartości kalibracji:", window.calibration);

    // Monkey patch image generation function
    monkeyPatchGenerateAndDownloadImage();

    // Show notification
    showNotification("Ustawienia kalibracji zapisane");

    // Close panel
    calibrationPanel.classList.remove("active");
  }

  /**
   * Reset to default values
   */
  function resetToDefaultCalibration() {
    if (window.Debug) {
      Debug.info(
        "CALIBRATION",
        "Reset do domyślnych wartości kalibracji",
        defaultCalibration
      );
    }

    if (!xPositionFactor || !yPositionFactor || !zoomFactor) {
      console.error("Elementy formularza kalibracji nie znalezione");
      return;
    }

    // Assign default values
    xPositionFactor.value = defaultCalibration.xPositionFactor;
    yPositionFactor.value = defaultCalibration.yPositionFactor;
    zoomFactor.value = defaultCalibration.zoomFactor;

    // Set standardized mode to true by default
    if (standardizedModeCheckbox) {
      standardizedModeCheckbox.checked = true;
      toggleCalibrationInputs(false);
    }

    // Update displayed values
    if (xPositionFactorValue && yPositionFactorValue && zoomFactorValue) {
      xPositionFactorValue.textContent = defaultCalibration.xPositionFactor;
      yPositionFactorValue.textContent = defaultCalibration.yPositionFactor;
      zoomFactorValue.textContent = defaultCalibration.zoomFactor;
    }
  }

  /**
   * Monkey patch the image generation function
   */
  function monkeyPatchGenerateAndDownloadImage() {
    // Check if the function exists
    if (
      typeof window.generateAndDownloadImage !== "function" &&
      typeof window.Export?.generateAndDownloadImage !== "function"
    ) {
      if (window.Debug) {
        Debug.error(
          "CALIBRATION",
          "generateAndDownloadImage funkcja nie znaleziona!"
        );
      }
      console.error("generateAndDownloadImage funkcja nie znaleziona!");
      return;
    }

    if (window.Debug) {
      Debug.debug(
        "CALIBRATION",
        "Rozpoczęcie zamiany funkcji generateAndDownloadImage"
      );
    }

    // Save original function
    if (!window.originalGenerateAndDownloadImage) {
      window.originalGenerateAndDownloadImage =
        window.generateAndDownloadImage ||
        window.Export.generateAndDownloadImage;
      if (window.Debug) {
        Debug.debug(
          "CALIBRATION",
          "Zapisano oryginalną funkcję generateAndDownloadImage"
        );
      }
    }

    // Override function is not needed if we use the modified export.js
    // Calibration is now handled directly in export.js
    console.log(
      "Funkcja generateAndDownloadImage używa teraz ujednoliconych współczynników kalibracji."
    );
  }

  /**
   * Show a notification
   * @param {string} message - Message to display
   */
  function showNotification(message) {
    if (window.Debug) {
      Debug.debug("CALIBRATION", `Pokazywanie powiadomienia: ${message}`);
    }

    const notification = document.createElement("div");
    notification.style.position = "fixed";
    notification.style.bottom = "20px";
    notification.style.left = "50%";
    notification.style.transform = "translateX(-50%)";
    notification.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    notification.style.color = "white";
    notification.style.padding = "10px 20px";
    notification.style.borderRadius = "5px";
    notification.style.zIndex = "9999";
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transition = "opacity 0.5s";

      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 2000);
  }

  // Register initialization with the Loader if available
  if (window.Loader) {
    window.Loader.registerInitFunction(init);
  } else {
    // Fallback for when Loader is not available
    document.addEventListener("DOMContentLoaded", function () {
      // Check if Loader is available after a short delay
      setTimeout(function () {
        if (window.Loader) {
          window.Loader.registerInitFunction(init);
        } else {
          // Direct initialization if Loader is still not available
          init();
        }
      }, 500);
    });
  }

  // Public interface
  return {
    init,
    loadCalibration,
    saveCalibration,
    resetToDefaultCalibration,
    getCalibration: function () {
      return calibration.useStandardized
        ? { ...STANDARD_CALIBRATION }
        : { ...calibration };
    },
    getStandardizedCalibration: function () {
      return { ...STANDARD_CALIBRATION };
    },
  };
})();

// Export as global object
window.Calibration = Calibration;
