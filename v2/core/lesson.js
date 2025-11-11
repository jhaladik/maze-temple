/**
 * Lesson class
 * Represents a teaching unit with pre-designed maze and evaluation criteria
 */

import { Maze } from './maze.js';
import { AttemptRecorder } from './recorder.js';

export class Lesson {
    constructor(id, name, difficulty, maze, objectives, evaluationCriteria) {
        this.id = id;
        this.name = name;
        this.difficulty = difficulty; // 'KINDERGARTEN', 'ELEMENTARY', etc.
        this.maze = maze;
        this.objectives = objectives; // Array of learning objectives
        this.evaluationCriteria = evaluationCriteria; // Grading rubric
        this.description = "";
    }

    // Run an agent through this lesson
    async conduct(agent, maxSteps = 200) {
        const maze = this.maze.clone();
        const recorder = new AttemptRecorder(this, agent);

        // Initialize state
        const state = {
            position: { ...maze.start },
            visitedCells: new Set(),
            gemsCollected: 0,
            hazardsHit: 0,
            lastAction: null,
            goal: maze.goal
        };

        state.visitedCells.add(`${state.position.x},${state.position.y}`);

        // Run attempt
        let success = false;
        for (let step = 0; step < maxSteps; step++) {
            // Get current state info
            const vision = maze.getVision(state.position.x, state.position.y);
            const availableMoves = maze.getAvailableMoves(state.position.x, state.position.y);
            const distanceToGoal = maze.getDistanceToGoal(state.position.x, state.position.y);

            // Check if reached goal
            if (state.position.x === maze.goal.x && state.position.y === maze.goal.y) {
                success = true;
                recorder.recordStep(state.position, 'GOAL', vision, { reasoning: 'Goal reached!' });
                break;
            }

            // Agent decides action
            const decisionContext = {
                ...state,
                vision,
                availableMoves,
                distanceToGoal
            };

            const { action, thoughts } = await agent.decideAction(decisionContext, maze, recorder);

            if (!action) {
                // Stuck!
                break;
            }

            // Record decision
            recorder.recordStep(state.position, action, vision, thoughts);

            // Execute move
            const dir = this.getDirection(action);
            const newX = state.position.x + dir.dx;
            const newY = state.position.y + dir.dy;

            if (!maze.isWalkable(newX, newY)) {
                recorder.recordWallHit();
                continue; // Stay in place
            }

            // Move agent
            state.position.x = newX;
            state.position.y = newY;
            state.lastAction = action;

            // Check for backtrack
            if (state.visitedCells.has(`${newX},${newY}`)) {
                recorder.recordBacktrack();
            }

            state.visitedCells.add(`${newX},${newY}`);

            // Check for gems/hazards
            const cellType = maze.getCell(newX, newY);
            if (cellType === '*') {
                state.gemsCollected++;
                recorder.recordGemCollected();
                maze.grid[newY][newX] = '.'; // Remove gem
            } else if (cellType === 'X') {
                state.hazardsHit++;
                recorder.recordHazardHit();
            }
        }

        // Finish recording
        recorder.finish(success);

        // Evaluate performance
        const grade = this.evaluate(recorder.getReport());

        // Agent learns from attempt
        agent.learnFromAttempt(recorder.getReport(), maze);
        agent.recordGrade(this.id, grade);

        return {
            recorder,
            report: recorder.getReport(),
            grade,
            snapshots: recorder.getSnapshots()
        };
    }

    getDirection(move) {
        const DIRECTIONS = {
            UP: { dx: 0, dy: -1 },
            DOWN: { dx: 0, dy: 1 },
            LEFT: { dx: -1, dy: 0 },
            RIGHT: { dx: 1, dy: 0 }
        };
        return DIRECTIONS[move];
    }

    // Evaluate attempt and assign grade
    evaluate(report) {
        const criteria = this.evaluationCriteria;

        let score = 0;
        let maxScore = 0;

        // Success/Failure
        if (criteria.mustSucceed) {
            maxScore += 50;
            if (report.success) score += 50;
        }

        // Efficiency (steps)
        if (criteria.maxSteps) {
            maxScore += 20;
            if (report.metrics.steps <= criteria.maxSteps) {
                score += 20;
            } else {
                const ratio = criteria.maxSteps / report.metrics.steps;
                score += Math.floor(20 * ratio);
            }
        }

        // Wall hits
        if (criteria.maxWallHits !== undefined) {
            maxScore += 10;
            if (report.metrics.wallHits <= criteria.maxWallHits) {
                score += 10;
            }
        }

        // Gems collected
        if (criteria.minGems) {
            maxScore += 10;
            if (report.metrics.gemsCollected >= criteria.minGems) {
                score += 10;
            }
        }

        // Exploration
        if (criteria.minExploration) {
            maxScore += 10;
            if (report.metrics.exploredCells >= criteria.minExploration) {
                score += 10;
            }
        }

        // Convert to letter grade
        const percentage = (score / maxScore) * 100;
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
    }
}
