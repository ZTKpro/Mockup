/**
 * password.js - Script for login page authentication
 */

// Register initialization function with Loader if available
if (window.Loader) {
  window.Loader.registerInitFunction(initPasswordModule);
} else {
  // Fallback when Loader is not available
  document.addEventListener("DOMContentLoaded", function () {
    // Check if Loader is available after a short delay
    setTimeout(function () {
      if (window.Loader) {
        window.Loader.registerInitFunction(initPasswordModule);
      } else {
        // Direct initialization
        initPasswordModule();
      }
    }, 100);
  });
}

/**
 * Initialize password module
 */
function initPasswordModule() {
  // Debug logging if available
  if (window.Debug) {
    Debug.info("PASSWORD", "Initializing login module");
  }

  // DOM elements
  const passwordForm = document.getElementById("password-form");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("error-message");
  const formContainer = document.getElementById("password-form-container");

  if (!passwordForm || !passwordInput || !errorMessage || !formContainer) {
    console.error("Required password form elements not found");
    return;
  }

  // Access password (you can change this to your own)
  const correctPassword = "halo@jpe.pl";

  // Check if user already has valid access
  checkAccess();

  // Password form submission handler
  passwordForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const password = passwordInput.value;

    if (window.Debug) {
      Debug.debug("PASSWORD", "Login attempt");
    }

    // Hide previous error message
    errorMessage.style.display = "none";

    // Check password
    if (password === correctPassword) {
      // Set access flag
      sessionStorage.setItem("hasAccess", "true");

      if (window.Debug) {
        Debug.info("PASSWORD", "Correct password, access granted");
      }

      // Redirect to application
      window.location.href = "index.html";
    } else {
      // Show error message
      errorMessage.style.display = "block";

      if (window.Debug) {
        Debug.warn("PASSWORD", "Incorrect password");
      }

      // Add form shake effect
      formContainer.classList.add("shake");
      setTimeout(() => {
        formContainer.classList.remove("shake");
      }, 500);

      // Clear password field
      passwordInput.value = "";
      passwordInput.focus();
    }
  });

  /**
   * Check if user has access
   */
  function checkAccess() {
    const hasAccess = sessionStorage.getItem("hasAccess") === "true";

    if (window.Debug) {
      Debug.debug(
        "PASSWORD",
        `Checking access: ${hasAccess ? "Authorized" : "Unauthorized"}`
      );
    }

    if (hasAccess) {
      // Redirect to application
      if (window.Debug) {
        Debug.debug("PASSWORD", "User has access, redirecting to index.html");
      }
      window.location.href = "index.html";
    }
  }
}
