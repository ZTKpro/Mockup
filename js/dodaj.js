document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const fileInput = document.getElementById("file-input");
  const mockupGallery = document.getElementById("mockup-gallery");
  const loadingIndicator = document.getElementById("loading-indicator");
  const noMockups = document.getElementById("no-mockups");
  const addNewBtn = document.getElementById("add-new-btn");
  const existingMockups = document.getElementById("existing-mockups");
  const uploadIndicator = document.getElementById("upload-indicator");
  const modelInput = document.getElementById("mockup-model");

  // Click handler for add button
  addNewBtn.addEventListener("click", () => {
    fileInput.click();
  });

  // Available mockup list
  let mockupFiles = [];
  let mockupItems = [];

  // Function to initialize mockup gallery
  async function initializeMockupGallery() {
    try {
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
    } catch (error) {
      console.error("Error initializing mockup gallery:", error);
      loadingIndicator.textContent = "Błąd wczytywania mockupów.";
    }
  }

  // Load available models for the datalist
  async function loadAvailableModels() {
    try {
      const response = await fetch("/api/models");
      const data = await response.json();

      if (data.success) {
        const modelsList = document.getElementById("models-list");
        modelsList.innerHTML = "";

        data.models.forEach((model) => {
          const option = document.createElement("option");
          option.value = model;
          modelsList.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Error loading models:", error);
    }
  }

  // Function to fetch mockups from API
  async function fetchMockups() {
    try {
      const response = await fetch("/api/mockups");
      const data = await response.json();

      if (data.success) {
        return data.mockups;
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error fetching mockups:", error);
      return [];
    }
  }

  // Function to generate mockup manager interface

  function generateMockupManager(mockups) {
    mockupGallery.innerHTML = ""; // Clear gallery

    if (mockups.length === 0) {
      noMockups.style.display = "block";
      return;
    } else {
      noMockups.style.display = "none";
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

    // Sort mockups by ID within each model group
    Object.keys(mockupsByModel).forEach((model) => {
      mockupsByModel[model].sort((a, b) => a.id - b.id);
    });

    // Display mockups grouped by model
    Object.keys(mockupsByModel)
      .sort()
      .forEach((model) => {
        // Add model header
        const modelHeader = document.createElement("div");
        modelHeader.className = "model-header";
        modelHeader.textContent = model + ` (${mockupsByModel[model].length})`;
        mockupGallery.appendChild(modelHeader);

        // Create a flex container for this model's mockups
        const flexContainer = document.createElement("div");
        flexContainer.className = "mockup-flex-container";
        flexContainer.style.display = "flex";
        flexContainer.style.flexWrap = "wrap";
        mockupGallery.appendChild(flexContainer);

        // Add mockups for this model to the flex container
        mockupsByModel[model].forEach((mockup) => {
          const mockupItem = document.createElement("div");
          mockupItem.className = "mockup-item";
          mockupItem.dataset.id = mockup.id;
          mockupItem.dataset.path = mockup.path;

          mockupItem.innerHTML = `
          <div class="mockup-thumbnail">
            <img src="${mockup.path}" alt="Mockup ${mockup.id}" />
          </div>
          <div class="mockup-controls">
            <div class="mockup-model">${mockup.model}</div>
            <div class="mockup-actions">
              <button class="action-btn edit-model" title="Zmień model">📱</button>
              <button class="action-btn delete" title="Usuń mockup">×</button>
            </div>
          </div>
        `;

          flexContainer.appendChild(mockupItem);
        });
      });

    // Assign listeners to newly generated elements
    setupMockupItemListeners();
  }

  // Function to handle clicks on mockup items
  function setupMockupItemListeners() {
    mockupItems = document.querySelectorAll(".mockup-item");

    mockupItems.forEach((item) => {
      // Delete button
      const deleteBtn = item.querySelector(".action-btn.delete");
      deleteBtn.addEventListener("click", async function (e) {
        e.stopPropagation();

        if (confirm("Czy na pewno chcesz usunąć ten mockup?")) {
          try {
            const mockupId = item.getAttribute("data-id");

            // Show loading indicator
            uploadIndicator.style.display = "flex";
            uploadIndicator.querySelector(
              ".upload-indicator-text"
            ).textContent = "Usuwanie mockupu...";

            // Call API to delete mockup
            const response = await fetch(`/api/mockups/${mockupId}`, {
              method: "DELETE",
            });

            const result = await response.json();

            // Hide loading indicator
            uploadIndicator.style.display = "none";

            if (result.success) {
              // Remove item from DOM
              item.remove();

              // Check if all mockups were removed
              if (document.querySelectorAll(".mockup-item").length === 0) {
                noMockups.style.display = "block";
              }
            } else {
              alert(`Błąd: ${result.error}`);
            }
          } catch (error) {
            uploadIndicator.style.display = "none";
            console.error("Error deleting mockup:", error);
            alert("Wystąpił błąd podczas usuwania mockupu.");
          }
        }
      });

      // Edit model button
      const editModelBtn = item.querySelector(".action-btn.edit-model");
      if (editModelBtn) {
        editModelBtn.addEventListener("click", async function (e) {
          e.stopPropagation();

          const mockupId = item.getAttribute("data-id");
          const modelElement = item.querySelector(".mockup-model");
          const currentModel = modelElement ? modelElement.textContent : "Inne";

          const newModel = prompt("Wprowadź model telefonu:", currentModel);

          if (newModel && newModel !== currentModel) {
            try {
              // Show loading indicator
              uploadIndicator.style.display = "flex";
              uploadIndicator.querySelector(
                ".upload-indicator-text"
              ).textContent = "Aktualizowanie modelu...";

              // Call API to update model
              const response = await fetch(`/api/mockups/${mockupId}/model`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ model: newModel }),
              });

              const result = await response.json();

              // Hide loading indicator
              uploadIndicator.style.display = "none";

              if (result.success) {
                // Refresh mockup gallery to reflect changes
                initializeMockupGallery();
                alert("Model zaktualizowany pomyślnie");
              } else {
                alert(`Błąd: ${result.error}`);
              }
            } catch (error) {
              uploadIndicator.style.display = "none";
              console.error("Error updating model:", error);
              alert("Wystąpił błąd podczas aktualizacji modelu.");
            }
          }
        });
      }

      // Click handler for thumbnail (select/deselect)
      const thumbnail = item.querySelector(".mockup-thumbnail");
      thumbnail.addEventListener("click", function () {
        item.classList.toggle("active");
      });
    });
  }

  // Initialize gallery on page load
  initializeMockupGallery();

  // File input change handler
  fileInput.addEventListener("change", handleFiles);

  // Drag & drop handlers
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    existingMockups.addEventListener(eventName, preventDefaults);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    existingMockups.addEventListener(eventName, () => {
      existingMockups.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    existingMockups.addEventListener(eventName, () => {
      existingMockups.classList.remove("dragover");
    });
  });

  existingMockups.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles({ target: { files } });
  });

  // Function to handle uploaded files
  async function handleFiles(e) {
    const files = e.target.files;

    if (files.length === 0) {
      return;
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
      alert("Można wgrać tylko pliki PNG! Wybierz ponownie.");
      return;
    }

    // Get the model from the input - spaces are preserved
    let model = modelInput.value.trim();

    // If model is empty after trimming, use "Inne"
    if (!model) {
      model = "Inne";
    }

    console.log("Using model (before server processing):", model);

    // Show upload indicator
    uploadIndicator.style.display = "flex";

    try {
      // Determine next mockup number
      const existingMockups = await fetchMockups();
      let nextMockupNumber = 1;

      if (existingMockups.length > 0) {
        // Find the highest ID and add 1
        nextMockupNumber = Math.max(...existingMockups.map((m) => m.id)) + 1;
      }

      // Upload each file
      const uploadPromises = [];

      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("mockup", files[i]);
        formData.append("mockupNumber", nextMockupNumber + i);
        formData.append("mockupModel", model); // Send model with spaces intact
        // No longer sending mockupName field - we're only using model

        const uploadPromise = fetch("/api/upload/mockup", {
          method: "POST",
          body: formData,
        }).then((response) => response.json());

        uploadPromises.push(uploadPromise);
      }

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);

      // Hide upload indicator
      uploadIndicator.style.display = "none";

      // Check for errors
      const errors = results.filter((result) => !result.success);

      if (errors.length > 0) {
        alert(
          `Wystąpiły błędy podczas przesyłania plików: ${errors
            .map((e) => e.error)
            .join(", ")}`
        );
      } else {
        alert(
          `Pomyślnie dodano ${files.length} mockup${
            files.length > 1 ? "ów" : ""
          }!`
        );
      }

      // Refresh mockup gallery
      initializeMockupGallery();

      // Reset file input and model field
      fileInput.value = "";
      modelInput.value = "";
    } catch (error) {
      console.error("Error uploading files:", error);
      uploadIndicator.style.display = "none";
      alert("Wystąpił błąd podczas przesyłania plików.");
      fileInput.value = "";
    }
  }
});
