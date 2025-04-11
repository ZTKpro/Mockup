/**
 * calibration.js - Module for handling image generation calibration
 */

const Calibration = (function () {
  // Debug logging if available
  if (window.Debug) {
    Debug.info("CALIBRATION", "Initializing calibration module");
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

  // Default calibration values
  const defaultCalibration = {
    xPositionFactor: 1,
    yPositionFactor: 1,
    zoomFactor: 0.64,
  };

  // Current calibration values
  let calibration = {
    xPositionFactor: 1,
    yPositionFactor: 1,
    zoomFactor: 0.64,
  };

  /**
   * Initialize the module and assign DOM element references
   */
  function init() {
    if (window.Debug) {
      Debug.info("CALIBRATION", "Initializing DOM elements for calibration");
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

    // Get display value elements
    xPositionFactorValue = document.getElementById("x-position-factor-value");
    yPositionFactorValue = document.getElementById("y-position-factor-value");
    zoomFactorValue = document.getElementById("zoom-factor-value");

    // Get preset buttons
    presetButtons = document.querySelectorAll(".calibration-preset-button");

    if (!calibrationBubble || !calibrationPanel) {
      if (window.Debug) {
        Debug.error("CALIBRATION", "Calibration panel elements not found", {
          calibrationBubble: !!calibrationBubble,
          calibrationPanel: !!calibrationPanel,
        });
      }
      console.error("Calibration panel elements not found");
      return;
    }

    setupEventListeners();
    loadCalibration();
    monkeyPatchGenerateAndDownloadImage();

    if (window.Debug) {
      Debug.info("CALIBRATION", "Calibration module initialized successfully");
    }
  }

  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    if (window.Debug) {
      Debug.debug("CALIBRATION", "Setting up calibration event listeners");
    }

    // Open calibration panel
    if (calibrationBubble) {
      calibrationBubble.addEventListener("click", function () {
        if (window.Debug) {
          Debug.debug("CALIBRATION", "Opening calibration panel");
        }
        calibrationPanel.classList.add("active");
      });
    }

    // Close calibration panel
    if (calibrationClose) {
      calibrationClose.addEventListener("click", function () {
        if (window.Debug) {
          Debug.debug("CALIBRATION", "Closing calibration panel");
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
      Debug.debug("CALIBRATION", "Loading calibration from localStorage");
    }

    const savedCalibration = localStorage.getItem("imageCalibration");
    if (savedCalibration) {
      try {
        calibration = JSON.parse(savedCalibration);

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

        if (window.Debug) {
          Debug.debug(
            "CALIBRATION",
            "Loaded saved calibration values",
            calibration
          );
        }

        // Make calibration globally available
        window.calibration = calibration;

        console.log("Loaded saved calibration values:", calibration);
      } catch (e) {
        if (window.Debug) {
          Debug.error("CALIBRATION", "Error loading calibration", e);
        }
        console.error("Error loading calibration:", e);
        resetToDefaultCalibration();
      }
    } else {
      if (window.Debug) {
        Debug.debug(
          "CALIBRATION",
          "No saved calibration found, using defaults"
        );
      }

      // Set default values
      calibration = { ...defaultCalibration };

      // Make calibration globally available
      window.calibration = calibration;
    }
  }

  /**
   * Save calibration values
   */
  function saveCalibration() {
    if (!xPositionFactor || !yPositionFactor || !zoomFactor) {
      console.error("Calibration form elements not found");
      return;
    }

    // Get values from form fields
    calibration.xPositionFactor = parseFloat(xPositionFactor.value);
    calibration.yPositionFactor = parseFloat(yPositionFactor.value);
    calibration.zoomFactor = parseFloat(zoomFactor.value);

    if (window.Debug) {
      Debug.info("CALIBRATION", "Saving calibration values", calibration);
    }

    // Save to localStorage
    localStorage.setItem("imageCalibration", JSON.stringify(calibration));

    // Make calibration globally available
    window.calibration = calibration;

    console.log("Saved calibration values:", calibration);

    // Monkey patch image generation function
    monkeyPatchGenerateAndDownloadImage();

    // Show notification
    showNotification("Calibration settings saved");

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
        "Resetting to default calibration values",
        defaultCalibration
      );
    }

    if (!xPositionFactor || !yPositionFactor || !zoomFactor) {
      console.error("Calibration form elements not found");
      return;
    }

    // Assign default values
    xPositionFactor.value = defaultCalibration.xPositionFactor;
    yPositionFactor.value = defaultCalibration.yPositionFactor;
    zoomFactor.value = defaultCalibration.zoomFactor;

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
          "generateAndDownloadImage function not found!"
        );
      }
      console.error("generateAndDownloadImage function not found!");
      return;
    }

    if (window.Debug) {
      Debug.debug(
        "CALIBRATION",
        "Starting monkey patch of generateAndDownloadImage function"
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
          "Saved original generateAndDownloadImage function"
        );
      }
    }

    // Get original function (either from global window or Export module)
    const originalFn =
      window.originalGenerateAndDownloadImage ||
      window.Export.generateAndDownloadImage;

    // Override function - use function in Export module if available
    if (
      window.Export &&
      typeof window.Export.generateAndDownloadImage === "function"
    ) {
      window.Export.generateAndDownloadImage = async function (
        fileName,
        format,
        size
      ) {
        // Ensure calibration is globally available
        if (!window.calibration) {
          window.calibration = calibration;
        }
        return originalFn.call(window.Export, fileName, format, size);
      };

      if (window.Debug) {
        Debug.info(
          "CALIBRATION",
          "Overrode Export.generateAndDownloadImage function"
        );
      }
    } else {
      window.generateAndDownloadImage = async function (
        fileName,
        format,
        size
      ) {
        // Ensure calibration is globally available
        if (!window.calibration) {
          window.calibration = calibration;
        }
        return originalFn(fileName, format, size);
      };

      if (window.Debug) {
        Debug.info("CALIBRATION", "Overrode generateAndDownloadImage function");
      }
    }

    console.log(
      "Overrode generateAndDownloadImage function with new calibration factors."
    );
  }

  /**
   * Show a notification
   * @param {string} message - Message to display
   */
  function showNotification(message) {
    if (window.Debug) {
      Debug.debug("CALIBRATION", `Showing notification: ${message}`);
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
      return { ...calibration };
    },
  };
})();

// Export as global object
window.Calibration = Calibration;
