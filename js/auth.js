/**
 * auth.js - Skrypt do weryfikacji dostępu
 * Umieść ten skrypt na wszystkich chronionych stronach
 */

document.addEventListener("DOMContentLoaded", function () {
  // Logowanie debugowania, jeśli moduł Debug jest dostępny
  if (window.Debug) {
    Debug.info("AUTH", "Inicjalizacja modułu autoryzacji");
  }

  // Sprawdź, czy użytkownik ma dostęp
  function checkAuth() {
    const hasAccess = sessionStorage.getItem("hasAccess") === "true";

    if (window.Debug) {
      Debug.debug(
        "AUTH",
        `Sprawdzanie autoryzacji: ${
          hasAccess ? "Autoryzowany" : "Nieautoryzowany"
        }`
      );
    }

    // Jeśli nie ma dostępu, przekieruj do strony z hasłem
    if (!hasAccess) {
      if (window.Debug) {
        Debug.debug(
          "AUTH",
          "Brak autoryzacji, przekierowanie do password.html"
        );
      }
      window.location.href = "password.html";
    }
  }

  // Sprawdź autoryzację przy ładowaniu strony
  checkAuth();
});
