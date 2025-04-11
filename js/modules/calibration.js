document.addEventListener("DOMContentLoaded", function () {
  // Logowanie debugowania, jeśli moduł Debug jest dostępny
  if (window.Debug) {
    Debug.info("CALIBRATION", "Inicjalizacja modułu kalibracji");
  }

  // Elementy DOM dla kalibracji
  const calibrationBubble = document.getElementById("calibration-bubble");
  const calibrationPanel = document.getElementById("calibration-panel");
  const calibrationClose = document.getElementById("calibration-close");
  const calibrationSave = document.getElementById("calibration-save");
  const calibrationReset = document.getElementById("calibration-reset");

  // Elementy pól kalibracji
  const xPositionFactor = document.getElementById("x-position-factor");
  const yPositionFactor = document.getElementById("y-position-factor");
  const zoomFactor = document.getElementById("zoom-factor");

  // Wartości do wyświetlania
  const xPositionFactorValue = document.getElementById(
    "x-position-factor-value"
  );
  const yPositionFactorValue = document.getElementById(
    "y-position-factor-value"
  );
  const zoomFactorValue = document.getElementById("zoom-factor-value");

  // Predefiniowane ustawienia
  const presetButtons = document.querySelectorAll(".calibration-preset-button");

  // Domyślne wartości kalibracji
  const defaultCalibration = {
    xPositionFactor: 1.65,
    yPositionFactor: 1.65,
    zoomFactor: 0.64,
  };

  // Wartości kalibracji
  let calibration = {
    xPositionFactor: 1.65,
    yPositionFactor: 1.65,
    zoomFactor: 0.64,
  };

  // Wczytaj zapisane wartości kalibracji z localStorage
  function loadCalibration() {
    if (window.Debug) {
      Debug.debug("CALIBRATION", "Wczytywanie kalibracji z localStorage");
    }

    const savedCalibration = localStorage.getItem("imageCalibration");
    if (savedCalibration) {
      try {
        calibration = JSON.parse(savedCalibration);

        // Aktualizuj pola formularza
        xPositionFactor.value = calibration.xPositionFactor;
        yPositionFactor.value = calibration.yPositionFactor;
        zoomFactor.value = calibration.zoomFactor;

        // Aktualizuj wyświetlane wartości
        xPositionFactorValue.textContent = calibration.xPositionFactor;
        yPositionFactorValue.textContent = calibration.yPositionFactor;
        zoomFactorValue.textContent = calibration.zoomFactor;

        if (window.Debug) {
          Debug.debug(
            "CALIBRATION",
            "Wczytano zapisane wartości kalibracji",
            calibration
          );
        }
        console.log("Wczytano zapisane wartości kalibracji:", calibration);
      } catch (e) {
        if (window.Debug) {
          Debug.error("CALIBRATION", "Błąd wczytywania kalibracji", e);
        }
        console.error("Błąd wczytywania kalibracji:", e);
        resetToDefaultCalibration();
      }
    } else {
      if (window.Debug) {
        Debug.debug(
          "CALIBRATION",
          "Nie znaleziono zapisanych wartości kalibracji, używanie domyślnych"
        );
      }
    }
  }

  // Zapisz wartości kalibracji
  function saveCalibration() {
    // Pobierz wartości z pól formularza
    calibration.xPositionFactor = parseFloat(xPositionFactor.value);
    calibration.yPositionFactor = parseFloat(yPositionFactor.value);
    calibration.zoomFactor = parseFloat(zoomFactor.value);

    if (window.Debug) {
      Debug.info("CALIBRATION", "Zapisywanie wartości kalibracji", calibration);
    }

    // Zapisz w localStorage
    localStorage.setItem("imageCalibration", JSON.stringify(calibration));
    console.log("Zapisano wartości kalibracji:", calibration);

    // Monkeypatch funkcji generowania obrazu
    monkeyPatchGenerateAndDownloadImage();

    // Pokaż powiadomienie
    showNotification("Zapisano ustawienia kalibracji");

    // Zamknij panel
    calibrationPanel.classList.remove("active");
  }

  // Resetuj do domyślnych wartości
  function resetToDefaultCalibration() {
    if (window.Debug) {
      Debug.info(
        "CALIBRATION",
        "Resetowanie do domyślnych wartości kalibracji",
        defaultCalibration
      );
    }

    // Przypisz domyślne wartości
    xPositionFactor.value = defaultCalibration.xPositionFactor;
    yPositionFactor.value = defaultCalibration.yPositionFactor;
    zoomFactor.value = defaultCalibration.zoomFactor;

    // Aktualizuj wyświetlane wartości
    xPositionFactorValue.textContent = defaultCalibration.xPositionFactor;
    yPositionFactorValue.textContent = defaultCalibration.yPositionFactor;
    zoomFactorValue.textContent = defaultCalibration.zoomFactor;
  }

  // Monkeypatch funkcji generowania obrazu
  function monkeyPatchGenerateAndDownloadImage() {
    // Sprawdź, czy funkcja istnieje
    if (typeof window.generateAndDownloadImage !== "function") {
      if (window.Debug) {
        Debug.error(
          "CALIBRATION",
          "Funkcja generateAndDownloadImage nie istnieje!"
        );
      }
      console.error("Funkcja generateAndDownloadImage nie istnieje!");
      return;
    }

    if (window.Debug) {
      Debug.debug(
        "CALIBRATION",
        "Rozpoczęcie monkeypatchu funkcji generateAndDownloadImage"
      );
    }

    // Zachowaj oryginalną funkcję
    if (!window.originalGenerateAndDownloadImage) {
      window.originalGenerateAndDownloadImage = window.generateAndDownloadImage;
      if (window.Debug) {
        Debug.debug(
          "CALIBRATION",
          "Zapisano oryginalną funkcję generateAndDownloadImage"
        );
      }
    }

    // Nadpisz funkcję
    // Kod do wstawienia w sekcji monkeyPatchGenerateAndDownloadImage w index.html

    window.generateAndDownloadImage = async function (
      fileName = "projekt-etui.png",
      format = "png",
      size = 1200
    ) {
      if (window.Debug) {
        Debug.debug(
          "CALIBRATION",
          "Wywołanie funkcji generateAndDownloadImage",
          {
            fileName,
            format,
            size,
          }
        );
      }

      const progressMsg = document.createElement("div");
      progressMsg.className = "progress-message";
      progressMsg.textContent = "Trwa generowanie obrazu, proszę czekać...";
      document.body.appendChild(progressMsg);

      return new Promise((resolve) => {
        setTimeout(async function () {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");

            // Używamy wybranego koloru tła zamiast białego
            ctx.fillStyle = currentBackgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const mockupImg = new Image();
            const userImg = new Image();

            let imagesLoaded = 0;
            let hasError = false;

            function handleImageError(message) {
              hasError = true;
              if (window.Debug) {
                Debug.error(
                  "CALIBRATION",
                  "Błąd podczas ładowania obrazu",
                  message
                );
              }
              console.error(message);
              document.body.removeChild(progressMsg);
              alert("Błąd: " + message);
              resolve(false);
            }

            function drawAndDownload() {
              if (hasError) return resolve(false);

              try {
                if (window.Debug) {
                  Debug.debug("CALIBRATION", "Rysowanie i pobieranie obrazu");
                }

                const mockupScaleFactor = Math.min(
                  size / mockupImg.naturalWidth,
                  size / mockupImg.naturalHeight
                );

                const drawWidth = mockupImg.naturalWidth * mockupScaleFactor;
                const drawHeight = mockupImg.naturalHeight * mockupScaleFactor;

                const mockupX = (canvas.width - drawWidth) / 2;
                const mockupY = (canvas.height - drawHeight) / 2;

                const imageOnTop =
                  parseInt(imagePreview.style.zIndex || "5") >= 10;

                if (imageOnTop) {
                  ctx.drawImage(
                    mockupImg,
                    mockupX,
                    mockupY,
                    drawWidth,
                    drawHeight
                  );
                  drawUserImage();
                } else {
                  drawUserImage();
                  ctx.drawImage(
                    mockupImg,
                    mockupX,
                    mockupY,
                    drawWidth,
                    drawHeight
                  );
                }

                function drawUserImage() {
                  if (window.Debug) {
                    Debug.debug(
                      "CALIBRATION",
                      "Rysowanie obrazu użytkownika z kalibracją",
                      calibration
                    );
                  }

                  const canvasCenterX = canvas.width / 2;
                  const canvasCenterY = canvas.height / 2;

                  // Używamy wartości kalibracji z panelu kalibracji
                  const X_POSITION_FACTOR = calibration.xPositionFactor;
                  const Y_POSITION_FACTOR = calibration.yPositionFactor;
                  const ZOOM_FACTOR = calibration.zoomFactor;

                  // Calculate scaled position values
                  const scaledX =
                    currentX * mockupScaleFactor * X_POSITION_FACTOR;
                  const scaledY =
                    currentY * mockupScaleFactor * Y_POSITION_FACTOR;

                  const userImageX = canvasCenterX + scaledX;
                  const userImageY = canvasCenterY + scaledY;

                  ctx.save();
                  ctx.translate(userImageX, userImageY);
                  ctx.rotate((currentRotation * Math.PI) / 180);

                  // Use the separate zoom factor for scaling
                  const scaledZoom =
                    (currentZoom / 100) * mockupScaleFactor * ZOOM_FACTOR;
                  ctx.scale(scaledZoom, scaledZoom);

                  const userImgWidth = userImg.naturalWidth;
                  const userImgHeight = userImg.naturalHeight;
                  ctx.drawImage(userImg, -userImgWidth / 2, -userImgHeight / 2);

                  ctx.restore();
                }

                if (canvas.toBlob) {
                  const mimeType =
                    format === "jpg" ? "image/jpeg" : "image/png";
                  const quality = format === "jpg" ? 0.9 : undefined;

                  canvas.toBlob(
                    function (blob) {
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
                if (window.Debug) {
                  Debug.error("CALIBRATION", "Błąd przy rysowaniu", e);
                }
                console.error("Błąd przy rysowaniu:", e);
                document.body.removeChild(progressMsg);
                alert(
                  "Wystąpił błąd podczas renderowania obrazu: " + e.message
                );
                resolve(false);
              }
            }

            function downloadUsingBlob(blob) {
              try {
                if (window.Debug) {
                  Debug.debug(
                    "CALIBRATION",
                    "Pobieranie obrazu za pomocą Blob"
                  );
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
                  resolve(true);
                }, 100);
              } catch (e) {
                if (window.Debug) {
                  Debug.error("CALIBRATION", "Błąd przy pobieraniu (blob)", e);
                }
                console.error("Błąd przy pobieraniu (blob):", e);
                document.body.removeChild(progressMsg);
                alert("Wystąpił błąd podczas pobierania obrazu: " + e.message);
                resolve(false);
              }
            }

            function downloadUsingDataURL(dataURL) {
              try {
                if (window.Debug) {
                  Debug.debug(
                    "CALIBRATION",
                    "Pobieranie obrazu za pomocą DataURL"
                  );
                }

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
                if (window.Debug) {
                  Debug.error(
                    "CALIBRATION",
                    "Błąd przy pobieraniu (dataURL)",
                    e
                  );
                }
                console.error("Błąd przy pobieraniu (dataURL):", e);
                document.body.removeChild(progressMsg);
                alert("Wystąpił błąd podczas pobierania obrazu: " + e.message);
                resolve(false);
              }
            }

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

            mockupImg.onload = function () {
              if (window.Debug) {
                Debug.debug("CALIBRATION", "Załadowano obraz mockupu");
              }
              imagesLoaded++;
              if (imagesLoaded === 2) drawAndDownload();
            };

            userImg.onload = function () {
              if (window.Debug) {
                Debug.debug("CALIBRATION", "Załadowano obraz użytkownika");
              }
              imagesLoaded++;
              if (imagesLoaded === 2) drawAndDownload();
            };

            mockupImg.crossOrigin = "Anonymous";
            userImg.crossOrigin = "Anonymous";
            const timestamp = new Date().getTime();
            mockupImg.src = mockupImage.src + "?t=" + timestamp;
            userImg.src = imagePreview.src;

            setTimeout(function () {
              if (imagesLoaded < 2 && !hasError) {
                handleImageError("Przekroczono limit czasu ładowania obrazów");
              }
            }, 10000);
          } catch (e) {
            if (window.Debug) {
              Debug.error("CALIBRATION", "Błąd generowania obrazu", e);
            }
            console.error("Błąd generowania obrazu:", e);
            document.body.removeChild(progressMsg);
            alert("Wystąpił błąd podczas generowania obrazu: " + e.message);
            resolve(false);
          }
        }, 100);
      });
    };

    if (window.Debug) {
      Debug.info(
        "CALIBRATION",
        "Nadpisano funkcję generateAndDownloadImage z nowymi współczynnikami kalibracji"
      );
    }
    console.log(
      "Nadpisano funkcję generateAndDownloadImage z nowymi współczynnikami kalibracji."
    );
  }

  // Funkcja wyświetlająca powiadomienie
  function showNotification(message) {
    if (window.Debug) {
      Debug.debug("CALIBRATION", `Wyświetlanie powiadomienia: ${message}`);
    }

    const notification = document.createElement("div");
    notification.style.position = "fixed";
    notification.style.bottom = "20px";
    notification.style.left = "50%";
    notification.style.transform = "translateX(-50%)";
    notification.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    notification.style.color = "white";
    notification.style.padding = "10px 20px";
    notification.style.borderRadius = "5px";
    notification.style.zIndex = "9999";
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transition = "opacity 0.5s";

      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 2000);
  }

  // Nasłuchiwacze zdarzeń dla pól kalibracji
  xPositionFactor.addEventListener("input", function () {
    if (window.Debug) {
      Debug.debug(
        "CALIBRATION",
        `Zmiana współczynnika pozycji X: ${this.value}`
      );
    }
    xPositionFactorValue.textContent = this.value;
  });

  yPositionFactor.addEventListener("input", function () {
    if (window.Debug) {
      Debug.debug(
        "CALIBRATION",
        `Zmiana współczynnika pozycji Y: ${this.value}`
      );
    }
    yPositionFactorValue.textContent = this.value;
  });

  zoomFactor.addEventListener("input", function () {
    if (window.Debug) {
      Debug.debug("CALIBRATION", `Zmiana współczynnika zoom: ${this.value}`);
    }
    zoomFactorValue.textContent = this.value;
  });

  // Obsługa przycisków predefiniowanych ustawień
  presetButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const x = parseFloat(this.getAttribute("data-x"));
      const y = parseFloat(this.getAttribute("data-y"));
      const zoom = parseFloat(this.getAttribute("data-zoom"));

      if (window.Debug) {
        Debug.debug("CALIBRATION", "Wybrano predefiniowane ustawienia", {
          x,
          y,
          zoom,
        });
      }

      xPositionFactor.value = x;
      yPositionFactor.value = y;
      zoomFactor.value = zoom;

      xPositionFactorValue.textContent = x;
      yPositionFactorValue.textContent = y;
      zoomFactorValue.textContent = zoom;
    });
  });

  // Otwórz panel kalibracji
  calibrationBubble.addEventListener("click", function () {
    if (window.Debug) {
      Debug.debug("CALIBRATION", "Otwieranie panelu kalibracji");
    }
    calibrationPanel.classList.add("active");
  });

  // Zamknij panel kalibracji
  calibrationClose.addEventListener("click", function () {
    if (window.Debug) {
      Debug.debug("CALIBRATION", "Zamykanie panelu kalibracji");
    }
    calibrationPanel.classList.remove("active");
  });

  // Zapisz ustawienia kalibracji
  calibrationSave.addEventListener("click", saveCalibration);

  // Resetuj ustawienia kalibracji
  calibrationReset.addEventListener("click", resetToDefaultCalibration);

  // Wczytaj zapisane wartości kalibracji przy ładowaniu strony
  loadCalibration();

  // Monkeypatch funkcji generowania obrazu przy ładowaniu strony
  // Opóźniamy to trochę, aby upewnić się, że oryginalny kod jest już załadowany
  setTimeout(monkeyPatchGenerateAndDownloadImage, 1000);

  if (window.Debug) {
    Debug.info(
      "CALIBRATION",
      "Moduł kalibracji obrazu został zainicjalizowany"
    );
  }
  console.log("Moduł kalibracji obrazu został zainicjalizowany.");
});
