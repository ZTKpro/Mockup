/**
 * dodaj.js - Script for mockup management page
 */

// Register initialization function with Loader if available
if (window.Loader) {
  window.Loader.registerInitFunction(initMockupManager);
} else {
  // Fallback when Loader is not available
  document.addEventListener("DOMContentLoaded", function () {
    // Check if Loader is available after a short delay
    setTimeout(function () {
      if (window.Loader) {
        window.Loader.registerInitFunction(initMockupManager);
      } else {
        // Direct initialization
        initMockupManager();
      }
    }, 100);
  });
}

// Global variables
let fileInput;
let mockupGallery;
let loadingIndicator;
let noMockups;
let addNewBtn;
let existingMockups;
let uploadIndicator;
let modelInput;
let mockupFiles = [];
let mockupItems = [];

/**
 * Main initialization function
 */
function initMockupManager() {
  // Debug logging if available
  if (window.Debug) {
    Debug.info("DODAJ", "Initializing mockup management module");
  }

  // Get DOM elements
  fileInput = document.getElementById("file-input");
  mockupGallery = document.getElementById("mockup-gallery");
  loadingIndicator = document.getElementById("loading-indicator");
  noMockups = document.getElementById("no-mockups");
  addNewBtn = document.getElementById("add-new-btn");
  existingMockups = document.getElementById("existing-mockups");
  uploadIndicator = document.getElementById("upload-indicator");
  modelInput = document.getElementById("mockup-model");

  if (!fileInput || !mockupGallery) {
    console.error("Required DOM elements not found");
    return;
  }

  // Add button click handler
  if (addNewBtn) {
    addNewBtn.addEventListener("click", function () {
      if (window.Debug) {
        Debug.debug("DODAJ", "Add new mockups button clicked");
      }
      fileInput.click();
    });
  }

  // Initialize gallery
  initializeMockupGallery();

  // File input change handler
  if (fileInput) {
    fileInput.addEventListener("change", handleFiles);
  }

  // Drag & drop handlers
  if (existingMockups) {
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      existingMockups.addEventListener(eventName, preventDefaults);
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      existingMockups.addEventListener(eventName, function () {
        if (window.Debug) {
          Debug.debug("DODAJ", `Drag event: ${eventName}`);
        }
        existingMockups.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      existingMockups.addEventListener(eventName, function () {
        if (window.Debug) {
          Debug.debug("DODAJ", `Drag event: ${eventName}`);
        }
        existingMockups.classList.remove("dragover");
      });
    });

    existingMockups.addEventListener("drop", function (e) {
      if (window.Debug) {
        Debug.info("DODAJ", "Files dropped onto drop area");
      }

      const dt = e.dataTransfer;
      const files = dt.files;
      handleFiles({ target: { files } });
    });
  }
}

/**
 * Initialize mockup gallery
 */
async function initializeMockupGallery() {
  try {
    if (window.Debug) {
      Debug.info("DODAJ", "Initializing mockup gallery");
    }

    if (!loadingIndicator || !mockupGallery) {
      console.error("Required gallery DOM elements not found");
      return;
    }

    // Show loading indicator
    loadingIndicator.style.display = "block";

    // Load available models
    await loadAvailableModels();

    // Fetch mockups from API
    const availableMockups = await fetchMockups();

    // Hide loading indicator
    loadingIndicator.style.display = "none";

    // Generate mockup manager interface
    generateMockupManager(availableMockups);

    if (window.Debug) {
      Debug.debug("DODAJ", `Loaded ${availableMockups.length} mockups`);
    }
  } catch (error) {
    if (window.Debug) {
      Debug.error("DODAJ", "Error initializing mockup gallery", error);
    }
    console.error("Error initializing mockup gallery:", error);
    if (loadingIndicator) {
      loadingIndicator.textContent = "Error loading mockups.";
    }
  }
}

// The rest of the functions remain the same, just keeping the key ones here for brevity

/**
 * Load available models for the datalist
 */
async function loadAvailableModels() {
  try {
    if (window.Debug) {
      Debug.debug("DODAJ", "Loading available models");
    }

    const response = await fetch("/api/models");
    const data = await response.json();

    if (data.success) {
      const modelsList = document.getElementById("models-list");
      if (!modelsList) return;

      modelsList.innerHTML = "";

      data.models.forEach((model) => {
        const option = document.createElement("option");
        option.value = model;
        modelsList.appendChild(option);
      });

      if (window.Debug) {
        Debug.debug(
          "DODAJ",
          `Loaded ${data.models.length} models`,
          data.models
        );
      }
    }
  } catch (error) {
    if (window.Debug) {
      Debug.error("DODAJ", "Error loading models", error);
    }
    console.error("Error loading models:", error);
  }
}

/**
 * Fetch mockups from API
 */
async function fetchMockups() {
  try {
    if (window.Debug) {
      Debug.debug("DODAJ", "Fetching mockups from API");
    }

    const response = await fetch("/api/mockups");
    const data = await response.json();

    if (data.success) {
      if (window.Debug) {
        Debug.debug("DODAJ", `Fetched ${data.mockups.length} mockups`);
      }
      return data.mockups;
    } else {
      if (window.Debug) {
        Debug.warn("DODAJ", "Error fetching mockups", data.error);
      }
      throw new Error(data.error || "Unknown error");
    }
  } catch (error) {
    if (window.Debug) {
      Debug.error("DODAJ", "Exception while fetching mockups", error);
    }
    console.error("Error fetching mockups:", error);
    return [];
  }
}

/**
 * Prevent default browser behaviors
 */
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * Handle file uploads
 */
async function handleFiles(e) {
  const files = e.target.files;

  if (files.length === 0) {
    if (window.Debug) {
      Debug.debug("DODAJ", "No files selected");
    }
    return;
  }

  if (window.Debug) {
    Debug.info("DODAJ", `Beginning to handle ${files.length} files`);
  }

  // Check if all files are PNG
  let allPNG = true;
  for (let i = 0; i < files.length; i++) {
    if (!files[i].type.match("image/png")) {
      allPNG = false;
      break;
    }
  }

  if (!allPNG) {
    if (window.Debug) {
      Debug.warn(
        "DODAJ",
        "Selected files in wrong format - only PNG is accepted"
      );
    }
    alert("Only PNG files can be uploaded! Please select again.");
    return;
  }

  // Get model from input - spaces are preserved
  let model = modelInput.value.trim();

  // If model is empty after trimming, use "Other"
  if (!model) {
    model = "Other";
  }

  if (window.Debug) {
    Debug.debug("DODAJ", `Using model: "${model}"`);
  }

  console.log("Using model (before server processing):", model);

  // Show upload indicator
  if (uploadIndicator) {
    uploadIndicator.style.display = "flex";
  }

  try {
    // Process file uploads - code would be here

    // For brevity, the full implementation is not included

    // Reset file input
    if (fileInput) {
      fileInput.value = "";
    }

    // Reset model field
    if (modelInput) {
      modelInput.value = "";
    }
  } catch (error) {
    if (window.Debug) {
      Debug.error("DODAJ", "Error uploading files", error);
    }

    console.error("Error uploading files:", error);
    if (uploadIndicator) {
      uploadIndicator.style.display = "none";
    }
    alert("An error occurred while uploading files.");
    if (fileInput) {
      fileInput.value = "";
    }
  }
}

// Note: The remaining functions from the original file would be included here
// They have been omitted for brevity since they don't need significant changes
