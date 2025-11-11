/**
 * Maze Temple School V2 - Main Application
 * Entry point that initializes the school and dashboard
 */

import { School } from './core/school.js';
import { ExplorerAgent } from './core/specializations/explorer.js';
import { NavigatorAgent } from './core/specializations/navigator.js';
import { KINDERGARTEN_CURRICULUM } from './lessons/kindergarten.js';
import { PrincipalDashboard } from './ui/dashboard.js';

class MazeTempleApp {
    constructor() {
        this.school = null;
        this.dashboard = null;
    }

    async init() {
        console.log('🏛️ Initializing Maze Temple School V2...');

        // Try to load saved school
        const saved = School.load();

        if (saved && saved.rawData) {
            console.log('📂 Loading saved school...');
            this.school = saved.school;

            // Restore students from saved data
            for (const studentData of saved.rawData.students) {
                let agent;

                if (studentData.specialization === 'EXPLORER') {
                    agent = new ExplorerAgent(studentData.name);
                } else if (studentData.specialization === 'NAVIGATOR') {
                    agent = new NavigatorAgent(studentData.name);
                } else {
                    continue; // Unknown specialization
                }

                // Restore state
                agent.level = studentData.level;
                agent.experience = studentData.experience;
                agent.completedLessons = new Set(studentData.completedLessons);
                agent.grades = new Map(studentData.grades);

                // Restore memory
                if (studentData.memory) {
                    agent.longTermMemory.successfulPaths = new Map(studentData.memory.successfulPaths);
                    agent.longTermMemory.deadEnds = new Map(
                        studentData.memory.deadEnds.map(([k, v]) => [k, new Set(v)])
                    );
                }

                this.school.enrollStudent(agent);
            }
        } else {
            console.log('🆕 Creating new school...');
            this.school = new School('Maze Temple School');

            // Create demo students
            this.school.enrollStudent(new ExplorerAgent('Explorer Eve'));
            this.school.enrollStudent(new NavigatorAgent('Navigator Nash'));
        }

        // Set up curriculum
        this.school.setCurriculum('KINDERGARTEN', KINDERGARTEN_CURRICULUM);

        // Initialize dashboard
        this.dashboard = new PrincipalDashboard(this.school);
        this.dashboard.init();

        // Listen for enrollment events
        window.addEventListener('enrollStudent', (e) => {
            this.enrollStudent(e.detail.name, e.detail.specialization);
        });

        // Expose app to window for button callbacks
        window.app = this;

        console.log('✅ School initialized!');
        console.log(`Students enrolled: ${this.school.getAllStudents().length}`);
        console.log(`Lessons available: ${this.school.getAllCurriculum().length}`);
    }

    enrollStudent(name, specialization) {
        let agent;

        switch (specialization) {
            case 'EXPLORER':
                agent = new ExplorerAgent(name);
                break;
            case 'NAVIGATOR':
                agent = new NavigatorAgent(name);
                break;
            default:
                throw new Error(`Unknown specialization: ${specialization}`);
        }

        this.school.enrollStudent(agent);
        console.log(`✅ Enrolled ${name} (${specialization})`);

        // Refresh roster
        if (this.dashboard.currentView === 'roster') {
            this.dashboard.showRoster();
        }
    }

    viewStudent(name) {
        const student = this.school.getStudent(name);
        if (!student) {
            alert('Student not found');
            return;
        }

        const report = this.school.getStudentReport(name);

        alert(`
Student: ${report.name}
Specialization: ${report.specialization}
Level: ${report.level}
Experience: ${report.experience}
Overall Grade: ${report.overallGrade}
Progress: ${report.progress}%
Completed Lessons: ${report.completedLessons} / ${report.totalLessons}
        `.trim());
    }

    selectLesson(lessonId) {
        console.log('Selected lesson:', lessonId);
        this.dashboard.switchView('classroom');

        // Pre-select the lesson
        setTimeout(() => {
            const select = document.getElementById('select-lesson');
            if (select) {
                select.value = lessonId;
            }
        }, 100);
    }

    async startLesson() {
        await this.dashboard.startLesson();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new MazeTempleApp();
    app.init().catch(error => {
        console.error('Failed to initialize app:', error);
        document.getElementById('app').innerHTML = `
            <div class="card">
                <h2>❌ Error</h2>
                <p>Failed to initialize Maze Temple School.</p>
                <pre>${error.message}</pre>
            </div>
        `;
    });
});
