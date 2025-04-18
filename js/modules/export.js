/**
 * export.js - Module for exporting and downloading images
 * Enhanced for high-quality image exports with perfect fidelity and ZIP support
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
              (size) =>
                `<option value="${size}" ${
                  size === 1000 ? "selected" : ""
                }>${size} x ${size} px</option>`
            )
            .join("")}
        </select>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Jakość:</label>
        <select id="quality-select" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
          <option value="high">Wysoka (zalecana)</option>
          <option value="ultra">Ultra wysoka (większy plik)</option>
          <option value="standard">Standardowa</option>
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
        const size = parseInt(document.getElementById("size-select").value, 10);
        const quality = document.getElementById("quality-select").value;

        if (window.Debug) {
          Debug.debug("EXPORT", "Download options confirmed", {
            format,
            size,
            quality,
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

        generateAndDownloadImage(fileName, format, size, quality);
      });
  }

  /**
   * Generate and download image with high quality rendering
   * @param {string} fileName - Filename for download
   * @param {string} format - File format (png/jpg)
   * @param {number} size - Image size in pixels
   * @param {string} quality - Quality setting (standard/high/ultra)
   * @returns {Promise<boolean>} - True if download succeeded
   */
  async function generateAndDownloadImage(
    fileName = "phone-case-design.png",
    format = "png",
    size = 1000,
    quality = "high"
  ) {
    // Create a short delay to ensure UI is fully rendered
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (window.Debug) {
      Debug.info("EXPORT", "Starting high-quality image capture", {
        fileName,
        format,
        size,
        quality,
      });
    }

    // Show progress message
    const progressMsg = document.createElement("div");
    progressMsg.className = "progress-message";
    progressMsg.textContent =
      "Generowanie obrazu wysokiej jakości, proszę czekać...";
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

      // Determine capture scale based on quality settings and device pixel ratio
      const devicePixelRatio = window.devicePixelRatio || 1;
      let captureScale = devicePixelRatio;

      if (quality === "high") {
        captureScale = Math.max(2, devicePixelRatio);
      } else if (quality === "ultra") {
        captureScale = Math.max(3, devicePixelRatio);
      }

      // Configure html2canvas for high quality capture
      const html2canvasOptions = {
        backgroundColor: transformState.currentBackgroundColor || "#FFFFFF",
        // Key improvement: use higher scale for better quality
        scale: captureScale,
        logging: window.Debug ? true : false,
        useCORS: true,
        allowTaint: true,
        // Add additional rendering improvements
        imageTimeout: 0, // No timeout for image loading
        removeContainer: false,
        foreignObjectRendering: false, // More compatible but may be slower
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
          // Enhance image quality in the cloned document
          const imageElements = clonedDoc.querySelectorAll("img");
          imageElements.forEach((img) => {
            // Remove any image smoothing that might blur pixel art
            if (img.style) {
              img.style.imageRendering = "high-quality";
            }
          });
        },
      };

      if (window.Debug) {
        Debug.debug(
          "EXPORT",
          "Starting html2canvas with enhanced options",
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
          scale: captureScale,
        });
      }

      // Create output canvas with requested dimensions
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = size;
      outputCanvas.height = size;
      const ctx = outputCanvas.getContext("2d");

      // Apply high-quality scaling settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Use better algorithms when possible
      if (typeof ctx.filter !== "undefined") {
        // Apply subtle sharpening for PNG exports
        if (format === "png" && quality === "ultra") {
          ctx.filter = "contrast(1.05) saturate(1.02)";
        }
      }

      // Fill with background color first
      ctx.fillStyle = transformState.currentBackgroundColor || "#FFFFFF";
      ctx.fillRect(0, 0, size, size);

      // Draw captured content with proper centering and scaling
      const scaleFactor = Math.min(size / canvas.width, size / canvas.height);
      const drawWidth = canvas.width * scaleFactor;
      const drawHeight = canvas.height * scaleFactor;
      const drawX = (size - drawWidth) / 2;
      const drawY = (size - drawHeight) / 2;

      // Draw image with best quality
      ctx.drawImage(canvas, drawX, drawY, drawWidth, drawHeight);

      if (window.Debug) {
        Debug.debug("EXPORT", "Final canvas prepared with enhanced quality", {
          size: size,
          scaleFactor: scaleFactor,
          quality: quality,
        });
      }

      // Convert to appropriate format and download with quality settings
      if (format === "jpg") {
        // Better quality setting for JPG based on selected quality
        let jpgQuality = 0.92; // High default
        if (quality === "ultra") {
          jpgQuality = 0.95;
        } else if (quality === "standard") {
          jpgQuality = 0.85;
        }

        const dataURL = outputCanvas.toDataURL("image/jpeg", jpgQuality);
        downloadUsingDataURL(dataURL, fileName);
      } else {
        // For PNG, use best quality always
        outputCanvas.toBlob(
          (blob) => downloadUsingBlob(blob, fileName),
          "image/png"
        );
      }

      // Apply subtle sharpen effect for better details (post-processing)
      if (format === "png" && quality === "ultra") {
        try {
          applySharpen(outputCanvas);
        } catch (err) {
          if (window.Debug) {
            Debug.warn("EXPORT", "Could not apply sharpen filter", err);
          }
        }
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
   * Apply a subtle sharpen effect to improve image clarity
   * @param {HTMLCanvasElement} canvas - Canvas to sharpen
   */
  function applySharpen(canvas) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Create a temporary canvas for the sharpen operation
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d");

    // Draw original image first
    tempCtx.drawImage(canvas, 0, 0);

    // Apply a subtle unsharp mask (simplified)
    const amount = 0.5; // Sharpen amount (0.0 to 1.0)
    const threshold = 3; // Threshold (0 to 255)

    // We'll use a simple convolution kernel to sharpen
    // This is a simplified approach that works well enough
    const imageData2 = tempCtx.getImageData(0, 0, width, height);
    const data2 = imageData2.data;

    // Very simplified sharpening - just increase contrast between adjacent pixels
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const offset = (y * width + x) * 4;

        for (let c = 0; c < 3; c++) {
          const current = data2[offset + c];
          const neighbors =
            (data2[offset - width * 4 + c] +
              data2[offset - 4 + c] +
              data2[offset + 4 + c] +
              data2[offset + width * 4 + c]) /
            4;

          const diff = current - neighbors;
          if (Math.abs(diff) > threshold) {
            data[offset + c] = Math.max(
              0,
              Math.min(255, current + diff * amount)
            );
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
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
   * Download multiple mockups with high quality rendering
   * @param {Array} mockups - Array of mockup objects
   */
  async function downloadMultipleMockups(mockups) {
    if (window.Debug) {
      Debug.info(
        "EXPORT",
        `Starting download of ${mockups.length} mockups with high quality`,
        mockups
      );
    }

    // Show quality selection dialog before batch export
    const dialogOverlay = document.createElement("div");
    dialogOverlay.className = "download-dialog-overlay";

    const dialogBox = document.createElement("div");
    dialogBox.className = "download-dialog";

    dialogBox.innerHTML = `
      <h3>Opcje eksportu wielu mockupów</h3>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Format pliku:</label>
        <select id="batch-format-select" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
          <option value="png">PNG</option>
          <option value="jpg">JPG</option>
        </select>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Rozmiar:</label>
        <select id="batch-size-select" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
          ${EditorConfig.export.availableSizes
            .map(
              (size) =>
                `<option value="${size}" ${
                  size === 1000 ? "selected" : ""
                }>${size} x ${size} px</option>`
            )
            .join("")}
        </select>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Jakość:</label>
        <select id="batch-quality-select" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
          <option value="high">Wysoka (zalecana)</option>
          <option value="ultra">Ultra wysoka (większe pliki)</option>
          <option value="standard">Standardowa</option>
        </select>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Metoda pobierania:</label>
        <select id="batch-download-method" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
          <option value="zip">Wszystkie pliki w jednym archiwum ZIP</option>
          <option value="individual">Pojedyncze pliki</option>
        </select>
      </div>
      
      <div class="download-dialog-buttons">
        <button id="batch-cancel" class="cancel">Anuluj</button>
        <button id="batch-confirm" class="confirm">Generuj ${
          mockups.length
        } mockupów</button>
      </div>
    `;

    dialogOverlay.appendChild(dialogBox);
    document.body.appendChild(dialogOverlay);

    // Wait for user choice
    const selection = await new Promise((resolve) => {
      document.getElementById("batch-cancel").addEventListener("click", () => {
        document.body.removeChild(dialogOverlay);
        resolve(null);
      });

      document.getElementById("batch-confirm").addEventListener("click", () => {
        const format = document.getElementById("batch-format-select").value;
        const size = parseInt(
          document.getElementById("batch-size-select").value,
          10
        );
        const quality = document.getElementById("batch-quality-select").value;
        const downloadMethod = document.getElementById(
          "batch-download-method"
        ).value;

        document.body.removeChild(dialogOverlay);
        resolve({ format, size, quality, downloadMethod });
      });
    });

    // If user canceled, return
    if (!selection) return;

    // Create progress indicator
    const progressMsg = document.createElement("div");
    progressMsg.className = "progress-message";
    progressMsg.textContent = `Generowanie ${mockups.length} obrazów wysokiej jakości, proszę czekać...`;
    document.body.appendChild(progressMsg);

    // Save current mockup to restore it later
    const originalMockup = Mockups.getCurrentMockup();

    if (window.Debug) {
      Debug.debug(
        "EXPORT",
        "Saved original mockup for restoration",
        originalMockup
      );
    }

    try {
      // Check if JSZip is available when zip method is selected
      if (selection.downloadMethod === "zip" && typeof JSZip === "undefined") {
        throw new Error(
          "JSZip library not found. Please include it in your HTML file."
        );
      }

      // Create a new ZIP file if needed
      const zip = selection.downloadMethod === "zip" ? new JSZip() : null;
      const generatedFiles = [];

      // For each selected mockup
      for (let i = 0; i < mockups.length; i++) {
        const mockup = mockups[i];
        progressMsg.textContent = `Generowanie obrazu ${i + 1} z ${
          mockups.length
        }...`;

        if (window.Debug) {
          Debug.debug(
            "EXPORT",
            `Generating high quality image ${i + 1}/${mockups.length}`,
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

        // Generate filename
        const fileName = `${mockup.model || "Inne"}_${mockup.name.replace(
          /\s+/g,
          "_"
        )}_${i + 1}.${selection.format}`;

        // If using ZIP, capture the canvas data but don't download it
        if (selection.downloadMethod === "zip") {
          // Generate the image - similar to generateAndDownloadImage but without download
          const canvas = await captureCanvasForZip(
            selection.format,
            selection.size,
            selection.quality
          );

          if (canvas) {
            // Store the canvas for later adding to ZIP
            generatedFiles.push({
              fileName: fileName,
              canvas: canvas,
              format: selection.format,
              quality: selection.quality,
            });

            if (window.Debug) {
              Debug.debug("EXPORT", `Added ${fileName} to ZIP queue`);
            }
          }
        } else {
          // Download individually (original behavior)
          await generateAndDownloadImage(
            fileName,
            selection.format,
            selection.size,
            selection.quality
          );
        }
      }

      // If using ZIP method, process all stored canvases and create the ZIP file
      if (selection.downloadMethod === "zip" && generatedFiles.length > 0) {
        progressMsg.textContent = "Tworzenie archiwum ZIP...";

        // Get current date for zip filename
        const date = new Date();
        const zipFilename = `mockups_${date.getFullYear()}-${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}.zip`;

        // Add each file to the ZIP
        for (let i = 0; i < generatedFiles.length; i++) {
          const file = generatedFiles[i];
          progressMsg.textContent = `Dodawanie do ZIP: ${i + 1}/${
            generatedFiles.length
          }`;

          // Convert canvas to blob
          const blob = await new Promise((resolve) => {
            if (file.format === "jpg") {
              // Get quality setting
              let jpgQuality = 0.92; // High default
              if (file.quality === "ultra") {
                jpgQuality = 0.95;
              } else if (file.quality === "standard") {
                jpgQuality = 0.85;
              }
              file.canvas.toBlob(resolve, "image/jpeg", jpgQuality);
            } else {
              file.canvas.toBlob(resolve, "image/png");
            }
          });

          // Add to ZIP
          zip.file(file.fileName, blob);
        }

        // Generate ZIP file
        progressMsg.textContent = "Generowanie archiwum ZIP...";
        const zipBlob = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: {
            level: 6, // Balanced compression
          },
        });

        // Download the ZIP file
        downloadUsingBlob(zipBlob, zipFilename);
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
          `Completed batch processing of ${mockups.length} high quality images`
        );
      }
    }
  }

  /**
   * Capture canvas for ZIP without downloading
   * This is a variation of generateAndDownloadImage that returns the canvas instead of downloading
   * @param {string} format - File format (png/jpg)
   * @param {number} size - Image size in pixels
   * @param {string} quality - Quality setting (standard/high/ultra)
   * @returns {Promise<HTMLCanvasElement>} - Canvas element with the captured image
   */
  async function captureCanvasForZip(
    format = "png",
    size = 1000,
    quality = "high"
  ) {
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

      // Determine capture scale based on quality settings and device pixel ratio
      const devicePixelRatio = window.devicePixelRatio || 1;
      let captureScale = devicePixelRatio;

      if (quality === "high") {
        captureScale = Math.max(2, devicePixelRatio);
      } else if (quality === "ultra") {
        captureScale = Math.max(3, devicePixelRatio);
      }

      // Configure html2canvas for high quality capture
      const html2canvasOptions = {
        backgroundColor: transformState.currentBackgroundColor || "#FFFFFF",
        // Key improvement: use higher scale for better quality
        scale: captureScale,
        logging: window.Debug ? true : false,
        useCORS: true,
        allowTaint: true,
        // Add additional rendering improvements
        imageTimeout: 0, // No timeout for image loading
        removeContainer: false,
        foreignObjectRendering: false, // More compatible but may be slower
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
          // Enhance image quality in the cloned document
          const imageElements = clonedDoc.querySelectorAll("img");
          imageElements.forEach((img) => {
            // Remove any image smoothing that might blur pixel art
            if (img.style) {
              img.style.imageRendering = "high-quality";
            }
          });
        },
      };

      if (window.Debug) {
        Debug.debug(
          "EXPORT",
          "Starting html2canvas with enhanced options",
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
          scale: captureScale,
        });
      }

      // Create output canvas with requested dimensions
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = size;
      outputCanvas.height = size;
      const ctx = outputCanvas.getContext("2d");

      // Apply high-quality scaling settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Use better algorithms when possible
      if (typeof ctx.filter !== "undefined") {
        // Apply subtle sharpening for PNG exports
        if (format === "png" && quality === "ultra") {
          ctx.filter = "contrast(1.05) saturate(1.02)";
        }
      }

      // Fill with background color first
      ctx.fillStyle = transformState.currentBackgroundColor || "#FFFFFF";
      ctx.fillRect(0, 0, size, size);

      // Draw captured content with proper centering and scaling
      const scaleFactor = Math.min(size / canvas.width, size / canvas.height);
      const drawWidth = canvas.width * scaleFactor;
      const drawHeight = canvas.height * scaleFactor;
      const drawX = (size - drawWidth) / 2;
      const drawY = (size - drawHeight) / 2;

      // Draw image with best quality
      ctx.drawImage(canvas, drawX, drawY, drawWidth, drawHeight);

      // Apply subtle sharpen effect for better details (post-processing)
      if (format === "png" && quality === "ultra") {
        try {
          applySharpen(outputCanvas);
        } catch (err) {
          if (window.Debug) {
            Debug.warn("EXPORT", "Could not apply sharpen filter", err);
          }
        }
      }

      return outputCanvas;
    } catch (error) {
      console.error("Error capturing canvas:", error);
      if (window.Debug) {
        Debug.error("EXPORT", "Error during canvas capture", error);
      }
      return null;
    }
  }

  /**
   * Initialize export module
   */
  function init() {
    if (window.Debug) {
      Debug.info(
        "EXPORT",
        "Initializing export module with high quality support"
      );
    }

    // Update the default size in EditorConfig
    if (EditorConfig && EditorConfig.export) {
      EditorConfig.export.defaultSize = 1000;
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
    captureCanvasForZip,
  };
})();

// Export module as global object
window.Export = Export;
