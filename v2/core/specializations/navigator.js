/**
 * Navigator Agent Specialization
 * Motivation: "What's the optimal path?"
 * Strength: Efficiency and pathfinding
 * Weakness: Ignores side objectives
 */

import { Agent } from '../agent.js';

export class NavigatorAgent extends Agent {
    constructor(name) {
        super(name, 'NAVIGATOR');
    }

    getSpecializationPriorities() {
        return {
            goalSeeking: 2.0,      // VERY focused on goal
            exploration: 0.3,      // Minimal wandering
            gemCollection: 0.2,    // Ignores gems
            safetyFirst: 0.8       // Cautious but goal-focused
        };
    }

    scoreMove(move, context) {
        let score = super.scoreMove(move, context);

        // MAJOR bonus for moving toward goal
        const dir = this.getDirection(move);
        const newX = context.position.x + dir.dx;
        const newY = context.position.y + dir.dy;

        const currentDist = context.distanceToGoal;
        const newDist = this.manhattanDistance(newX, newY, context.goal);

        if (newDist < currentDist) {
            score += 25; // HUGE bonus for Navigator!
        } else if (newDist > currentDist) {
            score -= 15; // Big penalty for moving away
        }

        // Penalize revisiting cells (inefficient!)
        if (context.visitedCells.has(`${newX},${newY}`)) {
            score -= 10;
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

    manhattanDistance(x1, y1, goal) {
        if (!goal) return 0;
        return Math.abs(x1 - goal.x) + Math.abs(y1 - goal.y);
    }

    getReasoningExplanation(context, action) {
        const dir = this.getDirection(action);
        const newX = context.position.x + dir.dx;
        const newY = context.position.y + dir.dy;

        const currentDist = context.distanceToGoal;
        const newDist = this.manhattanDistance(newX, newY, context.goal);

        if (newDist < currentDist) {
            return `🧭 Moving closer to goal (${newDist} steps away)`;
        }

        if (context.availableMoves.length === 1) {
            return "Only path available";
        }

        return "🧭 Strategic positioning";
    }
}
