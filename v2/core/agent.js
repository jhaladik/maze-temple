/**
 * Base Agent class
 * Represents a student in Maze Temple School
 */

import { DIRECTIONS } from './maze.js';

export class Agent {
    constructor(name, specialization) {
        this.name = name;
        this.specialization = specialization; // 'EXPLORER', 'NAVIGATOR', etc.
        this.level = 1;
        this.experience = 0;
        this.completedLessons = new Set();
        this.grades = new Map(); // lessonId -> grade

        // Learning progress
        this.baseKnowledge = null; // To be set by specialization
        this.tweaks = new Map(); // Learned patterns

        // Memory (across attempts)
        this.longTermMemory = {
            successfulPaths: new Map(), // mazeId -> path
            deadEnds: new Map(), // mazeId -> Set of positions
            efficientMoves: new Map() // pattern -> preferred action
        };
    }

    // To be overridden by specializations
    getSpecializationPriorities() {
        return {
            goalSeeking: 1.0,
            exploration: 1.0,
            gemCollection: 1.0,
            safetyFirst: 1.0
        };
    }

    // Main decision-making method
    async decideAction(state, maze, recorder) {
        // state contains: position, vision, availableMoves, distanceToGoal, etc.

        // Build decision context
        const context = this.buildContext(state, maze);

        // Make decision based on specialization
        const action = await this.makeDecision(context);

        // Record thoughts for replay
        const thoughts = {
            reasoning: this.getReasoningExplanation(context, action),
            confidence: this.calculateConfidence(context, action),
            alternatives: context.availableMoves.filter(m => m !== action)
        };

        return { action, thoughts };
    }

    buildContext(state, maze) {
        return {
            position: state.position,
            vision: state.vision,
            availableMoves: state.availableMoves,
            distanceToGoal: state.distanceToGoal,
            visitedCells: state.visitedCells,
            lastAction: state.lastAction,
            priorities: this.getSpecializationPriorities(),
            memory: this.getRelevantMemory(maze.name, state.position)
        };
    }

    // Basic decision making (to be enhanced by specializations)
    async makeDecision(context) {
        const { availableMoves, distanceToGoal, position, vision, lastAction } = context;

        if (availableMoves.length === 0) {
            return null; // Stuck
        }

        if (availableMoves.length === 1) {
            return availableMoves[0]; // Only one choice
        }

        // Score each available move
        const scores = availableMoves.map(move => ({
            move,
            score: this.scoreMove(move, context)
        }));

        // Pick best move
        scores.sort((a, b) => b.score - a.score);
        return scores[0].move;
    }

    // Score a move based on specialization priorities
    scoreMove(move, context) {
        const dir = DIRECTIONS[move];
        const newX = context.position.x + dir.dx;
        const newY = context.position.y + dir.dy;

        let score = 0;
        const priorities = context.priorities;

        // Goal seeking - does this move us closer?
        const currentDist = context.distanceToGoal;
        const newDist = Math.abs(newX - currentDist.x) + Math.abs(newY - currentDist.y);
        if (newDist < currentDist) {
            score += 10 * priorities.goalSeeking;
        }

        // Exploration - prefer unvisited cells
        if (!context.visitedCells.has(`${newX},${newY}`)) {
            score += 5 * priorities.exploration;
        }

        // Avoid backtracking immediately
        if (move === this.oppositeDirection(context.lastAction)) {
            score -= 3;
        }

        // Memory - avoid known dead ends
        if (context.memory.deadEnds.has(`${newX},${newY}`)) {
            score -= 20;
        }

        return score;
    }

    oppositeDirection(direction) {
        const opposites = {
            'UP': 'DOWN',
            'DOWN': 'UP',
            'LEFT': 'RIGHT',
            'RIGHT': 'LEFT'
        };
        return opposites[direction];
    }

    getReasoningExplanation(context, action) {
        // Simple explanation for UI
        if (context.availableMoves.length === 1) {
            return "Only option available";
        }

        const dir = DIRECTIONS[action];
        const newX = context.position.x + dir.dx;
        const newY = context.position.y + dir.dy;
        const notVisited = !context.visitedCells.has(`${newX},${newY}`);

        if (notVisited) {
            return `Exploring new area (${this.specialization} instinct)`;
        }

        return `Moving ${action.toLowerCase()} toward goal`;
    }

    calculateConfidence(context, action) {
        // 0-1 scale
        if (context.availableMoves.length === 1) return 1.0;
        return 0.6; // Base confidence, to be improved with learning
    }

    getRelevantMemory(mazeName, position) {
        return {
            deadEnds: this.longTermMemory.deadEnds.get(mazeName) || new Set(),
            successPath: this.longTermMemory.successfulPaths.get(mazeName)
        };
    }

    // Learn from attempt
    learnFromAttempt(attemptReport, maze) {
        // Update experience
        if (attemptReport.success) {
            this.experience += 10;
            this.completedLessons.add(attemptReport.lesson);

            // Store successful path
            if (attemptReport.snapshots) {
                const path = attemptReport.snapshots.map(s => s.position);
                this.longTermMemory.successfulPaths.set(maze.name, path);
            }
        } else {
            this.experience += 2; // Learn from failure too
        }

        // Level up check
        if (this.experience >= this.level * 20) {
            this.level++;
        }
    }

    // Record grade for lesson
    recordGrade(lessonId, grade) {
        this.grades.set(lessonId, grade);
    }

    getOverallGrade() {
        if (this.grades.size === 0) return 'N/A';

        const gradeValues = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
        const reverseGrade = ['F', 'D', 'C', 'B', 'A'];

        let total = 0;
        for (const grade of this.grades.values()) {
            total += gradeValues[grade] || 0;
        }

        const avg = Math.round(total / this.grades.size);
        return reverseGrade[avg] || 'F';
    }

    // Serialize for storage
    toJSON() {
        return {
            name: this.name,
            specialization: this.specialization,
            level: this.level,
            experience: this.experience,
            completedLessons: Array.from(this.completedLessons),
            grades: Array.from(this.grades.entries()),
            memory: {
                successfulPaths: Array.from(this.longTermMemory.successfulPaths.entries()),
                deadEnds: Array.from(this.longTermMemory.deadEnds.entries()).map(([k, v]) => [k, Array.from(v)])
            }
        };
    }

    static fromJSON(data) {
        const agent = new Agent(data.name, data.specialization);
        agent.level = data.level;
        agent.experience = data.experience;
        agent.completedLessons = new Set(data.completedLessons);
        agent.grades = new Map(data.grades);

        if (data.memory) {
            agent.longTermMemory.successfulPaths = new Map(data.memory.successfulPaths);
            agent.longTermMemory.deadEnds = new Map(
                data.memory.deadEnds.map(([k, v]) => [k, new Set(v)])
            );
        }

        return agent;
    }
}
