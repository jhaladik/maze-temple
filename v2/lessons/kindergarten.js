/**
 * Kindergarten Lessons
 * 5 simple, pre-designed mazes for teaching basics
 */

import { Maze, CELL_TYPES } from '../core/maze.js';
import { Lesson } from '../core/lesson.js';

// Lesson 1: Straight Line
// Just move forward in a straight line
const straightLineGrid = [
    ['#', '#', '#', '#', '#', '#', '#'],
    ['#', 'S', '.', '.', '.', 'G', '#'],
    ['#', '#', '#', '#', '#', '#', '#']
];

export const LESSON_1_STRAIGHT_LINE = new Lesson(
    'k1-straight',
    'Straight Line',
    'KINDERGARTEN',
    new Maze(straightLineGrid, 'Straight Line'),
    ['Learn to move forward', 'Understand goal'],
    {
        mustSucceed: true,
        maxSteps: 10,
        maxWallHits: 2
    }
);

// Lesson 2: One Turn
// Make a single turn
const oneTurnGrid = [
    ['#', '#', '#', '#', '#', '#'],
    ['#', 'S', '.', '.', '#', '#'],
    ['#', '#', '#', '.', '#', '#'],
    ['#', '#', '#', '.', '#', '#'],
    ['#', '#', '#', 'G', '#', '#'],
    ['#', '#', '#', '#', '#', '#']
];

export const LESSON_2_ONE_TURN = new Lesson(
    'k2-one-turn',
    'One Turn',
    'KINDERGARTEN',
    new Maze(oneTurnGrid, 'One Turn'),
    ['Learn to change direction', 'Navigate corner'],
    {
        mustSucceed: true,
        maxSteps: 15,
        maxWallHits: 3
    }
);

// Lesson 3: The T-Junction
// First real decision point
const tJunctionGrid = [
    ['#', '#', '#', '#', '#', '#', '#'],
    ['#', '.', '.', 'S', '.', '.', '#'],
    ['#', '#', '#', '.', '#', '#', '#'],
    ['#', '#', '#', '.', '#', '#', '#'],
    ['#', '#', '#', 'G', '#', '#', '#'],
    ['#', '#', '#', '#', '#', '#', '#']
];

export const LESSON_3_T_JUNCTION = new Lesson(
    'k3-t-junction',
    'The T-Junction',
    'KINDERGARTEN',
    new Maze(tJunctionGrid, 'T-Junction'),
    ['Make first decision', 'Choose correct path', 'Learn from wrong choices'],
    {
        mustSucceed: true,
        maxSteps: 20,
        maxWallHits: 5
    }
);

// Lesson 4: Simple Maze
// Small maze with multiple turns
const simpleMazeGrid = [
    ['#', '#', '#', '#', '#', '#', '#', '#'],
    ['#', 'S', '.', '#', '.', '.', '.', '#'],
    ['#', '#', '.', '#', '.', '#', '.', '#'],
    ['#', '.', '.', '.', '.', '#', '.', '#'],
    ['#', '.', '#', '#', '#', '#', '.', '#'],
    ['#', '.', '.', '.', '.', '.', 'G', '#'],
    ['#', '#', '#', '#', '#', '#', '#', '#']
];

export const LESSON_4_SIMPLE_MAZE = new Lesson(
    'k4-simple-maze',
    'Simple Maze',
    'KINDERGARTEN',
    new Maze(simpleMazeGrid, 'Simple Maze'),
    ['Navigate multiple turns', 'Handle dead ends', 'Find path to goal'],
    {
        mustSucceed: true,
        maxSteps: 40,
        maxWallHits: 10,
        minExploration: 10
    }
);

// Lesson 5: Gem Collector
// Collect gems on the way
const gemCollectorGrid = [
    ['#', '#', '#', '#', '#', '#', '#', '#', '#'],
    ['#', 'S', '.', '*', '.', '#', '.', '*', '#'],
    ['#', '#', '#', '.', '#', '#', '.', '#', '#'],
    ['#', '*', '.', '.', '.', '.', '.', '.', '#'],
    ['#', '#', '#', '.', '#', '#', '.', '#', '#'],
    ['#', '.', '.', '*', '.', '#', '.', 'G', '#'],
    ['#', '#', '#', '#', '#', '#', '#', '#', '#']
];

export const LESSON_5_GEM_COLLECTOR = new Lesson(
    'k5-gem-collector',
    'Gem Collector',
    'KINDERGARTEN',
    new Maze(gemCollectorGrid, 'Gem Collector'),
    ['Collect gems while navigating', 'Balance exploration and goal'],
    {
        mustSucceed: true,
        maxSteps: 50,
        minGems: 2,
        maxWallHits: 12
    }
);

// Export all kindergarten lessons as curriculum
export const KINDERGARTEN_CURRICULUM = [
    LESSON_1_STRAIGHT_LINE,
    LESSON_2_ONE_TURN,
    LESSON_3_T_JUNCTION,
    LESSON_4_SIMPLE_MAZE,
    LESSON_5_GEM_COLLECTOR
];
