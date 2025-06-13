import { ConfigLoader } from "./config-loader.js";

export class MessageHandler {
  constructor() {
    this.configLoader = new ConfigLoader();
    this.alertConfig = null;
    this.activeAlerts = [];
    this.soundEnabled = false;
    this.init();
  }

  async init() {
    try {
      this.alertConfig = await this.configLoader.loadConfig("alerts.json");
      this.soundEnabled = this.alertConfig.sounds?.enabled || false;
    } catch (error) {
      console.error("Failed to load alert configuration:", error);
      this.setDefaultAlertConfig();
    }
  }

  setDefaultAlertConfig() {
    this.alertConfig = {
      alertTypes: {
        success: {
          icon: "✅",
          color: "#4CAF50",
          duration: 3000,
          backgroundColor: "#E8F5E8",
          borderColor: "#4CAF50",
        },
        error: {
          icon: "❌",
          color: "#F44336",
          duration: 5000,
          backgroundColor: "#FFEBEE",
          borderColor: "#F44336",
        },
        warning: {
          icon: "⚠️",
          color: "#FF9800",
          duration: 4000,
          backgroundColor: "#FFF3E0",
          borderColor: "#FF9800",
        },
        info: {
          icon: "ℹ️",
          color: "#2196F3",
          duration: 3000,
          backgroundColor: "#E3F2FD",
          borderColor: "#2196F3",
        },
      },
      messages: {},
      settings: {
        position: "top-right",
        maxAlerts: 5,
        autoClose: true,
        closeButton: true,
        pauseOnHover: true,
      },
      sounds: {
        enabled: false,
        volume: 0.5,
      },
    };
  }

  static async showMessage(containerId, message, type = "info", options = {}) {
    const instance = new MessageHandler();
    await instance.init();
    return instance.displayMessage(containerId, message, type, options);
  }

  displayMessage(containerId, message, type = "info", options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Message container '${containerId}' not found`);
      return;
    }

    // Get alert configuration
    const alertType =
      this.alertConfig.alertTypes[type] || this.alertConfig.alertTypes.info;
    const settings = this.alertConfig.settings;

    // Create message element
    const messageElement = this.createMessageElement(
      message,
      type,
      alertType,
      options
    );

    // Add to container
    container.appendChild(messageElement);
    this.activeAlerts.push(messageElement);

    // Play sound if enabled
    if (this.soundEnabled) {
      this.playSound(type);
    }

    // Auto-close if enabled
    if (settings.autoClose && alertType.duration) {
      let timeoutId = setTimeout(() => {
        this.removeMessage(messageElement);
      }, alertType.duration);

      // Pause on hover if enabled
      if (settings.pauseOnHover) {
        let remainingTime = alertType.duration;
        let startTime = Date.now();

        messageElement.addEventListener("mouseenter", () => {
          clearTimeout(timeoutId);
          remainingTime -= Date.now() - startTime;
        });

        messageElement.addEventListener("mouseleave", () => {
          startTime = Date.now();
          timeoutId = setTimeout(() => {
            this.removeMessage(messageElement);
          }, remainingTime);
        });
      }
    }

    // Limit number of alerts
    if (this.activeAlerts.length > settings.maxAlerts) {
      const oldestAlert = this.activeAlerts.shift();
      this.removeMessage(oldestAlert);
    }

    return messageElement;
  }

  createMessageElement(message, type, alertType, options) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `alert alert-${type}`;
    messageDiv.style.cssText = `
      background-color: ${alertType.backgroundColor || "#f0f0f0"};
      color: ${alertType.color};
      border: 1px solid ${alertType.borderColor || alertType.color};
      padding: 12px 16px;
      margin: 8px 0;
      border-radius: 8px;
      display: flex;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease-out;
      cursor: pointer;
      transition: transform 0.2s ease;
      max-width: 400px;
      word-wrap: break-word;
    `;

    // Add hover effect
    messageDiv.addEventListener("mouseenter", () => {
      messageDiv.style.transform = "translateY(-2px)";
    });

    messageDiv.addEventListener("mouseleave", () => {
      messageDiv.style.transform = "translateY(0)";
    });

    const icon = document.createElement("span");
    icon.textContent = alertType.icon;
    icon.style.cssText = `
      margin-right: 12px;
      font-size: 16px;
      flex-shrink: 0;
    `;

    const text = document.createElement("span");
    text.textContent = message;
    text.style.cssText = `
      flex: 1;
      font-size: 14px;
      line-height: 1.4;
    `;

    messageDiv.appendChild(icon);
    messageDiv.appendChild(text);

    // Add close button if enabled
    if (this.alertConfig.settings.closeButton) {
      const closeBtn = document.createElement("button");
      closeBtn.innerHTML = "×";
      closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 20px;
        margin-left: 12px;
        cursor: pointer;
        color: ${alertType.color};
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease;
        flex-shrink: 0;
      `;

      closeBtn.addEventListener("mouseenter", () => {
        closeBtn.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
      });

      closeBtn.addEventListener("mouseleave", () => {
        closeBtn.style.backgroundColor = "transparent";
      });

      closeBtn.onclick = (e) => {
        e.stopPropagation();
        this.removeMessage(messageDiv);
      };
      messageDiv.appendChild(closeBtn);
    }

    // Add click to dismiss functionality
    messageDiv.addEventListener("click", () => {
      this.removeMessage(messageDiv);
    });

    return messageDiv;
  }

  removeMessage(messageElement) {
    if (messageElement && messageElement.parentNode) {
      messageElement.style.animation = "slideOut 0.3s ease-in";
      setTimeout(() => {
        if (messageElement.parentNode) {
          messageElement.remove();
        }
        const index = this.activeAlerts.indexOf(messageElement);
        if (index > -1) {
          this.activeAlerts.splice(index, 1);
        }
      }, 300);
    }
  }

  static hideMessage(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      const alerts = container.querySelectorAll(".alert");
      alerts.forEach((alert) => {
        alert.style.animation = "slideOut 0.3s ease-in";
        setTimeout(() => {
          if (alert.parentNode) {
            alert.remove();
          }
        }, 300);
      });
    }
  }

  static clearAllMessages(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = "";
    }
  }

  playSound(type) {
    if (!this.alertConfig.sounds || !this.alertConfig.sounds.enabled) {
      return;
    }

    const soundFile = this.alertConfig.sounds[type];
    if (soundFile) {
      try {
        const audio = new Audio(soundFile);
        audio.volume = this.alertConfig.sounds.volume || 0.5;
        audio.play().catch((error) => {
          console.warn("Could not play notification sound:", error);
        });
      } catch (error) {
        console.warn("Error creating audio element:", error);
      }
    }
  }

  // Predefined message methods using alerts.json messages
  static async showLoginSuccess() {
    const instance = new MessageHandler();
    await instance.init();
    const message =
      instance.alertConfig.messages?.login?.success ||
      "✅ Login successful! Redirecting to dashboard...";
    return MessageHandler.showMessage("messageArea", message, "success");
  }

  static async showLoginError() {
    const instance = new MessageHandler();
    await instance.init();
    const message =
      instance.alertConfig.messages?.login?.error ||
      "❌ Invalid credentials. Please try again.";
    return MessageHandler.showMessage("messageArea", message, "error");
  }

  static async showTransactionAdded() {
    const instance = new MessageHandler();
    await instance.init();
    const message =
      instance.alertConfig.messages?.transaction?.added ||
      "✅ Transaction added successfully!";
    return MessageHandler.showMessage("messageArea", message, "success");
  }

  static async showBudgetWarning(category) {
    const instance = new MessageHandler();
    await instance.init();
    let message =
      instance.alertConfig.messages?.budget?.warning ||
      "⚠️ You've spent 80% of your {category} budget.";
    message = message.replace("{category}", category);
    return MessageHandler.showMessage("messageArea", message, "warning");
  }

  static async showBudgetExceeded(category) {
    const instance = new MessageHandler();
    await instance.init();
    let message =
      instance.alertConfig.messages?.budget?.exceeded ||
      "⚠️ Budget exceeded for {category}!";
    message = message.replace("{category}", category);
    return MessageHandler.showMessage("messageArea", message, "error");
  }

  static async showExportSuccess() {
    const instance = new MessageHandler();
    await instance.init();
    const message =
      instance.alertConfig.messages?.export?.success ||
      "✅ Data exported successfully!";
    return MessageHandler.showMessage("messageArea", message, "success");
  }

  static async showSyncInProgress() {
    const instance = new MessageHandler();
    await instance.init();
    const message =
      instance.alertConfig.messages?.sync?.inProgress ||
      "🔄 Synchronizing data...";
    return MessageHandler.showMessage("messageArea", message, "info");
  }

  // Utility methods
  setPosition(position) {
    if (this.alertConfig) {
      this.alertConfig.settings.position = position;
    }
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    if (this.alertConfig) {
      this.alertConfig.sounds.enabled = enabled;
    }
  }

  setMaxAlerts(max) {
    if (this.alertConfig) {
      this.alertConfig.settings.maxAlerts = max;
    }
  }

  getActiveAlertsCount() {
    return this.activeAlerts.length;
  }

  clearAllActiveAlerts() {
    this.activeAlerts.forEach((alert) => {
      this.removeMessage(alert);
    });
    this.activeAlerts = [];
  }

  // Toast notification method for floating alerts
  static async showToast(message, type = "info", duration = 3000) {
    const instance = new MessageHandler();
    await instance.init();

    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
      `;
      document.body.appendChild(toastContainer);
    }

    const alertType =
      instance.alertConfig.alertTypes[type] ||
      instance.alertConfig.alertTypes.info;
    const toastElement = instance.createMessageElement(
      message,
      type,
      alertType,
      {}
    );

    toastElement.style.cssText += `
      pointer-events: auto;
      margin-bottom: 10px;
      animation: slideInRight 0.3s ease-out;
    `;

    toastContainer.appendChild(toastElement);

    // Auto remove after duration
    setTimeout(() => {
      instance.removeMessage(toastElement);
    }, duration);

    return toastElement;
  }
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }
`;

document.head.appendChild(style);
