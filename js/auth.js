/**
 * auth.js - Skrypt do weryfikacji dostępu
 * Umieść ten skrypt na wszystkich chronionych stronach
 */

document.addEventListener("DOMContentLoaded", function () {
  // Sprawdź, czy użytkownik ma dostęp
  function checkAuth() {
    const hasAccess = sessionStorage.getItem("hasAccess") === "true";

    // Jeśli nie ma dostępu, przekieruj do strony z hasłem
    if (!hasAccess) {
      window.location.href = "password.html";
    }
  }

  // Sprawdź autoryzację przy ładowaniu strony
  checkAuth();
});
