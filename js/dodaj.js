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
 * Generate mockup manager interface
 * @param {Array} mockups - Array of mockup data objects
 */
function generateMockupManager(mockups) {
  if (window.Debug) {
    Debug.debug("DODAJ", "Generowanie mockup manager interface");
  }

  // Hide loading indicator
  if (loadingIndicator) {
    loadingIndicator.style.display = "none";
  }

  // Check if there are any mockups
  if (!mockups || mockups.length === 0) {
    if (noMockups) {
      noMockups.style.display = "block";
    }
    if (mockupGallery) {
      mockupGallery.innerHTML = "";
    }
    if (window.Debug) {
      Debug.debug("DODAJ", "No mockups found");
    }
    return;
  }

  // Group mockups by model
  const mockupsByModel = {};
  mockups.forEach((mockup) => {
    const model = mockup.model || "Inne";
    if (!mockupsByModel[model]) {
      mockupsByModel[model] = [];
    }
    mockupsByModel[model].push(mockup);
  });

  // Generate HTML for each model group
  let galleryHTML = "";
  Object.keys(mockupsByModel)
    .sort()
    .forEach((model) => {
      const mockupsForModel = mockupsByModel[model];

      galleryHTML += `<div class="model-group">
      <div class="model-header">${model} (${mockupsForModel.length})</div>
      <div class="mockup-items">`;

      // Add mockup items
      mockupsForModel.forEach((mockup) => {
        galleryHTML += `
        <div class="mockup-item" data-id="${mockup.id}">
          <div class="mockup-thumbnail">
            <img src="${mockup.path}" alt="${mockup.name || "Mockup"}">
          </div>
          <div class="mockup-controls">
            <div class="mockup-number">#${mockup.id}</div>
            <div class="mockup-model">${mockup.model || "Inne"}</div>
            <div class="mockup-actions">
              <button class="action-btn edit-model" title="Edytuj model">✏️</button>
              <button class="action-btn delete" title="Usuń mockup">🗑️</button>
            </div>
          </div>
        </div>
      `;
      });

      galleryHTML += `</div></div>`;
    });

  // Update gallery HTML
  if (mockupGallery) {
    mockupGallery.innerHTML = galleryHTML;

    // Add event listeners to mockup items
    setupMockupItemListeners();
  }

  // Hide "no mockups" message
  if (noMockups) {
    noMockups.style.display = "none";
  }
}

/**
 * Set up event listeners for mockup items
 */
function setupMockupItemListeners() {
  // Delete buttons
  const deleteButtons = document.querySelectorAll(".action-btn.delete");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", async function (e) {
      e.stopPropagation();
      const mockupItem = this.closest(".mockup-item");
      const mockupId = mockupItem.getAttribute("data-id");

      if (confirm("Czy na pewno chcesz usunąć ten mockup?")) {
        await deleteMockup(mockupId, mockupItem);
      }
    });
  });

  // Edit model buttons
  const editButtons = document.querySelectorAll(".action-btn.edit-model");
  editButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.stopPropagation();
      const mockupItem = this.closest(".mockup-item");
      const mockupId = mockupItem.getAttribute("data-id");
      const currentModel =
        mockupItem.querySelector(".mockup-model").textContent;

      promptEditModel(mockupId, currentModel, mockupItem);
    });
  });
}

/**
 * Delete a mockup
 * @param {string} mockupId - ID of the mockup to delete
 * @param {HTMLElement} mockupItem - DOM element of the mockup item
 */
async function deleteMockup(mockupId, mockupItem) {
  try {
    if (window.Debug) {
      Debug.info("DODAJ", `Deleting mockup with ID: ${mockupId}`);
    }

    const response = await fetch(`/api/mockups/${mockupId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (result.success) {
      // Remove the mockup item from the DOM
      mockupItem.remove();

      if (window.Debug) {
        Debug.debug("DODAJ", `Successfully deleted mockup ID: ${mockupId}`);
      }

      // Check if the model group is now empty
      const modelGroup = mockupItem.closest(".model-group");
      const remainingItems = modelGroup.querySelectorAll(".mockup-item").length;

      if (remainingItems === 0) {
        modelGroup.remove();
      } else {
        // Update count in model header
        const modelHeader = modelGroup.querySelector(".model-header");
        const modelName = modelHeader.textContent.split("(")[0].trim();
        modelHeader.textContent = `${modelName} (${remainingItems})`;
      }
    } else {
      if (window.Debug) {
        Debug.error("DODAJ", `Error deleting mockup: ${result.error}`);
      }
      alert(`Error deleting mockup: ${result.error}`);
    }
  } catch (error) {
    if (window.Debug) {
      Debug.error("DODAJ", "Exception while deleting mockup", error);
    }
    console.error("Error deleting mockup:", error);
    alert("An error occurred while deleting the mockup.");
  }
}

/**
 * Prompt to edit mockup model
 * @param {string} mockupId - ID of the mockup
 * @param {string} currentModel - Current model name
 * @param {HTMLElement} mockupItem - DOM element of the mockup item
 */
function promptEditModel(mockupId, currentModel, mockupItem) {
  const newModel = prompt("Wprowadź nową nazwę modelu:", currentModel);

  if (newModel !== null && newModel !== currentModel) {
    updateMockupModel(mockupId, newModel, mockupItem);
  }
}

/**
 * Update mockup model
 * @param {string} mockupId - ID of the mockup
 * @param {string} newModel - New model name
 * @param {HTMLElement} mockupItem - DOM element of the mockup item
 */
async function updateMockupModel(mockupId, newModel, mockupItem) {
  try {
    if (window.Debug) {
      Debug.info(
        "DODAJ",
        `Updating mockup ID: ${mockupId} to model: ${newModel}`
      );
    }

    const response = await fetch(`/api/mockups/${mockupId}/model`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: newModel }),
    });

    const result = await response.json();

    if (result.success) {
      if (window.Debug) {
        Debug.debug(
          "DODAJ",
          `Successfully updated mockup model to: ${newModel}`
        );
      }

      // Update the model text in the DOM
      const modelElement = mockupItem.querySelector(".mockup-model");
      modelElement.textContent = newModel;

      // Reload gallery to reflect changes in grouping
      initializeMockupGallery();
    } else {
      if (window.Debug) {
        Debug.error("DODAJ", `Error updating mockup model: ${result.error}`);
      }
      alert(`Error updating mockup model: ${result.error}`);
    }
  } catch (error) {
    if (window.Debug) {
      Debug.error("DODAJ", "Exception while updating mockup model", error);
    }
    console.error("Error updating mockup model:", error);
    alert("An error occurred while updating the mockup model.");
  }
}

/**
 * Prevent default browser behaviors
 * @param {Event} e - Event object
 */
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * Handle file uploads
 * @param {Event} e - Event object with files
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

  // If model is empty after trimming, use "Inne"
  if (!model) {
    model = "Inne";
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
    // Upload each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mockupNumber = Date.now() + i; // Generate unique number

      // Create FormData
      const formData = new FormData();
      formData.append("mockup", file);
      formData.append("mockupModel", model);
      formData.append("mockupNumber", mockupNumber);

      if (window.Debug) {
        Debug.debug(
          "DODAJ",
          `Uploading file ${i + 1}/${files.length}: ${file.name}`
        );
      }

      // Upload to server
      const response = await fetch("/api/upload/mockup", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || `Failed to upload file ${file.name}`);
      }

      if (window.Debug) {
        Debug.debug(
          "DODAJ",
          `Successfully uploaded file ${i + 1}: ${file.name}`
        );
      }
    }

    // Hide upload indicator
    if (uploadIndicator) {
      uploadIndicator.style.display = "none";
    }

    // Reset file input
    if (fileInput) {
      fileInput.value = "";
    }

    // Reset model field
    if (modelInput) {
      modelInput.value = "";
    }

    // Reload mockup gallery
    await initializeMockupGallery();

    // Show success message
    if (window.Debug) {
      Debug.info("DODAJ", `Successfully uploaded ${files.length} files`);
    }
  } catch (error) {
    if (window.Debug) {
      Debug.error("DODAJ", "Error uploading files", error);
    }

    console.error("Error uploading files:", error);
    if (uploadIndicator) {
      uploadIndicator.style.display = "none";
    }
    alert("Wystąpił błąd podczas przesyłania plików: " + error.message);
    if (fileInput) {
      fileInput.value = "";
    }
  }
}
