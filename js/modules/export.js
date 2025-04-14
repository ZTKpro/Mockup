/**
 * export.js - Module for exporting and downloading images
 * Modified with improved calibration based on test data
 */

const Export = (function () {
  // Initialize debugging
  if (window.Debug) {
    Debug.info("EXPORT", "Initializing export module");
  }

  // Reference size for which scaling factors work correctly
  const REFERENCE_SIZE = 1200;

  /**
   * Calculate zoom factor based on image dimensions and desired zoom percentage
   * Improved implementation based on test data from kalibracja.txt
   * @param {number} imageWidth - Width of the image in pixels
   * @param {number} imageHeight - Height of the image in pixels
   * @param {number} zoomPercentage - Desired zoom level (default: 100)
   * @returns {number} - Calculated zoom factor
   */
  function calculateZoomFactor(imageWidth, imageHeight, zoomPercentage = 100) {
    // Calculate normalized area (in millions of pixels)
    const normalizedArea = (imageWidth * imageHeight) / 1000000;

    // Determine base factor based on image dimensions and aspect ratio
    let baseFactor;
    const aspectRatio =
      Math.max(imageWidth, imageHeight) / Math.min(imageWidth, imageHeight);

    if (normalizedArea <= 0.25) {
      // Small images (0-0.25 MP)
      baseFactor = 0.019;
    } else if (normalizedArea <= 0.4) {
      // Medium images (0.25-0.4 MP)
      baseFactor = 0.017;
    } else if (normalizedArea <= 0.6) {
      // Large images (0.4-0.6 MP)
      baseFactor = 0.015;
    } else if (normalizedArea <= 0.8) {
      // Larger images (0.6-0.8 MP)
      baseFactor = 0.0135;
    } else {
      // Very large images (0.8+ MP)
      baseFactor = 0.0125;
    }

    // Apply aspect ratio adjustment
    if (aspectRatio > 1.5) {
      // Elongated images need slightly different calibration
      baseFactor = Math.max(0.0125, baseFactor - 0.001);
    }

    // Apply zoom level adjustment
    let zoomAdjustment = 0;
    if (zoomPercentage > 50) {
      // Higher zoom needs higher factor for small/medium images
      if (normalizedArea <= 0.4) {
        zoomAdjustment = 0.001 * Math.min(1, (zoomPercentage - 50) / 30);
      }
    } else if (zoomPercentage < 20) {
      // Very low zoom needs lower factor
      zoomAdjustment = -0.0005 * Math.min(1, (20 - zoomPercentage) / 10);
    }

    if (window.Debug) {
      Debug.debug("EXPORT", "Zoom factor calculation", {
        imageWidth,
        imageHeight,
        normalizedArea,
        zoomPercentage,
        aspectRatio,
        baseFactor,
        zoomAdjustment,
        finalFactor: baseFactor + zoomAdjustment,
      });
    }

    return baseFactor + zoomAdjustment;
  }

  /**
   * Calculate position factor based on image dimensions
   * @param {number} imageWidth - Width of the image in pixels
   * @param {number} imageHeight - Height of the image in pixels
   * @returns {number} - Calculated position factor
   */
  function calculatePositionFactor(imageWidth, imageHeight) {
    const normalizedArea = (imageWidth * imageHeight) / 1000000;

    // Base position factor with progressive scale
    let factor;

    if (normalizedArea <= 0.25) {
      // Small images need more precision in positioning
      factor = 0.0022;
    } else if (normalizedArea <= 0.5) {
      // Medium images
      factor = 0.0018;
    } else if (normalizedArea <= 0.8) {
      // Large images
      factor = 0.0016;
    } else {
      // Very large images
      factor = 0.0014;
    }

    if (window.Debug) {
      Debug.debug("EXPORT", "Position factor calculation", {
        imageWidth,
        imageHeight,
        normalizedArea,
        factor,
      });
    }

    return factor;
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
   * Generate and download image
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
    if (window.Debug) {
      Debug.info("EXPORT", "Starting image generation", {
        fileName,
        format,
        size,
      });
    }

    const progressMsg = document.createElement("div");
    progressMsg.className = "progress-message";
    progressMsg.textContent = "Generowanie obrazu, proszę czekać...";
    document.body.appendChild(progressMsg);

    return new Promise((resolve) => {
      setTimeout(async function () {
        try {
          // Create canvas with specified size
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;

          const ctx = canvas.getContext("2d");
          // Settings for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Use selected background color
          const transformState = Transformations.getState();
          ctx.fillStyle = transformState.currentBackgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (window.Debug) {
            Debug.debug("EXPORT", "Created canvas and set background", {
              width: size,
              height: size,
              backgroundColor: transformState.currentBackgroundColor,
            });
          }

          // Load mockup image
          const mockupImg = new Image();
          mockupImg.crossOrigin = "Anonymous";
          const timestamp = new Date().getTime();
          mockupImg.src = Elements.mockupImage.src + "?t=" + timestamp;

          // Create a promise to wait for the mockup to load
          const mockupLoadPromise = new Promise((resolve, reject) => {
            mockupImg.onload = resolve;
            mockupImg.onerror = () =>
              reject(new Error("Nie udało się załadować obrazu mockupu"));

            // Timeout to prevent hanging
            setTimeout(
              () =>
                reject(new Error("Przekroczony czas ładowania obrazu mockupu")),
              10000
            );
          });

          try {
            // Wait for mockup to load
            await mockupLoadPromise;

            if (window.Debug) {
              Debug.debug("EXPORT", "Mockup image loaded", {
                width: mockupImg.naturalWidth,
                height: mockupImg.naturalHeight,
              });
            }

            // Calculate mockup scaling
            const mockupScaleFactor = Math.min(
              size / mockupImg.naturalWidth,
              size / mockupImg.naturalHeight
            );

            const drawWidth = mockupImg.naturalWidth * mockupScaleFactor;
            const drawHeight = mockupImg.naturalHeight * mockupScaleFactor;

            const mockupX = (canvas.width - drawWidth) / 2;
            const mockupY = (canvas.height - drawHeight) / 2;

            if (window.Debug) {
              Debug.debug("EXPORT", "Mockup drawing parameters", {
                mockupScaleFactor,
                drawWidth,
                drawHeight,
                mockupX,
                mockupY,
              });
            }

            // Check if we have the ElementsManager module
            if (
              window.ElementsManager &&
              ElementsManager.getElementCount() > 0
            ) {
              // Get all elements sorted by layer
              const elements = ElementsManager.getAllElements();

              if (window.Debug) {
                Debug.debug("EXPORT", `Drawing ${elements.length} elements`);
              }

              // Load all element images
              const elementImages = [];
              for (let i = 0; i < elements.length; i++) {
                const element = elements[i];

                try {
                  // Create and load image
                  const img = new Image();
                  img.crossOrigin = "Anonymous";

                  // Create a promise for this image load
                  await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = () =>
                      reject(
                        new Error(
                          `Nie udało się załadować elementu ${i + 1} image`
                        )
                      );
                    img.src = element.src;

                    // Timeout
                    setTimeout(
                      () =>
                        reject(
                          new Error(
                            `Przekroczony czas ładowania elementu ${i + 1}`
                          )
                        ),
                      10000
                    );
                  });

                  elementImages.push({
                    img: img,
                    transformations: element.transformations,
                  });

                  if (window.Debug) {
                    Debug.debug("EXPORT", `Element ${i + 1} image loaded`, {
                      width: img.naturalWidth,
                      height: img.naturalHeight,
                    });
                  }
                } catch (error) {
                  if (window.Debug) {
                    Debug.error(
                      "EXPORT",
                      `Error loading element ${i + 1} image`,
                      error
                    );
                  }
                  throw error;
                }
              }

              // Draw all elements according to layer order and mockup position
              drawElementsOnCanvas(
                ctx,
                elementImages,
                mockupScaleFactor,
                size,
                mockupImg,
                mockupX,
                mockupY,
                drawWidth,
                drawHeight
              );
            } else {
              // Legacy mode - single image
              if (window.Debug) {
                Debug.debug("EXPORT", "Using legacy mode (single image)");
              }

              // Always draw user image first, then mockup on top (ignore imageOnTop flag)
              await drawLegacyUserImage(ctx, mockupScaleFactor, size);
              ctx.drawImage(mockupImg, mockupX, mockupY, drawWidth, drawHeight);
            }

            // Convert to blob and download
            if (canvas.toBlob) {
              const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
              const quality =
                format === "jpg" ? EditorConfig.export.jpgQuality : undefined;

              if (window.Debug) {
                Debug.debug("EXPORT", "Generating BLOB", {
                  mimeType,
                  quality,
                });
              }

              canvas.toBlob(
                function (blob) {
                  downloadUsingBlob(blob);
                },
                mimeType,
                quality
              );
            } else {
              if (window.Debug) {
                Debug.debug(
                  "EXPORT",
                  "Canvas.toBlob not available, using DataURL"
                );
              }

              const dataURL = canvas.toDataURL(
                format === "jpg" ? "image/jpeg" : "image/png"
              );
              downloadUsingDataURL(dataURL);
            }
          } catch (error) {
            if (window.Debug) {
              Debug.error("EXPORT", "Error loading or drawing images", error);
            }
            document.body.removeChild(progressMsg);
            alert("Błąd: " + error.message);
            resolve(false);
          }

          async function drawLegacyUserImage(ctx, mockupScaleFactor, size) {
            if (window.Debug) {
              Debug.debug("EXPORT", "Drawing legacy user image");
            }

            const userImg = new Image();
            userImg.crossOrigin = "Anonymous";
            userImg.src = Elements.imagePreview.src;

            return new Promise((resolve, reject) => {
              userImg.onload = function () {
                try {
                  const canvasCenterX = size / 2;
                  const canvasCenterY = size / 2;

                  // Calculate size scaling ratio based on output size
                  const sizeScalingRatio = size / REFERENCE_SIZE;

                  // Calculate dynamic position factor based on image dimensions
                  const dynamicPositionFactor = calculatePositionFactor(
                    userImg.naturalWidth,
                    userImg.naturalHeight
                  );

                  // Apply dynamic position scaling
                  const scaledX =
                    transformState.currentX *
                    dynamicPositionFactor *
                    sizeScalingRatio *
                    size;
                  const scaledY =
                    transformState.currentY *
                    dynamicPositionFactor *
                    sizeScalingRatio *
                    size;

                  const userImageX = canvasCenterX + scaledX;
                  const userImageY = canvasCenterY + scaledY;

                  // Calculate zoom factor based on image dimensions, zoom percentage, and output size
                  const dynamicZoomFactor = calculateZoomFactor(
                    userImg.naturalWidth,
                    userImg.naturalHeight,
                    transformState.currentZoom
                  );
                  const absoluteZoom =
                    transformState.currentZoom *
                    dynamicZoomFactor *
                    sizeScalingRatio;

                  if (window.Debug) {
                    Debug.debug(
                      "EXPORT",
                      "Legacy user image transformation parameters",
                      {
                        scaledX,
                        scaledY,
                        userImageX,
                        userImageY,
                        rotation: transformState.currentRotation,
                        currentZoomPercent: transformState.currentZoom,
                        sizeScalingRatio,
                        dynamicPositionFactor,
                        dynamicZoomFactor,
                        absoluteZoom,
                        imageWidth: userImg.naturalWidth,
                        imageHeight: userImg.naturalHeight,
                      }
                    );
                  }

                  ctx.save();
                  ctx.translate(userImageX, userImageY);
                  ctx.rotate((transformState.currentRotation * Math.PI) / 180);
                  ctx.scale(absoluteZoom, absoluteZoom);
                  ctx.drawImage(
                    userImg,
                    -userImg.naturalWidth / 2,
                    -userImg.naturalHeight / 2
                  );
                  ctx.restore();

                  resolve();
                } catch (error) {
                  reject(error);
                }
              };

              userImg.onerror = () =>
                reject(new Error("Nie udało się załadować obrazu użytkownika"));
              setTimeout(
                () =>
                  reject(
                    new Error("Przekroczony czas ładowania obrazu użytkownika")
                  ),
                10000
              );
            });
          }

          function drawElementsOnCanvas(
            ctx,
            elementImages,
            mockupScaleFactor,
            size,
            mockupImg,
            mockupX,
            mockupY,
            drawWidth,
            drawHeight
          ) {
            if (window.Debug) {
              Debug.debug("EXPORT", "Drawing multiple elements on canvas");
            }

            const canvasCenterX = size / 2;
            const canvasCenterY = size / 2;
            const sizeScalingRatio = size / REFERENCE_SIZE;

            // Ensure mockup is always on top
            const mockupLayerIndex = Number.MAX_SAFE_INTEGER;

            // Sort elements by layer index (bottom to top)
            elementImages.sort(
              (a, b) =>
                a.transformations.layerIndex - b.transformations.layerIndex
            );

            // Create an array of all layers including the mockup
            const allLayers = [
              ...elementImages.map((el) => ({
                type: "element",
                layerIndex: el.transformations.layerIndex,
                data: el,
              })),
              {
                type: "mockup",
                layerIndex: mockupLayerIndex,
                data: {
                  img: mockupImg,
                  x: mockupX,
                  y: mockupY,
                  width: drawWidth,
                  height: drawHeight,
                },
              },
            ];

            // Sort all layers by layer index
            allLayers.sort((a, b) => a.layerIndex - b.layerIndex);

            // Draw each layer
            allLayers.forEach((layer) => {
              if (layer.type === "mockup") {
                // Draw mockup
                ctx.drawImage(
                  layer.data.img,
                  layer.data.x,
                  layer.data.y,
                  layer.data.width,
                  layer.data.height
                );
              } else {
                // Draw element
                const element = layer.data;
                const transform = element.transformations;

                // Calculate dynamic position factor based on image dimensions
                const dynamicPositionFactor = calculatePositionFactor(
                  element.img.naturalWidth,
                  element.img.naturalHeight
                );

                // Apply dynamic position scaling
                const scaledX =
                  transform.x * dynamicPositionFactor * sizeScalingRatio * size;
                const scaledY =
                  transform.y * dynamicPositionFactor * sizeScalingRatio * size;

                const elementX = canvasCenterX + scaledX;
                const elementY = canvasCenterY + scaledY;

                // Calculate dynamic zoom factor based on image dimensions and zoom percentage
                const dynamicZoomFactor = calculateZoomFactor(
                  element.img.naturalWidth,
                  element.img.naturalHeight,
                  transform.zoom
                );
                const absoluteZoom =
                  transform.zoom * dynamicZoomFactor * sizeScalingRatio;

                if (window.Debug) {
                  Debug.debug(
                    "EXPORT",
                    `Drawing element at layer ${transform.layerIndex}`,
                    {
                      scaledX,
                      scaledY,
                      elementX,
                      elementY,
                      rotation: transform.rotation,
                      zoom: transform.zoom,
                      dynamicPositionFactor,
                      dynamicZoomFactor,
                      absoluteZoom,
                      imageWidth: element.img.naturalWidth,
                      imageHeight: element.img.naturalHeight,
                    }
                  );
                }

                ctx.save();
                ctx.translate(elementX, elementY);
                ctx.rotate((transform.rotation * Math.PI) / 180);
                ctx.scale(absoluteZoom, absoluteZoom);
                ctx.drawImage(
                  element.img,
                  -element.img.naturalWidth / 2,
                  -element.img.naturalHeight / 2
                );
                ctx.restore();
              }
            });
          }

          function downloadUsingBlob(blob) {
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
                document.body.removeChild(progressMsg);

                if (window.Debug) {
                  Debug.info("EXPORT", "Download completed successfully");
                }

                resolve(true);
              }, 100);
            } catch (e) {
              if (window.Debug) {
                Debug.error("EXPORT", "Error while downloading (blob)", e);
              }
              console.error("Error while downloading (blob):", e);
              document.body.removeChild(progressMsg);
              alert("Wystąpił błąd przy pobieraniu obrazu: " + e.message);
              resolve(false);
            }
          }

          function downloadUsingDataURL(dataURL) {
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
                document.body.removeChild(progressMsg);

                if (window.Debug) {
                  Debug.info("EXPORT", "Download completed successfully");
                }

                resolve(true);
              }, 100);
            } catch (e) {
              if (window.Debug) {
                Debug.error("EXPORT", "Error while downloading (dataURL)", e);
              }
              console.error("Error while downloading (dataURL):", e);
              document.body.removeChild(progressMsg);
              alert("Wystąpił błąd przy pobieraniu obrazu: " + e.message);
              resolve(false);
            }
          }
        } catch (e) {
          if (window.Debug) {
            Debug.error("EXPORT", "Error generating image", e);
          }
          console.error("Error generating image:", e);
          document.body.removeChild(progressMsg);
          alert("Wystąpił błąd podczas generowania obrazu: " + e.message);
          resolve(false);
        }
      }, 100);
    });
  }

  /**
   * Download multiple mockups at once
   * @param {Array} mockups - List of mockups to download
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
    progressMsg.textContent = `Generating ${mockups.length} images, please wait...`;
    document.body.appendChild(progressMsg);

    // Save current mockup to restore it later
    const originalMockup = Mockups.getCurrentMockup();

    if (window.Debug) {
      Debug.debug("EXPORT", "Saved original mockup", originalMockup);
    }

    // For each selected mockup
    for (let i = 0; i < mockups.length; i++) {
      const mockup = mockups[i];
      progressMsg.textContent = `Generating image ${i + 1} of ${
        mockups.length
      }...`;

      if (window.Debug) {
        Debug.debug(
          "EXPORT",
          `Generating image ${i + 1}/${mockups.length}`,
          mockup
        );
      }

      // Change mockup
      await new Promise((resolve) => {
        Mockups.changeMockup(mockup.path, mockup.name, mockup.id, mockup.model);
        // Give time for mockup to load
        setTimeout(resolve, 200);
      });

      // Download image - using model and mockup name in filename
      const fileName = `${mockup.model || "Inne"}_${mockup.name.replace(
        /\s+/g,
        "_"
      )}_${i + 1}.png`;
      await generateAndDownloadImage(fileName);
    }

    // Restore original mockup
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
    document.body.removeChild(progressMsg);

    if (window.Debug) {
      Debug.info("EXPORT", `Successfully generated ${mockups.length} images`);
    }

    alert(`Successfully generated ${mockups.length} mockup(s)!`);
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
