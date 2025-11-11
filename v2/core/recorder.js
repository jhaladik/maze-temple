/**
 * Snapshot Recorder
 * Records agent attempts as discrete snapshots (not live rendering)
 * Like security camera footage - record first, playback later
 */

export class Snapshot {
    constructor(step, position, action, vision, thoughts = {}) {
        this.step = step;
        this.position = { ...position };
        this.action = action; // 'UP', 'DOWN', 'LEFT', 'RIGHT'
        this.vision = { ...vision };
        this.thoughts = { ...thoughts }; // Agent's decision-making info
        this.timestamp = Date.now();
    }
}

export class AttemptRecorder {
    constructor(lesson, agent) {
        this.lesson = lesson;
        this.agent = agent;
        this.snapshots = [];
        this.startTime = Date.now();
        this.endTime = null;
        this.success = false;
        this.metrics = {
            steps: 0,
            wallHits: 0,
            gemsCollected: 0,
            hazardsHit: 0,
            backtrackCount: 0,
            exploredCells: new Set()
        };
    }

    recordStep(position, action, vision, thoughts = {}) {
        const snapshot = new Snapshot(
            this.snapshots.length,
            position,
            action,
            vision,
            thoughts
        );
        this.snapshots.push(snapshot);

        // Update metrics
        this.metrics.steps++;
        this.metrics.exploredCells.add(`${position.x},${position.y}`);
    }

    recordWallHit() {
        this.metrics.wallHits++;
    }

    recordGemCollected() {
        this.metrics.gemsCollected++;
    }

    recordHazardHit() {
        this.metrics.hazardsHit++;
    }

    recordBacktrack() {
        this.metrics.backtrackCount++;
    }

    finish(success) {
        this.endTime = Date.now();
        this.success = success;
        this.metrics.duration = this.endTime - this.startTime;
        this.metrics.explorationRate = this.metrics.exploredCells.size;
    }

    getReport() {
        return {
            lesson: this.lesson.name,
            agent: this.agent.name,
            success: this.success,
            metrics: {
                ...this.metrics,
                exploredCells: this.metrics.exploredCells.size
            },
            snapshotCount: this.snapshots.length,
            duration: this.metrics.duration
        };
    }

    // For playback in UI
    getSnapshots() {
        return this.snapshots;
    }

    // Get key decision points for review
    getDecisionPoints() {
        return this.snapshots.filter((snap, i) => {
            if (i === 0) return true; // Start
            if (i === this.snapshots.length - 1) return true; // End

            // Direction changes
            const prevSnap = this.snapshots[i - 1];
            if (snap.action !== prevSnap.action) return true;

            // Multiple choices available
            const availableMoves = Object.values(snap.vision)
                .filter(cell => cell !== '#').length;
            if (availableMoves > 2) return true; // Junction

            return false;
        });
    }
}
