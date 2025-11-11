// Training Manager - Controls AI training loop and curriculum learning

class TrainingManager {
  constructor(agent, demoRecorder) {
    this.agent = agent;
    this.demoRecorder = demoRecorder;

    // Training state
    this.episode = 0;
    this.running = false;
    this.paused = false;
    this.cancelled = false; // IMMEDIATE CANCELLATION FLAG

    // Episode metrics
    this.episodeRewards = [];
    this.episodeSteps = [];
    this.episodeSuccesses = [];

    // Training callbacks
    this.onEpisodeEnd = null;
    this.onTrainingUpdate = null;

    // Speed control
    this.updateDelay = CONFIG.TRAINING.UPDATE_FREQUENCY;
  }

  // Start training
  async startTraining() {
    this.running = true;
    this.cancelled = false; // Reset cancellation flag
    this.agent.training = true;
    console.log('🚀 Starting training - cancellation flag reset');
    await this.trainingLoop();
  }

  // Stop training - IMMEDIATE CANCELLATION
  stopTraining() {
    console.log('⏹️ Stopping training IMMEDIATELY...');
    this.cancelled = true; // Set flag FIRST for immediate effect
    this.running = false;
    this.agent.training = false;
    console.log('✅ Training stopped - cancelled flag set');
  }

  // Pause/resume training
  togglePause() {
    this.paused = !this.paused;
  }

  // Main training loop
  async trainingLoop() {
    console.log('🏃 Training loop started');
    while (this.running) {
      if (this.paused) {
        await this.sleep(100);
        continue;
      }

      await this.runEpisode();

      // Check if target reached
      if (this.getSuccessRate(50) >= 0.95 &&
          this.episode >= CONFIG.TRAINING.PHASE_1_EPISODES) {
        console.log('Training target reached!');
        this.stopTraining();
      }
    }
    console.log('🏁 Training loop exited');
  }

  // Run a single episode
  async runEpisode() {
    this.episode++;

    // CHECK CANCELLATION - Exit immediately if cancelled
    if (this.cancelled) {
      console.log('🚫 Episode cancelled before start');
      return;
    }

    // Generate new maze
    const mazeGenerator = new MazeGenerator({
      difficulty: 'EASY',
      size: 15,
      seed: Date.now() + this.episode
    });
    const mazeData = mazeGenerator.generate();
    const maze = new Maze(mazeData);

    // Reset agent
    this.agent.reset(maze);

    // CHECK CANCELLATION
    if (this.cancelled) {
      console.log('🚫 Episode cancelled after maze generation');
      return;
    }

    // Get relevant demos for imitation learning
    const demos = this.demoRecorder.getRelevantDemos(maze, this.agent.agentType, 10);

    // Pre-training on demos (every 10 episodes)
    if (this.episode % CONFIG.IMITATION.PRETRAINING_FREQUENCY === 0 && demos.length > 0) {
      const phase = this.getTrainingPhase();
      const epochs = phase === 'imitation' ?
                    CONFIG.IMITATION.PRETRAINING_EPOCHS : 1;

      await this.agent.dqn.trainOnDemonstrations(demos, epochs);

      // CHECK CANCELLATION after training
      if (this.cancelled) {
        console.log('🚫 Episode cancelled after pre-training');
        return;
      }
    }

    // Episode rollout
    let totalReward = 0;
    let steps = 0;

    while (this.agent.active && steps < CONFIG.REWARDS.MAX_STEPS && !this.cancelled) {
      // Get current state
      const state = this.agent.getState();

      // Select action - AWAIT async operation
      const action = await this.agent.selectAction(demos);

      // Execute action
      const result = this.agent.executeAction(action);

      if (result && result.valid) {
        totalReward += result.reward;
        steps++;

        // Add to replay buffer
        this.agent.replayBuffer.add(
          state,
          action,
          result.reward,
          result.nextState,
          result.done
        );

        // Train on batch if buffer is ready
        if (this.agent.replayBuffer.isReady()) {
          const batch = this.agent.replayBuffer.sample(CONFIG.DQN.BATCH_SIZE);
          if (batch) {
            await this.agent.dqn.train(batch);
          }
        }

        // Visual update
        if (this.onTrainingUpdate) {
          this.onTrainingUpdate(this.agent, steps);
        }

        // Delay for visualization
        await this.sleep(this.updateDelay);
      }
    }

    // CHECK CANCELLATION - Exit before episode end processing
    if (this.cancelled) {
      console.log('🚫 Episode cancelled during rollout at step', steps);
      return;
    }

    // Episode end
    this.episodeRewards.push(totalReward);
    this.episodeSteps.push(steps);
    this.episodeSuccesses.push(this.agent.stats.completed ? 1 : 0);

    // Decay parameters
    this.agent.dqn.decayEpsilon();
    this.agent.dqn.decayImitation();

    // Update target network periodically
    if (this.episode % CONFIG.DQN.TARGET_UPDATE_FREQ === 0) {
      this.agent.dqn.updateTargetModel();
    }

    // Callback
    if (this.onEpisodeEnd) {
      this.onEpisodeEnd(this.getEpisodeStats());
    }
  }

  // Get training phase
  getTrainingPhase() {
    if (this.episode <= CONFIG.TRAINING.PHASE_1_EPISODES) return 'imitation';
    if (this.episode <= CONFIG.TRAINING.PHASE_2_EPISODES) return 'hybrid';
    return 'autonomous';
  }

  // Get episode statistics
  getEpisodeStats() {
    return {
      agentType: this.agent.agentType,
      episode: this.episode,
      reward: this.episodeRewards[this.episodeRewards.length - 1] || 0,
      steps: this.episodeSteps[this.episodeSteps.length - 1] || 0,
      success: this.episodeSuccesses[this.episodeSuccesses.length - 1] === 1,
      epsilon: this.agent.dqn.epsilon,
      imitationWeight: this.agent.dqn.imitationWeight,
      phase: this.getTrainingPhase(),
      avgReward: this.getAverageReward(10),
      successRate: this.getSuccessRate(10),
      loss: this.agent.dqn.getAverageLoss(10)
    };
  }

  // Get average reward over last N episodes
  getAverageReward(n = 10) {
    if (this.episodeRewards.length === 0) return 0;

    const recent = this.episodeRewards.slice(-n);
    return recent.reduce((a, b) => a + b, 0) / recent.length;
  }

  // Get success rate over last N episodes
  getSuccessRate(n = 10) {
    if (this.episodeSuccesses.length === 0) return 0;

    const recent = this.episodeSuccesses.slice(-n);
    return recent.reduce((a, b) => a + b, 0) / recent.length;
  }

  // Get average steps over last N episodes
  getAverageSteps(n = 10) {
    if (this.episodeSteps.length === 0) return 0;

    const recent = this.episodeSteps.slice(-n);
    return recent.reduce((a, b) => a + b, 0) / recent.length;
  }

  // Sleep utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Set training speed
  setSpeed(speed) {
    // speed: 0 (fastest) to 200 (slowest)
    this.updateDelay = speed;
  }

  // Get training progress summary
  getTrainingSummary() {
    return {
      episodes: this.episode,
      phase: this.getTrainingPhase(),
      avgReward: this.getAverageReward(50),
      successRate: this.getSuccessRate(50),
      avgSteps: this.getAverageSteps(50),
      epsilon: this.agent.dqn.epsilon,
      imitationWeight: this.agent.dqn.imitationWeight,
      bufferSize: this.agent.replayBuffer.size(),
      trainingSteps: this.agent.dqn.trainingSteps
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TrainingManager;
}
