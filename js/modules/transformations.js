/**
 * transformations.js - Plik zawierający funkcje transformacji obrazu
 */

const Transformations = (function() {
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
    initialY: 0
  };
  
  /**
   * Aktualizuje transformację obrazu na podstawie aktualnego stanu
   */
  function updateTransform() {
    Elements.imagePreview.style.transform = `translate(calc(-50% + ${state.currentX}px), calc(-50% + ${state.currentY}px)) rotate(${
      state.currentRotation
    }deg) scale(${state.currentZoom / 100})`;
  }
  
  /**
   * Resetuje wszystkie transformacje do wartości domyślnych
   */
  function resetTransformations() {
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
    state.currentZoom += amount;
    
    // Ograniczenie wartości do minimalnej i maksymalnej
    state.currentZoom = Math.max(
      EditorConfig.limits.zoom.min,
      Math.min(EditorConfig.limits.zoom.max, state.currentZoom)
    );
    
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
    state.isLayerFront = front;
    Elements.imagePreview.style.zIndex = front ? "20" : "5";
  }
  
  /**
   * Ustawia kolor tła edytora
   * @param {string} color - Kolor w formacie hex (#RRGGBB)
   */
  function setBackgroundColor(color) {
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
      
      moveImage(newX, newY);
    }
  }
  
  /**
   * Inicjalizuje moduł transformacji i binduje zdarzenia
   */
  function init() {
    // Ustaw domyślne wartości
    resetTransformations();
    
    // Binduj funkcje do zdarzeń - można przenieść do modułu UI
    Elements.imagePreview.addEventListener("mousedown", startDrag);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("mousemove", drag);
  }
  
  /**
   * Wczytuje zapisane parametry dla mockupu
   * @param {object} params - Parametry transformacji
   */
  function loadTransformationParams(params) {
    if (!params) return;
    
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
    getState: function() {
      return { ...state };
    }
  };
})();

// Eksport modułu jako obiekt globalny
window.Transformations = Transformations;
