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

// Lista dostępnych mockupów
const mockupFiles = [];
let mockupThumbnails = [];

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
let currentMockupFile = "./1.png";

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
      changeMockup(mockupPath);
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

      if (this.checked) {
        // Dodaj do wybranych mockupów
        if (!selectedMockups.includes(mockupPath)) {
          selectedMockups.push(mockupPath);
        }
      } else {
        // Usuń z wybranych mockupów
        selectedMockups = selectedMockups.filter((path) => path !== mockupPath);
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

function handleFiles(files) {
  if (files[0].type.match("image.*")) {
    const reader = new FileReader();

    reader.onload = function (e) {
      // Wyświetlenie podglądu obrazu
      imagePreview.src = e.target.result;
      imagePreview.onload = function () {
        // Pokaż kontrolki i instrukcję
        controls.style.display = "block";
        dragInstruction.style.display = "block";

        // Ustaw flagę, że obraz użytkownika jest wczytany
        userImageLoaded = true;

        // Resetuj ustawienia
        resetTransformations();

        // Upewnij się, że obraz jest wyśrodkowany
        centerImage();

        // Domyślnie ustaw obraz pod mockupem
        imagePreview.style.zIndex = "5";
      };
    };

    reader.readAsDataURL(files[0]);
  } else {
    alert("Proszę wybrać plik ze zdjęciem");
  }
}

function handleFileSelect(e) {
  const files = e.target.files;
  handleFiles(files);
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

// Obsługa przycisku pobierania
downloadButton.addEventListener("click", function () {
  if (!imagePreview.src || imagePreview.src === "") {
    alert("Najpierw wgraj zdjęcie!");
    return;
  }

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
  progressMsg.textContent = "Trwa generowanie obrazu, proszę czekać...";
  document.body.appendChild(progressMsg);

  // Opóźniamy wykonanie o 100ms, aby komunikat się pokazał
  setTimeout(function () {
    try {
      // Pobierz rozmiary i proporcje elementu edytora
      const editorRect = editorContainer.getBoundingClientRect();

      // Zachowaj proporcje, ale używaj stałej szerokości dla lepszej jakości
      const fixedWidth = 600;
      const aspectRatio = editorRect.height / editorRect.width;
      const fixedHeight = Math.round(fixedWidth * aspectRatio);

      // Utwórz canvas z odpowiednimi wymiarami
      const canvas = document.createElement("canvas");
      canvas.width = fixedWidth;
      canvas.height = fixedHeight;
      const ctx = canvas.getContext("2d");

      // Ustawienie białego tła
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Utwórz obrazy do rysowania
      const mockupImg = new Image();
      const userImg = new Image();

      let imagesLoaded = 0;
      let hasError = false;

      // Funkcja obsługująca błędy ładowania obrazów
      function handleImageError(message) {
        hasError = true;
        console.error(message);
        document.body.removeChild(progressMsg);
        alert("Błąd: " + message);
      }

      // Funkcja rysująca - wywołana po załadowaniu wszystkich obrazów
      function drawAndDownload() {
        if (hasError) return;

        try {
          const scaleX = canvas.width / editorRect.width;
          const scaleY = canvas.height / editorRect.height;

          // Pobierz informacje o pozycji i transformacjach obrazu użytkownika
          const transformStyle =
            window.getComputedStyle(imagePreview).transform;
          const zIndexValue = parseInt(imagePreview.style.zIndex || "5");

          // Współczynnik skalowania dla transformacji
          const imageOnTop = zIndexValue >= 10;

          // Klonujemy elementy DOM, aby odczytać ich rzeczywiste wymiary i style
          const tempContainer = document.createElement("div");
          tempContainer.style.position = "absolute";
          tempContainer.style.left = "-9999px";
          tempContainer.style.visibility = "hidden";
          document.body.appendChild(tempContainer);

          const mockupClone = mockupImage.cloneNode(true);
          const userImgClone = imagePreview.cloneNode(true);
          tempContainer.appendChild(mockupClone);
          tempContainer.appendChild(userImgClone);

          // Odczytujemy aktualnie zastosowane transformacje
          // Używamy wartości z kontrolek zamiast obliczania z CSS
          const userImgWidth = userImg.width * (currentZoom / 100);
          const userImgHeight = userImg.height * (currentZoom / 100);

          // Usuń tymczasowe elementy
          document.body.removeChild(tempContainer);

          // Rysowanie warstw w odpowiedniej kolejności
          if (imageOnTop) {
            // Najpierw mockup, potem obraz użytkownika

            // Skaluj mockup do pełnych wymiarów canvasa
            ctx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height);

            // Narysuj obraz użytkownika
            ctx.save();
            ctx.translate(
              canvas.width / 2 + currentX * scaleX,
              canvas.height / 2 + currentY * scaleY
            );
            ctx.rotate((currentRotation * Math.PI) / 180);
            const scaledZoom = currentZoom / 100;
            ctx.scale(scaledZoom, scaledZoom);
            ctx.drawImage(userImg, -userImg.width / 2, -userImg.height / 2);
            ctx.restore();
          } else {
            // Najpierw obraz użytkownika, potem mockup

            // Narysuj obraz użytkownika
            ctx.save();
            ctx.translate(
              canvas.width / 2 + currentX * scaleX,
              canvas.height / 2 + currentY * scaleY
            );
            ctx.rotate((currentRotation * Math.PI) / 180);
            const scaledZoom = currentZoom / 100;
            ctx.scale(scaledZoom, scaledZoom);
            ctx.drawImage(userImg, -userImg.width / 2, -userImg.height / 2);
            ctx.restore();

            // Skaluj mockup do pełnych wymiarów canvasa
            ctx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height);
          }

          // Pobierz obrazek jako PNG
          if (canvas.toBlob) {
            canvas.toBlob(function (blob) {
              downloadUsingBlob(blob);
            }, "image/png");
          } else {
            // Fallback
            const dataURL = canvas.toDataURL("image/png");
            downloadUsingDataURL(dataURL);
          }
        } catch (e) {
          console.error("Błąd przy rysowaniu:", e);
          document.body.removeChild(progressMsg);
          alert("Wystąpił błąd podczas renderowania obrazu: " + e.message);
        }
      }

      // Funkcja pobierania przy użyciu Blob
      function downloadUsingBlob(blob) {
        try {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "projekt-etui.png";
          document.body.appendChild(a);
          a.click();

          // Dajemy przeglądarce czas na rozpoczęcie pobierania
          setTimeout(function () {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            document.body.removeChild(progressMsg);
          }, 100);
        } catch (e) {
          console.error("Błąd przy pobieraniu (blob):", e);
          document.body.removeChild(progressMsg);
          alert("Wystąpił błąd podczas pobierania obrazu: " + e.message);
        }
      }

      // Funkcja pobierania przy użyciu dataURL (fallback)
      function downloadUsingDataURL(dataURL) {
        try {
          const a = document.createElement("a");
          a.href = dataURL;
          a.download = "projekt-etui.png";
          document.body.appendChild(a);
          a.click();

          // Dajemy przeglądarce czas na rozpoczęcie pobierania
          setTimeout(function () {
            document.body.removeChild(a);
            document.body.removeChild(progressMsg);
          }, 100);
        } catch (e) {
          console.error("Błąd przy pobieraniu (dataURL):", e);
          document.body.removeChild(progressMsg);
          alert("Wystąpił błąd podczas pobierania obrazu: " + e.message);
        }
      }

      // Obsługa błędów ładowania obrazów
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

      // Załaduj obrazy
      mockupImg.onload = function () {
        imagesLoaded++;
        if (imagesLoaded === 2) drawAndDownload();
      };

      userImg.onload = function () {
        imagesLoaded++;
        if (imagesLoaded === 2) drawAndDownload();
      };

      // Ustaw obrazy do załadowania
      mockupImg.crossOrigin = "Anonymous";
      userImg.crossOrigin = "Anonymous";

      // Zapobieganie problemom z cache
      const timestamp = new Date().getTime();
      mockupImg.src = mockupImage.src + "?t=" + timestamp;
      userImg.src = imagePreview.src;

      // Timeout zabezpieczający
      setTimeout(function () {
        if (imagesLoaded < 2 && !hasError) {
          handleImageError("Przekroczono limit czasu ładowania obrazów");
        }
      }, 10000);
    } catch (e) {
      console.error("Błąd generowania obrazu:", e);
      document.body.removeChild(progressMsg);
      alert("Wystąpił błąd podczas generowania obrazu: " + e.message);
    }
  }, 100);
});

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
function changeMockup(mockupPath) {
  currentMockupFile = mockupPath;

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
  const mockupFolder = "./mockup/"; // Folder z mockupami
  const maxFilesToCheck = 20; // Maksymalna liczba plików do sprawdzenia

  // Sprawdź dostępność każdego pliku od 1.png do 20.png
  for (let i = 1; i <= maxFilesToCheck; i++) {
    const fileName = `${i}.png`;
    const filePath = `${mockupFolder}${fileName}`;

    const exists = await checkFileExists(filePath);
    if (exists) {
      mockupFiles.push(filePath);
    }
  }

  // Jeśli nie znaleziono żadnych plików w folderze mockup, sprawdź w folderze głównym
  if (mockupFiles.length === 0) {
    for (let i = 1; i <= maxFilesToCheck; i++) {
      const fileName = `${i}.png`;
      const filePath = `./${fileName}`;

      const exists = await checkFileExists(filePath);
      if (exists) {
        mockupFiles.push(filePath);
      }
    }
  }

  return mockupFiles;
}

// Funkcja generująca miniatury mockupów
function generateMockupThumbnails(mockupPaths) {
  mockupGallery.innerHTML = ""; // Wyczyść galerię

  if (mockupPaths.length === 0) {
    mockupGallery.innerHTML = "<p>Nie znaleziono żadnych mockupów</p>";
    return;
  }

  mockupPaths.forEach((path, index) => {
    const fileName = path.split("/").pop();
    const mockupNumber = fileName.split(".")[0];

    const thumbnailHTML = `
            <div class="mockup-thumbnail window-frame ${
              index === 0 ? "active" : ""
            }" data-mockup="${path}">
              <input type="checkbox" class="mockup-checkbox" id="checkbox-mockup-${mockupNumber}" />
              <div class="window-content">
                <img src="${path}" alt="Mockup ${mockupNumber}" />
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
  if (mockupPaths.length > 0) {
    currentMockupFile = mockupPaths[0];
    mockupImage.src = currentMockupFile;
  }

  // Przypisz obsługę kliknięć do nowo wygenerowanych miniaturek
  setupThumbnailListeners();

  // Przypisz obsługę przycisków zaznaczania/odznaczania wszystkich
  const selectAllButton = document.getElementById("select-all-mockups");
  const deselectAllButton = document.getElementById("deselect-all-mockups");

  selectAllButton.addEventListener("click", function () {
    const checkboxes = document.querySelectorAll(".mockup-checkbox");
    checkboxes.forEach((checkbox) => {
      checkbox.checked = true;
      // Wywołaj zdarzenie zmiany, aby zaktualizować listę wybranych mockupów
      checkbox.dispatchEvent(new Event("change"));
    });
  });

  deselectAllButton.addEventListener("click", function () {
    const checkboxes = document.querySelectorAll(".mockup-checkbox");
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
      // Wywołaj zdarzenie zmiany, aby zaktualizować listę wybranych mockupów
      checkbox.dispatchEvent(new Event("change"));
    });
  });
}

// Inicjalizacja
window.onload = async function () {
  // Domyślne ustawienie braku kontrolek przy starcie
  controls.style.display = "none";
  dragInstruction.style.display = "none";

  // Skanuj dostępne mockupy
  const availableMockups = await scanMockups();

  // Generuj miniatury
  generateMockupThumbnails(availableMockups);
};
