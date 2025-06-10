// Authentication Module - Handles all authentication-related functionality
class AuthModule {
  constructor() {
    this.saltKey = "budgetblu_salt";
    this.storageKeys = {
      users: "budgetBluUsers",
      session: "budgetBluSession",
      currentUser: "currentUser",
    };
  }

  // User Registration
  async register(userData) {
    try {
      // Validate registration data
      const validation = this.validateRegistrationData(userData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Check if email already exists
      if (this.isEmailTaken(userData.email)) {
        throw new Error("Email is already registered");
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user object
      const newUser = {
        id: this.generateUserId(),
        fullName: userData.fullName,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        purpose: userData.purpose,
        customPurpose: userData.customPurpose || "",
        createdAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true,
      };

      // Save user
      this.saveUser(newUser);

      return {
        success: true,
        message: "Account created successfully",
        userId: newUser.id,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // User Login
  async login(credentials, rememberMe = false) {
    try {
      const { email, password } = credentials;

      // Validate credentials
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      // Find user
      const user = this.findUserByEmail(email);
      if (!user || !user.isActive) {
        throw new Error("Invalid email or password");
      }

      // Verify password
      const hashedPassword = await this.hashPassword(password);
      if (user.password !== hashedPassword) {
        throw new Error("Invalid email or password");
      }

      // Update last login
      this.updateUserLastLogin(user.id);

      // Create session
      const session = this.createSession(user, rememberMe);

      return {
        success: true,
        message: "Login successful",
        user: this.sanitizeUser(user),
        session,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Session Management
  createSession(user, rememberMe) {
    const sessionData = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      loginTime: new Date().toISOString(),
      expiresAt: rememberMe
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };

    // Store session
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.storageKeys.session, JSON.stringify(sessionData));

    // Store current user data
    sessionStorage.setItem(
      this.storageKeys.currentUser,
      JSON.stringify(this.sanitizeUser(user))
    );

    return sessionData;
  }

  getCurrentSession() {
    // Check session storage first
    let sessionData = sessionStorage.getItem(this.storageKeys.session);

    // If not found, check local storage
    if (!sessionData) {
      sessionData = localStorage.getItem(this.storageKeys.session);
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

  getCurrentUser() {
    const userData = sessionStorage.getItem(this.storageKeys.currentUser);
    return userData ? JSON.parse(userData) : null;
  }

  isAuthenticated() {
    return this.getCurrentSession() !== null;
  }

  requireAuth() {
    if (!this.isAuthenticated()) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      window.location.href = "login.html";
      return false;
    }
    return true;
  }

  logout() {
    // Clear all session data
    sessionStorage.removeItem(this.storageKeys.session);
    localStorage.removeItem(this.storageKeys.session);
    sessionStorage.removeItem(this.storageKeys.currentUser);

    // Redirect to login page
    window.location.href = "login.html";
  }

  extendSession() {
    const currentSession = this.getCurrentSession();
    if (currentSession) {
      currentSession.expiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString();

      // Update storage
      if (localStorage.getItem(this.storageKeys.session)) {
        localStorage.setItem(
          this.storageKeys.session,
          JSON.stringify(currentSession)
        );
      } else {
        sessionStorage.setItem(
          this.storageKeys.session,
          JSON.stringify(currentSession)
        );
      }
    }
  }

  // Password Management
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + this.saltKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  calculatePasswordStrength(password) {
    let score = 0;
    let feedback = [];

    if (!password)
      return {
        score: 0,
        level: "none",
        text: "Password strength",
        color: "#e9ecef",
      };

    // Length checks
    if (password.length >= 8) score += 2;
    else feedback.push("At least 8 characters");

    if (password.length >= 12) score += 1;

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("lowercase letter");

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("uppercase letter");

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push("number");

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push("special character");

    // Penalties
    if (/(.)\1{2,}/.test(password)) score -= 1;
    if (/123|abc|qwe|password/i.test(password)) score -= 2;

    // Determine strength
    let level, text, color;
    if (score < 3) {
      level = "weak";
      text = "Weak password";
      color = "#dc3545";
    } else if (score < 6) {
      level = "medium";
      text = "Medium password";
      color = "#ffc107";
    } else {
      level = "strong";
      text = "Strong password";
      color = "#28a745";
    }

    return { score, level, text, color, feedback };
  }

  // Validation Methods
  validateRegistrationData(userData) {
    const errors = [];

    // Full name validation
    if (!userData.fullName || userData.fullName.trim().length < 2) {
      errors.push("Full name must be at least 2 characters");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userData.email || !emailRegex.test(userData.email)) {
      errors.push("Please enter a valid email address");
    }

    // Password validation
    const passwordStrength = this.calculatePasswordStrength(userData.password);
    if (passwordStrength.score < 3) {
      errors.push(
        `Password too weak. Add: ${passwordStrength.feedback.join(", ")}`
      );
    }

    // Confirm password validation
    if (userData.password !== userData.confirmPassword) {
      errors.push("Passwords do not match");
    }

    // Purpose validation
    if (!userData.purpose) {
      errors.push("Please select your main purpose");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // User Management
  generateUserId() {
    return "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  saveUser(userData) {
    const users = this.getAllUsers();
    users.push(userData);
    localStorage.setItem(this.storageKeys.users, JSON.stringify(users));
  }

  getAllUsers() {
    return JSON.parse(localStorage.getItem(this.storageKeys.users) || "[]");
  }

  findUserByEmail(email) {
    const users = this.getAllUsers();
    return users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  isEmailTaken(email) {
    return this.findUserByEmail(email) !== undefined;
  }

  updateUserLastLogin(userId) {
    const users = this.getAllUsers();
    const userIndex = users.findIndex((user) => user.id === userId);

    if (userIndex !== -1) {
      users[userIndex].lastLogin = new Date().toISOString();
      localStorage.setItem(this.storageKeys.users, JSON.stringify(users));
    }
  }

  sanitizeUser(user) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  // Password Reset (for future implementation)
  async requestPasswordReset(email) {
    const user = this.findUserByEmail(email);
    if (!user) {
      throw new Error("No account found with that email address");
    }

    // In a real app, you would send an actual email here
    // For now, we'll just simulate the process
    const resetToken = this.generateResetToken();

    // Store reset token temporarily (expires in 1 hour)
    const resetData = {
      userId: user.id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };

    localStorage.setItem("passwordResetToken", JSON.stringify(resetData));

    return {
      success: true,
      message: "Password reset instructions have been sent to your email",
    };
  }

  generateResetToken() {
    return Math.random().toString(36).substr(2, 15) + Date.now().toString(36);
  }
}

// Authentication Manager
export class AuthManager {
  static storageKeys = {
    users: "budgetBluUsers",
    session: "budgetBluSession",
    currentUser: "currentUser",
  };

  // Check if user is logged in
  static isLoggedIn() {
    const session =
      localStorage.getItem(this.storageKeys.session) ||
      sessionStorage.getItem(this.storageKeys.session);
    return !!session;
  }

  // Get current user
  static getCurrentUser() {
    const userData = localStorage.getItem(this.storageKeys.currentUser);
    return userData ? JSON.parse(userData) : null;
  }

  // Login user
  static login(credentials, rememberMe = false) {
    const { email, password } = credentials;

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // For demo purposes, create a mock user
    const user = {
      id: Date.now(),
      email: email,
      name: email.split("@")[0],
      createdAt: new Date().toISOString(),
    };

    // Store session
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(
      this.storageKeys.session,
      JSON.stringify({
        userId: user.id,
        loginTime: new Date().toISOString(),
      })
    );

    localStorage.setItem(this.storageKeys.currentUser, JSON.stringify(user));

    return { success: true, user };
  }

  // Logout user
  static logout() {
    // Clear session data
    localStorage.removeItem(this.storageKeys.currentUser);
    localStorage.removeItem(this.storageKeys.session);
    sessionStorage.removeItem(this.storageKeys.session);

    console.log("User logged out");
  }

  // Register user
  static register(userData) {
    const user = {
      id: Date.now(),
      ...userData,
      createdAt: new Date().toISOString(),
    };

    // Store user
    const users = JSON.parse(
      localStorage.getItem(this.storageKeys.users) || "[]"
    );
    users.push(user);
    localStorage.setItem(this.storageKeys.users, JSON.stringify(users));

    return { success: true, user };
  }

  static setUser(user) {
    localStorage.setItem(this.storageKeys.currentUser, JSON.stringify(user));

    // Create session
    const session = {
      userId: user.id,
      loginTime: new Date().toISOString(),
      isActive: true,
    };

    localStorage.setItem(this.storageKeys.session, JSON.stringify(session));
  }

  static findUserByEmail(email) {
    const users = this.getUsers();
    return users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  static getUsers() {
    const users = localStorage.getItem(this.storageKeys.users);
    return users ? JSON.parse(users) : [];
  }

  static saveUser(user) {
    const users = this.getUsers();
    users.push(user);
    localStorage.setItem(this.storageKeys.users, JSON.stringify(users));
  }
}

// Make AuthManager globally available for backward compatibility
window.AuthManager = AuthManager;

// Global logout function for HTML onclick
window.logout = function () {
  AuthManager.logout();
};
