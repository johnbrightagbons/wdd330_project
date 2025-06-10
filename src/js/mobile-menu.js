// Mobile Menu Toggle Functionality
class MobileMenuManager {
  constructor() {
    this.mobileMenuToggle = document.getElementById("mobileMenuToggle");
    this.navbar = document.querySelector(".navbar");
    this.navButtons = document.querySelectorAll(".nav-btn");
    this.userSection = document.getElementById("userSection");
    this.isMenuOpen = false;

    this.init();
  }

  init() {
    if (this.mobileMenuToggle) {
      this.setupEventListeners();
      this.setupResponsiveHandling();
    }
  }

  setupEventListeners() {
    // Toggle menu on hamburger click
    this.mobileMenuToggle.addEventListener("click", (e) => {
      e.preventDefault();
      this.toggleMobileMenu();
    });

    // Close menu when clicking nav links
    this.navButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (this.isMenuOpen) {
          this.closeMobileMenu();
        }
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (
        this.isMenuOpen &&
        !this.navbar.contains(e.target) &&
        !this.mobileMenuToggle.contains(e.target)
      ) {
        this.closeMobileMenu();
      }
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768 && this.isMenuOpen) {
        this.closeMobileMenu();
      }
    });

    // Handle escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isMenuOpen) {
        this.closeMobileMenu();
      }
    });
  }

  toggleMobileMenu() {
    if (this.isMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  openMobileMenu() {
    this.navbar.classList.add("mobile-menu-open");
    this.mobileMenuToggle.classList.add("active");
    document.body.classList.add("menu-open");
    this.isMenuOpen = true;

    // Animate hamburger lines
    this.animateHamburger(true);
  }

  closeMobileMenu() {
    this.navbar.classList.remove("mobile-menu-open");
    this.mobileMenuToggle.classList.remove("active");
    document.body.classList.remove("menu-open");
    this.isMenuOpen = false;

    // Animate hamburger lines back
    this.animateHamburger(false);
  }

  animateHamburger(isOpen) {
    const lines = this.mobileMenuToggle.querySelectorAll(".hamburger-line");

    if (isOpen) {
      lines[0].style.transform = "rotate(45deg) translate(5px, 5px)";
      lines[1].style.opacity = "0";
      lines[2].style.transform = "rotate(-45deg) translate(7px, -6px)";
    } else {
      lines[0].style.transform = "none";
      lines[1].style.opacity = "1";
      lines[2].style.transform = "none";
    }
  }

  setupResponsiveHandling() {
    // Ensure menu is closed on larger screens
    const mediaQuery = window.matchMedia("(min-width: 769px)");
    mediaQuery.addListener((e) => {
      if (e.matches && this.isMenuOpen) {
        this.closeMobileMenu();
      }
    });
  }
}

// Initialize mobile menu when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new MobileMenuManager();
});

// Export for use in other modules
export { MobileMenuManager };
