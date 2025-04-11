/**
 * export.js - Plik zawierający funkcje do eksportu i pobierania obrazów
 */

const Export = (function() {
  /**
   * Pokazuje dialog z opcjami pobierania
   */
  function showDownloadOptions() {
    // Tworzymy dialog
    const dialogOverlay = document.createElement("div");
    dialogOverlay.className = "download-dialog-overlay";
    
    const dialogBox = document.createElement("div");
    dialogBox.className = "download-dialog";
    
    dialogBox.innerHTML = `
      <h3>Opcje pobierania</h3>
      
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
          ${EditorConfig.export.availableSizes.map(size => 
            `<option value="${size}">${size} x ${size} px</option>`
          ).join('')}
        </select>
      </div>
      
      <div class="download-dialog-buttons">
        <button id="cancel-download" class="cancel">Anuluj</button>
        <button id="confirm-download" class="confirm">Pobierz</button>
      </div>
    `;
    
    dialogOverlay.appendChild(dialogBox);
    document.body.appendChild(dialogOverlay);
    
    // Obsługa przycisków
    document
      .getElementById("cancel-download")
      .addEventListener("click", function() {
        document.body.removeChild(dialogOverlay);
      });
    
    document
      .getElementById("confirm-download")
      .addEventListener("click", function() {
        const format = document.getElementById("format-select").value;
        const size = document.getElementById("size-select").value;
        
        // Usuń dialog
        document.body.removeChild(dialogOverlay);
        
        // Generuj i pobierz obraz, używając modelu i nazwy mockupu
        const currentMockup = Mockups.getCurrentMockup();
        const sanitizedName = currentMockup.model.replace(/\s+/g, "_");
        const fileName = `${sanitizedName}_${size}x${size}.${format}`;
        generateAndDownloadImage(fileName, format, parseInt(size));
      });
  }
  
  /**
   * Generuje i pobiera obraz
   * @param {string} fileName - Nazwa pliku do pobrania
   * @param {string} format - Format pliku (png/jpg)
   * @param {number} size - Rozmiar obrazu w pikselach
   * @returns {Promise<boolean>} - True jeśli pobieranie zakończyło się sukcesem
   */
  async function generateAndDownloadImage(
    fileName = "projekt-etui.png",
    format = "png",
    size = 1200
  ) {
    const progressMsg = document.createElement("div");
    progressMsg.className = "progress-message";
    progressMsg.textContent = "Trwa generowanie obrazu, proszę czekać...";
    document.body.appendChild(progressMsg);
    
    return new Promise((resolve) => {
      setTimeout(async function() {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          
          // Użyj wybranego koloru tła
          const transformState = Transformations.getState();
          ctx.fillStyle = transformState.currentBackgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          const mockupImg = new Image();
          const userImg = new Image();
          
          let imagesLoaded = 0;
          let hasError = false;
          
          function handleImageError(message) {
            hasError = true;
            console.error(message);
            document.body.removeChild(progressMsg);
            alert("Błąd: " + message);
            resolve(false);
          }
          
          function drawAndDownload() {
            if (hasError) return resolve(false);
            
            try {
              const mockupScaleFactor = Math.min(
                size / mockupImg.naturalWidth,
                size / mockupImg.naturalHeight
              );
              
              const drawWidth = mockupImg.naturalWidth * mockupScaleFactor;
              const drawHeight = mockupImg.naturalHeight * mockupScaleFactor;
              
              const mockupX = (canvas.width - drawWidth) / 2;
              const mockupY = (canvas.height - drawHeight) / 2;
              
              const transformState = Transformations.getState();
              const imageOnTop = transformState.isLayerFront;
              
              if (imageOnTop) {
                ctx.drawImage(mockupImg, mockupX, mockupY, drawWidth, drawHeight);
                drawUserImage();
              } else {
                drawUserImage();
                ctx.drawImage(mockupImg, mockupX, mockupY, drawWidth, drawHeight);
              }
              
              function drawUserImage() {
                const canvasCenterX = canvas.width / 2;
                const canvasCenterY = canvas.height / 2;
                
                // Wczytaj parametry kalibracji
                const calibration = window.calibration || {
                  xPositionFactor: EditorConfig.calibration.defaultXPositionFactor,
                  yPositionFactor: EditorConfig.calibration.defaultYPositionFactor,
                  zoomFactor: EditorConfig.calibration.defaultZoomFactor
                };
                
                // Oblicz skalowane wartości pozycji
                const scaledX = transformState.currentX * mockupScaleFactor * calibration.xPositionFactor;
                const scaledY = transformState.currentY * mockupScaleFactor * calibration.yPositionFactor;
                
                const userImageX = canvasCenterX + scaledX;
                const userImageY = canvasCenterY + scaledY;
                
                ctx.save();
                ctx.translate(userImageX, userImageY);
                ctx.rotate((transformState.currentRotation * Math.PI) / 180);
                
                // Skalowanie z wykorzystaniem współczynnika zoom
                const scaledZoom = (transformState.currentZoom / 100) * mockupScaleFactor * calibration.zoomFactor;
                ctx.scale(scaledZoom, scaledZoom);
                
                const userImgWidth = userImg.naturalWidth;
                const userImgHeight = userImg.naturalHeight;
                ctx.drawImage(userImg, -userImgWidth / 2, -userImgHeight / 2);
                
                ctx.restore();
              }
              
              if (canvas.toBlob) {
                const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
                const quality = format === "jpg" ? EditorConfig.export.jpgQuality : undefined;
                
                canvas.toBlob(
                  function(blob) {
                    downloadUsingBlob(blob);
                  },
                  mimeType,
                  quality
                );
              } else {
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
          
          function downloadUsingBlob(blob) {
            try {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              
              setTimeout(function() {
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
          
          function downloadUsingDataURL(dataURL) {
            try {
              const a = document.createElement("a");
              a.href = dataURL;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              
              setTimeout(function() {
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
          
          mockupImg.onerror = function() {
            handleImageError(
              "Nie można załadować obrazu mockupu: " + Elements.mockupImage.src
            );
          };
          
          userImg.onerror = function() {
            handleImageError(
              "Nie można załadować obrazu użytkownika: " + Elements.imagePreview.src
            );
          };
          
          mockupImg.onload = function() {
            imagesLoaded++;
            if (imagesLoaded === 2) drawAndDownload();
          };
          
          userImg.onload = function() {
            imagesLoaded++;
            if (imagesLoaded === 2) drawAndDownload();
          };
          
          mockupImg.crossOrigin = "Anonymous";
          userImg.crossOrigin = "Anonymous";
          const timestamp = new Date().getTime();
          mockupImg.src = Elements.mockupImage.src + "?t=" + timestamp;
          userImg.src = Elements.imagePreview.src;
          
          setTimeout(function() {
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
  
  /**
   * Pobiera wiele mockupów jednocześnie
   * @param {Array} mockups - Lista mockupów do pobrania
   */
  async function downloadMultipleMockups(mockups) {
    // Tworzymy element do pokazywania postępu
    const progressMsg = document.createElement("div");
    progressMsg.className = "progress-message";
    progressMsg.textContent = `Trwa generowanie ${mockups.length} obrazów, proszę czekać...`;
    document.body.appendChild(progressMsg);
    
    // Zapisz aktualny mockup, aby przywrócić go po zakończeniu
    const originalMockup = Mockups.getCurrentMockup();
    
    // Dla każdego wybranego mockupu
    for (let i = 0; i < mockups.length; i++) {
      const mockup = mockups[i];
      progressMsg.textContent = `Generowanie obrazu ${i + 1} z ${mockups.length}...`;
      
      // Zmień mockup
      await new Promise((resolve) => {
        Mockups.changeMockup(mockup.path, mockup.name, mockup.id, mockup.model);
        // Daj czas na załadowanie mockupu
        setTimeout(resolve, 200);
      });
      
      // Pobierz obraz - używając modelu i nazwy mockupu w nazwie pliku
      const fileName = `${mockup.model || "Inne"}_${mockup.name.replace(/\s+/g, "_")}_${i + 1}.png`;
      await generateAndDownloadImage(fileName);
    }
    
    // Przywróć oryginalny mockup
    Mockups.changeMockup(
      originalMockup.path,
      originalMockup.name,
      originalMockup.id,
      originalMockup.model
    );
    
    // Usuń komunikat o postępie
    document.body.removeChild(progressMsg);
    
    alert(`Pomyślnie wygenerowano ${mockups.length} obrazów!`);
  }
  
  /**
   * Inicjalizuje moduł eksportu
   */
  function init() {
    // Obsługa przycisku pobierania
    Elements.downloadButton.addEventListener("click", function() {
      if (!UserImage.isImageLoaded()) {
        alert("Najpierw wgraj zdjęcie!");
        return;
      }
      
      // Pokaż dialog wyboru formatu i rozmiaru
      showDownloadOptions();
    });
    
    // Nasłuchuj zdarzenia pobierania wielu mockupów
    document.addEventListener("downloadSelectedMockups", function(e) {
      downloadMultipleMockups(e.detail.mockups);
    });
  }
  
  // Zwróć publiczny interfejs modułu
  return {
    init,
    showDownloadOptions,
    generateAndDownloadImage,
    downloadMultipleMockups
  };
})();

// Eksport modułu jako obiekt globalny
window.Export = Export;
