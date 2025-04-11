document.addEventListener("DOMContentLoaded", function () {
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
    if (hasAccess) {
      // Przekieruj do aplikacji
      window.location.href = "index.html";
    }
  }

  // Sprawdź status dostępu przy ładowaniu strony
  checkAccess();

  // Obsługa formularza hasła
  passwordForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const password = passwordInput.value;

    // Ukryj poprzedni komunikat o błędzie
    errorMessage.style.display = "none";

    // Sprawdź hasło
    if (password === correctPassword) {
      // Ustaw flagę dostępu
      sessionStorage.setItem("hasAccess", "true");

      // Przekieruj do aplikacji
      window.location.href = "index.html";
    } else {
      // Pokaż komunikat o błędzie
      errorMessage.style.display = "block";

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
