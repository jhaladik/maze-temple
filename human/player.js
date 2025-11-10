// Human Player - Manages human player state and interaction with maze

class HumanPlayer {
  constructor(maze, controls) {
    this.maze = maze;
    this.controls = controls;

    // Position
    this.x = maze.startX;
    this.y = maze.startY;

    // Stats
    this.stats = {
      steps: 0,
      score: 0,
      gemsCollected: 0,
      positiveGems: 0,
      negativeGems: 0,
      timeElapsed: 0,
      startTime: Date.now(),
      completed: false,
      path: [[this.x, this.y]]
    };

    // State
    this.active = true;
  }

  update(deltaTime) {
    if (!this.active) return null;

    // Check for input
    const action = this.controls.getInput();
    if (action !== null) {
      return this.executeAction(action);
    }

    return null;
  }

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
        reward: 0,
        newPosition: { x: this.x, y: this.y }
      };
    }

    // Update position
    this.x = newX;
    this.y = newY;
    this.stats.steps++;
    this.stats.path.push([this.x, this.y]);

    // Mark cell as visited
    this.maze.markVisited(this.x, this.y);

    // Calculate reward
    let reward = CONFIG.REWARDS.BASE_STEP;

    // Check for collectibles
    const gemValue = this.maze.collectGem(this.x, this.y);
    if (gemValue !== 0) {
      reward += gemValue;
      this.stats.score += gemValue;

      if (gemValue > 0) {
        this.stats.positiveGems++;
        this.stats.gemsCollected++;
      } else {
        this.stats.negativeGems++;
      }
    }

    // Check for goal
    if (this.maze.isGoal(this.x, this.y)) {
      reward += CONFIG.REWARDS.GOAL_REACHED;
      this.stats.score += CONFIG.REWARDS.GOAL_REACHED;
      this.stats.completed = true;
      this.stats.timeElapsed = Date.now() - this.stats.startTime;
      this.active = false;
    }

    // Distance-based reward (moving toward goal)
    const distToGoal = Math.abs(this.maze.goalX - this.x) +
                      Math.abs(this.maze.goalY - this.y);
    const prevDist = Math.abs(this.maze.goalX - (this.x - dx)) +
                    Math.abs(this.maze.goalY - (this.y - dy));

    if (distToGoal < prevDist) {
      reward += CONFIG.REWARDS.STEP_TOWARD_GOAL;
    } else if (distToGoal > prevDist) {
      reward += CONFIG.REWARDS.STEP_AWAY_GOAL;
    }

    return {
      action: action,
      valid: true,
      reward: reward,
      newPosition: { x: this.x, y: this.y },
      completed: this.stats.completed
    };
  }

  // Get current state for demo recording
  getState() {
    return {
      x: this.x,
      y: this.y,
      stats: { ...this.stats }
    };
  }

  // Reset for new game
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
      timeElapsed: 0,
      startTime: Date.now(),
      completed: false,
      path: [[this.x, this.y]]
    };

    this.active = true;
  }

  // Check if time limit exceeded
  checkTimeLimit() {
    const elapsed = (Date.now() - this.stats.startTime) / 1000;
    if (elapsed > this.maze.timeLimit) {
      this.active = false;
      return true;
    }
    return false;
  }

  // Get remaining time
  getRemainingTime() {
    const elapsed = (Date.now() - this.stats.startTime) / 1000;
    return Math.max(0, this.maze.timeLimit - elapsed);
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HumanPlayer;
}
