/**
 * transformations.js - Plik zawierający funkcje transformacji obrazu
 * Zmodyfikowany dla jednolitego powiększenia
 */

const Transformations = (function () {
  // Stan transformacji
  let state = {
    currentX: 0,
    currentY: 0,
    currentRotation: 0,
    currentZoom: 100,
    currentBackgroundColor: "#FFFFFF",
    isLayerFront: false,

    // Stan operacji przeciągania
    isDragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  };

  /**
   * Aktualizuje transformację obrazu na podstawie aktualnego stanu
   */
  function updateTransform() {
    // Dodaj debugowanie, jeśli moduł Debug jest dostępny
    if (window.Debug) {
      Debug.debug("TRANSFORMATIONS", "Aktualizacja transformacji", {
        x: state.currentX,
        y: state.currentY,
        rotation: state.currentRotation,
        zoom: state.currentZoom,
      });
    }

    // Używamy jednolitego, liniowego współczynnika powiększenia
    // Stała wartość 0.01 oznacza, że każdy 1% powiększenia to 0.01 jednostki skali
    // Dzięki temu powiększenie 30% będzie dokładnie takie samo na każdym urządzeniu
    const linearZoomFactor = state.currentZoom * 0.01;

    Elements.imagePreview.style.transform = `translate(calc(-50% + ${state.currentX}px), calc(-50% + ${state.currentY}px)) rotate(${state.currentRotation}deg) scale(${linearZoomFactor})`;
  }

  /**
   * Resetuje wszystkie transformacje do wartości domyślnych
   */
  function resetTransformations() {
    if (window.Debug) {
      Debug.info("TRANSFORMATIONS", "Resetowanie wszystkich transformacji");
    }

    // Resetuj wartości stanu
    state.currentX = EditorConfig.defaults.positionX;
    state.currentY = EditorConfig.defaults.positionY;
    state.currentRotation = EditorConfig.defaults.rotation;
    state.currentZoom = EditorConfig.defaults.zoom;

    // Aktualizuj UI
    Elements.rotateSlider.value = state.currentRotation;
    Elements.rotateValue.textContent = state.currentRotation;

    Elements.zoomSlider.value = state.currentZoom;
    Elements.zoomValue.textContent = state.currentZoom;

    Elements.moveXSlider.value = state.currentX;
    Elements.moveYSlider.value = state.currentY;
    Elements.moveXValue.textContent = state.currentX;
    Elements.moveYValue.textContent = state.currentY;

    // Zastosuj transformacje
    updateTransform();
  }

  /**
   * Ustawia obraz na środku edytora
   */
  function centerImage() {
    if (window.Debug) {
      Debug.info("TRANSFORMATIONS", "Centrowanie obrazu");
    }

    state.currentX = 0;
    state.currentY = 0;

    // Aktualizuj UI
    Elements.moveXSlider.value = state.currentX;
    Elements.moveYSlider.value = state.currentY;
    Elements.moveXValue.textContent = state.currentX;
    Elements.moveYValue.textContent = state.currentY;

    // Zastosuj transformacje
    updateTransform();
  }

  /**
   * Obraca obraz o określoną wartość
   * @param {number} degrees - Stopnie obrotu (dodatnie lub ujemne)
   */
  function rotateImage(degrees) {
    if (window.Debug) {
      Debug.debug("TRANSFORMATIONS", `Obracanie obrazu o ${degrees} stopni`);
    }

    state.currentRotation += degrees;

    // Ograniczenie wartości do zakresu -180 do 180
    if (state.currentRotation > 180) state.currentRotation -= 360;
    if (state.currentRotation < -180) state.currentRotation += 360;

    // Aktualizuj UI
    Elements.rotateSlider.value = state.currentRotation;
    Elements.rotateValue.textContent = state.currentRotation;

    // Zastosuj transformacje
    updateTransform();
  }

  /**
   * Zmienia powiększenie obrazu o określoną wartość
   * @param {number} amount - Wartość zmiany powiększenia
   */
  function zoomImage(amount) {
    const prevZoom = state.currentZoom;

    state.currentZoom += amount;

    // Ograniczenie wartości do minimalnej i maksymalnej
    state.currentZoom = Math.max(
      EditorConfig.limits.zoom.min,
      Math.min(EditorConfig.limits.zoom.max, state.currentZoom)
    );

    if (window.Debug) {
      Debug.debug(
        "TRANSFORMATIONS",
        `Zmiana powiększenia z ${prevZoom} na ${state.currentZoom}`
      );
    }

    // Aktualizuj UI
    Elements.zoomSlider.value = state.currentZoom;
    Elements.zoomValue.textContent = state.currentZoom;

    // Zastosuj transformacje
    updateTransform();
  }

  /**
   * Zmienia pozycję obrazu
   * @param {number} x - Wartość zmiany pozycji X
   * @param {number} y - Wartość zmiany pozycji Y
   */
  function moveImage(x, y) {
    // Zapisz poprzednie wartości do debugowania
    const prevX = state.currentX;
    const prevY = state.currentY;

    state.currentX = x;
    state.currentY = y;

    // Ograniczenie wartości
    state.currentX = Math.max(
      EditorConfig.limits.position.min,
      Math.min(EditorConfig.limits.position.max, state.currentX)
    );
    state.currentY = Math.max(
      EditorConfig.limits.position.min,
      Math.min(EditorConfig.limits.position.max, state.currentY)
    );

    // Dodaj debugowanie
    if (window.Debug) {
      Debug.debug("TRANSFORMATIONS", "Zmiana pozycji obrazu", {
        from: { x: prevX, y: prevY },
        to: { x: state.currentX, y: state.currentY },
      });
    }

    // Aktualizuj UI
    Elements.moveXSlider.value = state.currentX;
    Elements.moveYSlider.value = state.currentY;
    Elements.moveXValue.textContent = state.currentX;
    Elements.moveYValue.textContent = state.currentY;

    // Zastosuj transformacje
    updateTransform();
  }

  /**
   * Zmienia kolejność warstw (obraz na wierzchu/pod spodem)
   * @param {boolean} front - Czy obraz ma być na wierzchu
   */
  function setLayerOrder(front) {
    if (window.Debug) {
      Debug.debug(
        "TRANSFORMATIONS",
        `Zmiana kolejności warstw: obraz ${
          front ? "na wierzchu" : "pod spodem"
        }`
      );
    }

    state.isLayerFront = front;
    Elements.imagePreview.style.zIndex = front ? "20" : "5";
  }

  /**
   * Ustawia kolor tła edytora
   * @param {string} color - Kolor w formacie hex (#RRGGBB)
   */
  function setBackgroundColor(color) {
    if (window.Debug) {
      Debug.debug("TRANSFORMATIONS", `Zmiana koloru tła na ${color}`);
    }

    state.currentBackgroundColor = color;
    Elements.backgroundColorPicker.value = color;
    Elements.colorValue.textContent = color;
    Elements.editorContainer.style.backgroundColor = color;
  }

  /**
   * Rozpoczyna operację przeciągania obrazu
   * @param {MouseEvent} e - Zdarzenie myszy
   */
  function startDrag(e) {
    if (window.Debug) {
      Debug.debug("TRANSFORMATIONS", "Rozpoczęcie przeciągania obrazu", {
        clientX: e.clientX,
        clientY: e.clientY,
      });
    }

    state.isDragging = true;
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.initialX = state.currentX;
    state.initialY = state.currentY;
    Elements.imagePreview.style.cursor = "grabbing";
  }

  /**
   * Kończy operację przeciągania obrazu
   */
  function stopDrag() {
    if (state.isDragging && window.Debug) {
      Debug.debug("TRANSFORMATIONS", "Zakończenie przeciągania obrazu", {
        finalX: state.currentX,
        finalY: state.currentY,
      });
    }

    state.isDragging = false;
    Elements.imagePreview.style.cursor = "move";
  }

  /**
   * Obsługuje przeciąganie obrazu
   * @param {MouseEvent} e - Zdarzenie myszy
   */
  function drag(e) {
    if (state.isDragging) {
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;

      const newX = state.initialX + dx;
      const newY = state.initialY + dy;

      // Dodajemy rzadsze logowanie, aby nie zaśmiecać konsoli
      if (window.Debug && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        Debug.debug("TRANSFORMATIONS", "Przeciąganie obrazu", {
          deltaX: dx,
          deltaY: dy,
          newPosition: { x: newX, y: newY },
        });
        // Aktualizujemy wartości startowe, aby ograniczyć częstotliwość logowania
        state.startX = e.clientX;
        state.startY = e.clientY;
        state.initialX = newX;
        state.initialY = newY;
      }

      moveImage(newX, newY);
    }
  }

  /**
   * Inicjalizuje moduł transformacji i binduje zdarzenia
   */
  function init() {
    if (window.Debug) {
      Debug.info("TRANSFORMATIONS", "Inicjalizacja modułu transformacji");
    }

    // Ustaw domyślne wartości
    resetTransformations();

    // Binduj funkcje do zdarzeń - można przenieść do modułu UI
    Elements.imagePreview.addEventListener("mousedown", startDrag);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("mousemove", drag);

    if (window.Debug) {
      Debug.debug(
        "TRANSFORMATIONS",
        "Zainicjalizowano nasłuchiwacze zdarzeń myszy"
      );
    }
  }

  /**
   * Wczytuje zapisane parametry dla mockupu
   * @param {object} params - Parametry transformacji
   */
  function loadTransformationParams(params) {
    if (!params) {
      if (window.Debug) {
        Debug.warn("TRANSFORMATIONS", "Brak parametrów do wczytania");
      }
      return;
    }

    if (window.Debug) {
      Debug.info(
        "TRANSFORMATIONS",
        "Wczytywanie parametrów transformacji",
        params
      );
    }

    state.currentRotation = params.rotation;
    state.currentZoom = params.zoom;
    state.currentX = params.positionX;
    state.currentY = params.positionY;

    // Aktualizuj UI
    Elements.rotateSlider.value = state.currentRotation;
    Elements.rotateValue.textContent = state.currentRotation;

    Elements.zoomSlider.value = state.currentZoom;
    Elements.zoomValue.textContent = state.currentZoom;

    Elements.moveXSlider.value = state.currentX;
    Elements.moveYSlider.value = state.currentY;
    Elements.moveXValue.textContent = state.currentX;
    Elements.moveYValue.textContent = state.currentY;

    // Ustaw kolejność warstw
    setLayerOrder(params.layerFront);

    // Ustaw kolor tła jeśli jest dostępny
    if (params.backgroundColor) {
      setBackgroundColor(params.backgroundColor);
    }

    // Zastosuj transformacje
    updateTransform();
  }

  // Zwróć publiczny interfejs modułu
  return {
    init,
    updateTransform,
    resetTransformations,
    centerImage,
    rotateImage,
    zoomImage,
    moveImage,
    setLayerOrder,
    setBackgroundColor,
    loadTransformationParams,
    getState: function () {
      return { ...state };
    },
  };
})();
function detectResolutionAndAdjustFactors() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  if (window.Debug) {
    Debug.info("TRANSFORMATIONS", `Wykryto rozdzielczość: ${width}x${height}`);
  }

  // Współczynnik referencyjny dla 1920x1080
  const referenceWidth = 1920;
  const referenceHeight = 1080;

  // Oblicz współczynnik skalowania
  const widthRatio = width / referenceWidth;
  const heightRatio = height / referenceHeight;

  // Użyj mniejszego współczynnika dla zachowania proporcji
  const scaleFactor = Math.min(widthRatio, heightRatio);

  // Ustaw globalny współczynnik skalowania, który będzie używany w renderowaniu
  window.globalScaleFactor = scaleFactor;

  if (window.Debug) {
    Debug.debug(
      "TRANSFORMATIONS",
      `Ustawiono współczynnik skalowania: ${scaleFactor}`
    );
  }

  return scaleFactor;
}

// Wywołaj funkcję przy starcie i przy zmianie rozmiaru okna
detectResolutionAndAdjustFactors();
window.addEventListener("resize", detectResolutionAndAdjustFactors);

// Eksport modułu jako obiekt globalny
window.Transformations = Transformations;
