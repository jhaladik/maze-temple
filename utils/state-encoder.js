// State Encoder - Compact feature extraction for DQN
// Converts maze state to neural network input

class StateEncoder {
  constructor(agentType = 'explorer') {
    this.agentType = agentType;
    this.config = CONFIG.AGENTS[agentType.toUpperCase()];
    this.stateSize = this.config.stateSize;
  }

  // Main encoding function
  encode(agent, maze) {
    switch(this.agentType) {
      case 'explorer':
        return this.encodeExplorer(agent, maze);
      case 'collector':
        return this.encodeCollector(agent, maze);
      case 'protector':
        return this.encodeProtector(agent, maze);
      default:
        return this.encodeExplorer(agent, maze);
    }
  }

  // Explorer state: focus on navigation and mapping
  // Features: 16 total
  encodeExplorer(agent, maze) {
    const features = [];

    // 1-2: Normalized position (0-1)
    features.push(agent.x / maze.size);
    features.push(agent.y / maze.size);

    // 3-4: Goal direction (sin/cos for continuity)
    const angleToGoal = Math.atan2(
      maze.goalY - agent.y,
      maze.goalX - agent.x
    );
    features.push(Math.sin(angleToGoal));
    features.push(Math.cos(angleToGoal));

    // 5-6: Distance to goal (normalized)
    const distToGoal = Math.sqrt(
      Math.pow(maze.goalX - agent.x, 2) +
      Math.pow(maze.goalY - agent.y, 2)
    );
    features.push(distToGoal / (maze.size * Math.sqrt(2))); // Normalize by max distance
    features.push(distToGoal / Math.max(1, agent.stats.steps || 1)); // Distance per step

    // 7-10: Adjacent walls (4 directions)
    for (const [dx, dy] of CONFIG.ACTIONS.DELTAS) {
      const nx = agent.x + dx;
      const ny = agent.y + dy;
      features.push(maze.isWalkable(nx, ny) ? 0 : 1);
    }

    // 11-14: Local occupancy grid (2x2 ahead based on direction to goal)
    const localGrid = this.getLocalGrid(agent, maze, 1);
    features.push(...localGrid);

    // 15: Exploration progress (cells visited / total cells)
    const totalVisited = maze.visitedCells.flat().filter(v => v > 0).length;
    features.push(totalVisited / (maze.size * maze.size));

    // 16: Path efficiency (optimal distance / actual steps)
    const optimalDist = Math.abs(maze.goalX - maze.startX) +
                       Math.abs(maze.goalY - maze.startY);
    const efficiency = agent.stats.steps > 0 ?
                      optimalDist / agent.stats.steps : 1;
    features.push(Math.min(1, efficiency));

    return features;
  }

  // Collector state: focus on gems
  // Features: 24 total
  encodeCollector(agent, maze) {
    const features = [];

    // Start with explorer features (16)
    const explorerFeatures = this.encodeExplorer(agent, maze);
    features.push(...explorerFeatures);

    // 17-20: Nearest positive gems (distance + direction, top 2)
    const nearestPositiveGems = this.findNearestGems(agent, maze, true, 2);
    for (const gem of nearestPositiveGems) {
      features.push(gem.distance / maze.size);
      features.push(gem.angle);
    }

    // 21-24: Nearest negative gems (distance + direction, top 2)
    const nearestNegativeGems = this.findNearestGems(agent, maze, false, 2);
    for (const gem of nearestNegativeGems) {
      features.push(gem.distance / maze.size);
      features.push(gem.angle);
    }

    return features.slice(0, 24); // Ensure exactly 24 features
  }

  // Protector state: focus on safety
  // Features: 32 total
  encodeProtector(agent, maze) {
    const features = [];

    // Start with collector features (24)
    const collectorFeatures = this.encodeCollector(agent, maze);
    features.push(...collectorFeatures);

    // 25-26: Health/shield status (for future expansion)
    features.push(agent.health || 100 / 100);
    features.push(agent.shieldActive ? 1 : 0);

    // 27-28: Hazard proximity (nearest negative gem)
    const nearestHazard = this.findNearestGems(agent, maze, false, 1)[0];
    if (nearestHazard) {
      features.push(nearestHazard.distance / maze.size);
      features.push(nearestHazard.angle);
    } else {
      features.push(1.0);
      features.push(0.0);
    }

    // 29: Safe moves streak
    features.push(Math.min(1, (agent.stats.safeMovesStreak || 0) / 50));

    // 30: Negative gems avoided
    const avoidanceRate = agent.stats.negativeGemsAvoided /
                         Math.max(1, maze.negativeGems);
    features.push(avoidanceRate);

    // 31-32: Escape route quality (walkable cells in each direction)
    let escapeOptions = 0;
    for (const [dx, dy] of CONFIG.ACTIONS.DELTAS) {
      if (maze.isWalkable(agent.x + dx, agent.y + dy)) escapeOptions++;
    }
    features.push(escapeOptions / 4);
    features.push(escapeOptions >= 2 ? 1 : 0); // Binary: multiple escape routes

    return features.slice(0, 32); // Ensure exactly 32 features
  }

  // Helper: Get local grid occupancy
  getLocalGrid(agent, maze, radius) {
    const grid = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue; // Skip agent's position

        const nx = agent.x + dx;
        const ny = agent.y + dy;

        if (nx < 0 || nx >= maze.size || ny < 0 || ny >= maze.size) {
          grid.push(1); // Out of bounds = wall
        } else {
          const cell = maze.getCell(nx, ny);
          // Encode: 0=empty, 0.5=positive, 1=wall/negative
          let value = 0;
          if (cell.type === CONFIG.CELL_TYPES.WALL) value = 1;
          else if (cell.type >= CONFIG.CELL_TYPES.GEM_NEGATIVE_SMALL &&
                   cell.type <= CONFIG.CELL_TYPES.GEM_NEGATIVE_LARGE) value = 1;
          else if (cell.type >= CONFIG.CELL_TYPES.GEM_POSITIVE_SMALL &&
                   cell.type <= CONFIG.CELL_TYPES.GEM_POSITIVE_LARGE) value = 0.5;
          grid.push(value);
        }
      }
    }
    return grid.slice(0, 4); // Return 4 features for 2x2 grid minus center
  }

  // Helper: Find nearest gems
  findNearestGems(agent, maze, positive, count) {
    const gems = [];

    // Scan maze for gems
    for (let y = 0; y < maze.size; y++) {
      for (let x = 0; x < maze.size; x++) {
        const cell = maze.getCell(x, y);
        const isPositive = cell.type >= CONFIG.CELL_TYPES.GEM_POSITIVE_SMALL &&
                          cell.type <= CONFIG.CELL_TYPES.GEM_POSITIVE_LARGE;
        const isNegative = cell.type >= CONFIG.CELL_TYPES.GEM_NEGATIVE_SMALL &&
                          cell.type <= CONFIG.CELL_TYPES.GEM_NEGATIVE_LARGE;

        if ((positive && isPositive) || (!positive && isNegative)) {
          const dx = x - agent.x;
          const dy = y - agent.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) / Math.PI; // Normalize to [-1, 1]

          gems.push({ x, y, distance, angle, value: cell.value });
        }
      }
    }

    // Sort by distance and return top N
    gems.sort((a, b) => a.distance - b.distance);
    const result = gems.slice(0, count);

    // Pad with default values if not enough gems
    while (result.length < count) {
      result.push({ distance: maze.size * Math.sqrt(2), angle: 0, value: 0 });
    }

    return result;
  }

  // Calculate state distance (for imitation learning matching)
  distance(state1, state2) {
    if (state1.length !== state2.length) {
      throw new Error('State vectors must have same length');
    }

    let sum = 0;
    for (let i = 0; i < state1.length; i++) {
      sum += Math.pow(state1[i] - state2[i], 2);
    }
    return Math.sqrt(sum);
  }

  // Normalize state vector (ensure all features in [0, 1] or [-1, 1])
  normalize(state) {
    // Already normalized in encoding, but can apply additional normalization
    return state.map(v => {
      if (v < -1) return -1;
      if (v > 1) return 1;
      return v;
    });
  }

  // Convert state array to tensor (for TensorFlow.js)
  toTensor(state) {
    if (typeof tf !== 'undefined') {
      return tf.tensor2d([state], [1, state.length]);
    }
    return state; // Fallback if TensorFlow not loaded
  }

  // Batch convert states to tensor
  batchToTensor(states) {
    if (typeof tf !== 'undefined') {
      return tf.tensor2d(states, [states.length, states[0].length]);
    }
    return states;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StateEncoder;
}
