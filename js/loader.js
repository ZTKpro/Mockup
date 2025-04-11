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

// Monitorowanie statusu ładowania modułów
const loadedModules = {};
let allModulesLoaded = false;

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
    allModulesLoaded = true;

    if (loaderDebug || (window.Debug && window.Debug.isEnabled())) {
      console.log(
        "%c[LOADER] Wszystkie moduły zostały załadowane",
        "color: green; font-weight: bold"
      );
    } else {
      console.log("Wszystkie moduły zostały załadowane");
    }

    // Wywołaj zdarzenie, gdy wszystkie moduły zostaną załadowane
    const event = new CustomEvent("allModulesLoaded");
    document.dispatchEvent(event);

    return;
  }

  const script = document.createElement("script");
  script.src = "js/" + scripts[index];

  script.onload = function () {
    // Oznacz moduł jako załadowany
    loadedModules[scripts[index]] = true;

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
    // Oznacz moduł jako błędny
    loadedModules[scripts[index]] = false;

    if (loaderDebug || (window.Debug && window.Debug.isEnabled())) {
      console.error(
        `%c[LOADER] Błąd ładowania modułu: ${scripts[index]}`,
        "color: red"
      );
    } else {
      console.error(`Błąd ładowania modułu: ${scripts[index]}`);
    }

    // Kontynuuj ładowanie pozostałych modułów
    loadScriptsSequentially(scripts, index + 1);
  };

  document.head.appendChild(script);
}

// Funkcja sprawdzająca, czy konkretny moduł został załadowany
function isModuleLoaded(moduleName) {
  return !!loadedModules[moduleName];
}

// Funkcja czekająca na załadowanie wskazanego modułu
function waitForModule(moduleName) {
  return new Promise((resolve) => {
    if (isModuleLoaded(moduleName)) {
      resolve();
      return;
    }

    // Sprawdź co 100ms, czy moduł został załadowany
    const interval = setInterval(() => {
      if (isModuleLoaded(moduleName)) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}

// Funkcja czekająca na załadowanie wszystkich modułów
function waitForAllModules() {
  return new Promise((resolve) => {
    if (allModulesLoaded) {
      resolve();
      return;
    }

    // Nasłuchuj zdarzenia zakończenia ładowania wszystkich modułów
    document.addEventListener(
      "allModulesLoaded",
      function onAllModulesLoaded() {
        document.removeEventListener("allModulesLoaded", onAllModulesLoaded);
        resolve();
      }
    );
  });
}

// Rozpocznij ładowanie modułów
loadScriptsSequentially(modules, 0);

// Eksportuj pomocnicze funkcje jako obiekty globalne
window.Loader = {
  isModuleLoaded,
  waitForModule,
  waitForAllModules,
  getLoadedModules: function () {
    return { ...loadedModules };
  },
};
