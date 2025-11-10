// Renderer - Canvas rendering with split-screen support
// Handles single maze and battle mode rendering

class Renderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.showHeatmap = options.showHeatmap || false;
    this.showPath = options.showPath !== false;
    this.splitScreen = options.splitScreen || false;

    // Cache
    this.cellSize = CONFIG.MAZE.CELL_SIZE;
  }

  // Render single maze
  render(maze, player) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate cell size to fit canvas
    this.cellSize = Math.min(
      (this.canvas.width - 20) / maze.size,
      (this.canvas.height - 20) / maze.size
    );

    const offsetX = (this.canvas.width - maze.size * this.cellSize) / 2;
    const offsetY = (this.canvas.height - maze.size * this.cellSize) / 2;

    // Draw heatmap first (if enabled)
    if (this.showHeatmap) {
      this.drawHeatmap(maze, offsetX, offsetY);
    }

    // Draw maze
    this.drawMaze(maze, offsetX, offsetY);

    // Draw path (if enabled)
    if (this.showPath && player.stats.path.length > 1) {
      this.drawPath(player.stats.path, offsetX, offsetY);
    }

    // Draw player
    this.drawPlayer(player, offsetX, offsetY, CONFIG.UI.COLORS.PLAYER);
  }

  // Render battle mode (split screen)
  renderBattle(humanMaze, humanPlayer, aiMaze, aiAgent) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const halfWidth = this.canvas.width / 2;
    const dividerX = halfWidth;

    // Calculate cell size for split view
    this.cellSize = Math.min(
      (halfWidth - 20) / humanMaze.size,
      (this.canvas.height - 20) / humanMaze.size
    );

    // Offsets for left and right views
    const leftOffsetX = (halfWidth - humanMaze.size * this.cellSize) / 2;
    const rightOffsetX = halfWidth + (halfWidth - aiMaze.size * this.cellSize) / 2;
    const offsetY = (this.canvas.height - humanMaze.size * this.cellSize) / 2;

    // Draw divider
    this.ctx.strokeStyle = '#888';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(dividerX, 0);
    this.ctx.lineTo(dividerX, this.canvas.height);
    this.ctx.stroke();

    // Draw human side (left)
    this.drawMaze(humanMaze, leftOffsetX, offsetY);
    if (this.showPath) {
      this.drawPath(humanPlayer.stats.path, leftOffsetX, offsetY);
    }
    this.drawPlayer(humanPlayer, leftOffsetX, offsetY, CONFIG.UI.COLORS.PLAYER);

    // Draw AI side (right)
    this.drawMaze(aiMaze, rightOffsetX, offsetY);
    if (this.showPath) {
      this.drawPath(aiAgent.stats.path, rightOffsetX, offsetY);
    }
    this.drawPlayer(aiAgent, rightOffsetX, offsetY, CONFIG.UI.COLORS.AI);

    // Draw labels
    this.drawLabel('HUMAN', leftOffsetX + humanMaze.size * this.cellSize / 2, offsetY - 10);
    this.drawLabel('AI', rightOffsetX + aiMaze.size * this.cellSize / 2, offsetY - 10);
  }

  // Draw maze grid
  drawMaze(maze, offsetX, offsetY) {
    for (let y = 0; y < maze.size; y++) {
      for (let x = 0; x < maze.size; x++) {
        const cell = maze.getCell(x, y);
        const px = offsetX + x * this.cellSize;
        const py = offsetY + y * this.cellSize;

        // Draw cell
        this.ctx.fillStyle = this.getCellColor(cell.type);
        this.ctx.fillRect(px, py, this.cellSize, this.cellSize);

        // Draw grid lines
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        this.ctx.strokeRect(px, py, this.cellSize, this.cellSize);

        // Draw gems with symbols
        if (cell.type >= CONFIG.CELL_TYPES.GEM_POSITIVE_SMALL &&
            cell.type <= CONFIG.CELL_TYPES.GEM_NEGATIVE_LARGE) {
          this.drawGem(cell.type, px, py);
        }

        // Draw goal
        if (cell.type === CONFIG.CELL_TYPES.GOAL) {
          this.drawGoal(px, py);
        }
      }
    }
  }

  // Get cell color
  getCellColor(cellType) {
    switch(cellType) {
      case CONFIG.CELL_TYPES.EMPTY:
      case CONFIG.CELL_TYPES.START:
        return CONFIG.UI.COLORS.EMPTY;
      case CONFIG.CELL_TYPES.WALL:
        return CONFIG.UI.COLORS.WALL;
      case CONFIG.CELL_TYPES.GOAL:
        return CONFIG.UI.COLORS.GOAL;
      case CONFIG.CELL_TYPES.GEM_POSITIVE_SMALL:
      case CONFIG.CELL_TYPES.GEM_POSITIVE_MEDIUM:
      case CONFIG.CELL_TYPES.GEM_POSITIVE_LARGE:
        return CONFIG.UI.COLORS.GEM_POSITIVE;
      case CONFIG.CELL_TYPES.GEM_NEGATIVE_SMALL:
      case CONFIG.CELL_TYPES.GEM_NEGATIVE_MEDIUM:
      case CONFIG.CELL_TYPES.GEM_NEGATIVE_LARGE:
        return CONFIG.UI.COLORS.GEM_NEGATIVE;
      default:
        return CONFIG.UI.COLORS.EMPTY;
    }
  }

  // Draw gem symbol
  drawGem(type, x, y) {
    const centerX = x + this.cellSize / 2;
    const centerY = y + this.cellSize / 2;
    const size = this.cellSize * 0.3;

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = `${size}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const isPositive = type >= CONFIG.CELL_TYPES.GEM_POSITIVE_SMALL &&
                      type <= CONFIG.CELL_TYPES.GEM_POSITIVE_LARGE;

    this.ctx.fillText(isPositive ? '+' : '-', centerX, centerY);
  }

  // Draw goal
  drawGoal(x, y) {
    const centerX = x + this.cellSize / 2;
    const centerY = y + this.cellSize / 2;
    const size = this.cellSize * 0.4;

    this.ctx.fillStyle = '#000';
    this.ctx.font = `bold ${size}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('★', centerX, centerY);
  }

  // Draw player/agent
  drawPlayer(player, offsetX, offsetY, color) {
    const px = offsetX + player.x * this.cellSize + this.cellSize / 2;
    const py = offsetY + player.y * this.cellSize + this.cellSize / 2;
    const radius = this.cellSize * 0.35;

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(px, py, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Border
    this.ctx.strokeStyle = '#FFF';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  // Draw path
  drawPath(path, offsetX, offsetY) {
    if (path.length < 2) return;

    this.ctx.strokeStyle = CONFIG.UI.COLORS.PATH;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    for (let i = 0; i < path.length; i++) {
      const [x, y] = path[i];
      const px = offsetX + x * this.cellSize + this.cellSize / 2;
      const py = offsetY + y * this.cellSize + this.cellSize / 2;

      if (i === 0) {
        this.ctx.moveTo(px, py);
      } else {
        this.ctx.lineTo(px, py);
      }
    }

    this.ctx.stroke();
  }

  // Draw heatmap (visited cells)
  drawHeatmap(maze, offsetX, offsetY) {
    // Find max visits
    let maxVisits = 0;
    maze.visitedCells.forEach(row => {
      row.forEach(count => {
        maxVisits = Math.max(maxVisits, count);
      });
    });

    if (maxVisits === 0) return;

    for (let y = 0; y < maze.size; y++) {
      for (let x = 0; x < maze.size; x++) {
        const visits = maze.visitedCells[y][x];
        if (visits > 0) {
          const intensity = visits / maxVisits;
          const alpha = intensity * 0.5;

          this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
          this.ctx.fillRect(
            offsetX + x * this.cellSize,
            offsetY + y * this.cellSize,
            this.cellSize,
            this.cellSize
          );
        }
      }
    }
  }

  // Draw label
  drawLabel(text, x, y) {
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText(text, x, y);
  }

  // Toggle heatmap
  toggleHeatmap() {
    this.showHeatmap = !this.showHeatmap;
  }

  // Toggle path
  togglePath() {
    this.showPath = !this.showPath;
  }

  // Resize canvas
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Renderer;
}
