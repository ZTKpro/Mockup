/**
 * loader.js - Plik odpowiedzialny za ładowanie wszystkich modułów
 * Umieść ten skrypt przed innymi skryptami w index.html
 */

// Lista modułów do załadowania
const modules = [
  "modules/debug.js",
  "modules/config.js",
  "modules/elements.js",
  "modules/storage.js",
  "modules/transformations.js",
  "modules/userImage.js",
  "modules/mockups.js",
  "modules/export.js",
  "modules/ui.js",
  "modules/calibration.js",
  "index.js",
];

// Flaga debugowania
let loaderDebug = false;

// Sprawdź, czy tryb debugowania jest włączony
function checkDebugMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const debugParam = urlParams.get("debug") === "true";
  const localStorageDebug = localStorage.getItem("debug") === "true";

  loaderDebug = debugParam || localStorageDebug;

  if (loaderDebug) {
    console.log(
      "%c[LOADER] Tryb debugowania jest włączony",
      "color: green; font-weight: bold"
    );
  }

  return loaderDebug;
}

// Inicjalizuj tryb debugowania
checkDebugMode();

// Funkcja do ładowania skryptów po kolei
function loadScriptsSequentially(scripts, index) {
  if (index >= scripts.length) {
    if (loaderDebug || (window.Debug && window.Debug.isEnabled())) {
      console.log(
        "%c[LOADER] Wszystkie moduły zostały załadowane",
        "color: green; font-weight: bold"
      );
    } else {
      console.log("Wszystkie moduły zostały załadowane");
    }
    return;
  }

  const script = document.createElement("script");
  script.src = "js/" + scripts[index];

  script.onload = function () {
    if (loaderDebug || (window.Debug && window.Debug.isEnabled())) {
      console.log(
        `%c[LOADER] Załadowano moduł: ${scripts[index]}`,
        "color: lightblue"
      );
    } else {
      console.log(`Załadowano moduł: ${scripts[index]}`);
    }

    // Po załadowaniu modułu debug, możemy go używać
    if (scripts[index] === "modules/debug.js" && window.Debug) {
      window.Debug.info("LOADER", "Moduł Debug został załadowany");
      // Jeśli tryb debug był już sprawdzony w URL lub localStorage, inicjalizujemy Debug
      if (loaderDebug) {
        window.Debug.init(true);
      }
    }

    loadScriptsSequentially(scripts, index + 1);
  };

  script.onerror = function () {
    if (loaderDebug || (window.Debug && window.Debug.isEnabled())) {
      console.error(
        `%c[LOADER] Błąd ładowania modułu: ${scripts[index]}`,
        "color: red"
      );
    } else {
      console.error(`Błąd ładowania modułu: ${scripts[index]}`);
    }
    loadScriptsSequentially(scripts, index + 1);
  };

  document.head.appendChild(script);
}

// Rozpocznij ładowanie modułów
loadScriptsSequentially(modules, 0);
