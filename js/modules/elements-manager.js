/**
 * elements-manager.js - Module for managing multiple elements on a mockup
 * Updated to integrate seamlessly with main upload functionality
 */

const ElementsManager = (function () {
  // Debug initialization
  if (window.Debug) {
    Debug.info("ELEMENTS_MANAGER", "Initializing elements manager module");
  }

  // Module state
  let elements = []; // Array of element objects
  let activeElementIndex = -1; // Index of currently selected element
  let nextElementId = 1; // ID for the next element to be added

  // References to DOM elements for rendering
  let elementPreviews = {}; // Object to store element preview elements
  let uploadHandlersOverridden = false; // Flag to prevent multiple overrides

  /**
   * Element object structure:
   * {
   *   id: Number,            // Unique identifier
   *   src: String,           // Image source (data URL or path)
   *   name: String,          // Element name (e.g., "Element 1")
   *   transformations: {     // Transformation state
   *     x: Number,           // X position
   *     y: Number,           // Y position
   *     rotation: Number,    // Rotation in degrees
   *     zoom: Number,        // Zoom level in percent
   *     layerIndex: Number   // Z-index for layer ordering
   *   }
   * }
   */

  /**
   * Initialize the module
   */
  function init() {
    if (window.Debug) {
      Debug.info("ELEMENTS_MANAGER", "Initializing module");
    }

    // Create UI elements for managing multiple elements
    createElementsManagerUI();

    // Set up event listeners
    setupEventListeners();

    // Override existing upload handlers to integrate with our system
    overrideUploadHandlers();
  }

  /**
   * Override existing upload handlers
   */
  function overrideUploadHandlers() {
    if (uploadHandlersOverridden) {
      return; // Prevent multiple overrides
    }

    if (window.Debug) {
      Debug.debug("ELEMENTS_MANAGER", "Overriding existing upload handlers");
    }

    if (window.UserImage) {
      // Wait until all elements are loaded
      setTimeout(() => {
        // Only override if UserImage has these methods
        if (typeof window.UserImage.handleFileSelect === "function") {
          // Create our override for file selection
          const originalHandleFileSelect = window.UserImage.handleFileSelect;
          window.UserImage.handleFileSelect = function (e) {
            if (window.Debug) {
              Debug.debug("ELEMENTS_MANAGER", "Intercepted file selection");
            }
            // Prevent the original handler from running
            e.stopPropagation();

            // Use our handler that adds elements
            handleUploadedFiles(e.target.files);

            // Mark as handled to prevent duplicate processing
            e._handled = true;
          };
        }

        if (typeof window.UserImage.handleDrop === "function") {
          // Create our override for drop
          const originalHandleDrop = window.UserImage.handleDrop;
          window.UserImage.handleDrop = function (e) {
            if (window.Debug) {
              Debug.debug("ELEMENTS_MANAGER", "Intercepted drop event");
            }
            e.preventDefault();
            e.stopPropagation();

            const dt = e.dataTransfer;
            const files = dt.files;
            handleUploadedFiles(files);

            // Reset drop area appearance
            if (Elements.dropArea) {
              Elements.dropArea.classList.remove("highlight");
            }
            if (Elements.uploadText) {
              Elements.uploadText.style.display = "block";
            }
            if (Elements.dropText) {
              Elements.dropText.style.display = "none";
            }

            // Mark as handled to prevent duplicate processing
            e._handled = true;
          };
        }

        uploadHandlersOverridden = true;

        if (window.Debug) {
          Debug.info(
            "ELEMENTS_MANAGER",
            "Upload handlers successfully overridden"
          );
        }
      }, 500); // Wait for everything to be loaded properly
    }

    // Also attach directly to the main upload elements
    setTimeout(() => {
      const uploadInput = document.getElementById("image-upload");
      const dropArea = document.getElementById("drop-area");

      if (uploadInput) {
        uploadInput.addEventListener("change", function (e) {
          if (window.Debug) {
            Debug.debug(
              "ELEMENTS_MANAGER",
              "Direct handler for file input triggered"
            );
          }
          handleUploadedFiles(e.target.files);
        });
      }

      if (dropArea) {
        dropArea.addEventListener("drop", function (e) {
          if (window.Debug) {
            Debug.debug(
              "ELEMENTS_MANAGER",
              "Direct handler for drop area triggered"
            );
          }
          e.preventDefault();
          e.stopPropagation();
          const dt = e.dataTransfer;
          const files = dt.files;
          handleUploadedFiles(files);
        });
      }
    }, 1000);
  }

  /**
   * Handle files from the main upload interface
   * @param {FileList} files - Uploaded files
   */
  async function handleUploadedFiles(files) {
    if (window.Debug) {
      Debug.debug(
        "ELEMENTS_MANAGER",
        "Handling uploaded files from main interface"
      );
    }

    if (!files || files.length === 0) return;

    // Check if we're already processing these files to prevent duplication
    if (window._currentlyProcessingFiles) {
      if (window.Debug) {
        Debug.debug("ELEMENTS_MANAGER", "Skipping duplicate file processing");
      }
      return;
    }

    // Set a flag to prevent duplicate processing
    window._currentlyProcessingFiles = true;

    try {
      // Show loading message
      const loadingMsg = document.createElement("div");
      loadingMsg.style.position = "fixed";
      loadingMsg.style.top = "50%";
      loadingMsg.style.left = "50%";
      loadingMsg.style.transform = "translate(-50%, -50%)";
      loadingMsg.style.background = "rgba(0, 0, 0, 0.8)";
      loadingMsg.style.color = "white";
      loadingMsg.style.padding = "20px";
      loadingMsg.style.borderRadius = "10px";
      loadingMsg.style.zIndex = "9999";
      loadingMsg.textContent = "Wgrywanie obrazu...";
      document.body.appendChild(loadingMsg);

      // Process image as before but add it as an element
      const file = files[0];
      if (file.type.match("image.*")) {
        // Create a FormData object
        const formData = new FormData();
        formData.append("image", file);

        // Upload to server
        const response = await fetch("/api/upload/user-image", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        document.body.removeChild(loadingMsg);

        if (result.success) {
          if (window.Debug) {
            Debug.debug(
              "ELEMENTS_MANAGER",
              "Image uploaded successfully, adding as element"
            );
          }

          // For backwards compatibility, set the image preview source first
          if (Elements.imagePreview) {
            Elements.imagePreview.src = result.imageData;
            // Hide the original image preview since we're using elements now
            Elements.imagePreview.style.display = "none";
          }

          // Only add the element if we don't already have one with this source
          if (!elements.some((e) => e.src === result.imageData)) {
            // Add the image as a new element
            addNewElement(result.imageData);
          } else if (window.Debug) {
            Debug.debug(
              "ELEMENTS_MANAGER",
              "Element with this source already exists, skipping"
            );
          }

          // Show controls
          Elements.controls.style.display = "block";
          Elements.dragInstruction.style.display = "block";

          // Set UserImage as loaded
          if (window.UserImage) {
            UserImage.setImageLoaded(true);
          }

          // Dispatch event for compatibility
          const event = new CustomEvent("userImageLoaded");
          document.dispatchEvent(event);
        } else {
          alert("Error: " + (result.error || "Failed to upload image"));
        }
      } else {
        document.body.removeChild(loadingMsg);
        alert("Proszę wybrać plik ze zdjęciem");
      }

      // Clear the processing flag
      window._currentlyProcessingFiles = false;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Wystąpił błąd podczas przesyłania obrazu.");
    }
  }

  /**
   * Create UI elements for managing multiple elements
   */
  function createElementsManagerUI() {
    if (window.Debug) {
      Debug.debug("ELEMENTS_MANAGER", "Creating elements manager UI");
    }

    // Create elements panel
    const elementsPanel = document.createElement("div");
    elementsPanel.id = "elements-panel";
    elementsPanel.className = "elements-panel";

    // Panel header
    elementsPanel.innerHTML = `
      <div class="elements-panel-header">
        <h3>Elementy</h3>
      </div>
      <div class="elements-list" id="elements-list">
        <div class="no-elements-message">Brak dodanych elementów. Kliknij + aby dodać element lub przeciągnij obraz na główny obszar.</div>
      </div>
    `;

    // Find the controls section and insert our panel before it
    const controlsSection = document.getElementById("controls");
    if (controlsSection && controlsSection.parentNode) {
      controlsSection.parentNode.insertBefore(elementsPanel, controlsSection);
    } else {
      // Fallback - find the editor section
      const editorSection = document.querySelector(".editor-section");
      if (editorSection) {
        // Insert at the beginning of editor section
        if (editorSection.firstChild) {
          editorSection.insertBefore(elementsPanel, editorSection.firstChild);
        } else {
          editorSection.appendChild(elementsPanel);
        }
      } else {
        console.error(
          "Could not find .editor-section to append elements panel"
        );
      }
    }

    // Add CSS for the elements panel
    addElementsManagerStyles();
  }

  /**
   * Add CSS styles for the elements manager
   */
  function addElementsManagerStyles() {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .elements-panel {
        margin-bottom: 20px;
        background-color: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #dee2e6;
        overflow: hidden;
      }
      
      .elements-panel-header {
        padding: 10px 15px;
        background-color: #e9ecef;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .elements-panel-header h3 {
        margin: 0;
        font-size: 16px;
      }
      
      .elements-panel-actions {
        display: flex;
        gap: 5px;
      }
      
      .action-btn {
        width: 28px;
        height: 28px;
        border-radius: 4px;
        background-color: #3498db;
        color: white;
        border: none;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .action-btn:hover {
        background-color: #2980b9;
      }
      
      .elements-list {
        padding: 10px;
        max-height: 200px;
        overflow-y: auto;
      }
      
      .element-item {
        display: flex;
        align-items: center;
        padding: 8px;
        border-radius: 4px;
        margin-bottom: 5px;
        background-color: white;
        border: 1px solid #ddd;
        cursor: pointer;
      }
      
      .element-item.active {
        border-color: #3498db;
        background-color: #ecf0f1;
      }
      
      .element-thumbnail {
        width: 40px;
        height: 40px;
        background-color: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;
        margin-right: 10px;
      }
      
      .element-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      
      .element-details {
        flex: 1;
      }
      
      .element-name {
        font-weight: bold;
        margin-bottom: 3px;
      }
      
      .element-controls {
        display: flex;
        gap: 5px;
      }
      
      .element-control-btn {
        width: 24px;
        height: 24px;
        font-size: 12px;
        padding: 0;
        border-radius: 3px;
      }
      
      .delete-btn {
        background-color: #e74c3c;
      }
      
      .delete-btn:hover {
        background-color: #c0392b;
      }
      
      .no-elements-message {
        text-align: center;
        color: #7f8c8d;
        padding: 20px 10px;
        font-style: italic;
      }
      
      .element-up-btn, .element-down-btn {
        background-color: #7f8c8d;
      }
      
      .element-up-btn:hover, .element-down-btn:hover {
        background-color: #636e72;
      }
      
      /* Element preview styles */
      .editor-container {
        position: relative;
      }
      
      .element-preview {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        max-width: 100%;
        max-height: 100%;
        z-index: 5;
        pointer-events: none;
      }
      
      .element-preview.active {
        pointer-events: auto;
        cursor: move;
      }
    `;
    document.head.appendChild(styleElement);
  }

  /**
   * Set up event listeners for the elements manager
   */
  function setupEventListeners() {
    if (window.Debug) {
      Debug.debug("ELEMENTS_MANAGER", "Setting up event listeners");
    }

  
    // Handle user image loaded event - for compatibility with old code
    document.addEventListener("userImageLoaded", function () {
      if (window.Debug) {
        Debug.debug("ELEMENTS_MANAGER", "User image loaded event received");
      }

      // Mark that initialization has occurred to prevent double processing
      window._elementsManagerInitialized = true;

      // We no longer automatically add an element here since our upload handler does that
      // This eliminates the duplication issue
    });

    // Handle transformChange events only for the active element
    document.addEventListener("transformChange", function (e) {
      if (activeElementIndex !== -1) {
        const element = elements[activeElementIndex];

        if (element) {
          updateElementTransformation(
            activeElementIndex,
            e.detail.type,
            e.detail.value
          );
          // Update the preview
          updateElementPreview(activeElementIndex);
        }
      }
    });

    // Add handler for resetTransformations event
    document.addEventListener("resetTransformations", function () {
      if (window.Debug) {
        Debug.debug("ELEMENTS_MANAGER", "Handling resetTransformations event");
      }

      // Skip if no elements or no active element
      if (elements.length === 0 || activeElementIndex === -1) return;

      // Reset the active element's transformations to default values
      const activeElement = elements[activeElementIndex];
      if (activeElement) {
        if (window.Debug) {
          Debug.debug(
            "ELEMENTS_MANAGER",
            `Resetting element ID ${activeElement.id} transformations`
          );
        }

        // Reset to default values from EditorConfig
        activeElement.transformations.x = EditorConfig.defaults.positionX;
        activeElement.transformations.y = EditorConfig.defaults.positionY;
        activeElement.transformations.rotation = EditorConfig.defaults.rotation;
        activeElement.transformations.zoom = EditorConfig.defaults.zoom;

        // Update the preview
        updateElementPreview(activeElementIndex);

        // If Transformations module is available, sync its state with our element
        if (window.Transformations) {
          const transformState = Transformations.getState();

          // Sync state
          transformState.currentX = activeElement.transformations.x;
          transformState.currentY = activeElement.transformations.y;
          transformState.currentRotation =
            activeElement.transformations.rotation;
          transformState.currentZoom = activeElement.transformations.zoom;

          // Apply transformations
          Transformations.updateTransform();
        }
      }
    });

    // Also add handler for centerImage event
    document.addEventListener("centerImage", function () {
      if (window.Debug) {
        Debug.debug("ELEMENTS_MANAGER", "Handling centerImage event");
      }

      // Skip if no elements or no active element
      if (elements.length === 0 || activeElementIndex === -1) return;

      // Center the active element
      const activeElement = elements[activeElementIndex];
      if (activeElement) {
        if (window.Debug) {
          Debug.debug(
            "ELEMENTS_MANAGER",
            `Centering element ID ${activeElement.id}`
          );
        }

        // Set position to center (0,0)
        activeElement.transformations.x = 0;
        activeElement.transformations.y = 0;

        // Update the preview
        updateElementPreview(activeElementIndex);

        // If Transformations module is available, sync its state with our element
        if (window.Transformations) {
          const transformState = Transformations.getState();

          // Sync state
          transformState.currentX = activeElement.transformations.x;
          transformState.currentY = activeElement.transformations.y;

          // Apply transformations
          Transformations.updateTransform();

          // Update UI controls
          if (window.UI) {
            UI.updateControlsFromState(transformState);
          }
        }
      }
    });
  }

  /**
   * Add a new element to the mockup
   * @param {string} src - Image source (data URL)
   */
  function addNewElement(src) {
    if (window.Debug) {
      Debug.debug("ELEMENTS_MANAGER", "Adding new element");
    }

    // Create a new element object
    const newElement = {
      id: nextElementId++,
      src: src,
      name: `Element ${elements.length + 1}`,
      transformations: {
        x: 0,
        y: 0,
        rotation: 0,
        zoom: 100,
        layerIndex: elements.length, // Place on top
      },
    };

    // Add to elements array
    elements.push(newElement);

    // Set as active element
    activeElementIndex = elements.length - 1;

    // Update UI
    updateElementsList();

    // Create or update element previews
    createOrUpdateElementPreviews();

    // Apply transformations to UI controls
    applyActiveElementTransformations();

    // Set UserImage as loaded if not already
    if (window.UserImage && !UserImage.isImageLoaded()) {
      UserImage.setImageLoaded(true);
    }

    // Show controls if not already visible
    Elements.controls.style.display = "block";
    Elements.dragInstruction.style.display = "block";
  }

  /**
   * Create or update element previews in the editor
   */
  function createOrUpdateElementPreviews() {
    if (window.Debug) {
      Debug.debug("ELEMENTS_MANAGER", "Creating/updating element previews");
    }

    // Get editor container
    const editorContainer = document.querySelector(".editor-container");
    if (!editorContainer) return;

    // Remove existing previews
    const existingPreviews = document.querySelectorAll(".element-preview");
    existingPreviews.forEach((el) => el.remove());

    // Clear references
    elementPreviews = {};

    // Create new previews for each element - sorted by layer
    const sortedElements = [...elements].sort(
      (a, b) => a.transformations.layerIndex - b.transformations.layerIndex
    );

    sortedElements.forEach((element, index) => {
      const img = document.createElement("img");
      img.src = element.src;
      img.className = "element-preview";
      img.dataset.elementId = element.id;

      // Set z-index based on layer
      img.style.zIndex = 5 + element.transformations.layerIndex;

      // Apply transformations
      applyTransformationToElement(img, element.transformations);

      // Add active class and drag events only for active element
      if (elements.indexOf(element) === activeElementIndex) {
        img.classList.add("active");

        // Add mouse events for dragging (only for active element)
        img.addEventListener("mousedown", function (e) {
          if (window.Transformations) {
            Transformations.startDrag(e);
          }
        });
      }

      // Add to document
      editorContainer.appendChild(img);

      // Store reference
      elementPreviews[element.id] = img;
    });

    // Hide the original image preview
    if (Elements.imagePreview) {
      Elements.imagePreview.style.display = "none";
    }
  }

  /**
   * Apply transformation to an element preview
   * @param {HTMLElement} img - Element preview image
   * @param {Object} transform - Transformation object
   */
  function applyTransformationToElement(img, transform) {
    // Use the same transformation formula as in Transformations module
    const linearZoomFactor = transform.zoom * 0.01;

    img.style.transform = `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px)) rotate(${transform.rotation}deg) scale(${linearZoomFactor})`;
  }

  /**
   * Update the elements list UI
   */
  function updateElementsList() {
    if (window.Debug) {
      Debug.debug("ELEMENTS_MANAGER", "Updating elements list UI");
    }

    const listContainer = document.getElementById("elements-list");
    if (!listContainer) return;

    if (elements.length === 0) {
      listContainer.innerHTML = `<div class="no-elements-message">Brak dodanych elementów. Kliknij + aby dodać element lub przeciągnij obraz na główny obszar.</div>`;
      return;
    }

    let html = "";

    // Create element items in reverse order (top layer first)
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      const isActive = i === activeElementIndex;

      html += `
        <div class="element-item ${
          isActive ? "active" : ""
        }" data-index="${i}" data-id="${element.id}">
          <div class="element-thumbnail">
            <img src="${element.src}" alt="${element.name}">
          </div>
          <div class="element-details">
            <div class="element-name">${element.name}</div>
          </div>
          <div class="element-controls">
            <button class="action-btn element-control-btn element-up-btn" title="Warstwa wyżej" ${
              i === elements.length - 1 ? "disabled" : ""
            }>↑</button>
            <button class="action-btn element-control-btn element-down-btn" title="Warstwa niżej" ${
              i === 0 ? "disabled" : ""
            }>↓</button>
            <button class="action-btn element-control-btn delete-btn" title="Usuń element" ${
              elements.length === 1 ? "disabled" : ""
            }>×</button>
          </div>
        </div>
      `;
    }

    listContainer.innerHTML = html;

    // Add event listeners to elements
    setupElementItemListeners();
  }

  /**
   * Set up event listeners for element items
   */
  function setupElementItemListeners() {
    // Element selection
    const elementItems = document.querySelectorAll(".element-item");
    elementItems.forEach((item) => {
      item.addEventListener("click", function (e) {
        if (e.target.tagName !== "BUTTON") {
          const index = parseInt(this.getAttribute("data-index"));
          setActiveElement(index);
        }
      });
    });

    // Layer up buttons
    const upButtons = document.querySelectorAll(".element-up-btn");
    upButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.stopPropagation();
        const item = this.closest(".element-item");
        const index = parseInt(item.getAttribute("data-index"));
        moveElementLayer(index, "up");
      });
    });

    // Layer down buttons
    const downButtons = document.querySelectorAll(".element-down-btn");
    downButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.stopPropagation();
        const item = this.closest(".element-item");
        const index = parseInt(item.getAttribute("data-index"));
        moveElementLayer(index, "down");
      });
    });

    // Delete buttons
    const deleteButtons = document.querySelectorAll(".delete-btn");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.stopPropagation();
        const item = this.closest(".element-item");
        const index = parseInt(item.getAttribute("data-index"));

        // Confirm deletion
        if (
          elements.length > 1 &&
          confirm("Czy na pewno chcesz usunąć ten element?")
        ) {
          deleteElement(index);
        }
      });
    });
  }

  /**
   * Set the active element
   * @param {number} index - Index of the element to activate
   */
  function setActiveElement(index) {
    if (window.Debug) {
      Debug.debug(
        "ELEMENTS_MANAGER",
        `Setting active element to index ${index}`
      );
    }

    if (index === activeElementIndex || index < 0 || index >= elements.length) {
      return;
    }

    // Set new active index
    activeElementIndex = index;

    // Update UI
    updateElementsList();

    // Update element previews
    createOrUpdateElementPreviews();

    // Apply transformations
    applyActiveElementTransformations();
  }

  /**
   * Apply the active element's transformations to the UI
   */
  function applyActiveElementTransformations() {
    if (activeElementIndex === -1) return;

    const element = elements[activeElementIndex];
    if (!element) return;

    if (window.Debug) {
      Debug.debug(
        "ELEMENTS_MANAGER",
        "Applying active element transformations",
        element.transformations
      );
    }

    // Update transformations state
    if (window.Transformations) {
      const transformState = Transformations.getState();

      // Update the state values
      transformState.currentX = element.transformations.x;
      transformState.currentY = element.transformations.y;
      transformState.currentRotation = element.transformations.rotation;
      transformState.currentZoom = element.transformations.zoom;

      // Apply transformations
      Transformations.updateTransform();

      // Update UI controls
      if (window.UI) {
        UI.updateControlsFromState(transformState);
      }
    }
  }

  /**
   * Update an element preview based on index
   * @param {number} index - Index of the element to update
   */
  function updateElementPreview(index) {
    if (index < 0 || index >= elements.length) return;

    const element = elements[index];
    const elementId = element.id;

    // Get the preview element
    const preview = elementPreviews[elementId];
    if (preview) {
      // Apply transformations
      applyTransformationToElement(preview, element.transformations);
    }
  }

  /**
   * Update an element's transformation
   * @param {number} index - Index of the element to update
   * @param {string} type - Type of transformation (rotation, zoom, positionX, positionY)
   * @param {number} value - New value for the transformation
   */
  function updateElementTransformation(index, type, value) {
    if (index < 0 || index >= elements.length) return;

    const element = elements[index];

    if (window.Debug) {
      Debug.debug(
        "ELEMENTS_MANAGER",
        `Updating element ${index} ${type} to ${value}`
      );
    }

    // Update the appropriate transformation property
    switch (type) {
      case "rotation":
        element.transformations.rotation = value;
        break;
      case "zoom":
        element.transformations.zoom = value;
        break;
      case "positionX":
        element.transformations.x = value;
        break;
      case "positionY":
        element.transformations.y = value;
        break;
    }
  }

  /**
   * Move an element's layer position
   * @param {number} index - Index of the element to move
   * @param {string} direction - Direction to move ("up" or "down")
   */
  function moveElementLayer(index, direction) {
    if (window.Debug) {
      Debug.debug("ELEMENTS_MANAGER", `Moving element ${index} ${direction}`);
    }

    if (index < 0 || index >= elements.length) return;

    // Determine new index based on direction
    let newIndex;
    if (direction === "up" && index < elements.length - 1) {
      newIndex = index + 1;
    } else if (direction === "down" && index > 0) {
      newIndex = index - 1;
    } else {
      return; // No valid move
    }

    // Swap elements
    const temp = elements[index];
    elements[index] = elements[newIndex];
    elements[newIndex] = temp;

    // Update layer indexes
    for (let i = 0; i < elements.length; i++) {
      elements[i].transformations.layerIndex = i;
    }

    // Update active element index if needed
    if (activeElementIndex === index) {
      activeElementIndex = newIndex;
    } else if (activeElementIndex === newIndex) {
      activeElementIndex = index;
    }

    // Update UI
    updateElementsList();

    // Update preview elements
    createOrUpdateElementPreviews();
  }

  /**
   * Delete an element
   * @param {number} index - Index of the element to delete
   */
  function deleteElement(index) {
    if (window.Debug) {
      Debug.debug("ELEMENTS_MANAGER", `Deleting element at index ${index}`);
    }

    if (index < 0 || index >= elements.length) return;

    // Remove the element
    elements.splice(index, 1);

    // Update active element index
    if (activeElementIndex === index) {
      // Set active to the next element or the last one
      activeElementIndex = Math.min(index, elements.length - 1);
    } else if (activeElementIndex > index) {
      // Adjust active index if we removed an element before it
      activeElementIndex--;
    }

    // Re-index all elements
    for (let i = 0; i < elements.length; i++) {
      elements[i].transformations.layerIndex = i;
    }

    // Update UI
    updateElementsList();

    // Update preview
    createOrUpdateElementPreviews();

    // Apply transformations if we have elements
    if (elements.length > 0 && activeElementIndex >= 0) {
      applyActiveElementTransformations();
    }
  }

  /**
   * Get all elements for rendering
   * @returns {Array} Array of element objects sorted by layer index
   */
  function getAllElements() {
    // Return a copy of the elements array sorted by layer index
    return [...elements].sort(
      (a, b) => a.transformations.layerIndex - b.transformations.layerIndex
    );
  }

  // Public interface
  return {
    init,
    addNewElement,
    getAllElements,
    getActiveElement: function () {
      return activeElementIndex !== -1 ? elements[activeElementIndex] : null;
    },
    getElementCount: function () {
      return elements.length;
    },
  };
})();

// Export as global object
window.ElementsManager = ElementsManager;
