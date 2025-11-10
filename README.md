# 🏛️ Maze Temple - AI Agent Training Center

An interactive AI training platform where Deep Q-Network (DQN) agents learn to navigate mazes through reinforcement learning and imitation learning from human demonstrations.

## 🎮 Features

### Game Modes

1. **Play Mode** 🎮
   - Play mazes yourself with keyboard (WASD/Arrows) or touch controls
   - Successful runs are saved as demonstrations for AI training
   - Leaderboard tracking for human players

2. **Watch Mode** 🤖
   - Watch AI agents train in real-time
   - Visual training progress with metrics
   - See learning phases: Imitation → Hybrid → Autonomous

3. **Battle Mode** ⚔️
   - Compete against AI in split-screen
   - Same maze, simultaneous play
   - Live comparison of performance metrics

4. **Demo Library** 📚
   - View and manage recorded demonstrations
   - Quality scoring system
   - Export/import demonstrations

5. **Leaderboard** 🏆
   - Track top scores: Human vs AI
   - Filter by difficulty and player type
   - Competition statistics

## 🧠 AI Architecture

### Deep Q-Network (DQN)
- **TensorFlow.js** implementation
- **Noise injection** to avoid zero-value issues
- **Optimistic initialization** for exploration
- **Experience replay** buffer (50K capacity)
- **Target network** for stable training

### Imitation Learning
- **Behavioral cloning** from human demonstrations
- **State matching** for action selection
- **Adaptive weight decay** (50% → 5%)
- **Quality filtering** for demo library

### Agent Types

**Explorer** (Phase 1) - Navigation specialist
- Network: 16 → 32 → 16 → 4
- Focus: Finding optimal paths
- Reward: 90% navigation, 5% gems, 5% time

*Future agents:*
- **Collector**: Gem collection specialist
- **Protector**: Hazard avoidance specialist
- **Strategist**: Global optimization
- **Speedrunner**: Time-optimal paths

## 🏗️ Technical Architecture

```
maze-temple/
├── index.html           # Main application
├── styles.css           # Compact styling
├── config.js            # Hyperparameters
├── core/
│   ├── maze-generator.js   # Procedural maze generation
│   ├── dqn.js              # Deep Q-Network
│   ├── agents.js           # AI agents
│   ├── training.js         # Training loop
│   ├── battle.js           # Human vs AI mode
│   └── replay-buffer.js    # Experience replay
├── human/
│   ├── controls.js         # Input handling
│   ├── player.js           # Human player
│   └── demo-recorder.js    # Demonstration recording
├── ui/
│   ├── renderer.js         # Canvas rendering
│   ├── stats-display.js    # Live metrics
│   ├── leaderboard.js      # Scoring system
│   └── mode-selector.js    # Game mode UI
└── utils/
    ├── state-encoder.js    # Feature extraction
    └── persistence.js      # LocalStorage/KV
```

## 🚀 Deployment

### Cloudflare Pages

1. **Build command:** None (static site)
2. **Build output directory:** `/`
3. **Root directory:** `/`

### Local Development

```bash
# Serve with any static server
python -m http.server 8000
# or
npx serve
```

Open `http://localhost:8000`

## 🎯 Training Pipeline

### Phase 1: Imitation Learning (Episodes 1-100)
- AI learns from human demonstrations
- 50% imitation weight initially
- Behavioral cloning pretraining
- Builds foundational knowledge

### Phase 2: Hybrid Learning (Episodes 101-300)
- Reduced imitation weight (10%)
- Primarily reinforcement learning
- Discovers novel strategies
- Refines human knowledge

### Phase 3: Autonomous Mastery (Episodes 301+)
- Minimal imitation (5%)
- Pure RL optimization
- Surpasses human performance
- Generates superhuman demonstrations

## 🔧 Configuration

Edit `config.js` to customize:

- **Maze parameters**: Size, density, difficulty
- **DQN hyperparameters**: Learning rate, epsilon, gamma
- **Imitation learning**: Weights, decay rates
- **Rewards structure**: Navigation, gems, time
- **UI settings**: Colors, controls, display

## 📊 Key Hyperparameters

```javascript
DQN: {
  LEARNING_RATE: 0.001,
  GAMMA: 0.99,
  EPSILON_START: 0.9,
  EPSILON_DECAY: 0.995,
  BATCH_SIZE: 32,
  REPLAY_BUFFER_SIZE: 50000,
}

IMITATION: {
  INITIAL_WEIGHT: 0.5,
  DECAY_RATE: 0.98,
  MIN_WEIGHT: 0.05,
}
```

## 🎨 Maze Elements

- 🟢 **Positive Gems**: +10 to +50 points
- 🔴 **Negative Gems**: -10 to -50 points
- ⭐ **Goal**: Level completion (+100)
- ⬛ **Walls**: Obstacles to navigate
- 🏁 **Start**: Beginning position

## 🏅 Success Metrics

### Explorer Agent Goals
- **Goal Reach Rate**: 95%
- **Average Steps**: < 50 (on 15x15)
- **Exploration Coverage**: 80% of maze
- **Training Episodes**: 300-500

## 📱 Controls

### Keyboard
- **WASD** or **Arrow Keys**: Move
- **R**: Restart (Play mode)
- **Esc**: Quit to menu

### Mobile
- **Swipe** gestures
- **Virtual D-Pad** (auto-appears on mobile)

## 🔬 Technical Highlights

### Noise Injection
Prevents zero Q-value issues:
- Parameter noise: σ = 0.05
- Reward noise: σ = 0.02
- Minimum reward: 0.01

### State Encoding
Compact 16-feature representation:
1. Normalized position (x, y)
2. Goal direction (sin, cos)
3. Distance to goal
4. Adjacent walls (4 directions)
5. Local occupancy grid
6. Exploration progress
7. Path efficiency

### Loop Prevention
- Exponential revisit penalties
- Stuck detection (15+ visits)
- Max steps limit (300)

## 📦 Dependencies

- **TensorFlow.js**: ^4.11.0 (loaded from CDN)
- **Browser**: Modern browser with Canvas and LocalStorage

## 🐛 Known Limitations

- Single agent type (Explorer) in Phase 1
- No team coordination yet
- LocalStorage only (Cloudflare KV coming in Phase 2)
- Training pauses when browser tab inactive

## 🔮 Future Enhancements

**Phase 2** (Coming Next):
- Additional agent types (Collector, Protector)
- Dynamic maze elements (moving hazards)
- Cloudflare Workers API for global leaderboard
- Advanced visualizations (Q-value heatmaps)

**Phase 3**:
- Team-based mazes
- Communication protocols
- Meta-learning across agents
- Tournament system

## 📄 License

MIT License - Feel free to use and modify!

## 🙏 Acknowledgments

Inspired by:
- DeepMind's DQN paper (2015)
- OpenAI Gym environments
- Classic maze navigation problems

---

**Built with ❤️ for AI research and education**

Total Size: ~95KB uncompressed, ~25KB gzipped
