/**
 * debug.js - Moduł do debugowania aplikacji
 */

const Debug = (function () {
  // Flaga określająca, czy debugowanie jest włączone
  let debugEnabled = false;

  // Poziomy logowania
  const LEVELS = {
    INFO: { name: "INFO", color: "blue" },
    WARN: { name: "WARN", color: "orange" },
    ERROR: { name: "ERROR", color: "red" },
    DEBUG: { name: "DEBUG", color: "green" },
  };

  /**
   * Inicjalizuje moduł debugowania
   * @param {boolean} enabled - Czy debugowanie ma być włączone
   */
  function init(enabled = false) {
    debugEnabled = enabled;

    if (debugEnabled) {
      console.log(
        "%c[DEBUG] Tryb debugowania został włączony",
        "color: green; font-weight: bold"
      );
    }
  }

  /**
   * Sprawdza, czy na stronie jest ustawiony parametr debug=true
   * @returns {boolean} - Czy debugowanie jest włączone w URL
   */
  function checkUrlDebugFlag() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("debug") === "true";
  }

  /**
   * Sprawdza, czy w localStorage jest włączone debugowanie
   * @returns {boolean} - Czy debugowanie jest włączone w localStorage
   */
  function checkLocalStorageDebugFlag() {
    return localStorage.getItem("debug") === "true";
  }

  /**
   * Loguje wiadomość na określonym poziomie
   * @param {string} level - Poziom logowania
   * @param {string} module - Nazwa modułu
   * @param {string} message - Treść wiadomości
   * @param {any} data - Dodatkowe dane do wyświetlenia
   */
  function log(level, module, message, data = null) {
    if (!debugEnabled) return;

    const timestamp = new Date().toISOString().split("T")[1].slice(0, -1);
    const levelInfo = LEVELS[level] || LEVELS.INFO;

    const logMessage = `[${timestamp}] [${levelInfo.name}] [${module}] ${message}`;

    console.log(`%c${logMessage}`, `color: ${levelInfo.color}`);

    if (data !== null) {
      console.log(data);
    }
  }

  /**
   * Loguje wiadomość informacyjną
   * @param {string} module - Nazwa modułu
   * @param {string} message - Treść wiadomości
   * @param {any} data - Dodatkowe dane
   */
  function info(module, message, data = null) {
    log("INFO", module, message, data);
  }

  /**
   * Loguje ostrzeżenie
   * @param {string} module - Nazwa modułu
   * @param {string} message - Treść wiadomości
   * @param {any} data - Dodatkowe dane
   */
  function warn(module, message, data = null) {
    log("WARN", module, message, data);
  }

  /**
   * Loguje błąd
   * @param {string} module - Nazwa modułu
   * @param {string} message - Treść wiadomości
   * @param {any} data - Dodatkowe dane
   */
  function error(module, message, data = null) {
    log("ERROR", module, message, data);
  }

  /**
   * Loguje wiadomość debugowania
   * @param {string} module - Nazwa modułu
   * @param {string} message - Treść wiadomości
   * @param {any} data - Dodatkowe dane
   */
  function debug(module, message, data = null) {
    log("DEBUG", module, message, data);
  }

  /**
   * Mierzy czas wykonania funkcji
   * @param {string} module - Nazwa modułu
   * @param {string} functionName - Nazwa funkcji
   * @param {Function} fn - Funkcja do wywołania
   * @param {Array} args - Argumenty funkcji
   * @returns {any} - Wynik wywołania funkcji
   */
  function time(module, functionName, fn, ...args) {
    if (!debugEnabled) return fn(...args);

    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();

    log(
      "DEBUG",
      module,
      `${functionName} - czas wykonania: ${(end - start).toFixed(2)}ms`
    );

    return result;
  }

  /**
   * Mierzy czas wykonania funkcji asynchronicznej
   * @param {string} module - Nazwa modułu
   * @param {string} functionName - Nazwa funkcji
   * @param {Function} fn - Funkcja asynchroniczna
   * @param {Array} args - Argumenty funkcji
   * @returns {Promise<any>} - Wynik wywołania funkcji
   */
  async function timeAsync(module, functionName, fn, ...args) {
    if (!debugEnabled) return fn(...args);

    const start = performance.now();
    const result = await fn(...args);
    const end = performance.now();

    log(
      "DEBUG",
      module,
      `${functionName} - czas wykonania: ${(end - start).toFixed(2)}ms`
    );

    return result;
  }

  /**
   * Włącza debugowanie
   */
  function enable() {
    debugEnabled = true;
    localStorage.setItem("debug", "true");
    console.log(
      "%c[DEBUG] Tryb debugowania został włączony",
      "color: green; font-weight: bold"
    );
  }

  /**
   * Wyłącza debugowanie
   */
  function disable() {
    debugEnabled = false;
    localStorage.removeItem("debug");
    console.log(
      "%c[DEBUG] Tryb debugowania został wyłączony",
      "color: red; font-weight: bold"
    );
  }

  /**
   * Sprawdza wszystkie dostępne flagi debugowania i inicjalizuje moduł
   */
  function checkDebugFlags() {
    // Sprawdź flagę w URL
    const urlDebug = checkUrlDebugFlag();

    // Sprawdź flagę w localStorage
    const localStorageDebug = checkLocalStorageDebugFlag();

    // Włącz debugowanie, jeśli którakolwiek flaga jest true
    init(urlDebug || localStorageDebug);

    return debugEnabled;
  }

  // Inicjalizacja przy importowaniu modułu
  checkDebugFlags();

  // Publiczny interfejs modułu
  return {
    init,
    info,
    warn,
    error,
    debug,
    time,
    timeAsync,
    enable,
    disable,
    isEnabled: function () {
      return debugEnabled;
    },
  };
})();

// Eksport modułu jako obiekt globalny
window.Debug = Debug;
