/**
 * index.js - Main application file integrating all modules
 */

// Register initialization with the loader instead of using DOMContentLoaded directly
if (window.Loader) {
  window.Loader.registerInitFunction(initializeApp);
} else {
  // Fallback for when the loader hasn't loaded yet
  document.addEventListener("DOMContentLoaded", function () {
    // Check if Loader is available after a short delay
    setTimeout(function () {
      if (window.Loader) {
        window.Loader.registerInitFunction(initializeApp);
      } else {
        // Direct initialization if Loader is still not available
        initializeApp();
      }
    }, 100);
  });
}

/**
 * Main application initialization function
 */
function initializeApp() {
  // Debug initialization
  if (window.Debug) {
    Debug.info("MAIN", "Starting phone case editor application initialization");
  }

  // Initialize all modules
  initializeModules();
}

/**
 * Initialize all application modules
 */
function initializeModules() {
  if (window.Debug) {
    Debug.info("MAIN", "Initializing main application components");
  } else {
    console.log("Initializing phone case editor application");
  }

  // Initialize transformations
  if (window.Transformations) {
    if (window.Debug) {
      Debug.debug("MAIN", "Initializing transformations module");
    }
    Transformations.init();
  } else {
    console.error("Transformations module not loaded");
  }

  // Initialize UI
  if (window.UI) {
    if (window.Debug) {
      Debug.debug("MAIN", "Initializing UI module");
    }
    UI.init();
  } else {
    console.error("UI module not loaded");
  }

  // Initialize user image handling
  if (window.UserImage) {
    if (window.Debug) {
      Debug.debug("MAIN", "Initializing user image module");
    }
    UserImage.init();
  } else {
    console.error("UserImage module not loaded");
  }

  // Load parameters from localStorage
  if (window.Storage) {
    if (window.Debug) {
      Debug.debug("MAIN", "Loading parameters from localStorage");
    }
    Storage.loadParametersFromLocalStorage();
  } else {
    console.error("Storage module not loaded");
  }

  // Initialize mockups
  if (window.Mockups) {
    if (window.Debug) {
      Debug.debug("MAIN", "Initializing mockups module");
    }
    Mockups.init();
  } else {
    console.error("Mockups module not loaded");
  }

  // Initialize export
  if (window.Export) {
    if (window.Debug) {
      Debug.debug("MAIN", "Initializing export module");
    }
    Export.init();
  } else {
    console.error("Export module not loaded");
  }

  // Set up event listeners
  setupEventListeners();

  if (window.Debug) {
    Debug.info("MAIN", "Application initialization completed successfully");
  }
}

/**
 * Set up event listeners for communication between modules
 */
function setupEventListeners() {
  if (window.Debug) {
    Debug.info("MAIN", "Setting up global event listeners");
  }

  // Handle mockup changes
  document.addEventListener("mockupChanging", function (e) {
    if (window.Debug) {
      Debug.debug("MAIN:EVENT", "mockupChanging event", {
        previousId: e.detail.previousId,
      });
    }

    // Save parameters for previous mockup before changing
    if (e.detail.previousId && window.UserImage && UserImage.isImageLoaded()) {
      if (window.Debug) {
        Debug.debug("MAIN", "Saving parameters before mockup change", {
          mockupId: e.detail.previousId,
          hasImage: UserImage.isImageLoaded(),
        });
      }
      if (window.Storage && window.Transformations) {
        Storage.saveCurrentMockupParameters(
          e.detail.previousId,
          Transformations.getState()
        );
      }
    }
  });

  document.addEventListener("mockupChanged", function (e) {
    if (window.Debug) {
      Debug.debug("MAIN:EVENT", "mockupChanged event", {
        mockupId: e.detail.mockupId,
        mockupPath: e.detail.mockupPath,
        mockupName: e.detail.mockupName,
        mockupModel: e.detail.mockupModel,
      });
    }

    // Load parameters for new mockup
    if (window.UserImage && UserImage.isImageLoaded()) {
      if (window.Debug) {
        Debug.debug("MAIN", "Loading parameters for new mockup", {
          mockupId: e.detail.mockupId,
          hasImage: UserImage.isImageLoaded(),
        });
      }
      if (window.Storage && window.Transformations) {
        const params = Storage.loadMockupParameters(e.detail.mockupId);
        Transformations.loadTransformationParams(params);
      }
    }
  });

  // Handle user image loading
  document.addEventListener("userImageLoaded", function () {
    if (window.Debug) {
      Debug.debug("MAIN:EVENT", "userImageLoaded event");
    }

    // Load parameters for current mockup
    if (window.Mockups && window.Storage && window.Transformations) {
      const currentMockup = Mockups.getCurrentMockup();
      if (window.Debug) {
        Debug.debug("MAIN", "Loading parameters after image load", {
          mockupId: currentMockup.id,
          mockupModel: currentMockup.model,
        });
      }
      const params = Storage.loadMockupParameters(currentMockup.id);
      Transformations.loadTransformationParams(params);
    }
  });

  // Handle transformation changes
  document.addEventListener("transformChange", function (e) {
    if (!window.Transformations) return;

    if (window.Debug) {
      Debug.debug("MAIN:EVENT", "transformChange event", {
        type: e.detail.type,
        value: e.detail.value,
      });
    }

    const state = Transformations.getState();

    switch (e.detail.type) {
      case "rotation":
        if (window.Debug) {
          Debug.debug("MAIN", "Rotation change", {
            from: state.currentRotation,
            to: e.detail.value,
          });
        }
        Transformations.rotateImage(e.detail.value - state.currentRotation);
        break;
      case "zoom":
        if (window.Debug) {
          Debug.debug("MAIN", "Zoom change", {
            from: state.currentZoom,
            to: e.detail.value,
          });
        }
        Transformations.zoomImage(e.detail.value - state.currentZoom);
        break;
      case "positionX":
        if (window.Debug) {
          Debug.debug("MAIN", "Position X change", {
            from: state.currentX,
            to: e.detail.value,
          });
        }
        Transformations.moveImage(e.detail.value, state.currentY);
        break;
      case "positionY":
        if (window.Debug) {
          Debug.debug("MAIN", "Position Y change", {
            from: state.currentY,
            to: e.detail.value,
          });
        }
        Transformations.moveImage(state.currentX, e.detail.value);
        break;
      case "layerOrder":
        if (window.Debug) {
          Debug.debug("MAIN", "Layer order change", {
            layerFront: e.detail.value,
          });
        }
        Transformations.setLayerOrder(e.detail.value);
        break;
      case "backgroundColor":
        if (window.Debug) {
          Debug.debug("MAIN", "Background color change", {
            color: e.detail.value,
          });
        }
        Transformations.setBackgroundColor(e.detail.value);
        break;
    }

    // Save parameters after change
    if (window.Mockups && window.Storage && window.UserImage) {
      const currentMockup = Mockups.getCurrentMockup();
      if (currentMockup.id && UserImage.isImageLoaded()) {
        if (window.Debug) {
          Debug.debug("MAIN", "Saving parameters after transformation", {
            mockupId: currentMockup.id,
            type: e.detail.type,
          });
        }
        Storage.saveCurrentMockupParameters(
          currentMockup.id,
          Transformations.getState()
        );
      }
    }
  });

  // Handle transformation reset
  document.addEventListener("resetTransformations", function () {
    if (window.Debug) {
      Debug.debug("MAIN:EVENT", "resetTransformations event");
    }

    if (window.Transformations) {
      Transformations.resetTransformations();
    }

    // Save parameters after reset
    if (
      window.Mockups &&
      window.Storage &&
      window.UserImage &&
      window.Transformations
    ) {
      const currentMockup = Mockups.getCurrentMockup();
      if (currentMockup.id && UserImage.isImageLoaded()) {
        if (window.Debug) {
          Debug.debug("MAIN", "Saving parameters after reset", {
            mockupId: currentMockup.id,
          });
        }
        Storage.saveCurrentMockupParameters(
          currentMockup.id,
          Transformations.getState()
        );
      }
    }
  });

  // Handle image centering
  document.addEventListener("centerImage", function () {
    if (window.Debug) {
      Debug.debug("MAIN:EVENT", "centerImage event");
    }

    if (window.Transformations) {
      Transformations.centerImage();
    }

    // Save parameters after centering
    if (
      window.Mockups &&
      window.Storage &&
      window.UserImage &&
      window.Transformations
    ) {
      const currentMockup = Mockups.getCurrentMockup();
      if (currentMockup.id && UserImage.isImageLoaded()) {
        if (window.Debug) {
          Debug.debug("MAIN", "Saving parameters after centering", {
            mockupId: currentMockup.id,
          });
        }
        Storage.saveCurrentMockupParameters(
          currentMockup.id,
          Transformations.getState()
        );
      }
    }
  });

  // Save parameters before page unload
  window.addEventListener("beforeunload", function () {
    if (window.Debug) {
      Debug.debug(
        "MAIN:EVENT",
        "beforeunload event - saving state before closing"
      );
    }

    if (
      window.Mockups &&
      window.Storage &&
      window.UserImage &&
      window.Transformations
    ) {
      const currentMockup = Mockups.getCurrentMockup();
      if (currentMockup.id && UserImage.isImageLoaded()) {
        if (window.Debug) {
          Debug.debug("MAIN", "Saving parameters before page unload", {
            mockupId: currentMockup.id,
          });
        }
        Storage.saveCurrentMockupParameters(
          currentMockup.id,
          Transformations.getState()
        );
      }
    }
  });

  if (window.Debug) {
    Debug.info("MAIN", "Event listener setup completed");
  }
}
