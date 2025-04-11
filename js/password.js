document.addEventListener("DOMContentLoaded", function () {
  // Logowanie debugowania, jeśli moduł Debug jest dostępny
  if (window.Debug) {
    Debug.info("PASSWORD", "Inicjalizacja modułu logowania");
  }

  // Elementy DOM
  const passwordForm = document.getElementById("password-form");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("error-message");
  const formContainer = document.getElementById("password-form-container");

  // Hasło dostępu (możesz zmienić na własne)
  const correctPassword = "halo@jpe.pl";

  // Sprawdź, czy użytkownik ma już ważny dostęp
  function checkAccess() {
    const hasAccess = sessionStorage.getItem("hasAccess") === "true";

    if (window.Debug) {
      Debug.debug(
        "PASSWORD",
        `Sprawdzanie dostępu: ${hasAccess ? "Autoryzowany" : "Nieautoryzowany"}`
      );
    }

    if (hasAccess) {
      // Przekieruj do aplikacji
      if (window.Debug) {
        Debug.debug(
          "PASSWORD",
          "Użytkownik ma dostęp, przekierowanie do index.html"
        );
      }
      window.location.href = "index.html";
    }
  }

  // Sprawdź status dostępu przy ładowaniu strony
  checkAccess();

  // Obsługa formularza hasła
  passwordForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const password = passwordInput.value;

    if (window.Debug) {
      Debug.debug("PASSWORD", "Próba logowania");
    }

    // Ukryj poprzedni komunikat o błędzie
    errorMessage.style.display = "none";

    // Sprawdź hasło
    if (password === correctPassword) {
      // Ustaw flagę dostępu
      sessionStorage.setItem("hasAccess", "true");

      if (window.Debug) {
        Debug.info("PASSWORD", "Poprawne hasło, ustawiono flagę dostępu");
      }

      // Przekieruj do aplikacji
      window.location.href = "index.html";
    } else {
      // Pokaż komunikat o błędzie
      errorMessage.style.display = "block";

      if (window.Debug) {
        Debug.warn("PASSWORD", "Nieprawidłowe hasło");
      }

      // Dodaj efekt potrząsania formularzem
      formContainer.classList.add("shake");
      setTimeout(() => {
        formContainer.classList.remove("shake");
      }, 500);

      // Wyczyść pole hasła
      passwordInput.value = "";
      passwordInput.focus();
    }
  });
});
