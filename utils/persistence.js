// Persistence Layer - LocalStorage and Cloudflare KV abstraction
// Manages demo storage, leaderboards, and agent weights

class Persistence {
  constructor() {
    this.prefix = CONFIG.STORAGE.PREFIX;
    this.useCloudflareKV = CONFIG.STORAGE.USE_CLOUDFLARE_KV;

    // Check if localStorage is available
    this.hasLocalStorage = this.checkLocalStorage();
  }

  checkLocalStorage() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch(e) {
      console.warn('localStorage not available:', e);
      return false;
    }
  }

  // Generic get/set methods
  get(key) {
    const fullKey = this.prefix + key;

    if (this.useCloudflareKV) {
      // TODO: Implement Cloudflare KV fetch
      return null;
    }

    if (this.hasLocalStorage) {
      try {
        const data = localStorage.getItem(fullKey);
        return data ? JSON.parse(data) : null;
      } catch(e) {
        console.error('Error reading from storage:', e);
        return null;
      }
    }

    return null;
  }

  set(key, value) {
    const fullKey = this.prefix + key;

    if (this.useCloudflareKV) {
      // TODO: Implement Cloudflare KV put
      return false;
    }

    if (this.hasLocalStorage) {
      try {
        localStorage.setItem(fullKey, JSON.stringify(value));
        return true;
      } catch(e) {
        console.error('Error writing to storage:', e);
        return false;
      }
    }

    return false;
  }

  delete(key) {
    const fullKey = this.prefix + key;

    if (this.useCloudflareKV) {
      // TODO: Implement Cloudflare KV delete
      return false;
    }

    if (this.hasLocalStorage) {
      try {
        localStorage.removeItem(fullKey);
        return true;
      } catch(e) {
        console.error('Error deleting from storage:', e);
        return false;
      }
    }

    return false;
  }

  // Demo management
  loadDemos() {
    const demos = this.get(CONFIG.STORAGE.KEYS.DEMOS);
    return demos || [];
  }

  saveDemo(demo) {
    const demos = this.loadDemos();

    // Check if demo already exists (update)
    const existingIndex = demos.findIndex(d => d.id === demo.id);
    if (existingIndex >= 0) {
      demos[existingIndex] = demo;
    } else {
      demos.push(demo);
    }

    // Keep only top N demos by quality
    if (demos.length > CONFIG.IMITATION.MAX_DEMOS) {
      demos.sort((a, b) =>
        (b.metadata.quality || 0) - (a.metadata.quality || 0)
      );
      demos.splice(CONFIG.IMITATION.MAX_DEMOS);
    }

    return this.set(CONFIG.STORAGE.KEYS.DEMOS, demos);
  }

  deleteDemo(demoId) {
    const demos = this.loadDemos();
    const filtered = demos.filter(d => d.id !== demoId);
    return this.set(CONFIG.STORAGE.KEYS.DEMOS, filtered);
  }

  clearDemos() {
    return this.set(CONFIG.STORAGE.KEYS.DEMOS, []);
  }

  // Leaderboard management
  loadLeaderboard() {
    const leaderboard = this.get(CONFIG.STORAGE.KEYS.LEADERBOARD);
    return leaderboard || [];
  }

  saveLeaderboardEntry(entry) {
    const leaderboard = this.loadLeaderboard();

    leaderboard.push({
      ...entry,
      timestamp: Date.now()
    });

    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score);

    // Keep top 100
    const trimmed = leaderboard.slice(0, 100);

    return this.set(CONFIG.STORAGE.KEYS.LEADERBOARD, trimmed);
  }

  clearLeaderboard() {
    return this.set(CONFIG.STORAGE.KEYS.LEADERBOARD, []);
  }

  // Agent weights management
  saveAgentWeights(agentType, weights) {
    const allWeights = this.get(CONFIG.STORAGE.KEYS.AGENT_WEIGHTS) || {};
    allWeights[agentType] = {
      weights: weights,
      timestamp: Date.now()
    };
    return this.set(CONFIG.STORAGE.KEYS.AGENT_WEIGHTS, allWeights);
  }

  loadAgentWeights(agentType) {
    const allWeights = this.get(CONFIG.STORAGE.KEYS.AGENT_WEIGHTS) || {};
    return allWeights[agentType] || null;
  }

  clearAgentWeights(agentType = null) {
    if (agentType) {
      const allWeights = this.get(CONFIG.STORAGE.KEYS.AGENT_WEIGHTS) || {};
      delete allWeights[agentType];
      return this.set(CONFIG.STORAGE.KEYS.AGENT_WEIGHTS, allWeights);
    } else {
      return this.set(CONFIG.STORAGE.KEYS.AGENT_WEIGHTS, {});
    }
  }

  // Settings management
  loadSettings() {
    const settings = this.get(CONFIG.STORAGE.KEYS.SETTINGS);
    return settings || this.getDefaultSettings();
  }

  saveSettings(settings) {
    return this.set(CONFIG.STORAGE.KEYS.SETTINGS, settings);
  }

  getDefaultSettings() {
    return {
      soundEnabled: true,
      musicEnabled: false,
      showHeatmap: false,
      aiSpeed: 100, // ms between AI moves
      difficulty: 'EASY',
      playerName: 'Player'
    };
  }

  // Utility: Get storage usage (localStorage only)
  getStorageUsage() {
    if (!this.hasLocalStorage) return { used: 0, available: 0 };

    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith(this.prefix)) {
        used += localStorage[key].length + key.length;
      }
    }

    // Estimate available space (typically 5-10MB for localStorage)
    const available = 5 * 1024 * 1024; // 5MB estimate

    return {
      used: used,
      available: available,
      percentage: (used / available * 100).toFixed(2)
    };
  }

  // Clear all maze-temple data
  clearAll() {
    if (!this.hasLocalStorage) return false;

    const keys = Object.keys(localStorage);
    const mazeKeys = keys.filter(k => k.startsWith(this.prefix));

    mazeKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    return true;
  }

  // Export all data as JSON
  exportAll() {
    return {
      demos: this.loadDemos(),
      leaderboard: this.loadLeaderboard(),
      settings: this.loadSettings(),
      timestamp: Date.now()
    };
  }

  // Import data from JSON
  importAll(data) {
    try {
      if (data.demos) {
        this.set(CONFIG.STORAGE.KEYS.DEMOS, data.demos);
      }
      if (data.leaderboard) {
        this.set(CONFIG.STORAGE.KEYS.LEADERBOARD, data.leaderboard);
      }
      if (data.settings) {
        this.set(CONFIG.STORAGE.KEYS.SETTINGS, data.settings);
      }
      return { success: true };
    } catch(e) {
      return { success: false, error: e.message };
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Persistence;
}
