/**
 * Explorer Agent Specialization
 * Motivation: "What's around the corner?"
 * Strength: Mapping unknown territory
 * Weakness: Wanders off-task
 */

import { Agent } from '../agent.js';

export class ExplorerAgent extends Agent {
    constructor(name) {
        super(name, 'EXPLORER');
    }

    getSpecializationPriorities() {
        return {
            goalSeeking: 0.6,     // Less focused on goal
            exploration: 1.5,      // LOVES exploring
            gemCollection: 0.7,    // Moderate interest
            safetyFirst: 0.5       // A bit reckless
        };
    }

    scoreMove(move, context) {
        let score = super.scoreMove(move, context);

        // EXTRA bonus for unexplored territory
        const dir = this.getDirection(move);
        const newX = context.position.x + dir.dx;
        const newY = context.position.y + dir.dy;

        if (!context.visitedCells.has(`${newX},${newY}`)) {
            score += 15; // Big bonus for Explorer!
        }

        // Prefer directions we haven't tried much
        const directionCount = this.getDirectionUsageCount(move);
        if (directionCount < 3) {
            score += 5; // Try all directions
        }

        return score;
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

    getDirectionUsageCount(direction) {
        if (!this.directionUsage) {
            this.directionUsage = { UP: 0, DOWN: 0, LEFT: 0, RIGHT: 0 };
        }
        return this.directionUsage[direction] || 0;
    }

    getReasoningExplanation(context, action) {
        const dir = this.getDirection(action);
        const newX = context.position.x + dir.dx;
        const newY = context.position.y + dir.dy;

        if (!context.visitedCells.has(`${newX},${newY}`)) {
            return "🔍 New territory to explore!";
        }

        return super.getReasoningExplanation(context, action);
    }
}
