/**
 * export.js - Module for exporting and downloading images
 * Enhanced for exact 1:1 DOM capture with perfect fidelity
 */

const Export = (function () {
  // Initialize debugging
  if (window.Debug) {
    Debug.info("EXPORT", "Initializing export module");
  }

  /**
   * Show download options dialog
   */
  function showDownloadOptions() {
    if (window.Debug) {
      Debug.debug("EXPORT", "Displaying download options dialog");
    }

    // Create dialog
    const dialogOverlay = document.createElement("div");
    dialogOverlay.className = "download-dialog-overlay";

    const dialogBox = document.createElement("div");
    dialogBox.className = "download-dialog";

    dialogBox.innerHTML = `
      <h3>Opcje pobierania</h3>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;"> Format pliku:</label>
        <select id="format-select" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
          <option value="png">PNG</option>
          <option value="jpg">JPG</option>
        </select>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Rozmiar:</label>
        <select id="size-select" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
          ${EditorConfig.export.availableSizes
            .map(
              (size) => `<option value="${size}">${size} x ${size} px</option>`
            )
            .join("")}
        </select>
      </div>
      
      <div class="download-dialog-buttons">
        <button id="cancel-download" class="cancel">Anuluj</button>
        <button id="confirm-download" class="confirm">Pobierz</button>
      </div>
    `;

    dialogOverlay.appendChild(dialogBox);
    document.body.appendChild(dialogOverlay);

    // Button handlers
    document
      .getElementById("cancel-download")
      .addEventListener("click", function () {
        if (window.Debug) {
          Debug.debug("EXPORT", "Download dialog canceled");
        }
        document.body.removeChild(dialogOverlay);
      });

    document
      .getElementById("confirm-download")
      .addEventListener("click", function () {
        const format = document.getElementById("format-select").value;
        const size = document.getElementById("size-select").value;

        if (window.Debug) {
          Debug.debug("EXPORT", "Download options confirmed", {
            format,
            size,
          });
        }

        // Remove dialog
        document.body.removeChild(dialogOverlay);

        // Generate and download image using mockup model and name
        const currentMockup = Mockups.getCurrentMockup();
        const sanitizedName = currentMockup.model.replace(/\s+/g, "_");
        const fileName = `${sanitizedName}_${size}x${size}.${format}`;

        if (window.Debug) {
          Debug.debug("EXPORT", `Generating file: ${fileName}`);
        }

        generateAndDownloadImage(fileName, format, parseInt(size));
      });
  }

  /**
   * Generate and download image with exact 1:1 rendering
   * @param {string} fileName - Filename for download
   * @param {string} format - File format (png/jpg)
   * @param {number} size - Image size in pixels
   * @returns {Promise<boolean>} - True if download succeeded
   */
  async function generateAndDownloadImage(
    fileName = "phone-case-design.png",
    format = "png",
    size = 1200
  ) {
    // Create a short delay to ensure UI is fully rendered
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (window.Debug) {
      Debug.info("EXPORT", "Starting exact 1:1 image capture", {
        fileName,
        format,
        size,
      });
    }

    // Show progress message
    const progressMsg = document.createElement("div");
    progressMsg.className = "progress-message";
    progressMsg.textContent = "Generowanie obrazu, proszę czekać...";
    document.body.appendChild(progressMsg);

    try {
      const transformState = Transformations.getState();

      // Ensure html2canvas is loaded
      if (typeof html2canvas !== "function") {
        if (window.Debug) {
          Debug.debug("EXPORT", "html2canvas not loaded, loading it now");
        }
        await loadHtml2Canvas();
      }

      // Get the editor container
      const editorContainer = document.getElementById("editor-container");
      if (!editorContainer) {
        throw new Error("Editor container not found");
      }

      // Store exact visual state before capture
      const editorRect = editorContainer.getBoundingClientRect();
      const originalComputedStyle = window.getComputedStyle(editorContainer);

      // Save all relevant DOM element states that we'll temporarily modify
      const elementsToHide = [];
      document
        .querySelectorAll(".controls, .drag-instruction, .calibration-bubble")
        .forEach((el) => {
          elementsToHide.push({
            element: el,
            display: el.style.display,
          });
          el.style.display = "none";
        });

      // Save original editor background color
      const originalBgColor = editorContainer.style.backgroundColor;
      // Set background from current state
      editorContainer.style.backgroundColor =
        transformState.currentBackgroundColor || "#FFFFFF";

      // No need to clone images or elements anymore since we're directly capturing
      // the actual editor container with all its contents

      // Configure html2canvas for exact 1:1 capture
      const html2canvasOptions = {
        backgroundColor: transformState.currentBackgroundColor || "#FFFFFF",
        scale: 1, // Use scale 1 for exact 1:1 representation
        logging: window.Debug ? true : false,
        useCORS: true,
        allowTaint: true,
        ignoreElements: (element) => {
          // Ignore controls and UI elements
          return (
            element.classList &&
            (element.classList.contains("controls") ||
              element.classList.contains("drag-instruction") ||
              element.classList.contains("calibration-bubble"))
          );
        },
        onclone: (clonedDoc) => {
          if (window.Debug) {
            Debug.debug("EXPORT", "DOM cloned by html2canvas");
          }
        },
      };

      if (window.Debug) {
        Debug.debug(
          "EXPORT",
          "Starting html2canvas with options",
          html2canvasOptions
        );
      }

      // Directly capture the actual editor container (not a clone)
      const canvas = await html2canvas(editorContainer, html2canvasOptions);

      // Restore all hidden elements
      elementsToHide.forEach((item) => {
        item.element.style.display = item.display || "";
      });

      // Restore original background color
      editorContainer.style.backgroundColor = originalBgColor;

      if (window.Debug) {
        Debug.debug("EXPORT", "html2canvas capture completed", {
          width: canvas.width,
          height: canvas.height,
        });
      }

      // Resize to requested output size with high quality
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = size;
      outputCanvas.height = size;
      const ctx = outputCanvas.getContext("2d");

      // Apply high-quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fill with background color first
      ctx.fillStyle = transformState.currentBackgroundColor || "#FFFFFF";
      ctx.fillRect(0, 0, size, size);

      // Draw captured content with proper centering and scaling
      const scaleFactor = Math.min(size / canvas.width, size / canvas.height);
      const drawWidth = canvas.width * scaleFactor;
      const drawHeight = canvas.height * scaleFactor;
      const drawX = (size - drawWidth) / 2;
      const drawY = (size - drawHeight) / 2;

      ctx.drawImage(canvas, drawX, drawY, drawWidth, drawHeight);

      if (window.Debug) {
        Debug.debug("EXPORT", "Final canvas prepared", {
          size: size,
          scaleFactor: scaleFactor,
        });
      }

      // Convert to appropriate format and download
      if (format === "jpg") {
        const dataURL = outputCanvas.toDataURL(
          "image/jpeg",
          EditorConfig.export.jpgQuality
        );
        downloadUsingDataURL(dataURL, fileName);
      } else {
        outputCanvas.toBlob(
          (blob) => downloadUsingBlob(blob, fileName),
          "image/png"
        );
      }

      // Remove progress message
      document.body.removeChild(progressMsg);
      return true;
    } catch (error) {
      console.error("Error generating image:", error);
      if (window.Debug) {
        Debug.error("EXPORT", "Error during image capture", error);
      }
      if (progressMsg.parentNode) {
        document.body.removeChild(progressMsg);
      }
      alert("Wystąpił błąd podczas generowania obrazu: " + error.message);
      return false;
    }
  }

  /**
   * Load html2canvas library dynamically if not already available
   * @returns {Promise} Resolves when html2canvas is loaded
   */
  function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
      if (typeof html2canvas === "function") {
        resolve();
        return;
      }

      if (window.Debug) {
        Debug.debug("EXPORT", "Loading html2canvas library dynamically");
      }

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.integrity =
        "sha512-BNaRQnYJYiPSqHHDb58B0yaPfCu+Wgds8Gp/gU33kqBtgNS4tSPHuGibyoeqMV/TJlSKda6FXzoEyYGjTe+vXA==";
      script.crossOrigin = "anonymous";
      script.referrerPolicy = "no-referrer";
      script.onload = resolve;
      script.onerror = () =>
        reject(new Error("Failed to load html2canvas library"));
      document.head.appendChild(script);
    });
  }

  /**
   * Download using Blob
   * @param {Blob} blob - Image blob
   * @param {string} fileName - File name
   */
  function downloadUsingBlob(blob, fileName) {
    try {
      if (window.Debug) {
        Debug.debug("EXPORT", "Downloading using Blob", {
          blobSize: blob.size,
        });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (window.Debug) {
          Debug.info("EXPORT", "Download completed successfully");
        }
      }, 100);
    } catch (e) {
      if (window.Debug) {
        Debug.error("EXPORT", "Error while downloading (blob)", e);
      }
      console.error("Error while downloading (blob):", e);
      alert("Wystąpił błąd przy pobieraniu obrazu: " + e.message);
    }
  }

  /**
   * Download using Data URL
   * @param {string} dataURL - Image data URL
   * @param {string} fileName - File name
   */
  function downloadUsingDataURL(dataURL, fileName) {
    try {
      if (window.Debug) {
        Debug.debug("EXPORT", "Downloading using DataURL");
      }

      const a = document.createElement("a");
      a.href = dataURL;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      setTimeout(function () {
        document.body.removeChild(a);
        if (window.Debug) {
          Debug.info("EXPORT", "Download completed successfully");
        }
      }, 100);
    } catch (e) {
      if (window.Debug) {
        Debug.error("EXPORT", "Error while downloading (dataURL)", e);
      }
      console.error("Error while downloading (dataURL):", e);
      alert("Wystąpił błąd przy pobieraniu obrazu: " + e.message);
    }
  }

  /**
   * Download multiple mockups with exact 1:1 rendering
   * @param {Array} mockups - Array of mockup objects
   */
  async function downloadMultipleMockups(mockups) {
    if (window.Debug) {
      Debug.info(
        "EXPORT",
        `Starting download of ${mockups.length} mockups`,
        mockups
      );
    }

    // Create progress indicator
    const progressMsg = document.createElement("div");
    progressMsg.className = "progress-message";
    progressMsg.textContent = `Generowanie ${mockups.length} obrazów, proszę czekać...`;
    document.body.appendChild(progressMsg);

    // Save current mockup to restore it later
    const originalMockup = Mockups.getCurrentMockup();

    if (window.Debug) {
      Debug.debug("EXPORT", "Saved original mockup", originalMockup);
    }

    try {
      // For each selected mockup
      for (let i = 0; i < mockups.length; i++) {
        const mockup = mockups[i];
        progressMsg.textContent = `Generowanie obrazu ${i + 1} z ${
          mockups.length
        }...`;

        if (window.Debug) {
          Debug.debug(
            "EXPORT",
            `Generating image ${i + 1}/${mockups.length}`,
            mockup
          );
        }

        // Change mockup with sufficient timeout to ensure complete loading
        await new Promise((resolve) => {
          Mockups.changeMockup(
            mockup.path,
            mockup.name,
            mockup.id,
            mockup.model
          );

          // Create event listener to know when mockup image is fully loaded
          const mockupImg = document.getElementById("mockup-image");
          if (mockupImg) {
            const originalSrc = mockupImg.src;
            const loadHandler = function () {
              mockupImg.removeEventListener("load", loadHandler);
              // Give a little extra time for rendering
              setTimeout(resolve, 100);
            };

            // Only add listener if src is different
            if (mockupImg.src !== mockup.path) {
              mockupImg.addEventListener("load", loadHandler);
            } else {
              // If src is already correct, just wait a bit
              setTimeout(resolve, 300);
            }
          } else {
            // Fallback if mockup image element not found
            setTimeout(resolve, 500);
          }
        });

        // Download image - using model and mockup name in filename
        const fileName = `${mockup.model || "Inne"}_${mockup.name.replace(
          /\s+/g,
          "_"
        )}_${i + 1}.png`;

        await generateAndDownloadImage(fileName);
      }
    } catch (error) {
      console.error("Error generating multiple mockups:", error);
      if (window.Debug) {
        Debug.error("EXPORT", "Error during batch processing", error);
      }
      alert("Wystąpił błąd podczas generowania obrazów: " + error.message);
    } finally {
      // Always restore original mockup
      if (window.Debug) {
        Debug.debug("EXPORT", "Restoring original mockup", originalMockup);
      }

      Mockups.changeMockup(
        originalMockup.path,
        originalMockup.name,
        originalMockup.id,
        originalMockup.model
      );

      // Remove progress indicator
      if (progressMsg.parentNode) {
        document.body.removeChild(progressMsg);
      }

      if (window.Debug) {
        Debug.info(
          "EXPORT",
          `Completed batch processing of ${mockups.length} images`
        );
      }
    }
  }

  /**
   * Initialize export module
   */
  function init() {
    if (window.Debug) {
      Debug.info("EXPORT", "Initializing export module");
    }

    // Download button handler
    Elements.downloadButton.addEventListener("click", function () {
      // Check if ElementsManager exists and has elements or UserImage is loaded
      const hasElements =
        window.ElementsManager && ElementsManager.getElementCount() > 0;
      const hasUserImage = window.UserImage && UserImage.isImageLoaded();

      if (!hasElements && !hasUserImage) {
        if (window.Debug) {
          Debug.warn("EXPORT", "Download attempt without any loaded image");
        }
        alert("Please upload an image first!");
        return;
      }

      if (window.Debug) {
        Debug.debug("EXPORT", "Download button clicked");
      }

      // Show format and size selection dialog
      showDownloadOptions();
    });

    // Listen for downloadSelectedMockups event
    document.addEventListener("downloadSelectedMockups", function (e) {
      if (window.Debug) {
        Debug.debug("EXPORT", "Received downloadSelectedMockups event", {
          mockupCount: e.detail.mockups.length,
        });
      }
      downloadMultipleMockups(e.detail.mockups);
    });

    // Pre-load html2canvas for faster first export
    setTimeout(() => {
      loadHtml2Canvas()
        .then(() => {
          if (window.Debug) {
            Debug.debug("EXPORT", "html2canvas pre-loaded successfully");
          }
        })
        .catch((err) => {
          if (window.Debug) {
            Debug.warn("EXPORT", "Failed to pre-load html2canvas", err);
          }
        });
    }, 2000);
  }

  // Public interface
  return {
    init,
    showDownloadOptions,
    generateAndDownloadImage,
    downloadMultipleMockups,
  };
})();

// Export module as global object
window.Export = Export;
