// Demo Recorder - Records and manages human demonstrations for imitation learning
// Stores high-quality demos for AI training

class DemonstrationRecorder {
  constructor(persistence) {
    this.persistence = persistence;
    this.currentDemo = null;
    this.recording = false;
    this.stateEncoder = new StateEncoder('explorer'); // Default to explorer
  }

  // Start recording a new demonstration
  startRecording(maze, agentType = 'explorer') {
    this.recording = true;
    this.stateEncoder = new StateEncoder(agentType);

    this.currentDemo = {
      id: this.generateId(),
      agentType: agentType,
      mazeConfig: maze.serialize ? maze.serialize() : this.serializeMaze(maze),
      sequence: [],
      startTime: Date.now(),
      metadata: {
        steps: 0,
        score: 0,
        gemsCollected: 0,
        completed: false
      }
    };
  }

  // Record a single step (state, action, reward)
  recordStep(agent, maze, action, result) {
    if (!this.recording || !this.currentDemo) return;

    // Encode state
    const state = this.stateEncoder.encode(agent, maze);

    // Record step
    this.currentDemo.sequence.push({
      state: state,
      action: action,
      reward: result.reward,
      timestamp: Date.now() - this.currentDemo.startTime
    });

    // Update metadata
    this.currentDemo.metadata.steps++;
    this.currentDemo.metadata.score = agent.stats.score;
    this.currentDemo.metadata.gemsCollected = agent.stats.gemsCollected;
    this.currentDemo.metadata.completed = result.completed || false;
  }

  // Stop recording and save if quality threshold met
  stopRecording(agent, maze) {
    if (!this.recording || !this.currentDemo) return null;

    this.recording = false;

    // Finalize metadata
    this.currentDemo.metadata.timeElapsed = Date.now() - this.currentDemo.startTime;
    this.currentDemo.metadata.efficiency = this.calculateEfficiency(agent, maze);
    this.currentDemo.metadata.completionRate = agent.stats.score / maze.maxScore;

    // Calculate quality score
    const quality = this.calculateQuality(this.currentDemo);

    // Save if quality threshold met
    if (quality >= CONFIG.IMITATION.MIN_DEMO_QUALITY) {
      this.currentDemo.metadata.quality = quality;
      const saved = this.persistence.saveDemo(this.currentDemo);

      const demo = this.currentDemo;
      this.currentDemo = null;
      return { saved: true, demo: demo, quality: quality };
    }

    this.currentDemo = null;
    return { saved: false, quality: quality };
  }

  // Calculate demonstration quality (0-1)
  calculateQuality(demo) {
    const m = demo.metadata;

    // Completion is most important
    const completionScore = m.completed ? 1.0 : (m.completionRate || 0);

    // Efficiency (lower steps is better)
    const efficiencyScore = m.efficiency || 0;

    // Gem collection rate
    const gemScore = m.gemsCollected / Math.max(1, m.steps);

    // Weighted combination
    return (
      completionScore * 0.5 +
      efficiencyScore * 0.3 +
      Math.min(1, gemScore * 5) * 0.2
    );
  }

  calculateEfficiency(agent, maze) {
    if (agent.stats.steps === 0) return 0;
    return Math.min(1, maze.optimalSteps / agent.stats.steps);
  }

  // Get all demonstrations
  getDemos(agentType = null) {
    const allDemos = this.persistence.loadDemos();

    if (agentType) {
      return allDemos.filter(d => d.agentType === agentType);
    }

    return allDemos;
  }

  // Get demonstrations relevant to a specific maze
  getRelevantDemos(maze, agentType = null, maxDemos = 10) {
    const allDemos = this.getDemos(agentType);

    // Score demos by relevance to current maze
    const scored = allDemos.map(demo => {
      let score = demo.metadata.quality || 0;

      // Prefer similar maze sizes
      const mazeCfg = demo.mazeConfig;
      if (mazeCfg && mazeCfg.size) {
        const sizeDiff = Math.abs(mazeCfg.size - maze.size);
        score *= Math.max(0.5, 1 - sizeDiff / 10);
      }

      // Prefer similar difficulty
      if (mazeCfg && mazeCfg.difficulty === maze.difficulty) {
        score *= 1.2;
      }

      return { demo: demo, score: score };
    });

    // Sort by score and return top N
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxDemos).map(s => s.demo);
  }

  // Find best matching action from demos for a given state
  getBestMatchingAction(state, demos) {
    if (!demos || demos.length === 0) return null;

    let bestMatch = null;
    let bestDistance = Infinity;

    // Search all demos for closest state
    for (const demo of demos) {
      for (const step of demo.sequence) {
        const distance = this.stateEncoder.distance(state, step.state);

        if (distance < bestDistance &&
            distance < CONFIG.IMITATION.STATE_MATCH_THRESHOLD) {
          bestDistance = distance;
          bestMatch = step;
        }
      }
    }

    return bestMatch ? bestMatch.action : null;
  }

  // Generate unique ID
  generateId() {
    return `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Serialize maze config (fallback if maze doesn't have serialize method)
  serializeMaze(maze) {
    return {
      size: maze.size,
      seed: maze.seed,
      difficulty: maze.difficulty,
      startX: maze.startX,
      startY: maze.startY,
      goalX: maze.goalX,
      goalY: maze.goalY,
      timeLimit: maze.timeLimit
    };
  }

  // Get statistics about demo library
  getLibraryStats() {
    const demos = this.getDemos();

    const byAgentType = {};
    let totalSteps = 0;
    let totalSuccesses = 0;
    let avgQuality = 0;

    demos.forEach(demo => {
      // Count by agent type
      byAgentType[demo.agentType] = (byAgentType[demo.agentType] || 0) + 1;

      // Aggregate stats
      totalSteps += demo.metadata.steps || 0;
      if (demo.metadata.completed) totalSuccesses++;
      avgQuality += demo.metadata.quality || 0;
    });

    if (demos.length > 0) {
      avgQuality /= demos.length;
    }

    return {
      totalDemos: demos.length,
      byAgentType: byAgentType,
      avgStepsPerDemo: demos.length > 0 ? totalSteps / demos.length : 0,
      successRate: demos.length > 0 ? totalSuccesses / demos.length : 0,
      avgQuality: avgQuality
    };
  }

  // Clear all demos (for testing/reset)
  clearAll() {
    this.persistence.clearDemos();
  }

  // Export demos as JSON (for sharing/backup)
  exportDemos() {
    const demos = this.getDemos();
    return JSON.stringify(demos, null, 2);
  }

  // Import demos from JSON
  importDemos(jsonString) {
    try {
      const demos = JSON.parse(jsonString);
      demos.forEach(demo => {
        this.persistence.saveDemo(demo);
      });
      return { success: true, count: demos.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete a specific demo
  deleteDemo(demoId) {
    this.persistence.deleteDemo(demoId);
  }

  // Get top N quality demos
  getTopDemos(count = 10, agentType = null) {
    const demos = this.getDemos(agentType);

    demos.sort((a, b) =>
      (b.metadata.quality || 0) - (a.metadata.quality || 0)
    );

    return demos.slice(0, count);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DemonstrationRecorder;
}
