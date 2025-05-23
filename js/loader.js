/**
 * improved-loader.js - Fixes module loading order issues
 * Replace your existing loader.js with this file
 */

// List of modules to load - ensuring proper order
const modules = [
  "modules/debug.js",
  "modules/config.js",
  "modules/elements.js",
  "modules/storage.js", // Storage module needs to load early
  "modules/transformations.js",
  "modules/userImage.js",
  "modules/mockups.js",
  "modules/elements-manager.js",
  "modules/export.js",
  "modules/ui.js",
  "modules/calibration.js",
  "index.js", // index.js should always be last
];

// Debugging flag
let loaderDebug = false;

// Module loading status tracking
const loadedModules = {};
let allModulesLoaded = false;

// Store DOMContentLoaded state
let isDOMLoaded = false;
let pendingInitFunctions = [];

// Check if debug mode is enabled
function checkDebugMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const debugParam = urlParams.get("debug") === "true";
  const localStorageDebug = localStorage.getItem("debug") === "true";

  loaderDebug = debugParam || localStorageDebug;

  if (loaderDebug) {
    console.log(
      "%c[LOADER] Debug mode enabled",
      "color: green; font-weight: bold"
    );
  }

  return loaderDebug;
}

// Initialize debug mode
checkDebugMode();

// Function to load scripts sequentially and handle dependencies better
function loadScriptsSequentially(scripts, index) {
  if (index >= scripts.length) {
    allModulesLoaded = true;

    if (loaderDebug || (window.Debug && window.Debug.isEnabled())) {
      console.log(
        "%c[LOADER] All modules loaded successfully",
        "color: green; font-weight: bold"
      );
    } else {
      console.log("All modules loaded successfully");
    }

    // Dispatch event for all modules loaded
    const event = new CustomEvent("allModulesLoaded");
    document.dispatchEvent(event);

    // Run pending initialization functions if DOM is already loaded
    if (isDOMLoaded) {
      runPendingInitFunctions();
    }

    return;
  }

  const script = document.createElement("script");
  script.src = "js/" + scripts[index];

  script.onload = function () {
    // Mark module as loaded
    loadedModules[scripts[index]] = true;

    if (loaderDebug || (window.Debug && window.Debug.isEnabled())) {
      console.log(
        `%c[LOADER] Loaded module: ${scripts[index]}`,
        "color: lightblue"
      );
    } else {
      console.log(`Loaded module: ${scripts[index]}`);
    }

    // If Debug module is loaded, we can use it now
    if (scripts[index] === "modules/debug.js" && window.Debug) {
      window.Debug.info("LOADER", "Debug module loaded");
      if (loaderDebug) {
        window.Debug.init(true);
      }
    }

    // Add delay between module loads to ensure proper initialization
    setTimeout(() => {
      loadScriptsSequentially(scripts, index + 1);
    }, 50); // Small delay to allow module initialization
  };

  script.onerror = function () {
    // Mark module as failed
    loadedModules[scripts[index]] = false;

    if (loaderDebug || (window.Debug && window.Debug.isEnabled())) {
      console.error(
        `%c[LOADER] Error loading module: ${scripts[index]}`,
        "color: red"
      );
    } else {
      console.error(`Error loading module: ${scripts[index]}`);
    }

    // Continue loading remaining modules
    setTimeout(() => {
      loadScriptsSequentially(scripts, index + 1);
    }, 50);
  };

  document.head.appendChild(script);
}

// Function to check if a module is loaded
function isModuleLoaded(moduleName) {
  return !!loadedModules[moduleName];
}

// Function to wait for a specific module to load
function waitForModule(moduleName) {
  return new Promise((resolve) => {
    if (isModuleLoaded(moduleName)) {
      resolve();
      return;
    }

    // Check every 100ms if the module is loaded
    const interval = setInterval(() => {
      if (isModuleLoaded(moduleName)) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}

// Function to wait for all modules to load
function waitForAllModules() {
  return new Promise((resolve) => {
    if (allModulesLoaded) {
      resolve();
      return;
    }

    // Listen for the allModulesLoaded event
    document.addEventListener(
      "allModulesLoaded",
      function onAllModulesLoaded() {
        document.removeEventListener("allModulesLoaded", onAllModulesLoaded);
        resolve();
      }
    );
  });
}

// Register a function to run when DOM is loaded
function registerInitFunction(fn) {
  if (isDOMLoaded && allModulesLoaded) {
    // If DOM and modules are already loaded, run immediately but with a small delay
    setTimeout(fn, 50);
  } else {
    // Otherwise, queue for later execution
    pendingInitFunctions.push(fn);
  }
}

// Run all pending initialization functions with better error handling
function runPendingInitFunctions() {
  if (loaderDebug || (window.Debug && window.Debug.isEnabled())) {
    console.log(
      `%c[LOADER] Running ${pendingInitFunctions.length} pending initialization functions`,
      "color: orange"
    );
  }

  // Run each function separately to isolate errors
  pendingInitFunctions.forEach((fn, index) => {
    setTimeout(() => {
      try {
        fn();
      } catch (e) {
        if (window.Debug && window.Debug.isEnabled()) {
          window.Debug.error(
            "LOADER",
            `Error in initialization function #${index}`,
            e
          );
        } else {
          console.error(`Error in initialization function #${index}:`, e);
        }
      }
    }, index * 50); // Stagger the initialization to prevent race conditions
  });

  // Clear the queue
  pendingInitFunctions = [];
}

// Handle DOMContentLoaded event
document.addEventListener("DOMContentLoaded", function () {
  isDOMLoaded = true;

  if (loaderDebug || (window.Debug && window.Debug.isEnabled())) {
    console.log(
      "%c[LOADER] DOMContentLoaded event fired",
      "color: green; font-weight: bold"
    );
  }

  // If all modules are already loaded, run pending init functions with a small delay
  if (allModulesLoaded) {
    setTimeout(runPendingInitFunctions, 100);
  }
});

// Start loading modules
loadScriptsSequentially(modules, 0);

// Export helper functions as global objects
window.Loader = {
  isModuleLoaded,
  waitForModule,
  waitForAllModules,
  registerInitFunction,
  getLoadedModules: function () {
    return { ...loadedModules };
  },
  isDOMLoaded: function () {
    return isDOMLoaded;
  },
};

// Check if DOM is already loaded (for late script inclusion)
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  if (loaderDebug) {
    console.log(
      "%c[LOADER] DOM already loaded when script executed",
      "color: orange; font-weight: bold"
    );
  }

  // Simulate the DOMContentLoaded event
  setTimeout(function () {
    isDOMLoaded = true;
    if (allModulesLoaded) {
      setTimeout(runPendingInitFunctions, 100);
    }
  }, 0);
}
