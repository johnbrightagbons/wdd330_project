// Dashboard functionality
import { AuthManager } from "./auth.js";
import { ReportModule } from "./reports.js";

// Dashboard initialization
const reportModule = new ReportModule();
document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard();
  setupMobileMenu(); //
});

function initializeDashboard() {
  const currentUser = AuthManager.getCurrentUser();

  if (currentUser) {
    updateUserInterface(currentUser);
    initializeReports();
  }

  setupEventListeners();
}

function updateUserInterface(user) {
  const userNameElement = document.getElementById("userName");
  const userSection = document.getElementById("userSection");
  const loginLink = document.getElementById("loginLink");
  const signupLink = document.getElementById("signupLink");

  if (userNameElement) {
    userNameElement.textContent = `Welcome, ${user.fullName}!`;
  }

  if (userSection) {
    userSection.style.display = "block";
  }

  if (loginLink) {
    loginLink.style.display = "none";
  }

  if (signupLink) {
    signupLink.style.display = "none";
  }
}

function initializeReports() {
  if (typeof ReportManager !== "undefined") {
    window.reportManager = new ReportManager();
    window.reportManager.initializeReports();
  }
}

function setupEventListeners() {
  const addTransactionBtn = document.getElementById("addTransactionBtn");
  if (addTransactionBtn) {
    addTransactionBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Add transaction clicked");
    });
  }

  const refreshReportsBtn = document.getElementById("refreshReportsBtn");
  if (refreshReportsBtn) {
    refreshReportsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.reportManager) {
        window.reportManager.refreshReports();
      }
    });
  }
}

// Simplified mobile menu setup
function setupMobileMenu() {
  console.log("Setting up mobile menu..."); // Debug log

  const toggle = document.getElementById("mobileMenuToggle");
  const navbar = document.querySelector(".navbar");

  console.log("Toggle element:", toggle); // Debug log
  console.log("Navbar element:", navbar); // Debug log

  if (!toggle) {
    console.error(
      "Mobile menu toggle button not found! Looking for element with ID 'mobileMenuToggle'"
    );
    return;
  }

  if (!navbar) {
    console.error("Navbar not found! Looking for element with class 'navbar'");
    return;
  }

  toggle.addEventListener("click", function (e) {
    e.preventDefault();
    console.log("Mobile menu toggle clicked!"); // Debug log

    // Toggle classes
    toggle.classList.toggle("active");
    navbar.classList.toggle("mobile-menu-open");
    document.body.classList.toggle("menu-open");

    console.log("Toggle classes:", toggle.classList.toString()); // Debug log
    console.log("Navbar classes:", navbar.classList.toString()); // Debug log
  });

  // Close menu when clicking nav links
  const navLinks = navbar.querySelectorAll("a, button");
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      toggle.classList.remove("active");
      navbar.classList.remove("mobile-menu-open");
      document.body.classList.remove("menu-open");
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!navbar.contains(e.target) && !toggle.contains(e.target)) {
      toggle.classList.remove("active");
      navbar.classList.remove("mobile-menu-open");
      document.body.classList.remove("menu-open");
    }
  });
}

// Make logout function globally available
window.logout = function () {
  AuthManager.logout();
  window.location.reload();
};

// Display Google Map
function initMap() {
  const mapOptions = {
    center: { lat: 40.7128, lng: -74.006 },
    zoom: 12,
  };

  const map = new google.maps.Map(document.getElementById("map"), mapOptions);

  new google.maps.Marker({
    position: mapOptions.center,
    map: map,
    title: "Hello NYC!",
  });
}
