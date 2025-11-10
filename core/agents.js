// AI Agents - Specialized agents for maze navigation
// Phase 1: Explorer agent

class Agent {
  constructor(maze, agentType = 'explorer', demoRecorder = null) {
    this.maze = maze;
    this.agentType = agentType;
    this.demoRecorder = demoRecorder;

    // Get agent configuration
    this.config = CONFIG.AGENTS[agentType.toUpperCase()];

    // Position (handle null maze gracefully)
    this.x = maze ? maze.startX : 0;
    this.y = maze ? maze.startY : 0;

    // Stats
    this.stats = {
      steps: 0,
      score: 0,
      gemsCollected: 0,
      positiveGems: 0,
      negativeGems: 0,
      negativeGemsAvoided: 0,
      safeMovesStreak: 0,
      timeElapsed: 0,
      startTime: Date.now(),
      completed: false,
      path: [[this.x, this.y]]
    };

    // State
    this.active = true;
    this.health = 100;
    this.shieldActive = false;

    // Create DQN
    this.stateEncoder = new StateEncoder(agentType);
    this.dqn = new DQN(
      this.config.stateSize,
      this.config.actionSize,
      this.config.networkSize
    );

    // Replay buffer
    this.replayBuffer = new ReplayBuffer();

    // Training state
    this.training = false;
    this.episode = 0;
  }

  // Get current state
  getState() {
    return this.stateEncoder.encode(this, this.maze);
  }

  // Select action
  selectAction(demos = null) {
    const state = this.getState();
    return this.dqn.selectAction(state, demos, this.training);
  }

  // Execute action and get reward
  executeAction(action) {
    if (!this.active) return null;

    const [dx, dy] = CONFIG.ACTIONS.DELTAS[action];
    const newX = this.x + dx;
    const newY = this.y + dy;

    // Check if valid move
    if (!this.maze.isWalkable(newX, newY)) {
      return {
        action: action,
        valid: false,
        reward: -1, // Wall collision penalty
        newPosition: { x: this.x, y: this.y },
        nextState: this.getState()
      };
    }

    // Store previous position for reward calculation
    const prevX = this.x;
    const prevY = this.y;

    // Update position
    this.x = newX;
    this.y = newY;
    this.stats.steps++;
    this.stats.path.push([this.x, this.y]);

    // Mark cell as visited
    this.maze.markVisited(this.x, this.y);

    // Calculate reward
    let reward = this.calculateReward(prevX, prevY, action);

    // Check for episode termination
    let done = false;

    // Goal reached
    if (this.maze.isGoal(this.x, this.y)) {
      reward += CONFIG.REWARDS.GOAL_REACHED;
      this.stats.score += CONFIG.REWARDS.GOAL_REACHED;
      this.stats.completed = true;
      this.stats.timeElapsed = Date.now() - this.stats.startTime;
      this.active = false;
      done = true;
    }

    // Max steps exceeded
    if (this.stats.steps >= CONFIG.REWARDS.MAX_STEPS) {
      reward += CONFIG.REWARDS.STUCK_PENALTY;
      this.active = false;
      done = true;
    }

    // Too many revisits (stuck detection)
    const revisits = this.maze.visitedCells[this.y][this.x];
    if (revisits > CONFIG.REWARDS.MAX_REVISITS) {
      reward += CONFIG.REWARDS.STUCK_PENALTY;
      this.active = false;
      done = true;
    }

    const nextState = this.getState();

    return {
      action: action,
      valid: true,
      reward: reward,
      newPosition: { x: this.x, y: this.y },
      nextState: nextState,
      done: done,
      completed: this.stats.completed
    };
  }

  // Calculate reward based on agent type
  calculateReward(prevX, prevY, action) {
    let reward = CONFIG.REWARDS.BASE_STEP;
    const weights = this.config.rewardWeights;

    // Navigation reward
    if (weights.navigation > 0) {
      const distToGoal = Math.abs(this.maze.goalX - this.x) +
                        Math.abs(this.maze.goalY - this.y);
      const prevDist = Math.abs(this.maze.goalX - prevX) +
                      Math.abs(this.maze.goalY - prevY);

      if (distToGoal < prevDist) {
        reward += CONFIG.REWARDS.STEP_TOWARD_GOAL * weights.navigation;
      } else if (distToGoal > prevDist) {
        reward += CONFIG.REWARDS.STEP_AWAY_GOAL * weights.navigation;
      }
    }

    // Gem collection reward
    if (weights.gems > 0) {
      const gemValue = this.maze.collectGem(this.x, this.y);
      if (gemValue !== 0) {
        reward += gemValue * weights.gems;
        this.stats.score += gemValue;

        if (gemValue > 0) {
          this.stats.positiveGems++;
          this.stats.gemsCollected++;
          this.stats.safeMovesStreak++;
        } else {
          this.stats.negativeGems++;
          this.stats.safeMovesStreak = 0;
        }
      } else {
        this.stats.safeMovesStreak++;
      }
    }

    // Loop penalty
    const revisits = this.maze.visitedCells[this.y][this.x];
    if (revisits > 1) {
      const loopPenalty = -CONFIG.REWARDS.REVISIT_PENALTY_BASE *
                         Math.pow(revisits, CONFIG.REWARDS.REVISIT_PENALTY_EXP);
      reward += loopPenalty;
    }

    // Time penalty
    if (weights.time > 0) {
      reward += CONFIG.REWARDS.TIME_PENALTY_MIN * weights.time;
    }

    return reward;
  }

  // Reset for new episode
  reset(maze) {
    this.maze = maze;
    this.x = maze.startX;
    this.y = maze.startY;

    this.stats = {
      steps: 0,
      score: 0,
      gemsCollected: 0,
      positiveGems: 0,
      negativeGems: 0,
      negativeGemsAvoided: 0,
      safeMovesStreak: 0,
      timeElapsed: 0,
      startTime: Date.now(),
      completed: false,
      path: [[this.x, this.y]]
    };

    this.active = true;
    this.health = 100;
    this.shieldActive = false;
  }

  // Get performance metrics
  getPerformance() {
    const efficiency = this.stats.steps > 0 ?
                      this.maze.optimalSteps / this.stats.steps : 0;

    const gemRate = this.stats.gemsCollected / Math.max(1, this.stats.steps);

    const completionRate = this.stats.completed ? 1 : 0;

    return {
      efficiency: efficiency,
      gemRate: gemRate,
      completionRate: completionRate,
      score: this.stats.score,
      steps: this.stats.steps,
      timeElapsed: this.stats.timeElapsed / 1000
    };
  }

  // Save agent
  async saveAgent(persistence) {
    const weights = await this.dqn.saveWeights();

    if (weights) {
      persistence.saveAgentWeights(this.agentType, weights);
      return true;
    }

    return false;
  }

  // Load agent
  async loadAgent(persistence) {
    const weightData = persistence.loadAgentWeights(this.agentType);

    if (weightData && weightData.weights) {
      return await this.dqn.loadWeights(weightData.weights);
    }

    return false;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Agent;
}
