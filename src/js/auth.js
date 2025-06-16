class AuthModule {
  constructor() {
    this.usersKey = "users";
    this.sessionKey = "session";
  }

  // Hash password using SHA-256
  hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    return window.crypto.subtle.digest("SHA-256", data).then((hash) => {
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    });
  }

  // Retrieve all users from localStorage
  getUsers() {
    const usersJson = localStorage.getItem(this.usersKey);
    return usersJson ? JSON.parse(usersJson) : [];
  }

  // Save all users to localStorage
  saveUsers(users) {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  // Save a single new user to localStorage
  saveUser(newUser) {
    const users = this.getUsers();
    users.push(newUser);
    this.saveUsers(users);
  }

  // Find a user by email
  findUserByEmail(email) {
    return this.getUsers().find((user) => user.email === email);
  }

  // Update a user in the users list
  updateUser(updatedUser) {
    const users = this.getUsers().map((user) =>
      user.email === updatedUser.email ? updatedUser : user
    );
    this.saveUsers(users);
  }

  // Register a new user
  async register(fullname, email, password) {
    const existingUser = this.findUserByEmail(email);
    if (existingUser) {
      return { success: false, message: "Email is already registered." };
    }

    const passwordHash = await this.hashPassword(password);
    const newUser = { fullname, email, password: passwordHash };
    this.saveUser(newUser);

    return { success: true, message: "Registration successful." };
  }

  // Log in a user
  async login(email, password) {
    const user = this.findUserByEmail(email);
    if (!user) {
      return { success: false, message: "Invalid credentials." };
    }

    const passwordHash = await this.hashPassword(password);
    if (user.password !== passwordHash) {
      return { success: false, message: "Invalid credentials." };
    }

    const session = {
      email: user.email,
      token: this.generateSessionToken(),
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    };
    localStorage.setItem(this.sessionKey, JSON.stringify(session));

    return {
      success: true,
      message: "Login successful.",
      token: session.token,
    };
  }

  // Get the current user session
  getCurrentUser() {
    const sessionJson = localStorage.getItem(this.sessionKey);
    if (!sessionJson) return null;

    const session = JSON.parse(sessionJson);
    if (Date.now() > session.expiresAt) {
      this.logout();
      return null;
    }

    return this.findUserByEmail(session.email);
  }

  // Validate the current session
  validateSession() {
    const sessionJson = localStorage.getItem(this.sessionKey);
    if (!sessionJson) return false;

    const session = JSON.parse(sessionJson);
    if (Date.now() > session.expiresAt) {
      this.logout();
      return false;
    }

    return true;
  }

  // Log out the current user
  logout() {
    localStorage.removeItem(this.sessionKey);
  }

  // Generate a secure session token
  generateSessionToken() {
    const randomValues = window.crypto.getRandomValues(new Uint8Array(32));
    return Array.from(randomValues)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Initiate password reset process
  initiatePasswordReset(email) {
    const user = this.findUserByEmail(email);
    if (!user) {
      return { success: false, message: "User not found." };
    }

    const token = this.generateSessionToken();
    const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    this.updateUser(user);

    return {
      success: true,
      message: "Password reset token generated.",
      token, // Only for development/testing. In production, send via email.
    };
  }

  // Reset password using token
  async resetPassword(email, token, newPassword) {
    const user = this.findUserByEmail(email);
    if (
      !user ||
      user.resetToken !== token ||
      Date.now() > user.resetTokenExpiry
    ) {
      return { success: false, message: "Invalid or expired token." };
    }

    const newPasswordHash = await this.hashPassword(newPassword);
    user.password = newPasswordHash;
    delete user.resetToken;
    delete user.resetTokenExpiry;
    this.updateUser(user);

    return { success: true, message: "Password reset successful." };
  }
}

// Exporting an instance of the module
export const AuthManager = new AuthModule();
