/**
 * loader.js - Plik odpowiedzialny za ładowanie wszystkich modułów
 * Umieść ten skrypt przed innymi skryptami w index.html
 */

// Flaga debugowania - sprawdź parametr URL lub localStorage
const isDebug =
  window.location.search.includes("debug=true") ||
  localStorage.getItem("debug") === "true";

// Lista modułów do załadowania - debug.js jako pierwszy
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

// Funkcja do ładowania skryptów po kolei
function loadScriptsSequentially(scripts, index) {
  if (index >= scripts.length) {
    if (isDebug) {
      console.log(
        "%c[LOADER] Wszystkie moduły zostały załadowane",
        "color: green; font-weight: bold"
      );
    }
    return;
  }

  const script = document.createElement("script");
  script.src = "js/" + scripts[index];

  // Dodaj timestamp do URL, aby uniknąć cache podczas debugowania
  if (isDebug) {
    script.src += "?t=" + new Date().getTime();
  }

  script.onload = function () {
    if (isDebug) {
      console.log(
        `%c[LOADER] Załadowano moduł: ${scripts[index]}`,
        "color: blue"
      );
    }
    loadScriptsSequentially(scripts, index + 1);
  };

  script.onerror = function () {
    if (isDebug) {
      console.error(
        `%c[LOADER] Błąd ładowania modułu: ${scripts[index]}`,
        "color: red"
      );
    }
    loadScriptsSequentially(scripts, index + 1);
  };

  document.head.appendChild(script);
}

// Rozpocznij ładowanie modułów
if (isDebug) {
  console.log(
    "%c[LOADER] Rozpoczęcie ładowania modułów w trybie debug",
    "color: green; font-weight: bold"
  );
}
loadScriptsSequentially(modules, 0);
