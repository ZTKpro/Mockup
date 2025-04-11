/**
 * elements.js - Plik zawierający referencje do elementów DOM
 */

// Obiekt przechowujący referencje do elementów DOM
const Elements = {
  // Główne elementy edytora
  uploadInput: document.getElementById("image-upload"),
  imagePreview: document.getElementById("image-preview"),
  mockupImage: document.getElementById("mockup-image"),
  editorContainer: document.getElementById("editor-container"),
  controls: document.getElementById("controls"),
  dragInstruction: document.getElementById("drag-instruction"),
  dropArea: document.getElementById("drop-area"),
  dropText: document.querySelector(".drop-text"),
  uploadText: document.querySelector(".upload-text"),
  mockupGallery: document.getElementById("mockup-gallery"),
  
  // Przyciski i kontrolki
  rotateSlider: document.getElementById("rotate-slider"),
  rotateValue: document.getElementById("rotate-value"),
  rotateLeft: document.getElementById("rotate-left"),
  rotateRight: document.getElementById("rotate-right"),
  
  zoomSlider: document.getElementById("zoom-slider"),
  zoomValue: document.getElementById("zoom-value"),
  zoomIn: document.getElementById("zoom-in"),
  zoomOut: document.getElementById("zoom-out"),
  
  moveXSlider: document.getElementById("move-x-slider"),
  moveYSlider: document.getElementById("move-y-slider"),
  moveXValue: document.getElementById("move-x-value"),
  moveYValue: document.getElementById("move-y-value"),
  
  resetButton: document.getElementById("reset-button"),
  centerButton: document.getElementById("center-button"),
  downloadButton: document.getElementById("download-button"),
  downloadSelectedMockups: document.getElementById("download-selected-mockups"),
  
  
  // Elementy związane z tłem
  backgroundColorPicker: document.getElementById("background-color"),
  colorValue: document.getElementById("color-value"),
  resetColorButton: document.getElementById("reset-color"),
  
  // Elementy związane z mockupami
  selectAllButton: document.getElementById("select-all-mockups"),
  deselectAllButton: document.getElementById("deselect-all-mockups"),
  modelFilters: document.getElementById("model-filters")
};

// Eksport elementów jako obiekt globalny
window.Elements = Elements;
