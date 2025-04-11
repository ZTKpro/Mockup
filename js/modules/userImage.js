/**
 * userImage.js - Plik zawierający funkcje do obsługi obrazu użytkownika
 */

const UserImage = (function() {
  // Stan modułu
  let userImageLoaded = false;
  
  /**
   * Obsługuje wybór pliku przez użytkownika
   * @param {Event} e - Zdarzenie zmiany input[type=file]
   */
  async function handleFileSelect(e) {
    const files = e.target.files;
    await handleFiles(files);
  }
  
  /**
   * Obsługuje upuszczenie pliku na obszar drag & drop
   * @param {DragEvent} e - Zdarzenie upuszczenia pliku
   */
  async function handleDrop(e) {
    e.preventDefault();
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length) {
      await handleFiles(files);
    }
    
    // Przywróć normalny wygląd obszaru upuszczania
    unhighlight();
  }
  
  /**
   * Obsługuje pliki przekazane przez użytkownika (wybrane lub upuszczone)
   * @param {FileList} files - Lista plików
   */
  async function handleFiles(files) {
    if (files.length && files[0].type.match("image.*")) {
      try {
        // Pokaż komunikat o ładowaniu
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
        
        // Utwórz obiekt FormData
        const formData = new FormData();
        formData.append("image", files[0]);
        
        // Wyślij plik na serwer
        const response = await fetch("/api/upload/user-image", {
          method: "POST",
          body: formData
        });
        
        const result = await response.json();
        document.body.removeChild(loadingMsg);
        
        if (result.success) {
          // Użyj danych obrazu w formacie base64 zamiast ścieżki do pliku
          Elements.imagePreview.src = result.imageData;
          
          // Po załadowaniu obrazu
          Elements.imagePreview.onload = function() {
            // Pokaż kontrolki i instrukcje
            Elements.controls.style.display = "block";
            Elements.dragInstruction.style.display = "block";
            
            // Ustaw flagę, że obraz użytkownika jest załadowany
            userImageLoaded = true;
            
            // Wyemituj zdarzenie informujące o załadowaniu obrazu
            const event = new CustomEvent("userImageLoaded");
            document.dispatchEvent(event);
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
  
  /**
   * Reaguje na rozpoczęcie przeciągania pliku nad obszarem drop
   */
  function highlight() {
    Elements.dropArea.classList.add("highlight");
    Elements.uploadText.style.display = "none";
    Elements.dropText.style.display = "block";
  }
  
  /**
   * Reaguje na opuszczenie obszaru drop lub upuszczenie pliku
   */
  function unhighlight() {
    Elements.dropArea.classList.remove("highlight");
    Elements.uploadText.style.display = "block";
    Elements.dropText.style.display = "none";
  }
  
  /**
   * Inicjalizuje moduł i binduje zdarzenia
   */
  function init() {
    // Obsługa uploadu pliku przez kliknięcie
    Elements.uploadInput.addEventListener("change", handleFileSelect);
    
    // Obsługa przeciągnij i upuść
    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
      Elements.dropArea.addEventListener(eventName, preventDefault);
    });
    
    ["dragenter", "dragover"].forEach(eventName => {
      Elements.dropArea.addEventListener(eventName, highlight);
    });
    
    ["dragleave", "drop"].forEach(eventName => {
      Elements.dropArea.addEventListener(eventName, unhighlight);
    });
    
    Elements.dropArea.addEventListener("drop", handleDrop);
  }
  
  /**
   * Zapobiega domyślnemu zachowaniu przeglądarki
   * @param {Event} e - Zdarzenie
   */
  function preventDefault(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  // Zwróć publiczny interfejs modułu
  return {
    init,
    isImageLoaded: function() {
      return userImageLoaded;
    },
    setImageLoaded: function(value) {
      userImageLoaded = value;
    }
  };
})();

// Eksport modułu jako obiekt globalny
window.UserImage = UserImage;
