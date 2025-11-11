// Maze Temple Configuration
// Compact hyperparameters and constants for AI training center

const CONFIG = {
  // Maze Generation
  MAZE: {
    DEFAULT_SIZE: 15,
    MIN_SIZE: 10,
    MAX_SIZE: 25,
    CELL_SIZE: 30, // pixels

    // Element distribution (percentages)
    WALL_DENSITY: 0.25,
    POSITIVE_GEM_DENSITY: 0.15,
    NEGATIVE_GEM_DENSITY: 0.10,
    SPECIAL_GEM_DENSITY: 0.05,

    // Gem values
    GEM_VALUES: {
      SMALL: 10,
      MEDIUM: 25,
      LARGE: 50,
    },

    GEM_PENALTIES: {
      SMALL: -10,
      MEDIUM: -25,
      LARGE: -50,
    },

    // Time limits (seconds)
    TIME_LIMITS: {
      EASY: 300,
      MEDIUM: 180,
      HARD: 120,
      EXPERT: 60,
    },
  },

  // DQN Hyperparameters
  DQN: {
    LEARNING_RATE: 0.001,
    GAMMA: 0.99,              // Discount factor
    EPSILON_START: 0.9,
    EPSILON_END: 0.01,
    EPSILON_DECAY: 0.995,

    BATCH_SIZE: 32,
    REPLAY_BUFFER_SIZE: 50000,
    TARGET_UPDATE_FREQ: 100,  // episodes

    // Noise injection for zero-value handling
    PARAMETER_NOISE_STDDEV: 0.05,
    REWARD_NOISE_STDDEV: 0.02,
    MIN_REWARD: 0.01,         // Minimum exploration reward

    // Optimistic initialization
    INITIAL_Q_BIAS: 0.5,

    // Network architectures (layer sizes)
    NETWORKS: {
      MICRO: [32, 16],        // Explorer
      SMALL: [64, 32],        // Collector
      MEDIUM: [128, 64, 32],  // Protector
      LARGE: [256, 128, 64],  // Strategist
    },
  },

  // Imitation Learning
  IMITATION: {
    INITIAL_WEIGHT: 0.5,      // 50% imitation at start
    DECAY_RATE: 0.98,         // Per episode
    MIN_WEIGHT: 0.05,         // Keep 5% throughout

    MAX_DEMOS: 50,            // Maximum stored demonstrations
    MIN_DEMO_QUALITY: 0.7,    // Quality threshold for saving

    // Behavioral cloning
    PRETRAINING_EPOCHS: 5,
    PRETRAINING_FREQUENCY: 10, // Every N episodes

    // State matching
    STATE_MATCH_THRESHOLD: 2.0, // Euclidean distance
  },

  // Rewards Structure
  REWARDS: {
    // Navigation
    GOAL_REACHED: 100,
    STEP_TOWARD_GOAL: 1,
    STEP_AWAY_GOAL: -1,
    BASE_STEP: 0.01,          // Minimum exploration reward

    // Gems
    POSITIVE_GEM: 50,
    NEGATIVE_GEM: -30,
    MULTIPLIER_GEM: 0,        // Activates 2x multiplier
    SHIELD_GEM: 0,            // Activates shield

    // Time pressure
    TIME_PENALTY_MIN: -0.01,
    TIME_PENALTY_MAX: -0.05,

    // Loop prevention
    REVISIT_PENALTY_BASE: -3,
    REVISIT_PENALTY_EXP: 1.5,
    MAX_REVISITS: 15,
    STUCK_PENALTY: -100,

    // Episode termination
    MAX_STEPS: 300,
  },

  // Agent Configurations
  AGENTS: {
    EXPLORER: {
      type: 'explorer',
      networkSize: 'MICRO',
      stateSize: 16,
      actionSize: 4,
      rewardWeights: {
        navigation: 0.90,
        gems: 0.05,
        time: 0.05,
      },
    },

    COLLECTOR: {
      type: 'collector',
      networkSize: 'SMALL',
      stateSize: 24,
      actionSize: 4,
      rewardWeights: {
        navigation: 0.30,
        gems: 0.60,
        time: 0.10,
      },
    },

    PROTECTOR: {
      type: 'protector',
      networkSize: 'MEDIUM',
      stateSize: 32,
      actionSize: 4,
      rewardWeights: {
        navigation: 0.30,
        safety: 0.60,
        time: 0.10,
      },
    },
  },

  // Training Phases
  TRAINING: {
    PHASE_1_EPISODES: 100,     // Imitation learning
    PHASE_2_EPISODES: 300,     // Hybrid learning
    PHASE_3_EPISODES: Infinity, // Autonomous

    SUCCESS_TARGET: 50,        // Successful completions per level

    // Visualization
    UPDATE_FREQUENCY: 100,     // ms between AI steps
    CHART_UPDATE_FREQUENCY: 10, // episodes
  },

  // UI Configuration
  UI: {
    COLORS: {
      EMPTY: '#1a1a1a',
      WALL: '#404040',
      PLAYER: '#4CAF50',
      AI: '#2196F3',
      GOAL: '#FFD700',
      GEM_POSITIVE: '#00FF00',
      GEM_NEGATIVE: '#FF0000',
      GEM_MULTIPLIER: '#FFA500',
      GEM_SHIELD: '#00FFFF',
      PATH: '#FFFFFF20',
      VISITED: '#FFFFFF10',
    },

    // Heat map colors
    HEATMAP: {
      COLD: '#0000FF',
      WARM: '#FFFF00',
      HOT: '#FF0000',
    },

    // Fonts
    FONT_FAMILY: 'Arial, sans-serif',
    FONT_SIZE_SMALL: '12px',
    FONT_SIZE_MEDIUM: '14px',
    FONT_SIZE_LARGE: '18px',
  },

  // Persistence
  STORAGE: {
    PREFIX: 'maze_temple_',
    KEYS: {
      DEMOS: 'demos',
      LEADERBOARD: 'leaderboard',
      AGENT_WEIGHTS: 'agent_weights',
      SETTINGS: 'settings',
    },

    // Cloudflare KV (for future use)
    USE_CLOUDFLARE_KV: false,
    KV_NAMESPACE: 'MAZE_TEMPLE',
  },

  // Controls
  CONTROLS: {
    KEYS: {
      UP: ['w', 'W', 'ArrowUp', '8'],
      DOWN: ['s', 'S', 'ArrowDown', '2'],
      LEFT: ['a', 'A', 'ArrowLeft', '4'],
      RIGHT: ['d', 'D', 'ArrowRight', '6'],
    },

    TOUCH_SWIPE_THRESHOLD: 30, // pixels

    // Mobile controls
    ENABLE_TOUCH: true,
    ENABLE_VIRTUAL_DPAD: true,
  },

  // Performance
  PERFORMANCE: {
    USE_WEB_WORKERS: false,    // For Phase 3+
    USE_WEBGL: true,           // For TensorFlow.js
    MAX_FPS: 60,

    // Memory management
    CLEANUP_FREQUENCY: 1000,   // episodes
    MAX_TENSORS: 100,
  },

  // Debug
  DEBUG: {
    ENABLED: true,
    LOG_TRAINING: false,
    LOG_REWARDS: false,
    LOG_ACTIONS: false,
    SHOW_STATE_VECTORS: false,
    SHOW_Q_VALUES: false,
  },
};

// Action mapping
CONFIG.ACTIONS = {
  UP: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3,

  // Deltas for movement
  DELTAS: [
    [0, -1],  // UP - move up (decrease y)
    [0, 1],   // DOWN - move down (increase y)
    [-1, 0],  // LEFT - move left (decrease x)
    [1, 0],   // RIGHT - move right (increase x)
  ],

  NAMES: ['UP', 'DOWN', 'LEFT', 'RIGHT'],
};


// Cell types
CONFIG.CELL_TYPES = {
  EMPTY: 0,
  WALL: 1,
  GEM_POSITIVE_SMALL: 2,
  GEM_POSITIVE_MEDIUM: 3,
  GEM_POSITIVE_LARGE: 4,
  GEM_NEGATIVE_SMALL: 5,
  GEM_NEGATIVE_MEDIUM: 6,
  GEM_NEGATIVE_LARGE: 7,
  GEM_MULTIPLIER: 8,
  GEM_SHIELD: 9,
  GOAL: 10,
  START: 11,
};

// Difficulty presets
CONFIG.DIFFICULTY_PRESETS = {
  TUTORIAL: {
    size: 10,
    wallDensity: 0.15,
    positiveGems: 0.20,
    negativeGems: 0.05,
    timeLimit: 300,
  },

  EASY: {
    size: 15,
    wallDensity: 0.20,
    positiveGems: 0.15,
    negativeGems: 0.08,
    timeLimit: 240,
  },

  MEDIUM: {
    size: 20,
    wallDensity: 0.25,
    positiveGems: 0.12,
    negativeGems: 0.12,
    timeLimit: 180,
  },

  HARD: {
    size: 25,
    wallDensity: 0.30,
    positiveGems: 0.10,
    negativeGems: 0.15,
    timeLimit: 120,
  },
};

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
