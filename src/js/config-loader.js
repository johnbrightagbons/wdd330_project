export class ConfigLoader {
  constructor() {
    this.configCache = new Map();
    this.basePath = "/json/";
  }

  async loadConfig(filename) {
    // Check cache first
    if (this.configCache.has(filename)) {
      return this.configCache.get(filename);
    }

    try {
      const response = await fetch(`${this.basePath}${filename}`);

      if (!response.ok) {
        throw new Error(`Failed to load ${filename}: ${response.statusText}`);
      }

      const config = await response.json();

      // Cache the configuration
      this.configCache.set(filename, config);

      return config;
    } catch (error) {
      console.error(`Error loading configuration file ${filename}:`, error);
      throw error;
    }
  }

  async loadMultipleConfigs(filenames) {
    const promises = filenames.map((filename) => this.loadConfig(filename));
    return Promise.all(promises);
  }

  clearCache() {
    this.configCache.clear();
  }

  getCachedConfig(filename) {
    return this.configCache.get(filename);
  }
}
