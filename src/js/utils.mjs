// Session management utilities
class SessionManager {
  static getCurrentUser() {
    // Check session storage first
    let sessionData = sessionStorage.getItem("budgetBluSession");

    // If not found, check local storage
    if (!sessionData) {
      sessionData = localStorage.getItem("budgetBluSession");
    }

    if (!sessionData) return null;

    try {
      const session = JSON.parse(sessionData);

      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        this.logout();
        return null;
      }

      return session;
    } catch (error) {
      console.error("Error parsing session data:", error);
      return null;
    }
  }

  static isLoggedIn() {
    return this.getCurrentUser() !== null;
  }

  static requireAuth() {
    if (!this.isLoggedIn()) {
      // Store the current page to redirect back after login
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      window.location.href = "login.html";
      return false;
    }
    return true;
  }

  static logout() {
    // Clear all session data
    sessionStorage.removeItem("budgetBluSession");
    localStorage.removeItem("budgetBluSession");
    sessionStorage.removeItem("currentUser");

    // Redirect to login page
    window.location.href = "login.html";
  }

  static extendSession() {
    const currentSession = this.getCurrentUser();
    if (currentSession) {
      // Extend session by 24 hours
      currentSession.expiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString();

      // Update storage
      if (localStorage.getItem("budgetBluSession")) {
        localStorage.setItem(
          "budgetBluSession",
          JSON.stringify(currentSession)
        );
      } else {
        sessionStorage.setItem(
          "budgetBluSession",
          JSON.stringify(currentSession)
        );
      }
    }
  }

  static getUserData() {
    const currentUser = sessionStorage.getItem("currentUser");
    return currentUser ? JSON.parse(currentUser) : null;
  }
}

// Auto-extend session on user activity
let sessionExtendTimer;
function resetSessionExtendTimer() {
  clearTimeout(sessionExtendTimer);
  sessionExtendTimer = setTimeout(() => {
    if (SessionManager.isLoggedIn()) {
      SessionManager.extendSession();
    }
  }, 30 * 60 * 1000); // Extend after 30 minutes of activity
}

// Listen for user activity
["mousedown", "mousemove", "keypress", "scroll", "touchstart"].forEach(
  (event) => {
    document.addEventListener(event, resetSessionExtendTimer, true);
  }
);
