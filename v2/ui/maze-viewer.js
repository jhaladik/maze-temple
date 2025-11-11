/**
 * MazeViewer - Static maze display with playback controls
 * No live rendering - just replay recorded snapshots
 */

export class MazeViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.canvas = null;
        this.ctx = null;
        this.cellSize = 40;
        this.currentSnapshot = 0;
        this.snapshots = [];
        this.maze = null;
        this.isPlaying = false;
        this.playbackSpeed = 500; // ms per step
    }

    init() {
        this.container.innerHTML = `
            <div class="maze-viewer">
                <h2 id="viewer-title">Maze Viewer</h2>

                <div class="maze-canvas-container">
                    <canvas id="mazeCanvas"></canvas>
                </div>

                <div class="playback-controls">
                    <button id="btn-first">⏮️ First</button>
                    <button id="btn-prev">◀️ Prev</button>
                    <button id="btn-play">▶️ Play</button>
                    <button id="btn-next">Next ▶️</button>
                    <button id="btn-last">Last ⏭️</button>
                </div>

                <div class="step-info">
                    <span id="step-counter">Step: 0 / 0</span>
                </div>

                <div class="decision-info" id="decision-info">
                    <strong>Decision:</strong> <span id="decision-action">-</span><br>
                    <div class="reasoning">
                        <strong>Reasoning:</strong> <span id="decision-reasoning">-</span>
                    </div>
                    <div class="confidence">
                        <strong>Confidence:</strong> <span id="decision-confidence">-</span>
                    </div>
                </div>
            </div>
        `;

        this.canvas = document.getElementById('mazeCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Bind controls
        document.getElementById('btn-first').addEventListener('click', () => this.goToFirst());
        document.getElementById('btn-prev').addEventListener('click', () => this.prevStep());
        document.getElementById('btn-play').addEventListener('click', () => this.togglePlay());
        document.getElementById('btn-next').addEventListener('click', () => this.nextStep());
        document.getElementById('btn-last').addEventListener('click', () => this.goToLast());
    }

    loadAttempt(maze, snapshots) {
        this.maze = maze;
        this.snapshots = snapshots;
        this.currentSnapshot = 0;

        // Size canvas
        this.canvas.width = maze.width * this.cellSize;
        this.canvas.height = maze.height * this.cellSize;

        this.render();
    }

    render() {
        if (!this.maze) return;

        const ctx = this.ctx;
        const cellSize = this.cellSize;

        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw maze
        for (let y = 0; y < this.maze.height; y++) {
            for (let x = 0; x < this.maze.width; x++) {
                const cell = this.maze.getCell(x, y);
                this.drawCell(ctx, x, y, cell, cellSize);
            }
        }

        // Draw agent position (current snapshot)
        if (this.snapshots.length > 0 && this.currentSnapshot < this.snapshots.length) {
            const snapshot = this.snapshots[this.currentSnapshot];
            this.drawAgent(ctx, snapshot.position.x, snapshot.position.y, cellSize);

            // Update decision info
            this.updateDecisionInfo(snapshot);
        }

        // Update step counter
        document.getElementById('step-counter').textContent =
            `Step: ${this.currentSnapshot + 1} / ${this.snapshots.length}`;
    }

    drawCell(ctx, x, y, cellType, size) {
        const px = x * size;
        const py = y * size;

        // Background
        switch (cellType) {
            case '#': // Wall
                ctx.fillStyle = '#34495e';
                break;
            case '.': // Path
                ctx.fillStyle = '#ecf0f1';
                break;
            case 'S': // Start
                ctx.fillStyle = '#3498db';
                break;
            case 'G': // Goal
                ctx.fillStyle = '#27ae60';
                break;
            case '*': // Gem
                ctx.fillStyle = '#f1c40f';
                break;
            case 'X': // Hazard
                ctx.fillStyle = '#e74c3c';
                break;
            default:
                ctx.fillStyle = '#ecf0f1';
        }

        ctx.fillRect(px, py, size, size);

        // Border
        ctx.strokeStyle = '#bdc3c7';
        ctx.strokeRect(px, py, size, size);

        // Icons
        ctx.fillStyle = '#2c3e50';
        ctx.font = `${size * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let symbol = '';
        switch (cellType) {
            case 'S': symbol = '🏁'; break;
            case 'G': symbol = '🎯'; break;
            case '*': symbol = '💎'; break;
            case 'X': symbol = '⚠️'; break;
        }

        if (symbol) {
            ctx.fillText(symbol, px + size / 2, py + size / 2);
        }
    }

    drawAgent(ctx, x, y, size) {
        const px = x * size + size / 2;
        const py = y * size + size / 2;
        const radius = size * 0.35;

        // Agent circle
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#d35400';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Agent face
        ctx.fillStyle = '#fff';
        ctx.font = `${size * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🤖', px, py);
    }

    updateDecisionInfo(snapshot) {
        document.getElementById('decision-action').textContent = snapshot.action || '-';
        document.getElementById('decision-reasoning').textContent =
            snapshot.thoughts?.reasoning || 'No reasoning recorded';
        document.getElementById('decision-confidence').textContent =
            snapshot.thoughts?.confidence
                ? `${(snapshot.thoughts.confidence * 100).toFixed(0)}%`
                : '-';
    }

    // Playback controls
    goToFirst() {
        this.currentSnapshot = 0;
        this.render();
    }

    prevStep() {
        if (this.currentSnapshot > 0) {
            this.currentSnapshot--;
            this.render();
        }
    }

    nextStep() {
        if (this.currentSnapshot < this.snapshots.length - 1) {
            this.currentSnapshot++;
            this.render();
        }
    }

    goToLast() {
        this.currentSnapshot = this.snapshots.length - 1;
        this.render();
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('btn-play');

        if (this.isPlaying) {
            btn.textContent = '⏸️ Pause';
            this.play();
        } else {
            btn.textContent = '▶️ Play';
        }
    }

    async play() {
        while (this.isPlaying && this.currentSnapshot < this.snapshots.length - 1) {
            await new Promise(resolve => setTimeout(resolve, this.playbackSpeed));
            this.nextStep();
        }

        if (this.currentSnapshot >= this.snapshots.length - 1) {
            this.isPlaying = false;
            document.getElementById('btn-play').textContent = '▶️ Play';
        }
    }

    setTitle(title) {
        document.getElementById('viewer-title').textContent = title;
    }
}
