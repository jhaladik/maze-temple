// Replay Buffer - Experience replay for DQN training
// Implements prioritized experience replay

class ReplayBuffer {
  constructor(capacity = CONFIG.DQN.REPLAY_BUFFER_SIZE) {
    this.capacity = capacity;
    this.buffer = [];
    this.position = 0;
  }

  // Add experience to buffer
  add(state, action, reward, nextState, done) {
    const experience = {
      state: state,
      action: action,
      reward: reward,
      nextState: nextState,
      done: done,
      timestamp: Date.now()
    };

    if (this.buffer.length < this.capacity) {
      this.buffer.push(experience);
    } else {
      // Circular buffer: overwrite oldest
      this.buffer[this.position] = experience;
    }

    this.position = (this.position + 1) % this.capacity;
  }

  // Sample random batch
  sample(batchSize) {
    if (this.buffer.length < batchSize) {
      return null;
    }

    const indices = [];
    const batch = [];

    // Random sampling without replacement
    while (indices.length < batchSize) {
      const idx = Math.floor(Math.random() * this.buffer.length);
      if (!indices.includes(idx)) {
        indices.push(idx);
        batch.push(this.buffer[idx]);
      }
    }

    return batch;
  }

  // Sample with recency bias (prefer recent experiences)
  sampleRecent(batchSize, recentRatio = 0.7) {
    if (this.buffer.length < batchSize) {
      return null;
    }

    const batch = [];
    const recentCount = Math.floor(batchSize * recentRatio);
    const oldCount = batchSize - recentCount;

    // Sample recent experiences (last 50% of buffer)
    const recentStart = Math.floor(this.buffer.length * 0.5);
    for (let i = 0; i < recentCount; i++) {
      const idx = recentStart + Math.floor(Math.random() * (this.buffer.length - recentStart));
      batch.push(this.buffer[idx]);
    }

    // Sample older experiences
    for (let i = 0; i < oldCount; i++) {
      const idx = Math.floor(Math.random() * recentStart);
      batch.push(this.buffer[idx]);
    }

    return batch;
  }

  // Get current size
  size() {
    return this.buffer.length;
  }

  // Check if ready for training
  isReady(minSize = CONFIG.DQN.BATCH_SIZE) {
    return this.buffer.length >= minSize;
  }

  // Clear buffer
  clear() {
    this.buffer = [];
    this.position = 0;
  }

  // Get statistics
  getStats() {
    if (this.buffer.length === 0) {
      return {
        size: 0,
        avgReward: 0,
        minReward: 0,
        maxReward: 0,
        successRate: 0
      };
    }

    let totalReward = 0;
    let minReward = Infinity;
    let maxReward = -Infinity;
    let successes = 0;

    this.buffer.forEach(exp => {
      totalReward += exp.reward;
      minReward = Math.min(minReward, exp.reward);
      maxReward = Math.max(maxReward, exp.reward);
      if (exp.done && exp.reward > 50) successes++; // Goal reached
    });

    return {
      size: this.buffer.length,
      avgReward: totalReward / this.buffer.length,
      minReward: minReward,
      maxReward: maxReward,
      successRate: successes / this.buffer.length
    };
  }
}

// Prioritized Replay Buffer (for Phase 3+)
class PrioritizedReplayBuffer extends ReplayBuffer {
  constructor(capacity = CONFIG.DQN.REPLAY_BUFFER_SIZE) {
    super(capacity);
    this.priorities = [];
    this.alpha = 0.6; // Priority exponent
    this.beta = 0.4;  // Importance sampling exponent
    this.betaIncrement = 0.001;
    this.epsilon = 0.01; // Small constant to avoid zero priority
  }

  // Add experience with TD error
  add(state, action, reward, nextState, done, tdError = null) {
    super.add(state, action, reward, nextState, done);

    // Set priority based on TD error
    const priority = tdError !== null ?
                    Math.abs(tdError) + this.epsilon :
                    1.0; // Max priority for new experiences

    if (this.priorities.length < this.capacity) {
      this.priorities.push(priority);
    } else {
      this.priorities[this.position] = priority;
    }
  }

  // Sample based on priority
  sample(batchSize) {
    if (this.buffer.length < batchSize) {
      return null;
    }

    // Calculate probabilities from priorities
    const totalPriority = this.priorities.reduce((sum, p) => sum + Math.pow(p, this.alpha), 0);
    const probs = this.priorities.map(p => Math.pow(p, this.alpha) / totalPriority);

    // Sample indices based on probabilities
    const indices = [];
    const batch = [];
    const weights = [];

    for (let i = 0; i < batchSize; i++) {
      const idx = this.sampleIndex(probs);
      indices.push(idx);
      batch.push(this.buffer[idx]);

      // Calculate importance sampling weight
      const prob = probs[idx];
      const weight = Math.pow(this.buffer.length * prob, -this.beta);
      weights.push(weight);
    }

    // Normalize weights
    const maxWeight = Math.max(...weights);
    const normalizedWeights = weights.map(w => w / maxWeight);

    // Anneal beta
    this.beta = Math.min(1.0, this.beta + this.betaIncrement);

    return {
      experiences: batch,
      indices: indices,
      weights: normalizedWeights
    };
  }

  sampleIndex(probs) {
    const rand = Math.random();
    let cumProb = 0;

    for (let i = 0; i < probs.length; i++) {
      cumProb += probs[i];
      if (rand <= cumProb) {
        return i;
      }
    }

    return probs.length - 1; // Fallback
  }

  // Update priorities after training
  updatePriorities(indices, tdErrors) {
    indices.forEach((idx, i) => {
      this.priorities[idx] = Math.abs(tdErrors[i]) + this.epsilon;
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ReplayBuffer, PrioritizedReplayBuffer };
}
