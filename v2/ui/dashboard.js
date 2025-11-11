/**
 * Principal Dashboard
 * Main UI for managing students and lessons
 */

import { MazeViewer } from './maze-viewer.js';
import { ReportCard } from './report-card.js';

export class PrincipalDashboard {
    constructor(school) {
        this.school = school;
        this.currentView = 'roster';
        this.mazeViewer = null;
        this.reportCard = null;
    }

    init() {
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="school-header">
                <h1>🏛️ ${this.school.name}</h1>
                <div class="subtitle">Principal Dashboard</div>
            </div>

            <div class="nav-tabs">
                <div class="nav-tab active" data-view="roster">👥 Students</div>
                <div class="nav-tab" data-view="curriculum">📚 Curriculum</div>
                <div class="nav-tab" data-view="classroom">🎓 Classroom</div>
                <div class="nav-tab" data-view="statistics">📊 Statistics</div>
            </div>

            <div id="content-area"></div>
        `;

        // Bind navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // Show initial view
        this.showRoster();
    }

    switchView(view) {
        // Update nav
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === view);
        });

        this.currentView = view;

        // Show view
        switch (view) {
            case 'roster':
                this.showRoster();
                break;
            case 'curriculum':
                this.showCurriculum();
                break;
            case 'classroom':
                this.showClassroom();
                break;
            case 'statistics':
                this.showStatistics();
                break;
        }
    }

    showRoster() {
        const students = this.school.getAllStudents();
        const content = document.getElementById('content-area');

        const studentCards = students.map(student => {
            const report = this.school.getStudentReport(student.name);
            const specialIcon = this.getSpecializationIcon(student.specialization);

            return `
                <div class="student-card">
                    <div class="specialization">${specialIcon}</div>
                    <div class="name">${student.name}</div>
                    <div class="level">Level ${student.level} ${student.specialization}</div>

                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${report.progress}%">
                            ${report.progress}%
                        </div>
                    </div>

                    <div class="mt-20">
                        <strong>Grade:</strong> <span class="grade-badge grade-${report.overallGrade}">${report.overallGrade}</span>
                    </div>

                    <div class="mt-20">
                        <small>Completed: ${report.completedLessons} / ${report.totalLessons} lessons</small>
                    </div>

                    <div class="btn-group">
                        <button class="btn btn-primary" onclick="app.viewStudent('${student.name}')">
                            View Details
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        content.innerHTML = `
            <div class="card">
                <h2>Your Students</h2>

                ${students.length === 0 ? `
                    <p>No students enrolled yet.</p>
                ` : `
                    <div class="student-list">
                        ${studentCards}
                    </div>
                `}

                <div class="btn-group mt-20">
                    <button class="btn btn-success" onclick="app.enrollNewStudent()">
                        ➕ Enroll New Student
                    </button>
                </div>
            </div>
        `;
    }

    showCurriculum() {
        const content = document.getElementById('content-area');
        const curriculum = this.school.getAllCurriculum();

        const lessonItems = curriculum.map(lesson => {
            const completed = false; // TODO: Track completion
            const locked = false; // TODO: Track prerequisites

            return `
                <div class="lesson-item ${completed ? 'completed' : ''} ${locked ? 'locked' : ''}"
                     onclick="app.selectLesson('${lesson.id}')">
                    <div class="lesson-status">
                        ${completed ? '✓' : locked ? '🔒' : '○'}
                    </div>
                    <div class="lesson-info">
                        <div class="lesson-name">${lesson.name}</div>
                        <div class="lesson-difficulty">${lesson.difficulty}</div>
                    </div>
                    <button class="btn btn-primary">Start Lesson</button>
                </div>
            `;
        }).join('');

        content.innerHTML = `
            <div class="card">
                <h2>Curriculum</h2>
                <p>Lessons available for your students</p>

                <div class="curriculum-list mt-20">
                    ${lessonItems}
                </div>
            </div>
        `;
    }

    showClassroom() {
        const content = document.getElementById('content-area');
        const students = this.school.getAllStudents();
        const curriculum = this.school.getAllCurriculum();

        const studentOptions = students.map(s =>
            `<option value="${s.name}">${s.name} (${s.specialization})</option>`
        ).join('');

        const lessonOptions = curriculum.map(l =>
            `<option value="${l.id}">${l.name} - ${l.difficulty}</option>`
        ).join('');

        content.innerHTML = `
            <div class="card">
                <h2>🎓 Classroom</h2>
                <p>Conduct lessons with your students</p>

                <div class="form-group">
                    <label>Select Student:</label>
                    <select id="select-student">
                        <option value="">-- Choose Student --</option>
                        ${studentOptions}
                    </select>
                </div>

                <div class="form-group">
                    <label>Select Lesson:</label>
                    <select id="select-lesson">
                        <option value="">-- Choose Lesson --</option>
                        ${lessonOptions}
                    </select>
                </div>

                <div class="btn-group">
                    <button class="btn btn-primary" onclick="app.startLesson()">
                        🎬 Start Lesson
                    </button>
                </div>
            </div>

            <div id="lesson-result" class="hidden">
                <div id="viewer-container"></div>
                <div id="report-container"></div>
            </div>
        `;
    }

    showStatistics() {
        const content = document.getElementById('content-area');
        const stats = this.school.getClassStatistics();

        const gradeChart = Object.entries(stats.gradeDistribution)
            .map(([grade, count]) => `
                <div class="metric">
                    <div class="metric-label">Grade ${grade}</div>
                    <div class="metric-value">${count}</div>
                </div>
            `).join('');

        content.innerHTML = `
            <div class="card">
                <h2>📊 Class Statistics</h2>

                <div class="report-metrics">
                    <div class="metric">
                        <div class="metric-label">Total Students</div>
                        <div class="metric-value">${stats.totalStudents}</div>
                    </div>

                    <div class="metric">
                        <div class="metric-label">Average Level</div>
                        <div class="metric-value">${stats.averageLevel}</div>
                    </div>

                    <div class="metric">
                        <div class="metric-label">Average Progress</div>
                        <div class="metric-value">${stats.averageProgress}%</div>
                    </div>
                </div>

                <h3 class="mt-20">Grade Distribution</h3>
                <div class="report-metrics">
                    ${gradeChart || '<p>No grades yet</p>'}
                </div>
            </div>
        `;
    }

    async startLesson() {
        const studentName = document.getElementById('select-student').value;
        const lessonId = document.getElementById('select-lesson').value;

        if (!studentName || !lessonId) {
            alert('Please select both student and lesson');
            return;
        }

        // Show loading
        const resultDiv = document.getElementById('lesson-result');
        resultDiv.classList.remove('hidden');
        resultDiv.innerHTML = '<div class="card"><h3>Running lesson... Please wait.</h3></div>';

        try {
            // Run lesson
            const result = await this.school.conductLesson(studentName, lessonId);

            // Show results
            this.showLessonResult(result);

        } catch (error) {
            alert('Error conducting lesson: ' + error.message);
            console.error(error);
        }
    }

    showLessonResult(result) {
        const resultDiv = document.getElementById('lesson-result');

        resultDiv.innerHTML = `
            <div id="viewer-container"></div>
            <div id="report-container"></div>
        `;

        // Initialize viewer
        const viewerContainer = document.getElementById('viewer-container');
        viewerContainer.innerHTML = '<div id="maze-viewer-area"></div>';

        this.mazeViewer = new MazeViewer('maze-viewer-area');
        this.mazeViewer.init();
        this.mazeViewer.loadAttempt(result.recorder.lesson.maze, result.snapshots);
        this.mazeViewer.setTitle(`${result.report.lesson} - ${result.report.agent}`);

        // Initialize report card
        const reportContainer = document.getElementById('report-container');
        reportContainer.innerHTML = '<div id="report-card-area"></div>';

        this.reportCard = new ReportCard('report-card-area');
        this.reportCard.show(result);
    }

    getSpecializationIcon(spec) {
        const icons = {
            'EXPLORER': '🔍',
            'NAVIGATOR': '🧭',
            'COLLECTOR': '💎',
            'PROTECTOR': '🛡️',
            'STRATEGIST': '♟️'
        };
        return icons[spec] || '🤖';
    }

    enrollNewStudent() {
        const name = prompt('Student name:');
        if (!name) return;

        const spec = prompt('Specialization (EXPLORER or NAVIGATOR):');
        if (!spec) return;

        try {
            // This will be called from app.js which has access to agent classes
            window.dispatchEvent(new CustomEvent('enrollStudent', {
                detail: { name, specialization: spec.toUpperCase() }
            }));

            this.showRoster();
        } catch (error) {
            alert('Error enrolling student: ' + error.message);
        }
    }
}
