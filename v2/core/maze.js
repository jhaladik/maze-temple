/**
 * Static Maze representation
 * Pre-designed mazes for lessons (not randomly generated)
 */

export const CELL_TYPES = {
    WALL: '#',
    PATH: '.',
    START: 'S',
    GOAL: 'G',
    GEM: '*',
    HAZARD: 'X'
};

export const DIRECTIONS = {
    UP: { dx: 0, dy: -1, name: 'UP' },
    DOWN: { dx: 0, dy: 1, name: 'DOWN' },
    LEFT: { dx: -1, dy: 0, name: 'LEFT' },
    RIGHT: { dx: 1, dy: 0, name: 'RIGHT' }
};

export class Maze {
    constructor(grid, name = "Unnamed Maze") {
        this.grid = grid; // 2D array of CELL_TYPES
        this.name = name;
        this.height = grid.length;
        this.width = grid[0].length;
        this.start = this.findCell(CELL_TYPES.START);
        this.goal = this.findCell(CELL_TYPES.GOAL);
        this.gems = this.findAllCells(CELL_TYPES.GEM);
        this.hazards = this.findAllCells(CELL_TYPES.HAZARD);
    }

    findCell(cellType) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === cellType) {
                    return { x, y };
                }
            }
        }
        return null;
    }

    findAllCells(cellType) {
        const cells = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === cellType) {
                    cells.push({ x, y });
                }
            }
        }
        return cells;
    }

    getCell(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return CELL_TYPES.WALL; // Out of bounds is wall
        }
        return this.grid[y][x];
    }

    isWalkable(x, y) {
        const cell = this.getCell(x, y);
        return cell !== CELL_TYPES.WALL;
    }

    getAvailableMoves(x, y) {
        const moves = [];
        for (const [name, dir] of Object.entries(DIRECTIONS)) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            if (this.isWalkable(newX, newY)) {
                moves.push(name);
            }
        }
        return moves;
    }

    getVision(x, y) {
        return {
            up: this.getCell(x, y - 1),
            down: this.getCell(x, y + 1),
            left: this.getCell(x - 1, y),
            right: this.getCell(x + 1, y)
        };
    }

    // Manhattan distance
    getDistanceToGoal(x, y) {
        if (!this.goal) return 0;
        return Math.abs(x - this.goal.x) + Math.abs(y - this.goal.y);
    }

    // Clone maze for independent student attempts
    clone() {
        const gridCopy = this.grid.map(row => [...row]);
        return new Maze(gridCopy, this.name);
    }
}
