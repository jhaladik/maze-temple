/**
 * ReportCard - Display attempt results and grades
 */

export class ReportCard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    show(result) {
        const { report, grade, snapshots } = result;

        const successClass = report.success ? 'success' : 'failure';
        const successText = report.success ? '✓ Completed' : '✗ Incomplete';

        this.container.innerHTML = `
            <div class="report-card">
                <div class="report-header">
                    <h2>📋 Report Card</h2>
                    <h3>${report.lesson}</h3>
                    <p><strong>Student:</strong> ${report.agent}</p>
                </div>

                <div class="text-center mb-20">
                    <span class="grade-badge grade-${grade}">${grade}</span>
                    <span class="success-badge ${successClass}">${successText}</span>
                </div>

                <div class="report-metrics">
                    <div class="metric">
                        <div class="metric-label">Steps Taken</div>
                        <div class="metric-value">${report.metrics.steps}</div>
                    </div>

                    <div class="metric">
                        <div class="metric-label">Wall Hits</div>
                        <div class="metric-value">${report.metrics.wallHits}</div>
                    </div>

                    <div class="metric">
                        <div class="metric-label">Cells Explored</div>
                        <div class="metric-value">${report.metrics.exploredCells}</div>
                    </div>

                    <div class="metric">
                        <div class="metric-label">Gems Collected</div>
                        <div class="metric-value">${report.metrics.gemsCollected || 0}</div>
                    </div>

                    <div class="metric">
                        <div class="metric-label">Backtracks</div>
                        <div class="metric-value">${report.metrics.backtrackCount}</div>
                    </div>

                    <div class="metric">
                        <div class="metric-label">Duration</div>
                        <div class="metric-value">${this.formatDuration(report.metrics.duration)}</div>
                    </div>
                </div>

                <div class="mt-20">
                    <h3>Performance Summary</h3>
                    <p>${this.getPerformanceSummary(report, grade)}</p>
                </div>
            </div>
        `;
    }

    formatDuration(ms) {
        if (!ms) return '-';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    }

    getPerformanceSummary(report, grade) {
        const summaries = {
            'A': `Excellent work! ${report.agent} completed the lesson with outstanding efficiency and minimal errors.`,
            'B': `Good job! ${report.agent} completed the lesson well, with room for minor improvements.`,
            'C': `Satisfactory. ${report.agent} completed the lesson but could improve efficiency.`,
            'D': `Needs improvement. ${report.agent} struggled with the lesson and needs more practice.`,
            'F': report.success
                ? `${report.agent} completed the lesson but performance was below standards.`
                : `${report.agent} did not complete the lesson. More practice needed.`
        };

        return summaries[grade] || 'Performance evaluation not available.';
    }

    hide() {
        this.container.innerHTML = '';
    }
}
