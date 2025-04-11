/**
 * loader.js - Plik odpowiedzialny za ładowanie wszystkich modułów
 * Umieść ten skrypt przed innymi skryptami w index.html
 */

// Lista modułów do załadowania
const modules = [
  'modules/config.js',
  'modules/elements.js',
  'modules/storage.js',
  'modules/transformations.js', 
  'modules/userImage.js',
  'modules/mockups.js',
  'modules/export.js',
  'modules/ui.js',
  'modules/calibration.js',
  'index.js'
];

// Funkcja do ładowania skryptów po kolei
function loadScriptsSequentially(scripts, index) {
  if (index >= scripts.length) {
    console.log('Wszystkie moduły zostały załadowane');
    return;
  }
  
  const script = document.createElement('script');
  script.src = 'js/' + scripts[index];
  script.onload = function() {
    console.log(`Załadowano moduł: ${scripts[index]}`);
    loadScriptsSequentially(scripts, index + 1);
  };
  script.onerror = function() {
    console.error(`Błąd ładowania modułu: ${scripts[index]}`);
    loadScriptsSequentially(scripts, index + 1);
  };
  
  document.head.appendChild(script);
}

// Rozpocznij ładowanie modułów
loadScriptsSequentially(modules, 0);
