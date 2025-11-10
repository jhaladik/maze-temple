// Maze Generator - Procedural maze generation with gems and obstacles
// Compact implementation for AI training

class MazeGenerator {
  constructor(config = {}) {
    this.size = config.size || CONFIG.MAZE.DEFAULT_SIZE;
    this.seed = config.seed || Date.now();
    this.difficulty = config.difficulty || 'EASY';

    // Apply difficulty preset
    const preset = CONFIG.DIFFICULTY_PRESETS[this.difficulty];
    this.wallDensity = config.wallDensity || preset.wallDensity;
    this.positiveGemDensity = config.positiveGems || preset.positiveGems;
    this.negativeGemDensity = config.negativeGems || preset.negativeGems;
    this.timeLimit = config.timeLimit || preset.timeLimit;

    // Random number generator (seeded)
    this.rng = this.createRNG(this.seed);
  }

  // Seeded random number generator (LCG)
  createRNG(seed) {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  generate() {
    // Initialize grid
    this.grid = Array(this.size).fill(null).map(() =>
      Array(this.size).fill(CONFIG.CELL_TYPES.EMPTY)
    );

    // Place borders
    this.placeBorders();

    // Place start and goal (opposite corners with some randomness)
    this.placeStartAndGoal();

    // Generate maze structure with walls
    this.generateWalls();

    // Ensure path exists from start to goal
    this.ensurePathExists();

    // Place gems
    this.placeGems();

    // Calculate metadata
    const metadata = this.calculateMetadata();

    return {
      grid: this.grid,
      size: this.size,
      startX: this.startX,
      startY: this.startY,
      goalX: this.goalX,
      goalY: this.goalY,
      timeLimit: this.timeLimit,
      seed: this.seed,
      difficulty: this.difficulty,
      ...metadata
    };
  }

  placeBorders() {
    for (let i = 0; i < this.size; i++) {
      this.grid[0][i] = CONFIG.CELL_TYPES.WALL;
      this.grid[this.size - 1][i] = CONFIG.CELL_TYPES.WALL;
      this.grid[i][0] = CONFIG.CELL_TYPES.WALL;
      this.grid[i][this.size - 1] = CONFIG.CELL_TYPES.WALL;
    }
  }

  placeStartAndGoal() {
    // Start in top-left area (with randomness)
    this.startX = 1 + Math.floor(this.rng() * Math.min(3, this.size - 2));
    this.startY = 1 + Math.floor(this.rng() * Math.min(3, this.size - 2));
    this.grid[this.startY][this.startX] = CONFIG.CELL_TYPES.START;

    // Goal in bottom-right area (with randomness)
    this.goalX = this.size - 2 - Math.floor(this.rng() * Math.min(3, this.size - 2));
    this.goalY = this.size - 2 - Math.floor(this.rng() * Math.min(3, this.size - 2));
    this.grid[this.goalY][this.goalX] = CONFIG.CELL_TYPES.GOAL;
  }

  generateWalls() {
    const numWalls = Math.floor(
      (this.size - 2) * (this.size - 2) * this.wallDensity
    );

    let placed = 0;
    let attempts = 0;
    const maxAttempts = numWalls * 10;

    while (placed < numWalls && attempts < maxAttempts) {
      const x = 1 + Math.floor(this.rng() * (this.size - 2));
      const y = 1 + Math.floor(this.rng() * (this.size - 2));

      // Don't place on start or goal
      if (this.grid[y][x] === CONFIG.CELL_TYPES.EMPTY) {
        this.grid[y][x] = CONFIG.CELL_TYPES.WALL;
        placed++;
      }

      attempts++;
    }
  }

  ensurePathExists() {
    // Simple BFS to check if path exists
    const visited = Array(this.size).fill(null).map(() =>
      Array(this.size).fill(false)
    );

    const queue = [[this.startX, this.startY]];
    visited[this.startY][this.startX] = true;
    let pathExists = false;

    while (queue.length > 0) {
      const [x, y] = queue.shift();

      if (x === this.goalX && y === this.goalY) {
        pathExists = true;
        break;
      }

      // Check 4 directions
      for (const [dx, dy] of CONFIG.ACTIONS.DELTAS) {
        const nx = x + dx;
        const ny = y + dy;

        if (
          nx >= 0 && nx < this.size &&
          ny >= 0 && ny < this.size &&
          !visited[ny][nx] &&
          this.grid[ny][nx] !== CONFIG.CELL_TYPES.WALL
        ) {
          visited[ny][nx] = true;
          queue.push([nx, ny]);
        }
      }
    }

    // If no path, create one by removing walls along a path
    if (!pathExists) {
      this.createPath();
    }
  }

  createPath() {
    // Simple path creation: move from start toward goal, removing walls
    let x = this.startX;
    let y = this.startY;

    while (x !== this.goalX || y !== this.goalY) {
      // Move toward goal
      if (x < this.goalX) x++;
      else if (x > this.goalX) x--;
      else if (y < this.goalY) y++;
      else if (y > this.goalY) y--;

      // Clear wall if present
      if (this.grid[y][x] === CONFIG.CELL_TYPES.WALL) {
        this.grid[y][x] = CONFIG.CELL_TYPES.EMPTY;
      }
    }
  }

  placeGems() {
    // Count available cells
    let emptyCells = [];
    for (let y = 1; y < this.size - 1; y++) {
      for (let x = 1; x < this.size - 1; x++) {
        if (this.grid[y][x] === CONFIG.CELL_TYPES.EMPTY) {
          emptyCells.push([x, y]);
        }
      }
    }

    // Shuffle empty cells
    emptyCells = this.shuffle(emptyCells);

    // Place positive gems
    const numPositiveGems = Math.floor(emptyCells.length * this.positiveGemDensity);
    for (let i = 0; i < numPositiveGems && i < emptyCells.length; i++) {
      const [x, y] = emptyCells[i];
      const gemType = this.selectGemType(true);
      this.grid[y][x] = gemType;
    }

    // Place negative gems
    const numNegativeGems = Math.floor(emptyCells.length * this.negativeGemDensity);
    for (let i = numPositiveGems; i < numPositiveGems + numNegativeGems && i < emptyCells.length; i++) {
      const [x, y] = emptyCells[i];
      const gemType = this.selectGemType(false);
      this.grid[y][x] = gemType;
    }
  }

  selectGemType(positive) {
    const rand = this.rng();
    if (positive) {
      if (rand < 0.6) return CONFIG.CELL_TYPES.GEM_POSITIVE_SMALL;
      if (rand < 0.9) return CONFIG.CELL_TYPES.GEM_POSITIVE_MEDIUM;
      return CONFIG.CELL_TYPES.GEM_POSITIVE_LARGE;
    } else {
      if (rand < 0.6) return CONFIG.CELL_TYPES.GEM_NEGATIVE_SMALL;
      if (rand < 0.9) return CONFIG.CELL_TYPES.GEM_NEGATIVE_MEDIUM;
      return CONFIG.CELL_TYPES.GEM_NEGATIVE_LARGE;
    }
  }

  shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  calculateMetadata() {
    let positiveGems = 0;
    let negativeGems = 0;
    let walls = 0;
    let emptyCells = 0;

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const cell = this.grid[y][x];
        if (cell === CONFIG.CELL_TYPES.WALL) walls++;
        else if (cell >= CONFIG.CELL_TYPES.GEM_POSITIVE_SMALL && cell <= CONFIG.CELL_TYPES.GEM_POSITIVE_LARGE) {
          positiveGems++;
        }
        else if (cell >= CONFIG.CELL_TYPES.GEM_NEGATIVE_SMALL && cell <= CONFIG.CELL_TYPES.GEM_NEGATIVE_LARGE) {
          negativeGems++;
        }
        else if (cell === CONFIG.CELL_TYPES.EMPTY) emptyCells++;
      }
    }

    // Calculate optimal path length (Manhattan distance + some buffer)
    const optimalSteps = Math.abs(this.goalX - this.startX) +
                        Math.abs(this.goalY - this.startY);

    // Calculate max possible score
    const maxScore = positiveGems * 50 + CONFIG.REWARDS.GOAL_REACHED;

    // Calculate complexity (0-100 scale)
    const complexity = Math.min(100,
      (walls / (this.size * this.size) * 40) +
      (negativeGems / Math.max(1, positiveGems) * 30) +
      (this.size / CONFIG.MAZE.MAX_SIZE * 30)
    );

    return {
      positiveGems,
      negativeGems,
      walls,
      emptyCells,
      optimalSteps,
      maxScore,
      complexity: Math.floor(complexity)
    };
  }

  // Serialize maze for reproducibility
  serialize() {
    return {
      seed: this.seed,
      size: this.size,
      difficulty: this.difficulty,
      wallDensity: this.wallDensity,
      positiveGemDensity: this.positiveGemDensity,
      negativeGemDensity: this.negativeGemDensity,
      timeLimit: this.timeLimit
    };
  }

  // Create maze from serialized config
  static fromConfig(config) {
    const generator = new MazeGenerator(config);
    return generator.generate();
  }
}

// Maze runtime state manager
class Maze {
  constructor(mazeData) {
    Object.assign(this, mazeData);

    // Create a mutable copy of the grid
    this.cells = mazeData.grid.map(row => [...row]);

    // Track collected items
    this.collectedGems = [];
    this.visitedCells = Array(this.size).fill(null).map(() =>
      Array(this.size).fill(0)
    );
  }

  getCell(x, y) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
      return { type: CONFIG.CELL_TYPES.WALL, value: 0 };
    }

    const cellType = this.cells[y][x];
    const value = this.getCellValue(cellType);

    return {
      type: cellType,
      value: value,
      visited: this.visitedCells[y][x]
    };
  }

  getCellValue(cellType) {
    switch(cellType) {
      case CONFIG.CELL_TYPES.GEM_POSITIVE_SMALL: return CONFIG.MAZE.GEM_VALUES.SMALL;
      case CONFIG.CELL_TYPES.GEM_POSITIVE_MEDIUM: return CONFIG.MAZE.GEM_VALUES.MEDIUM;
      case CONFIG.CELL_TYPES.GEM_POSITIVE_LARGE: return CONFIG.MAZE.GEM_VALUES.LARGE;
      case CONFIG.CELL_TYPES.GEM_NEGATIVE_SMALL: return CONFIG.MAZE.GEM_PENALTIES.SMALL;
      case CONFIG.CELL_TYPES.GEM_NEGATIVE_MEDIUM: return CONFIG.MAZE.GEM_PENALTIES.MEDIUM;
      case CONFIG.CELL_TYPES.GEM_NEGATIVE_LARGE: return CONFIG.MAZE.GEM_PENALTIES.LARGE;
      default: return 0;
    }
  }

  isWalkable(x, y) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) return false;
    return this.cells[y][x] !== CONFIG.CELL_TYPES.WALL;
  }

  collectGem(x, y) {
    const cell = this.getCell(x, y);
    if (cell.type >= CONFIG.CELL_TYPES.GEM_POSITIVE_SMALL &&
        cell.type <= CONFIG.CELL_TYPES.GEM_NEGATIVE_LARGE) {
      this.collectedGems.push({ x, y, type: cell.type, value: cell.value });
      this.cells[y][x] = CONFIG.CELL_TYPES.EMPTY;
      return cell.value;
    }
    return 0;
  }

  markVisited(x, y) {
    if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
      this.visitedCells[y][x]++;
    }
  }

  isGoal(x, y) {
    return x === this.goalX && y === this.goalY;
  }

  // Get cells in a radius (for state encoding)
  getCellsInRadius(x, y, radius) {
    const cells = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size) {
          cells.push({
            x: nx,
            y: ny,
            dx: dx,
            dy: dy,
            distance: Math.sqrt(dx * dx + dy * dy),
            ...this.getCell(nx, ny)
          });
        }
      }
    }
    return cells;
  }

  // Clone maze for parallel simulations
  clone() {
    return new Maze({
      grid: this.cells.map(row => [...row]),
      size: this.size,
      startX: this.startX,
      startY: this.startY,
      goalX: this.goalX,
      goalY: this.goalY,
      timeLimit: this.timeLimit,
      seed: this.seed,
      difficulty: this.difficulty,
      positiveGems: this.positiveGems,
      negativeGems: this.negativeGems,
      walls: this.walls,
      emptyCells: this.emptyCells,
      optimalSteps: this.optimalSteps,
      maxScore: this.maxScore,
      complexity: this.complexity
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MazeGenerator, Maze };
}
