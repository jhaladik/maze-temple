// Deep Q-Network with Imitation Learning
// TensorFlow.js implementation with noise injection

class DQN {
  constructor(stateSize, actionSize, networkConfig = 'MICRO') {
    this.stateSize = stateSize;
    this.actionSize = actionSize;
    this.networkConfig = networkConfig;

    // Hyperparameters
    this.learningRate = CONFIG.DQN.LEARNING_RATE;
    this.gamma = CONFIG.DQN.GAMMA;
    this.epsilon = CONFIG.DQN.EPSILON_START;
    this.epsilonMin = CONFIG.DQN.EPSILON_END;
    this.epsilonDecay = CONFIG.DQN.EPSILON_DECAY;

    // Noise parameters
    this.parameterNoiseStddev = CONFIG.DQN.PARAMETER_NOISE_STDDEV;
    this.rewardNoiseStddev = CONFIG.DQN.REWARD_NOISE_STDDEV;
    this.minReward = CONFIG.DQN.MIN_REWARD;

    // Imitation learning parameters
    this.imitationWeight = CONFIG.IMITATION.INITIAL_WEIGHT;
    this.imitationDecay = CONFIG.IMITATION.DECAY_RATE;
    this.imitationMin = CONFIG.IMITATION.MIN_WEIGHT;

    // Build networks
    this.model = this.buildNetwork();
    this.targetModel = this.buildNetwork();
    this.updateTargetModel();

    // Initialize with optimistic values
    this.initializeOptimistic();

    // Training metrics
    this.trainingSteps = 0;
    this.lossHistory = [];
  }

  // Build neural network
  buildNetwork() {
    if (typeof tf === 'undefined') {
      console.error('TensorFlow.js not loaded!');
      return null;
    }

    const model = tf.sequential();

    // Get layer sizes from config
    const layers = CONFIG.DQN.NETWORKS[this.networkConfig];

    // Input layer
    model.add(tf.layers.dense({
      inputShape: [this.stateSize],
      units: layers[0],
      activation: 'relu',
      kernelInitializer: 'heNormal'
    }));

    // Hidden layers
    for (let i = 1; i < layers.length; i++) {
      model.add(tf.layers.dense({
        units: layers[i],
        activation: 'relu',
        kernelInitializer: 'heNormal'
      }));
    }

    // Output layer (Q-values for each action)
    model.add(tf.layers.dense({
      units: this.actionSize,
      activation: 'linear',
      kernelInitializer: 'heNormal'
    }));

    // Compile model
    model.compile({
      optimizer: tf.train.adam(this.learningRate),
      loss: 'meanSquaredError',
      metrics: ['mse']
    });

    return model;
  }

  // Initialize with optimistic bias (avoid zero Q-values)
  initializeOptimistic() {
    if (!this.model) return;

    const layers = this.model.layers;
    layers.forEach((layer, idx) => {
      if (layer.getWeights().length > 0) {
        // Set positive bias on output layer
        if (idx === layers.length - 1) {
          const weights = layer.getWeights();
          if (weights.length >= 2) {
            const bias = weights[1];
            // Clone kernel and create optimistic bias
            const kernelClone = weights[0].clone();
            const optimisticBias = tf.fill(bias.shape, CONFIG.DQN.INITIAL_Q_BIAS);
            // Set new weights (layer takes ownership, old weights auto-disposed)
            layer.setWeights([kernelClone, optimisticBias]);
          }
        }
      }
    });
  }

  // Predict Q-values for a state
  predict(state, addNoise = false) {
    if (!this.model) return null;

    return tf.tidy(() => {
      let stateTensor;
      if (Array.isArray(state)) {
        stateTensor = tf.tensor2d([state]);
      } else {
        stateTensor = state;
      }

      let qValues = this.model.predict(stateTensor);

      // Add parameter noise during exploration
      if (addNoise && this.parameterNoiseStddev > 0) {
        const noise = tf.randomNormal(qValues.shape, 0, this.parameterNoiseStddev);
        qValues = qValues.add(noise);
      }

      return qValues;
    });
  }

  // Select action using epsilon-greedy with imitation - NOW ASYNC!
  async selectAction(state, demos = null, training = true) {
    // Epsilon-greedy exploration
    if (training && Math.random() < this.epsilon) {
      // Exploration: use imitation or random
      if (demos && demos.length > 0 && Math.random() < this.imitationWeight) {
        return this.getImitationAction(state, demos);
      } else {
        return Math.floor(Math.random() * this.actionSize);
      }
    } else {
      // Exploitation: use learned policy
      const qValues = this.predict(state, false);
      if (!qValues) {
        // Model not ready, use random action
        return Math.floor(Math.random() * this.actionSize);
      }
      // ASYNC - Use .data() instead of .dataSync() to avoid blocking
      const actionTensor = qValues.argMax(-1);
      const actionData = await actionTensor.data();
      const action = actionData[0];

      // Dispose tensors
      actionTensor.dispose();
      qValues.dispose();

      return action;
    }
  }

  // Get action from demonstration matching
  getImitationAction(state, demos) {
    if (!demos || demos.length === 0) {
      return Math.floor(Math.random() * this.actionSize);
    }

    let bestMatch = null;
    let bestDistance = Infinity;

    // Find closest state in demonstrations
    for (const demo of demos) {
      for (const step of demo.sequence) {
        const distance = this.stateDistance(state, step.state);

        if (distance < bestDistance &&
            distance < CONFIG.IMITATION.STATE_MATCH_THRESHOLD) {
          bestDistance = distance;
          bestMatch = step;
        }
      }
    }

    return bestMatch ? bestMatch.action : Math.floor(Math.random() * this.actionSize);
  }

  // Calculate Euclidean distance between states
  stateDistance(state1, state2) {
    let sum = 0;
    const len = Math.min(state1.length, state2.length);
    for (let i = 0; i < len; i++) {
      sum += Math.pow(state1[i] - state2[i], 2);
    }
    return Math.sqrt(sum);
  }

  // Train on a batch of experiences
  async train(batch) {
    if (!this.model || !this.targetModel) return null;

    // Extract components from batch
    const states = batch.map(exp => exp.state);
    const actions = batch.map(exp => exp.action);
    const rewards = batch.map(exp => {
      // Add reward noise to avoid zero values
      let r = exp.reward;
      if (this.rewardNoiseStddev > 0) {
        r += (Math.random() - 0.5) * 2 * this.rewardNoiseStddev;
      }
      return Math.max(this.minReward, r);
    });
    const nextStates = batch.map(exp => exp.nextState);
    const dones = batch.map(exp => exp.done ? 1 : 0);

    // Convert to tensors
    const statesTensor = tf.tensor2d(states);
    const nextStatesTensor = tf.tensor2d(nextStates);

    // Get current Q-values
    const currentQs = this.model.predict(statesTensor);

    // Get next Q-values from target network
    const nextQs = this.targetModel.predict(nextStatesTensor);
    const maxNextQs = nextQs.max(-1);

    // Calculate target Q-values - ASYNC to avoid blocking
    const targetsArray = await currentQs.array();  // Use .array() instead of .arraySync()
    const maxNextQsArray = await maxNextQs.data();  // Use .data() instead of .dataSync()

    for (let i = 0; i < batch.length; i++) {
      const target = rewards[i] + (1 - dones[i]) * this.gamma * maxNextQsArray[i];
      targetsArray[i][actions[i]] = target;
    }

    const targetsTensor = tf.tensor2d(targetsArray);

    // Train model (async operation - cannot use tf.tidy)
    return this.model.fit(statesTensor, targetsTensor, {
      epochs: 1,
      verbose: 0,
      batchSize: batch.length
    }).then(history => {
      this.trainingSteps++;

      // Record loss
      const loss = history.history.loss[0];
      this.lossHistory.push(loss);
      if (this.lossHistory.length > 100) {
        this.lossHistory.shift();
      }

      // Cleanup tensors manually (since we can't use tf.tidy with async)
      statesTensor.dispose();
      nextStatesTensor.dispose();
      currentQs.dispose();
      nextQs.dispose();
      maxNextQs.dispose();
      targetsTensor.dispose();

      return { loss: loss, steps: this.trainingSteps };
    });
  }

  // Behavioral cloning: supervised learning from demos
  async trainOnDemonstrations(demos, epochs = 5) {
    if (!this.model || demos.length === 0) return null;

    // Collect all state-action pairs from demos
    const states = [];
    const actions = [];

    demos.forEach(demo => {
      demo.sequence.forEach(step => {
        states.push(step.state);
        actions.push(step.action);
      });
    });

    if (states.length === 0) return null;

    // Create tensors
    const statesTensor = tf.tensor2d(states);
    const actionsTensor = tf.oneHot(tf.tensor1d(actions, 'int32'), this.actionSize);

    // Train model (async operation - cannot use tf.tidy)
    return this.model.fit(statesTensor, actionsTensor, {
      epochs: epochs,
      verbose: 0,
      batchSize: 32,
      shuffle: true
    }).then(history => {
      // Cleanup tensors manually
      statesTensor.dispose();
      actionsTensor.dispose();

      return {
        loss: history.history.loss[epochs - 1],
        samples: states.length
      };
    });
  }

  // Update target network
  updateTargetModel() {
    if (!this.model || !this.targetModel) return;

    const weights = this.model.getWeights();
    const weightValues = weights.map(w => w.clone());
    this.targetModel.setWeights(weightValues);

    // Note: Don't dispose 'weights' - they are references to the model's internal weights
    // The cloned 'weightValues' are now owned by targetModel and will be managed automatically
  }

  // Decay exploration parameters
  decayEpsilon() {
    this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);
  }

  decayImitation() {
    this.imitationWeight = Math.max(
      this.imitationMin,
      this.imitationWeight * this.imitationDecay
    );
  }

  // Get training phase
  getTrainingPhase() {
    if (this.imitationWeight > 0.3) return 'imitation';
    if (this.imitationWeight > 0.1) return 'hybrid';
    return 'autonomous';
  }

  // Save model weights
  async saveWeights() {
    if (!this.model) return null;

    try {
      const weights = this.model.getWeights();
      const weightData = await Promise.all(
        weights.map(async (w) => {
          const data = await w.data();
          return {
            shape: w.shape,
            data: Array.from(data)
          };
        })
      );

      return {
        architecture: this.networkConfig,
        stateSize: this.stateSize,
        actionSize: this.actionSize,
        weights: weightData,
        hyperparameters: {
          epsilon: this.epsilon,
          imitationWeight: this.imitationWeight,
          trainingSteps: this.trainingSteps
        }
      };
    } catch (error) {
      console.error('Error saving weights:', error);
      return null;
    }
  }

  // Load model weights
  async loadWeights(weightData) {
    if (!this.model || !weightData) return false;

    try {
      const weights = weightData.weights.map(w => {
        return tf.tensor(w.data, w.shape);
      });

      this.model.setWeights(weights);
      this.updateTargetModel();

      // Restore hyperparameters
      if (weightData.hyperparameters) {
        this.epsilon = weightData.hyperparameters.epsilon;
        this.imitationWeight = weightData.hyperparameters.imitationWeight;
        this.trainingSteps = weightData.hyperparameters.trainingSteps;
      }

      // Cleanup
      weights.forEach(w => w.dispose());

      return true;
    } catch (error) {
      console.error('Error loading weights:', error);
      return false;
    }
  }

  // Get average loss
  getAverageLoss(lastN = 10) {
    if (this.lossHistory.length === 0) return 0;

    const recent = this.lossHistory.slice(-lastN);
    return recent.reduce((a, b) => a + b, 0) / recent.length;
  }

  // Dispose models (cleanup)
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    if (this.targetModel) {
      this.targetModel.dispose();
      this.targetModel = null;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DQN;
}
