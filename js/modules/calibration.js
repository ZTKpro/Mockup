/**
 * calibration.js - Moduł obsługujący kalibrację generowania obrazów
 */

const Calibration = (function () {
  // Logowanie debugowania, jeśli moduł Debug jest dostępny
  if (window.Debug) {
    Debug.info("CALIBRATION", "Inicjalizacja modułu kalibracji");
  }

  // Referencje do elementów DOM
  let calibrationBubble;
  let calibrationPanel;
  let calibrationClose;
  let calibrationSave;
  let calibrationReset;
  let xPositionFactor;
  let yPositionFactor;
  let zoomFactor;
  let xPositionFactorValue;
  let yPositionFactorValue;
  let zoomFactorValue;
  let presetButtons;

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

  /**
   * Inicjalizuje moduł i przypisuje referencje do elementów DOM
   */
  function init() {
    if (window.Debug) {
      Debug.info("CALIBRATION", "Inicjalizacja elementów DOM kalibracji");
    }

    // Elementy DOM dla kalibracji
    calibrationBubble = document.getElementById("calibration-bubble");
    calibrationPanel = document.getElementById("calibration-panel");
    calibrationClose = document.getElementById("calibration-close");
    calibrationSave = document.getElementById("calibration-save");
    calibrationReset = document.getElementById("calibration-reset");

    // Elementy pól kalibracji
    xPositionFactor = document.getElementById("x-position-factor");
    yPositionFactor = document.getElementById("y-position-factor");
    zoomFactor = document.getElementById("zoom-factor");

    // Wartości do wyświetlania
    xPositionFactorValue = document.getElementById("x-position-factor-value");
    yPositionFactorValue = document.getElementById("y-position-factor-value");
    zoomFactorValue = document.getElementById("zoom-factor-value");

    // Predefiniowane ustawienia
    presetButtons = document.querySelectorAll(".calibration-preset-button");

    if (!calibrationBubble || !calibrationPanel) {
      if (window.Debug) {
        Debug.error(
          "CALIBRATION",
          "Nie znaleziono elementów panelu kalibracji",
          {
            calibrationBubble: !!calibrationBubble,
            calibrationPanel: !!calibrationPanel,
          }
        );
      }
      console.error("Nie znaleziono elementów panelu kalibracji");
      return;
    }

    setupEventListeners();
    loadCalibration();
    monkeyPatchGenerateAndDownloadImage();

    if (window.Debug) {
      Debug.info("CALIBRATION", "Moduł kalibracji został zainicjalizowany");
    }
  }

  /**
   * Konfiguruje nasłuchiwacze zdarzeń
   */
  function setupEventListeners() {
    if (window.Debug) {
      Debug.debug(
        "CALIBRATION",
        "Konfiguracja nasłuchiwaczy zdarzeń kalibracji"
      );
    }

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
  }

  /**
   * Wczytuje zapisane wartości kalibracji z localStorage
   */
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

        // Udostępnij kalibrację globalnie
        window.calibration = calibration;

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

      // Ustaw wartości domyślne
      calibration = { ...defaultCalibration };

      // Udostępnij kalibrację globalnie
      window.calibration = calibration;
    }
  }

  /**
   * Zapisuje wartości kalibracji
   */
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

    // Udostępnij kalibrację globalnie
    window.calibration = calibration;

    console.log("Zapisano wartości kalibracji:", calibration);

    // Monkeypatch funkcji generowania obrazu
    monkeyPatchGenerateAndDownloadImage();

    // Pokaż powiadomienie
    showNotification("Zapisano ustawienia kalibracji");

    // Zamknij panel
    calibrationPanel.classList.remove("active");
  }

  /**
   * Resetuje do domyślnych wartości
   */
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

  /**
   * Monkeypatch funkcji generowania obrazu
   */
  function monkeyPatchGenerateAndDownloadImage() {
    // Sprawdź, czy funkcja istnieje
    if (
      typeof window.generateAndDownloadImage !== "function" &&
      typeof window.Export?.generateAndDownloadImage !== "function"
    ) {
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
      window.originalGenerateAndDownloadImage =
        window.generateAndDownloadImage ||
        window.Export.generateAndDownloadImage;
      if (window.Debug) {
        Debug.debug(
          "CALIBRATION",
          "Zapisano oryginalną funkcję generateAndDownloadImage"
        );
      }
    }

    // Pobierz oryginalną funkcję (albo z globalnego window, albo z modułu Export)
    const originalFn =
      window.originalGenerateAndDownloadImage ||
      window.Export.generateAndDownloadImage;

    // Nadpisz funkcję - używamy funkcji w module Export, jeśli jest dostępna
    if (
      window.Export &&
      typeof window.Export.generateAndDownloadImage === "function"
    ) {
      window.Export.generateAndDownloadImage = async function (
        fileName,
        format,
        size
      ) {
        // Upewnij się, że kalibracja jest dostępna globalnie
        if (!window.calibration) {
          window.calibration = calibration;
        }
        return originalFn.call(window.Export, fileName, format, size);
      };

      if (window.Debug) {
        Debug.info(
          "CALIBRATION",
          "Nadpisano funkcję Export.generateAndDownloadImage"
        );
      }
    } else {
      window.generateAndDownloadImage = async function (
        fileName,
        format,
        size
      ) {
        // Upewnij się, że kalibracja jest dostępna globalnie
        if (!window.calibration) {
          window.calibration = calibration;
        }
        return originalFn(fileName, format, size);
      };

      if (window.Debug) {
        Debug.info("CALIBRATION", "Nadpisano funkcję generateAndDownloadImage");
      }
    }

    console.log(
      "Nadpisano funkcję generateAndDownloadImage z nowymi współczynnikami kalibracji."
    );
  }

  /**
   * Funkcja wyświetlająca powiadomienie
   * @param {string} message - Wiadomość do wyświetlenia
   */
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

  // Zwróć publiczny interfejs modułu
  return {
    init,
    loadCalibration,
    saveCalibration,
    resetToDefaultCalibration,
    getCalibration: function () {
      return { ...calibration };
    },
  };
})();

// Czekaj na załadowanie DOM przed inicjalizacją
document.addEventListener("DOMContentLoaded", function () {
  // Inicjalizacja modułu po załadowaniu DOM
  setTimeout(function () {
    Calibration.init();
  }, 500); // Dodajemy małe opóźnienie, aby upewnić się, że inne moduły zostały załadowane
});

// Eksportuj moduł jako obiekt globalny
window.Calibration = Calibration;
