/**
 * auth.js - Script for access verification
 * Include this script on all protected pages
 */

// Register initialization function with Loader if available
if (window.Loader) {
  window.Loader.registerInitFunction(initAuthModule);
} else {
  // Fallback when Loader is not available
  document.addEventListener("DOMContentLoaded", function () {
    // Check if Loader is available after a short delay
    setTimeout(function () {
      if (window.Loader) {
        window.Loader.registerInitFunction(initAuthModule);
      } else {
        // Direct initialization
        initAuthModule();
      }
    }, 100);
  });
}

/**
 * Initialize auth module
 */
function initAuthModule() {
  // Debug logging if available
  if (window.Debug) {
    Debug.info("AUTH", "Initializing authorization module");
  }

  // Check if user has access
  checkAuth();

  /**
   * Check authorization status
   */
  function checkAuth() {
    const hasAccess = sessionStorage.getItem("hasAccess") === "true";

    if (window.Debug) {
      Debug.debug(
        "AUTH",
        `Authorization check: ${hasAccess ? "Authorized" : "Unauthorized"}`
      );
    }

    // If no access, redirect to password page
    if (!hasAccess) {
      if (window.Debug) {
        Debug.debug("AUTH", "No authorization, redirecting to password.html");
      }
      window.location.href = "password.html";
    }
  }
}
