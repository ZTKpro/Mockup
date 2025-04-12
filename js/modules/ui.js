/**
 * ui.js - Plik zawierający obsługę interfejsu użytkownika
 */

const UI = (function () {
  // Inicjalizacja debugowania
  if (window.Debug) {
    Debug.info("UI", "Inicjalizacja modułu interfejsu użytkownika");
  }

  /**
   * Inicjalizuje obsługę kontrolek i przycisków interfejsu
   */
  function init() {
    if (window.Debug) {
      Debug.debug("UI", "Inicjalizacja kontrolek i przycisków");
    }

    setupRotationControls();
    setupZoomControls();
    setupPositionControls();
    setupBackgroundControls();
    setupActionButtons();
  }

  /**
   * Konfiguruje kontrolki obrotu
   */
  function setupRotationControls() {
    if (window.Debug) {
      Debug.debug("UI", "Konfiguracja kontrolek obrotu");
    }

    // Suwak obrotu
    Elements.rotateSlider.addEventListener("input", function () {
      const rotation = parseInt(this.value);
      Elements.rotateValue.textContent = rotation;

      if (window.Debug) {
        Debug.debug("UI", `Zmiana suwaka obrotu: ${rotation}°`);
      }

      // Zastosuj transformację
      const transformEvent = new CustomEvent("transformChange", {
        detail: { type: "rotation", value: rotation },
      });
      document.dispatchEvent(transformEvent);
    });

    // Przyciski obrotu w lewo/prawo
    Elements.rotateLeft.addEventListener("click", function () {
      const rotation = parseInt(Elements.rotateSlider.value) - 90;
      const adjustedRotation = rotation < -180 ? rotation + 360 : rotation;

      if (window.Debug) {
        Debug.debug("UI", `Kliknięto obróć w lewo: ${adjustedRotation}°`);
      }

      Elements.rotateSlider.value = adjustedRotation;
      Elements.rotateValue.textContent = adjustedRotation;

      // Zastosuj transformację
      const transformEvent = new CustomEvent("transformChange", {
        detail: { type: "rotation", value: adjustedRotation },
      });
      document.dispatchEvent(transformEvent);
    });

    Elements.rotateRight.addEventListener("click", function () {
      const rotation = parseInt(Elements.rotateSlider.value) + 90;
      const adjustedRotation = rotation > 180 ? rotation - 360 : rotation;

      if (window.Debug) {
        Debug.debug("UI", `Kliknięto obróć w prawo: ${adjustedRotation}°`);
      }

      Elements.rotateSlider.value = adjustedRotation;
      Elements.rotateValue.textContent = adjustedRotation;

      // Zastosuj transformację
      const transformEvent = new CustomEvent("transformChange", {
        detail: { type: "rotation", value: adjustedRotation },
      });
      document.dispatchEvent(transformEvent);
    });
  }

  /**
   * Konfiguruje kontrolki powiększenia
   */
  function setupZoomControls() {
    if (window.Debug) {
      Debug.debug("UI", "Konfiguracja kontrolek powiększenia");
    }

    // Suwak powiększenia
    Elements.zoomSlider.addEventListener("input", function () {
      const zoom = parseInt(this.value);
      Elements.zoomValue.textContent = zoom;

      if (window.Debug) {
        Debug.debug("UI", `Zmiana suwaka powiększenia: ${zoom}%`);
      }

      // Zastosuj transformację
      const transformEvent = new CustomEvent("transformChange", {
        detail: { type: "zoom", value: zoom },
      });
      document.dispatchEvent(transformEvent);
    });

    // Przyciski powiększania/pomniejszania
    Elements.zoomIn.addEventListener("click", function () {
      const zoom = Math.min(
        parseInt(Elements.zoomSlider.value) + 10,
        EditorConfig.limits.zoom.max
      );

      if (window.Debug) {
        Debug.debug("UI", `Kliknięto powiększ: ${zoom}%`);
      }

      Elements.zoomSlider.value = zoom;
      Elements.zoomValue.textContent = zoom;

      // Zastosuj transformację
      const transformEvent = new CustomEvent("transformChange", {
        detail: { type: "zoom", value: zoom },
      });
      document.dispatchEvent(transformEvent);
    });

    Elements.zoomOut.addEventListener("click", function () {
      const zoom = Math.max(
        parseInt(Elements.zoomSlider.value) - 10,
        EditorConfig.limits.zoom.min
      );

      if (window.Debug) {
        Debug.debug("UI", `Kliknięto pomniejsz: ${zoom}%`);
      }

      Elements.zoomSlider.value = zoom;
      Elements.zoomValue.textContent = zoom;

      // Zastosuj transformację
      const transformEvent = new CustomEvent("transformChange", {
        detail: { type: "zoom", value: zoom },
      });
      document.dispatchEvent(transformEvent);
    });
  }

  /**
   * Konfiguruje kontrolki pozycji
   */
  function setupPositionControls() {
    if (window.Debug) {
      Debug.debug("UI", "Konfiguracja kontrolek pozycji");
    }

    // Suwak pozycji X
    Elements.moveXSlider.addEventListener("input", function () {
      const positionX = parseInt(this.value);
      Elements.moveXValue.textContent = positionX;

      if (window.Debug) {
        Debug.debug("UI", `Zmiana pozycji X: ${positionX}px`);
      }

      // Zastosuj transformację
      const transformEvent = new CustomEvent("transformChange", {
        detail: { type: "positionX", value: positionX },
      });
      document.dispatchEvent(transformEvent);
    });

    // Suwak pozycji Y
    Elements.moveYSlider.addEventListener("input", function () {
      const positionY = parseInt(this.value);
      Elements.moveYValue.textContent = positionY;

      if (window.Debug) {
        Debug.debug("UI", `Zmiana pozycji Y: ${positionY}px`);
      }

      // Zastosuj transformację
      const transformEvent = new CustomEvent("transformChange", {
        detail: { type: "positionY", value: positionY },
      });
      document.dispatchEvent(transformEvent);
    });
  }

  /**
   * Konfiguruje kontrolki koloru tła
   */
  function setupBackgroundControls() {
    if (window.Debug) {
      Debug.debug("UI", "Konfiguracja kontrolek koloru tła");
    }

    // Wybór koloru tła
    Elements.backgroundColorPicker.addEventListener("input", function () {
      const color = this.value;
      Elements.colorValue.textContent = color;
      Elements.editorContainer.style.backgroundColor = color;

      if (window.Debug) {
        Debug.debug("UI", `Zmiana koloru tła: ${color}`);
      }

      // Zastosuj transformację
      const transformEvent = new CustomEvent("transformChange", {
        detail: { type: "backgroundColor", value: color },
      });
      document.dispatchEvent(transformEvent);
    });

    // Przycisk resetowania koloru tła
    Elements.resetColorButton.addEventListener("click", function () {
      const defaultColor = EditorConfig.defaults.backgroundColor;

      if (window.Debug) {
        Debug.debug(
          "UI",
          `Resetowanie koloru tła do domyślnego: ${defaultColor}`
        );
      }

      Elements.backgroundColorPicker.value = defaultColor;
      Elements.colorValue.textContent = defaultColor;
      Elements.editorContainer.style.backgroundColor = defaultColor;

      // Zastosuj transformację
      const transformEvent = new CustomEvent("transformChange", {
        detail: { type: "backgroundColor", value: defaultColor },
      });
      document.dispatchEvent(transformEvent);
    });
  }

  /**
   * Konfiguruje przyciski akcji
   */
  function setupActionButtons() {
    if (window.Debug) {
      Debug.debug("UI", "Konfiguracja przycisków akcji");
    }

    // Przycisk resetowania
    Elements.resetButton.addEventListener("click", function () {
      if (window.Debug) {
        Debug.info("UI", "Kliknięto przycisk resetowania transformacji");
      }

      if (window.Transformations) {
        Transformations.resetTransformations();
      }

      const resetEvent = new CustomEvent("resetTransformations");
      document.dispatchEvent(resetEvent);
    });

    // Przycisk centrowania
    Elements.centerButton.addEventListener("click", function () {
      if (window.Debug) {
        Debug.info("UI", "Kliknięto przycisk centrowania obrazu");
      }

      const centerEvent = new CustomEvent("centerImage");
      document.dispatchEvent(centerEvent);
    });
  }

  /**
   * Aktualizuje wartości kontrolek na podstawie stanu transformacji
   * @param {object} state - Stan transformacji
   */
  function updateControlsFromState(state) {
    if (window.Debug) {
      Debug.debug("UI", "Aktualizacja kontrolek na podstawie stanu", state);
    }

    // Aktualizuj suwaki i wartości
    Elements.rotateSlider.value = state.currentRotation;
    Elements.rotateValue.textContent = state.currentRotation;

    Elements.zoomSlider.value = state.currentZoom;
    Elements.zoomValue.textContent = state.currentZoom;

    Elements.moveXSlider.value = state.currentX;
    Elements.moveYSlider.value = state.currentY;
    Elements.moveXValue.textContent = state.currentX;
    Elements.moveYValue.textContent = state.currentY;

    // Aktualizuj kolor tła
    Elements.backgroundColorPicker.value = state.currentBackgroundColor;
    Elements.colorValue.textContent = state.currentBackgroundColor;
    Elements.editorContainer.style.backgroundColor =
      state.currentBackgroundColor;
  }

  /**
   * Pokazuje powiadomienie
   * @param {string} message - Wiadomość do wyświetlenia
   * @param {number} duration - Czas wyświetlania w ms
   */
  function showNotification(message, duration = 2000) {
    if (window.Debug) {
      Debug.debug(
        "UI",
        `Wyświetlanie powiadomienia: "${message}", czas: ${duration}ms`
      );
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

        if (window.Debug) {
          Debug.debug("UI", "Usunięto powiadomienie");
        }
      }, 500);
    }, duration);
  }

  // Zwróć publiczny interfejs modułu
  return {
    init,
    updateControlsFromState,
    showNotification,
  };
})();

// Eksport modułu jako obiekt globalny
window.UI = UI;
