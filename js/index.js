// Pobranie elementów DOM
const uploadInput = document.getElementById("image-upload");
const imagePreview = document.getElementById("image-preview");
const mockupImage = document.getElementById("mockup-image");
const editorContainer = document.getElementById("editor-container");
const controls = document.getElementById("controls");
const dragInstruction = document.getElementById("drag-instruction");
const dropArea = document.getElementById("drop-area");
const dropText = document.querySelector(".drop-text");
const uploadText = document.querySelector(".upload-text");
const mockupGallery = document.getElementById("mockup-gallery");
const downloadSelectedMockups = document.getElementById(
  "download-selected-mockups"
);

// Lista dostępnych mockupów
const mockupFiles = [];
let mockupThumbnails = [];
let mockupsData = []; // Przechowuje dane mockupów razem z ich nazwami

// Suwaki i przyciski kontrolne
const rotateSlider = document.getElementById("rotate-slider");
const rotateValue = document.getElementById("rotate-value");
const rotateLeft = document.getElementById("rotate-left");
const rotateRight = document.getElementById("rotate-right");

const zoomSlider = document.getElementById("zoom-slider");
const zoomValue = document.getElementById("zoom-value");
const zoomIn = document.getElementById("zoom-in");
const zoomOut = document.getElementById("zoom-out");

const resetButton = document.getElementById("reset-button");
const centerButton = document.getElementById("center-button");
const layerFrontButton = document.getElementById("layer-front");
const layerBackButton = document.getElementById("layer-back");

// Suwaki przesuwania obrazu
const moveXSlider = document.getElementById("move-x-slider");
const moveYSlider = document.getElementById("move-y-slider");
const moveXValue = document.getElementById("move-x-value");
const moveYValue = document.getElementById("move-y-value");

// Przycisk pobierania
const downloadButton = document.getElementById("download-button");

// Aktualny mockup
let currentMockupFile = "";
let currentMockupName = ""; // Przechowuje nazwę aktualnego mockupu
let currentMockupId = 0; // Przechowuje ID aktualnego mockupu

// Zmienne stanu
let isDragging = false;
let startX, startY, initialX, initialY;
let currentX = 0;
let currentY = 0;
let currentRotation = 0;
let currentZoom = 100;
let userImageLoaded = false; // Flaga do śledzenia, czy obraz użytkownika został wczytany

// Obsługa uploadu pliku przez kliknięcie
uploadInput.addEventListener("change", handleFileSelect);

// Tablica przechowująca wybrane mockupy
let selectedMockups = [];

// Funkcja przypisująca obsługę kliknięć do miniaturek
function setupThumbnailListeners() {
  mockupThumbnails = document.querySelectorAll(".mockup-thumbnail");

  // Obsługa kliknięć na miniaturki
  mockupThumbnails.forEach((thumbnail) => {
    thumbnail.addEventListener("click", function (e) {
      // Ignoruj kliknięcie, jeśli kliknięto na checkbox lub jest to przycisk dodawania
      if (
        e.target.type === "checkbox" ||
        this.classList.contains("add-mockup-button")
      )
        return;

      const mockupPath = this.getAttribute("data-mockup");
      const mockupId = parseInt(this.getAttribute("data-id"), 10);
      const mockupName = this.getAttribute("data-name");

      changeMockup(mockupPath, mockupName, mockupId);
      updateMockupThumbnailSelection(mockupPath);
    });
  });

  // Obsługa checkboxów
  const checkboxes = document.querySelectorAll(".mockup-checkbox");
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function (e) {
      e.stopPropagation(); // Zatrzymaj propagację zdarzenia

      const mockupDiv = this.closest(".mockup-thumbnail");
      const mockupPath = mockupDiv.getAttribute("data-mockup");
      const mockupId = parseInt(mockupDiv.getAttribute("data-id"), 10);
      const mockupName = mockupDiv.getAttribute("data-name");

      if (this.checked) {
        // Dodaj do wybranych mockupów
        if (!selectedMockups.includes(mockupPath)) {
          selectedMockups.push({
            path: mockupPath,
            id: mockupId,
            name: mockupName,
          });
        }
      } else {
        // Usuń z wybranych mockupów
        selectedMockups = selectedMockups.filter(
          (mockup) => mockup.path !== mockupPath
        );
      }

      console.log("Wybrane mockupy:", selectedMockups);
    });
  });

  // Dodaj obsługę przycisku dodawania mockupów
  const addMockupButton = document.querySelector(".add-mockup-button");
  if (addMockupButton) {
    addMockupButton.addEventListener("click", function () {
      window.location.href = "dodaj.html";
    });
  }
}

// Funkcja aktualizująca zaznaczenie miniaturki
function updateMockupThumbnailSelection(selectedMockup) {
  mockupThumbnails.forEach((thumbnail) => {
    // Pomijamy przycisk dodawania przy aktualizowaniu zaznaczenia
    if (!thumbnail.classList.contains("add-mockup-button")) {
      if (thumbnail.getAttribute("data-mockup") === selectedMockup) {
        thumbnail.classList.add("active");
      } else {
        thumbnail.classList.remove("active");
      }
    }
  });
}

// Obsługa uploadu przez drag & drop
["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

["dragenter", "dragover"].forEach((eventName) => {
  dropArea.addEventListener(eventName, highlight, false);
});

["dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
  dropArea.classList.add("highlight");
  uploadText.style.display = "none";
  dropText.style.display = "block";
}

function unhighlight() {
  dropArea.classList.remove("highlight");
  uploadText.style.display = "block";
  dropText.style.display = "none";
}

dropArea.addEventListener("drop", handleDrop, false);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  if (files.length) {
    handleFiles(files);
  }
}

// Funkcja obsługująca wybrane pliki (kliknięcie lub drop)
function handleFileSelect(e) {
  const files = e.target.files;
  handleFiles(files);
}

async function handleFiles(files) {
  if (files.length && files[0].type.match("image.*")) {
    try {
      // Show a loading message
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

      // Create a FormData object
      const formData = new FormData();
      formData.append("image", files[0]);

      // Send the file to the server
      const response = await fetch("/api/upload/user-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      document.body.removeChild(loadingMsg);

      if (result.success) {
        // Display image preview
        imagePreview.src = result.filePath;
        imagePreview.onload = function () {
          // Show controls and instructions
          controls.style.display = "block";
          dragInstruction.style.display = "block";

          // Set flag that user image is loaded
          userImageLoaded = true;

          // Reset settings
          resetTransformations();

          // Center the image
          centerImage();

          // Default to setting image under mockup
          imagePreview.style.zIndex = "5";
        };
      } else {
        alert("Error: " + (result.error || "Failed to upload image"));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Wystąpił błąd podczas przesyłania obrazu.");
    }
  } else {
    alert("Proszę wybrać plik ze zdjęciem");
  }
}

// Obsługa przesuwania obrazu
imagePreview.addEventListener("mousedown", startDrag);
window.addEventListener("mouseup", stopDrag);
window.addEventListener("mousemove", drag);

function startDrag(e) {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  initialX = currentX;
  initialY = currentY;
  imagePreview.style.cursor = "grabbing";
}

function stopDrag() {
  isDragging = false;
  imagePreview.style.cursor = "move";
}

function drag(e) {
  if (isDragging) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    currentX = initialX + dx;
    currentY = initialY + dy;

    // Ograniczenie wartości
    currentX = Math.max(-150, Math.min(150, currentX));
    currentY = Math.max(-150, Math.min(150, currentY));

    // Aktualizacja suwaków
    moveXSlider.value = currentX;
    moveYSlider.value = currentY;
    moveXValue.textContent = currentX;
    moveYValue.textContent = currentY;

    updateTransform();
  }
}

// Obsługa kontrolek
rotateSlider.addEventListener("input", function () {
  currentRotation = parseInt(this.value);
  rotateValue.textContent = currentRotation;
  updateTransform();
});

zoomSlider.addEventListener("input", function () {
  currentZoom = parseInt(this.value);
  zoomValue.textContent = currentZoom;
  updateTransform();
});

rotateLeft.addEventListener("click", function () {
  currentRotation -= 90;
  if (currentRotation < -180) currentRotation += 360;
  rotateSlider.value = currentRotation;
  rotateValue.textContent = currentRotation;
  updateTransform();
});

rotateRight.addEventListener("click", function () {
  currentRotation += 90;
  if (currentRotation > 180) currentRotation -= 360;
  rotateSlider.value = currentRotation;
  rotateValue.textContent = currentRotation;
  updateTransform();
});

zoomIn.addEventListener("click", function () {
  currentZoom = Math.min(currentZoom + 10, 300);
  zoomSlider.value = currentZoom;
  zoomValue.textContent = currentZoom;
  updateTransform();
});

zoomOut.addEventListener("click", function () {
  currentZoom = Math.max(currentZoom - 10, 10);
  zoomSlider.value = currentZoom;
  zoomValue.textContent = currentZoom;
  updateTransform();
});

resetButton.addEventListener("click", resetTransformations);

centerButton.addEventListener("click", function () {
  centerImage();
});

layerFrontButton.addEventListener("click", function () {
  imagePreview.style.zIndex = "20";
});

layerBackButton.addEventListener("click", function () {
  imagePreview.style.zIndex = "5";
});

// Obsługa suwaków przesuwania
moveXSlider.addEventListener("input", function () {
  currentX = parseInt(this.value);
  moveXValue.textContent = currentX;
  updateTransform();
});

moveYSlider.addEventListener("input", function () {
  currentY = parseInt(this.value);
  moveYValue.textContent = currentY;
  updateTransform();
});

// Obsługa przycisku pobierania wszystkich wybranych mockupów
downloadSelectedMockups.addEventListener("click", function () {
  if (selectedMockups.length === 0) {
    alert("Najpierw wybierz mockupy do pobrania!");
    return;
  }

  if (!userImageLoaded) {
    alert("Najpierw wgraj zdjęcie!");
    return;
  }

  downloadMultipleMockups();
});

// Funkcja do pobierania wielu mockupów
async function downloadMultipleMockups() {
  // Tworzymy element do pokazywania postępu
  const progressMsg = document.createElement("div");
  progressMsg.style.position = "fixed";
  progressMsg.style.top = "50%";
  progressMsg.style.left = "50%";
  progressMsg.style.transform = "translate(-50%, -50%)";
  progressMsg.style.background = "rgba(0, 0, 0, 0.8)";
  progressMsg.style.color = "white";
  progressMsg.style.padding = "20px";
  progressMsg.style.borderRadius = "10px";
  progressMsg.style.zIndex = "9999";
  progressMsg.textContent = `Trwa generowanie ${selectedMockups.length} obrazów, proszę czekać...`;
  document.body.appendChild(progressMsg);

  // Zapisz aktualny mockup, aby przywrócić go po zakończeniu
  const originalMockup = {
    path: currentMockupFile,
    name: currentMockupName,
    id: currentMockupId,
  };

  // Dla każdego wybranego mockupu
  for (let i = 0; i < selectedMockups.length; i++) {
    const mockup = selectedMockups[i];
    progressMsg.textContent = `Generowanie obrazu ${i + 1} z ${
      selectedMockups.length
    }...`;

    // Zmień mockup
    await new Promise((resolve) => {
      changeMockup(mockup.path, mockup.name, mockup.id);
      // Daj czas na załadowanie mockupu
      setTimeout(resolve, 200);
    });

    // Pobierz obraz - używając nazwy mockupu w nazwie pliku
    const fileName = `${mockup.name.replace(/\s+/g, "_")}_${i + 1}.png`;
    await generateAndDownloadImage(fileName);
  }

  // Przywróć oryginalny mockup
  changeMockup(originalMockup.path, originalMockup.name, originalMockup.id);

  // Usuń komunikat o postępie
  document.body.removeChild(progressMsg);

  alert(`Pomyślnie wygenerowano ${selectedMockups.length} obrazów!`);
}

// Obsługa przycisku pobierania
downloadButton.addEventListener("click", function () {
  if (!userImageLoaded) {
    alert("Najpierw wgraj zdjęcie!");
    return;
  }

  // Pokaż dialog wyboru formatu i rozmiaru
  showDownloadOptions();
});

// Funkcja wyświetlająca dialog z opcjami pobierania
function showDownloadOptions() {
  // Tworzymy dialog
  const dialogOverlay = document.createElement("div");
  dialogOverlay.style.position = "fixed";
  dialogOverlay.style.top = "0";
  dialogOverlay.style.left = "0";
  dialogOverlay.style.width = "100%";
  dialogOverlay.style.height = "100%";
  dialogOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  dialogOverlay.style.display = "flex";
  dialogOverlay.style.justifyContent = "center";
  dialogOverlay.style.alignItems = "center";
  dialogOverlay.style.zIndex = "9999";

  const dialogBox = document.createElement("div");
  dialogBox.style.backgroundColor = "white";
  dialogBox.style.padding = "20px";
  dialogBox.style.borderRadius = "10px";
  dialogBox.style.width = "300px";
  dialogBox.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)";

  dialogBox.innerHTML = `
    <h3 style="margin-top: 0; text-align: center;">Opcje pobierania</h3>
    
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; font-weight: bold;">Format pliku:</label>
      <select id="format-select" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
        <option value="png">PNG</option>
        <option value="jpg">JPG</option>
      </select>
    </div>
    
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; font-weight: bold;">Rozmiar:</label>
      <select id="size-select" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
        <option value="1200">1200 x 1200 px</option>
        <option value="1000">1000 x 1000 px</option>
        <option value="800">800 x 800 px</option>
        <option value="600">600 x 600 px</option>
      </select>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin-top: 20px;">
      <button id="cancel-download" style="padding: 8px 15px; background-color: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">Anuluj</button>
      <button id="confirm-download" style="padding: 8px 15px; background-color: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer;">Pobierz</button>
    </div>
  `;

  dialogOverlay.appendChild(dialogBox);
  document.body.appendChild(dialogOverlay);

  // Obsługa przycisków
  document
    .getElementById("cancel-download")
    .addEventListener("click", function () {
      document.body.removeChild(dialogOverlay);
    });

  document
    .getElementById("confirm-download")
    .addEventListener("click", function () {
      const format = document.getElementById("format-select").value;
      const size = document.getElementById("size-select").value;

      // Usuń dialog
      document.body.removeChild(dialogOverlay);

      // Generuj i pobierz obraz, używając nazwy mockupu
      const sanitizedName = currentMockupName.replace(/\s+/g, "_");
      const fileName = `${sanitizedName}_${size}x${size}.${format}`;
      generateAndDownloadImage(fileName, format, parseInt(size));
    });
}

async function generateAndDownloadImage(
  fileName = "projekt-etui.png",
  format = "png",
  size = 1200
) {
  // Show progress message
  const progressMsg = document.createElement("div");
  progressMsg.className = "progress-message";
  progressMsg.textContent = "Trwa generowanie obrazu, proszę czekać...";
  document.body.appendChild(progressMsg);

  // Delay execution to allow progress message to display
  return new Promise((resolve) => {
    setTimeout(async function () {
      try {
        // Create canvas with specified dimensions
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        // Set white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Create image objects
        const mockupImg = new Image();
        const userImg = new Image();

        let imagesLoaded = 0;
        let hasError = false;

        // Error handler function
        function handleImageError(message) {
          hasError = true;
          console.error(message);
          document.body.removeChild(progressMsg);
          alert("Błąd: " + message);
          resolve(false);
        }

        // Drawing function - called after both images are loaded
        function drawAndDownload() {
          if (hasError) return resolve(false);

          try {
            // Get editor container dimensions for accurate scaling
            const editorRect = editorContainer.getBoundingClientRect();

            // Instead of using the entire editorRect which may have padding/margins,
            // use the mockup image dimensions as our reference
            const mockupRect = mockupImage.getBoundingClientRect();

            // Calculate aspect ratio of the mockup in the preview
            const mockupAspectRatio =
              mockupImg.naturalWidth / mockupImg.naturalHeight;

            // Calculate the dimensions to maintain proper aspect ratio in the canvas
            let drawWidth, drawHeight;
            if (mockupAspectRatio >= 1) {
              // Wider than tall
              drawWidth = canvas.width;
              drawHeight = canvas.width / mockupAspectRatio;
            } else {
              // Taller than wide
              drawHeight = canvas.height;
              drawWidth = canvas.height * mockupAspectRatio;
            }

            // Center the mockup on the canvas
            const mockupX = (canvas.width - drawWidth) / 2;
            const mockupY = (canvas.height - drawHeight) / 2;

            // Get the z-index to determine drawing order
            const zIndexValue = parseInt(imagePreview.style.zIndex || "5");
            const imageOnTop = zIndexValue >= 10;

            // Calculate scaling for user image positioning
            // Use the mockup's displayed size as the reference for scaling
            const scaleX = drawWidth / mockupRect.width;
            const scaleY = drawHeight / mockupRect.height;

            // Position user image relative to mockup center
            const userImageX = canvas.width / 2 + currentX * scaleX;
            const userImageY = canvas.height / 2 + currentY * scaleY;

            // Draw in the correct order based on z-index
            if (imageOnTop) {
              // Draw mockup first
              if (mockupAspectRatio !== 1) {
                // If mockup isn't square, draw with preserved aspect ratio
                ctx.drawImage(
                  mockupImg,
                  mockupX,
                  mockupY,
                  drawWidth,
                  drawHeight
                );
              } else {
                // If mockup is square, fill the canvas
                ctx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height);
              }

              // Then draw user image on top
              drawUserImage();
            } else {
              // Draw user image first
              drawUserImage();

              // Then draw mockup on top
              if (mockupAspectRatio !== 1) {
                // If mockup isn't square, draw with preserved aspect ratio
                ctx.drawImage(
                  mockupImg,
                  mockupX,
                  mockupY,
                  drawWidth,
                  drawHeight
                );
              } else {
                // If mockup is square, fill the canvas
                ctx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height);
              }
            }

            // Function to draw the user image with current transformations
            function drawUserImage() {
              ctx.save();
              ctx.translate(userImageX, userImageY);
              ctx.rotate((currentRotation * Math.PI) / 180);
              const scaledZoom = currentZoom / 100;
              ctx.scale(scaledZoom, scaledZoom);

              // Calculate dimensions to maintain aspect ratio
              const userImgWidth = userImg.width;
              const userImgHeight = userImg.height;

              // Draw user image centered at the current position
              ctx.drawImage(userImg, -userImgWidth / 2, -userImgHeight / 2);
              ctx.restore();
            }

            // Create and download the image
            if (canvas.toBlob) {
              const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
              const quality = format === "jpg" ? 0.9 : undefined;

              canvas.toBlob(
                function (blob) {
                  downloadUsingBlob(blob);
                },
                mimeType,
                quality
              );
            } else {
              // Fallback to dataURL if toBlob not supported
              const dataURL = canvas.toDataURL(
                format === "jpg" ? "image/jpeg" : "image/png"
              );
              downloadUsingDataURL(dataURL);
            }
          } catch (e) {
            console.error("Błąd przy rysowaniu:", e);
            document.body.removeChild(progressMsg);
            alert("Wystąpił błąd podczas renderowania obrazu: " + e.message);
            resolve(false);
          }
        }

        // Function to download using Blob (preferred method)
        function downloadUsingBlob(blob) {
          try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();

            // Give the browser time to start downloading
            setTimeout(function () {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              document.body.removeChild(progressMsg);
              resolve(true);
            }, 100);
          } catch (e) {
            console.error("Błąd przy pobieraniu (blob):", e);
            document.body.removeChild(progressMsg);
            alert("Wystąpił błąd podczas pobierania obrazu: " + e.message);
            resolve(false);
          }
        }

        // Fallback download method using dataURL
        function downloadUsingDataURL(dataURL) {
          try {
            const a = document.createElement("a");
            a.href = dataURL;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();

            setTimeout(function () {
              document.body.removeChild(a);
              document.body.removeChild(progressMsg);
              resolve(true);
            }, 100);
          } catch (e) {
            console.error("Błąd przy pobieraniu (dataURL):", e);
            document.body.removeChild(progressMsg);
            alert("Wystąpił błąd podczas pobierania obrazu: " + e.message);
            resolve(false);
          }
        }

        // Error handlers for image loading
        mockupImg.onerror = function () {
          handleImageError(
            "Nie można załadować obrazu mockupu: " + mockupImage.src
          );
        };

        userImg.onerror = function () {
          handleImageError(
            "Nie można załadować obrazu użytkownika: " + imagePreview.src
          );
        };

        // Load the images
        mockupImg.onload = function () {
          imagesLoaded++;
          if (imagesLoaded === 2) drawAndDownload();
        };

        userImg.onload = function () {
          imagesLoaded++;
          if (imagesLoaded === 2) drawAndDownload();
        };

        // Set image sources with cache prevention timestamp
        mockupImg.crossOrigin = "Anonymous";
        userImg.crossOrigin = "Anonymous";
        const timestamp = new Date().getTime();
        mockupImg.src = mockupImage.src + "?t=" + timestamp;
        userImg.src = imagePreview.src;

        // Safety timeout
        setTimeout(function () {
          if (imagesLoaded < 2 && !hasError) {
            handleImageError("Przekroczono limit czasu ładowania obrazów");
          }
        }, 10000);
      } catch (e) {
        console.error("Błąd generowania obrazu:", e);
        document.body.removeChild(progressMsg);
        alert("Wystąpił błąd podczas generowania obrazu: " + e.message);
        resolve(false);
      }
    }, 100);
  });
}

function centerImage() {
  currentX = 0;
  currentY = 0;

  // Aktualizacja wartości suwaków
  moveXSlider.value = currentX;
  moveYSlider.value = currentY;
  moveXValue.textContent = currentX;
  moveYValue.textContent = currentY;
  updateTransform();
}

// Aktualizacja transformacji
function updateTransform() {
  imagePreview.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px)) rotate(${currentRotation}deg) scale(${
    currentZoom / 100
  })`;
}

// Funkcja zmieniająca mockup
function changeMockup(mockupPath, mockupName, mockupId) {
  currentMockupFile = mockupPath;
  currentMockupName = mockupName || "Mockup"; // Ustaw domyślną nazwę, jeśli nie podano
  currentMockupId = mockupId || 0;

  // Zachowaj stan kontrolek przed zmianą mockupu
  const controlsWereVisible = controls.style.display === "block";
  const instructionsWereVisible = dragInstruction.style.display === "block";

  mockupImage.src = mockupPath;

  // Obsługa błędu ładowania mockupu
  mockupImage.onerror = function () {
    console.error(`Nie można załadować mockupu: ${mockupPath}`);
    alert(`Nie można załadować mockupu: ${mockupPath}. Używanie placeholdera.`);
    mockupImage.src =
      "https://via.placeholder.com/400x800/ffffff/000000?text=Mockup+Niedostępny";
  };

  // Obsługa zdarzenia onload mockupa - to się uruchamia po załadowaniu nowego mockupu
  mockupImage.onload = function () {
    // Przywróć widoczność kontrolek, jeśli były widoczne i obraz został wcześniej wczytany
    if (userImageLoaded) {
      controls.style.display = "block";
      dragInstruction.style.display = "block";
    }
  };

  // Dodatkowo, natychmiast przywróć kontrolki, jeśli obraz użytkownika jest wczytany
  if (userImageLoaded) {
    // Używamy setTimeout, aby upewnić się, że kontrolki zostaną przywrócone
    // nawet jeśli coś innego próbuje je ukryć
    setTimeout(function () {
      controls.style.display = "block";
      dragInstruction.style.display = "block";
    }, 50);
  }
}

// Resetowanie wszystkich transformacji
function resetTransformations() {
  currentX = 0;
  currentY = 0;
  currentRotation = 0;
  currentZoom = 100;

  rotateSlider.value = currentRotation;
  rotateValue.textContent = currentRotation;

  zoomSlider.value = currentZoom;
  zoomValue.textContent = currentZoom;

  // Aktualizacja suwaków pozycji
  moveXSlider.value = currentX;
  moveYSlider.value = currentY;
  moveXValue.textContent = currentX;
  moveYValue.textContent = currentY;

  updateTransform();
}

// Funkcja sprawdzająca dostępność pliku
async function checkFileExists(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    console.error("Błąd sprawdzania pliku:", error);
    return false;
  }
}

// Funkcja skanująca dostępne mockupy
async function scanMockups() {
  try {
    const response = await fetch("/api/mockups");
    const data = await response.json();

    if (data.success) {
      // Zapamiętaj pełne dane mockupów, nie tylko ścieżki
      mockupsData = data.mockups;
      return data.mockups;
    } else {
      console.error("Error fetching mockups:", data.error);
      return [];
    }
  } catch (error) {
    console.error("Error scanning mockups:", error);
    return [];
  }
}

// Funkcja generująca miniatury mockupów
function generateMockupThumbnails(mockups) {
  mockupGallery.innerHTML = ""; // Wyczyść galerię

  if (mockups.length === 0) {
    // Zamiast tekstu, dodajemy tylko przycisk dodawania mockupów
    const addButtonHTML = `
      <div class="mockup-thumbnail window-frame add-mockup-button" title="Dodaj nowy mockup">
        <div class="window-content">
          <div class="add-button-content">+</div>
        </div>
      </div>
    `;
    mockupGallery.innerHTML = addButtonHTML;

    // Dodajemy obsługę przycisku dodawania mockupów
    const addMockupButton = document.querySelector(".add-mockup-button");
    if (addMockupButton) {
      addMockupButton.addEventListener("click", function () {
        window.location.href = "dodaj.html";
      });
    }
    return;
  }

  mockups.forEach((mockup, index) => {
    // Upewnij się, że nazwa mockupu jest czysta i nie zawiera znaczników formatowania
    const cleanName = mockup.name.replace(/\*/g, "").replace(/#/g, "").trim();

    const thumbnailHTML = `
      <div class="mockup-thumbnail window-frame ${
        index === 0 ? "active" : ""
      }" data-mockup="${mockup.path}" data-id="${
      mockup.id
    }" data-name="${cleanName}">
        <input type="checkbox" class="mockup-checkbox" id="checkbox-mockup-${
          mockup.id
        }" />
        <div class="window-title-bar">${cleanName}</div>
        <div class="window-content">
          <img src="${mockup.path}" alt="${cleanName}" />
        </div>
      </div>
    `;

    mockupGallery.innerHTML += thumbnailHTML;
  });

  // Dodajemy przycisk dodawania nowych mockupów na końcu galerii
  const addButtonHTML = `
    <div class="mockup-thumbnail window-frame add-mockup-button" title="Dodaj nowy mockup">
      <div class="window-content">
        <div class="add-button-content">+</div>
      </div>
    </div>
  `;

  mockupGallery.innerHTML += addButtonHTML;

  // Ustaw pierwszy mockup jako aktywny
  if (mockups.length > 0) {
    currentMockupFile = mockups[0].path;
    currentMockupName = mockups[0].name;
    currentMockupId = mockups[0].id;
    mockupImage.src = currentMockupFile;
  }

  // Przypisz obsługę kliknięć do nowo wygenerowanych miniaturek
  setupThumbnailListeners();

  // Przypisz obsługę przycisków zaznaczania/odznaczania wszystkich
  const selectAllButton = document.getElementById("select-all-mockups");
  const deselectAllButton = document.getElementById("deselect-all-mockups");

  if (selectAllButton && deselectAllButton) {
    selectAllButton.addEventListener("click", function () {
      const checkboxes = document.querySelectorAll(".mockup-checkbox");

      // Wyczyść tablicę wybranych mockupów
      selectedMockups = [];

      checkboxes.forEach((checkbox) => {
        checkbox.checked = true;

        // Dodaj mockup do wybranych
        const mockupDiv = checkbox.closest(".mockup-thumbnail");
        if (!mockupDiv.classList.contains("add-mockup-button")) {
          const mockupPath = mockupDiv.getAttribute("data-mockup");
          const mockupId = parseInt(mockupDiv.getAttribute("data-id"), 10);
          const mockupName = mockupDiv.getAttribute("data-name");

          selectedMockups.push({
            path: mockupPath,
            id: mockupId,
            name: mockupName,
          });
        }
      });

      console.log("Wszystkie zaznaczone:", selectedMockups);
    });

    deselectAllButton.addEventListener("click", function () {
      const checkboxes = document.querySelectorAll(".mockup-checkbox");
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });

      // Wyczyść listę wybranych mockupów
      selectedMockups = [];
      console.log("Wszystkie odznaczone");
    });
  }
}

// Inicjalizacja
window.onload = async function () {
  // Domyślne ustawienie braku kontrolek przy starcie
  controls.style.display = "none";
  dragInstruction.style.display = "none";

  // Sprawdź czy strona wymaga autoryzacji
  checkAuth();

  // Skanuj dostępne mockupy
  const availableMockups = await scanMockups();

  // Generuj miniatury
  generateMockupThumbnails(availableMockups);

  // Ustaw domyślny mockup jeśli istnieje
  if (availableMockups.length > 0) {
    changeMockup(
      availableMockups[0].path,
      availableMockups[0].name,
      availableMockups[0].id
    );
  }
};

// Funkcja sprawdzająca autoryzację
function checkAuth() {
  const hasAccess = sessionStorage.getItem("hasAccess") === "true";

  // Jeśli nie ma dostępu, przekieruj do strony hasła
  if (!hasAccess) {
    window.location.href = "password.html";
  }
}
