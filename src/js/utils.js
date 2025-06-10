// Utility functions for the Budget Blu application

export class MessageHandler {
  static showMessage(elementId, message, type = "info") {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`Message area with id '${elementId}' not found`);
      return;
    }

    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = "block";
  }

  static hideMessage(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = "none";
      element.textContent = "";
      element.className = "message";
    }
  }
}

export class Validator {
  static validateRequired(value) {
    return value && value.toString().trim().length > 0;
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password) {
    return password && password.length >= 6;
  }
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
