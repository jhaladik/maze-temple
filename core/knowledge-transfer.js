// Knowledge Transfer - Share learned weights between agents
// Enables curriculum learning: Explorer → Collector → Protector

class KnowledgeTransfer {
  constructor() {
    this.transferHistory = [];
  }

  // Transfer weights from source agent to target agent
  async transferWeights(sourceAgent, targetAgent, options = {}) {
    const transferType = options.type || 'copy'; // 'copy' or 'blend'
    const optimismBonus = options.optimismBonus || 0.1;
    const freezeLayers = options.freezeLayers || false;

    console.log(`Transferring knowledge: ${sourceAgent.agentType} → ${targetAgent.agentType}`);

    try {
      // Get source weights
      const sourceWeights = sourceAgent.dqn.model.getWeights();

      // Determine how to transfer based on network size compatibility
      const sourceConfig = sourceAgent.config;
      const targetConfig = targetAgent.config;

      if (sourceConfig.stateSize === targetConfig.stateSize) {
        // Same state size: direct transfer
        await this.directTransfer(sourceWeights, targetAgent.dqn.model, optimismBonus);
      } else if (sourceConfig.stateSize < targetConfig.stateSize) {
        // Target has more features: partial transfer of shared layers
        await this.partialTransfer(sourceWeights, targetAgent.dqn.model, sourceConfig, targetConfig, optimismBonus);
      } else {
        // Source has more features: cannot transfer (different architecture)
        console.warn('Cannot transfer: Source has larger state space than target');
        return false;
      }

      // Update target network
      targetAgent.dqn.updateTargetModel();

      // Reset epsilon for exploration with transferred knowledge
      targetAgent.dqn.epsilon = CONFIG.DQN.EPSILON_START * 0.6; // Start with less exploration

      // Record transfer
      this.transferHistory.push({
        from: sourceAgent.agentType,
        to: targetAgent.agentType,
        timestamp: Date.now(),
        type: transferType
      });

      console.log('✓ Knowledge transfer complete');
      return true;

    } catch (error) {
      console.error('Knowledge transfer failed:', error);
      return false;
    }
  }

  // Direct transfer for same-sized networks
  async directTransfer(sourceWeights, targetModel, optimismBonus) {
    const transferredWeights = sourceWeights.map((weight, i) => {
      const cloned = weight.clone();

      // Add optimism bonus to encourage exploration with new knowledge
      if (i % 2 === 1 && optimismBonus > 0) { // Bias layers (odd indices)
        return cloned.add(tf.scalar(optimismBonus));
      }

      return cloned;
    });

    targetModel.setWeights(transferredWeights);

    // Dispose cloned tensors
    transferredWeights.forEach(t => t.dispose());
  }

  // Partial transfer for different-sized networks (e.g., Explorer → Collector)
  async partialTransfer(sourceWeights, targetModel, sourceConfig, targetConfig, optimismBonus) {
    const targetWeights = targetModel.getWeights();

    // Transfer only the compatible layers (initial layers that match)
    const transferredWeights = targetWeights.map((targetWeight, i) => {
      if (i < sourceWeights.length) {
        const sourceWeight = sourceWeights[i];

        // Check if dimensions are compatible
        const sourceShape = sourceWeight.shape;
        const targetShape = targetWeight.shape;

        // For weight matrices (2D tensors)
        if (sourceShape.length === 2 && targetShape.length === 2) {
          // If input dimensions match, transfer
          if (sourceShape[0] === targetShape[0]) {
            return sourceWeight.clone();
          }
          // If source is smaller (fewer features), pad with random values
          else if (sourceShape[0] < targetShape[0]) {
            const padding = targetShape[0] - sourceShape[0];
            const paddingTensor = tf.randomNormal([padding, targetShape[1]], 0, 0.1);
            const combined = tf.concat([sourceWeight, paddingTensor], 0);
            paddingTensor.dispose();
            return combined;
          }
        }
        // For bias vectors (1D tensors)
        else if (sourceShape.length === 1 && targetShape.length === 1) {
          if (sourceShape[0] === targetShape[0]) {
            const cloned = sourceWeight.clone();
            if (optimismBonus > 0) {
              return cloned.add(tf.scalar(optimismBonus));
            }
            return cloned;
          }
        }
      }

      // Keep target's original weights if incompatible
      return targetWeight.clone();
    });

    targetModel.setWeights(transferredWeights);

    // Dispose cloned tensors
    transferredWeights.forEach(t => t.dispose());
  }

  // Blend weights from multiple source agents (for ensemble learning)
  async blendWeights(sourceAgents, targetAgent, weights = null) {
    if (sourceAgents.length === 0) return false;

    // Equal weights if not specified
    if (!weights) {
      weights = Array(sourceAgents.length).fill(1.0 / sourceAgents.length);
    }

    console.log(`Blending knowledge from ${sourceAgents.length} agents`);

    try {
      const allSourceWeights = sourceAgents.map(agent => agent.dqn.model.getWeights());
      const targetWeights = targetAgent.dqn.model.getWeights();

      // Blend each layer
      const blendedWeights = targetWeights.map((targetWeight, layerIdx) => {
        let blended = tf.zerosLike(targetWeight);

        // Weighted sum of source weights
        allSourceWeights.forEach((sourceWeights, agentIdx) => {
          if (layerIdx < sourceWeights.length) {
            const sourceWeight = sourceWeights[layerIdx];

            // Only blend if shapes match
            if (this.shapesMatch(sourceWeight.shape, targetWeight.shape)) {
              const weighted = sourceWeight.mul(tf.scalar(weights[agentIdx]));
              const newBlended = blended.add(weighted);
              blended.dispose();
              weighted.dispose();
              blended = newBlended;
            }
          }
        });

        return blended;
      });

      targetAgent.dqn.model.setWeights(blendedWeights);
      targetAgent.dqn.updateTargetModel();

      // Dispose blended tensors
      blendedWeights.forEach(t => t.dispose());

      console.log('✓ Blend complete');
      return true;

    } catch (error) {
      console.error('Blend failed:', error);
      return false;
    }
  }

  // Helper: Check if tensor shapes match
  shapesMatch(shape1, shape2) {
    if (shape1.length !== shape2.length) return false;
    return shape1.every((dim, i) => dim === shape2[i]);
  }

  // Get transfer history
  getHistory() {
    return this.transferHistory;
  }

  // Clear transfer history
  clearHistory() {
    this.transferHistory = [];
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KnowledgeTransfer;
}
