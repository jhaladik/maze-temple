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
    this.humanFinishedLogged = false;
    this.aiFinishedLogged = false;

    // AI update control
    this.aiUpdateInterval = 200; // ms between AI moves
    this.lastAIUpdate = 0;
    this.aiInvalidAttempts = 0; // Track consecutive invalid moves
    this.aiLastInvalidAction = -1;

    // Callbacks
    this.onUpdate = null;
    this.onComplete = null;
  }

  // Update battle state - NOW ASYNC!
  async update(deltaTime) {
    if (!this.active) return;

    // Update human player (input-driven)
    const humanResult = this.humanPlayer.update(deltaTime);

    // Update AI agent (time-based)
    const now = Date.now();
    if (now - this.lastAIUpdate >= this.aiUpdateInterval) {
      if (this.aiAgent.active) {
        let aiAction;

        // If stuck (consecutive invalid moves), use random action
        if (this.aiInvalidAttempts > 3) {
          aiAction = Math.floor(Math.random() * 4);
          if (CONFIG.DEBUG.ENABLED) {
            console.log('🤖 AI stuck! Using random action:', CONFIG.ACTIONS.NAMES[aiAction]);
          }
        } else {
          // AWAIT async operation - non-blocking!
          aiAction = await this.aiAgent.selectAction(null); // No demos (training flag set in agent)
        }

        const aiResult = this.aiAgent.executeAction(aiAction);

        // Track invalid moves
        if (aiResult.valid) {
          this.aiInvalidAttempts = 0;
        } else {
          this.aiInvalidAttempts++;
        }

        if (CONFIG.DEBUG.ENABLED && aiResult) {
          console.log('🤖 AI action:', CONFIG.ACTIONS.NAMES[aiAction], 'valid:', aiResult.valid, 'active:', this.aiAgent.active, 'steps:', this.aiAgent.stats.steps, 'invalid attempts:', this.aiInvalidAttempts);
        }
      } else {
        if (CONFIG.DEBUG.ENABLED) {
          console.log('🤖 AI is inactive! Steps:', this.aiAgent.stats.steps, 'Completed:', this.aiAgent.stats.completed);
        }
      }
      this.lastAIUpdate = now;
    }

    // Check for completion
    this.checkCompletion();

    // Callback for UI updates (every frame)
    if (this.onUpdate) {
      this.onUpdate(this.getStatus());
    } else if (CONFIG.DEBUG.ENABLED) {
      console.warn('⚠️ No onUpdate callback set!');
    }
  }

  // Check if battle is complete
  checkCompletion() {
    const humanDone = !this.humanPlayer.active;
    const aiDone = !this.aiAgent.active;

    // Log when a player finishes
    if (humanDone && !this.humanFinishedLogged) {
      console.log('🏁 HUMAN FINISHED! Score:', this.humanPlayer.stats.score, 'Steps:', this.humanPlayer.stats.steps, 'Completed:', this.humanPlayer.stats.completed);
      this.humanFinishedLogged = true;
    }
    if (aiDone && !this.aiFinishedLogged) {
      console.log('🏁 AI FINISHED! Score:', this.aiAgent.stats.score, 'Steps:', this.aiAgent.stats.steps, 'Completed:', this.aiAgent.stats.completed);
      this.aiFinishedLogged = true;
    }

    // Only end when BOTH are done
    if (humanDone && aiDone) {
      console.log('🏆 BATTLE COMPLETE! Both players finished.');
      this.active = false;
      this.determineWinner();

      if (this.onComplete) {
        this.onComplete(this.getResults());
      }
      return;
    }

    // Safety: If AI takes too long (500 steps), end battle
    if (this.aiAgent.stats.steps > 500 && !this.aiAgent.stats.completed) {
      console.log('⏱️ AI taking too long (500+ steps), ending battle');
      this.aiAgent.active = false;
      // Will trigger completion check on next frame
    }

    // If one finishes first, keep battle going
    // Let both players complete their runs
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
      },
      humanMaze: this.humanMaze,
      aiMaze: this.aiMaze
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
