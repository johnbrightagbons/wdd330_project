export class NotificationModule {
  constructor() {
    this.container = null;
    this.notifications = [];
    this.maxNotifications = 5;
    this.defaultDuration = 5000; // 5 seconds
    this.budgetLimits = {};
    this.init();
  }

  // Initialize notification system
  init() {
    this.createNotificationContainer();
    this.loadBudgetLimits();
    this.setupStyles();
  }

  // Create notification container
  createNotificationContainer() {
    this.container = document.createElement("div");
    this.container.id = "notification-container";
    this.container.className = "notification-container";
    document.body.appendChild(this.container);
  }

  // Setup notification styles
  setupStyles() {
    if (document.getElementById("notification-styles")) return;

    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
      .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
      }

      .notification {
        background: white;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-left: 4px solid #007bff;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        animation: slideIn 0.3s ease-out;
        transition: all 0.3s ease;
        cursor: pointer;
      }

      .notification:hover {
        transform: translateX(-5px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }

      .notification.success {
        border-left-color: #28a745;
      }

      .notification.error {
        border-left-color: #dc3545;
      }

      .notification.warning {
        border-left-color: #ffc107;
      }

      .notification.info {
        border-left-color: #17a2b8;
      }

      .notification-icon {
        font-size: 20px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .notification.success .notification-icon {
        color: #28a745;
      }

      .notification.error .notification-icon {
        color: #dc3545;
      }

      .notification.warning .notification-icon {
        color: #ffc107;
      }

      .notification.info .notification-icon {
        color: #17a2b8;
      }

      .notification-content {
        flex: 1;
      }

      .notification-title {
        font-weight: 600;
        margin-bottom: 4px;
        color: #333;
      }

      .notification-message {
        color: #666;
        font-size: 14px;
        line-height: 1.4;
      }

      .notification-close {
        background: none;
        border: none;
        font-size: 18px;
        color: #999;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
      }

      .notification-close:hover {
        background-color: #f8f9fa;
        color: #666;
      }

      .notification.removing {
        animation: slideOut 0.3s ease-in forwards;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      .progress-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background-color: rgba(0, 0, 0, 0.1);
        border-radius: 0 0 8px 8px;
        animation: progress linear;
      }

      @keyframes progress {
        from { width: 100%; }
        to { width: 0%; }
      }

      @media (max-width: 768px) {
        .notification-container {
          top: 10px;
          right: 10px;
          left: 10px;
          max-width: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Show notification
  show(message, type = "info", options = {}) {
    const notification = this.createNotification(message, type, options);
    this.addNotification(notification);
    return notification.id;
  }

  // Create notification element
  createNotification(message, type, options) {
    const id = Date.now() + Math.random();
    const {
      title = "",
      duration = this.defaultDuration,
      persistent = false,
      actions = [],
    } = options;

    const notificationEl = document.createElement("div");
    notificationEl.className = `notification ${type}`;
    notificationEl.dataset.id = id;

    const icon = this.getIcon(type);

    notificationEl.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-content">
        ${title ? `<div class="notification-title">${title}</div>` : ""}
        <div class="notification-message">${message}</div>
        ${actions.length > 0 ? this.createActionButtons(actions) : ""}
      </div>
      <button class="notification-close" aria-label="Close notification">×</button>
      ${!persistent && duration > 0 ? `<div class="progress-bar" style="animation-duration: ${duration}ms;"></div>` : ""}
    `;

    // Add event listeners
    const closeBtn = notificationEl.querySelector(".notification-close");
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.remove(id);
    });

    // Auto-remove after duration
    if (!persistent && duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }

    // Click to dismiss
    notificationEl.addEventListener("click", () => {
      if (!persistent) this.remove(id);
    });

    return {
      id,
      element: notificationEl,
      type,
      message,
      options,
    };
  }

  // Add notification to container
  addNotification(notification) {
    // Remove oldest if at max capacity
    if (this.notifications.length >= this.maxNotifications) {
      const oldest = this.notifications.shift();
      this.remove(oldest.id);
    }

    this.notifications.push(notification);
    this.container.appendChild(notification.element);
  }

  // Remove notification
  remove(id) {
    const notification = this.notifications.find((n) => n.id === id);
    if (!notification) return;

    notification.element.classList.add("removing");

    setTimeout(() => {
      if (notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element);
      }
      this.notifications = this.notifications.filter((n) => n.id !== id);
    }, 300);
  }

  // Get icon for notification type
  getIcon(type) {
    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
    };
    return icons[type] || icons.info;
  }

  // Create action buttons
  createActionButtons(actions) {
    return `
      <div class="notification-actions" style="margin-top: 8px; display: flex; gap: 8px;">
        ${actions
          .map(
            (action) => `
          <button class="notification-action-btn" 
                  style="padding: 4px 8px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; font-size: 12px;"
                  onclick="${action.handler}">
            ${action.label}
          </button>
        `
          )
          .join("")}
      </div>
    `;
  }

  // Convenience methods
  showSuccess(message, options = {}) {
    return this.show(message, "success", options);
  }

  showError(message, options = {}) {
    return this.show(message, "error", { ...options, persistent: true });
  }

  showWarning(message, options = {}) {
    return this.show(message, "warning", options);
  }

  showInfo(message, options = {}) {
    return this.show(message, "info", options);
  }

  // Budget limit notifications
  setBudgetLimit(category, limit) {
    this.budgetLimits[category] = limit;
    this.saveBudgetLimits();
  }

  checkBudgetLimit(category, currentSpent) {
    const limit = this.budgetLimits[category];
    if (!limit) return;

    const percentage = (currentSpent / limit) * 100;

    if (percentage >= 100) {
      this.showError(`Budget exceeded for ${category}!`, {
        title: "Budget Alert",
        persistent: true,
        actions: [
          {
            label: "View Budget",
            handler: 'window.location.href="/budget.html"',
          },
        ],
      });
    } else if (percentage >= 80) {
      this.showWarning(
        `You've spent ${percentage.toFixed(0)}% of your ${category} budget`,
        {
          title: "Budget Warning",
        }
      );
    } else if (percentage >= 50) {
      this.showInfo(
        `You've spent ${percentage.toFixed(0)}% of your ${category} budget`,
        {
          title: "Budget Update",
        }
      );
    }
  }

  // Transaction confirmations
  confirmTransaction(type, amount, category) {
    const message = `${type === "income" ? "Income" : "Expense"} of $${amount.toFixed(2)} added to ${category}`;
    this.showSuccess(message, {
      title: "Transaction Added",
    });

    // Check budget if it's an expense
    if (type === "expense") {
      this.checkBudgetLimit(category, amount);
    }
  }

  // Confirmation dialogs
  confirm(message, options = {}) {
    return new Promise((resolve) => {
      const id = this.show(message, "info", {
        title: options.title || "Confirm Action",
        persistent: true,
        actions: [
          {
            label: "Cancel",
            handler: `window.notificationModule.handleConfirm(${id}, false)`,
          },
          {
            label: options.confirmText || "Confirm",
            handler: `window.notificationModule.handleConfirm(${id}, true)`,
          },
        ],
      });

      // Store resolver for this confirmation
      this.confirmResolvers = this.confirmResolvers || {};
      this.confirmResolvers[id] = resolve;
    });
  }

  // Handle confirmation response
  handleConfirm(id, result) {
    if (this.confirmResolvers && this.confirmResolvers[id]) {
      this.confirmResolvers[id](result);
      delete this.confirmResolvers[id];
    }
    this.remove(id);
  }

  // Load budget limits from storage
  loadBudgetLimits() {
    const stored = localStorage.getItem("budgetLimits");
    this.budgetLimits = stored ? JSON.parse(stored) : {};
  }

  // Save budget limits to storage
  saveBudgetLimits() {
    localStorage.setItem("budgetLimits", JSON.stringify(this.budgetLimits));
  }

  // Clear all notifications
  clearAll() {
    this.notifications.forEach((notification) => {
      this.remove(notification.id);
    });
  }

  // Get notification count
  getCount() {
    return this.notifications.length;
  }
}

// Create global instance
window.notificationModule = new NotificationModule();

// Export for module usage
export default NotificationModule;
