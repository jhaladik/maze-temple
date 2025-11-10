// Battle Mode - Human vs AI simultaneous gameplay
// Split-screen competition

class MazeBattle {
  constructor(mazeData, humanPlayer, aiAgent) {
    // Create separate maze instances for each player
    this.humanMaze = new Maze(mazeData);
    this.aiMaze = new Maze(mazeData);

    // Players
    this.humanPlayer = humanPlayer;
    this.aiAgent = aiAgent;

    // Reset players on their respective mazes
    this.humanPlayer.reset(this.humanMaze);
    this.aiAgent.reset(this.aiMaze);

    // Battle state
    this.active = true;
    this.startTime = Date.now();
    this.winner = null;

    // AI update control
    this.aiUpdateInterval = 200; // ms between AI moves
    this.lastAIUpdate = 0;

    // Callbacks
    this.onUpdate = null;
    this.onComplete = null;
  }

  // Update battle state
  update(deltaTime) {
    if (!this.active) return;

    // Update human player (input-driven)
    const humanResult = this.humanPlayer.update(deltaTime);

    // Update AI agent (time-based)
    const now = Date.now();
    if (now - this.lastAIUpdate >= this.aiUpdateInterval) {
      const aiAction = this.aiAgent.selectAction(null); // No demos during battle
      const aiResult = this.aiAgent.executeAction(aiAction);
      this.lastAIUpdate = now;
    }

    // Check for completion
    this.checkCompletion();

    // Callback for UI updates
    if (this.onUpdate) {
      this.onUpdate(this.getStatus());
    }
  }

  // Check if battle is complete
  checkCompletion() {
    const humanDone = !this.humanPlayer.active;
    const aiDone = !this.aiAgent.active;

    if (humanDone && aiDone) {
      this.active = false;
      this.determineWinner();

      if (this.onComplete) {
        this.onComplete(this.getResults());
      }
    } else if (humanDone) {
      // Human finished first, keep AI running for comparison
      if (this.aiAgent.stats.steps > this.humanPlayer.stats.steps + 50) {
        // AI is taking too long, end battle
        this.active = false;
        this.determineWinner();
        if (this.onComplete) {
          this.onComplete(this.getResults());
        }
      }
    } else if (aiDone) {
      // AI finished first, keep human running
      // Human can still finish
    }
  }

  // Determine winner
  determineWinner() {
    const humanScore = this.calculateFinalScore(this.humanPlayer);
    const aiScore = this.calculateFinalScore(this.aiAgent);

    if (humanScore > aiScore) {
      this.winner = 'human';
    } else if (aiScore > humanScore) {
      this.winner = 'ai';
    } else {
      this.winner = 'tie';
    }
  }

  // Calculate final score (weighted by multiple factors)
  calculateFinalScore(player) {
    const s = player.stats;

    let score = s.score; // Base score

    // Completion bonus
    if (s.completed) {
      score += CONFIG.REWARDS.GOAL_REACHED * 2;
    }

    // Speed bonus (if completed)
    if (s.completed) {
      const timeBonus = Math.max(0, (60000 - s.timeElapsed) / 100);
      score += timeBonus;
    }

    // Efficiency bonus
    const efficiency = player.maze.optimalSteps / Math.max(1, s.steps);
    score += efficiency * 100;

    // Gem bonus
    score += s.gemsCollected * 5;

    // Penalty for negative gems
    score -= s.negativeGems * 10;

    return Math.max(0, score);
  }

  // Get current battle status
  getStatus() {
    return {
      active: this.active,
      timeElapsed: Date.now() - this.startTime,
      human: {
        x: this.humanPlayer.x,
        y: this.humanPlayer.y,
        stats: { ...this.humanPlayer.stats },
        active: this.humanPlayer.active
      },
      ai: {
        x: this.aiAgent.x,
        y: this.aiAgent.y,
        stats: { ...this.aiAgent.stats },
        active: this.aiAgent.active
      }
    };
  }

  // Get battle results
  getResults() {
    const humanScore = this.calculateFinalScore(this.humanPlayer);
    const aiScore = this.calculateFinalScore(this.aiAgent);

    return {
      winner: this.winner,
      timeElapsed: Date.now() - this.startTime,
      human: {
        score: humanScore,
        stats: { ...this.humanPlayer.stats },
        performance: this.humanPlayer.getPerformance()
      },
      ai: {
        score: aiScore,
        stats: { ...this.aiAgent.stats },
        performance: this.aiAgent.getPerformance()
      }
    };
  }

  // Set AI speed
  setAISpeed(interval) {
    this.aiUpdateInterval = interval;
  }

  // Force end battle
  end() {
    this.active = false;
    this.determineWinner();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MazeBattle;
}
