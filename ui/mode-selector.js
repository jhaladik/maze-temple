// Mode Selector - UI for selecting game modes

class ModeSelector {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.onModeSelected = null;
  }

  // Show mode selection screen
  show() {
    this.container.innerHTML = `
      <div class="mode-selector">
        <h1>🏛️ MAZE TEMPLE</h1>
        <p class="subtitle">AI Agent Training Center</p>

        <div class="mode-grid">
          <div class="mode-card" data-mode="play">
            <div class="mode-icon">🎮</div>
            <h3>Play Mode</h3>
            <p>Play the maze yourself and record demonstrations</p>
            <button class="btn-mode">Start Playing</button>
          </div>

          <div class="mode-card" data-mode="watch">
            <div class="mode-icon">🤖</div>
            <h3>Watch AI</h3>
            <p>Watch the AI agent train and improve</p>
            <button class="btn-mode">Watch Training</button>
          </div>

          <div class="mode-card" data-mode="battle">
            <div class="mode-icon">⚔️</div>
            <h3>Battle Mode</h3>
            <p>Compete against AI in split-screen</p>
            <button class="btn-mode">Start Battle</button>
          </div>

          <div class="mode-card" data-mode="demos">
            <div class="mode-icon">📚</div>
            <h3>Demo Library</h3>
            <p>View and manage recorded demonstrations</p>
            <button class="btn-mode">View Demos</button>
          </div>

          <div class="mode-card" data-mode="leaderboard">
            <div class="mode-icon">🏆</div>
            <h3>Leaderboard</h3>
            <p>Top scores: Human vs AI</p>
            <button class="btn-mode">View Scores</button>
          </div>

          <div class="mode-card" data-mode="compare">
            <div class="mode-icon">📊</div>
            <h3>Compare Agents</h3>
            <p>Train multiple AI agents side-by-side</p>
            <button class="btn-mode">Compare</button>
          </div>

          <div class="mode-card" data-mode="settings">
            <div class="mode-icon">⚙️</div>
            <h3>Settings</h3>
            <p>Configure difficulty and AI parameters</p>
            <button class="btn-mode">Settings</button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const buttons = this.container.querySelectorAll('.btn-mode');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.mode-card');
        const mode = card.dataset.mode;
        if (this.onModeSelected) {
          this.onModeSelected(mode);
        }
      });
    });
  }

  // Hide mode selector
  hide() {
    this.container.innerHTML = '';
  }

  // Show difficulty selector
  showDifficultySelector(mode, callback) {
    this.container.innerHTML = `
      <div class="difficulty-selector">
        <h2>Select Difficulty</h2>

        <div class="difficulty-grid">
          <div class="difficulty-card" data-difficulty="TUTORIAL">
            <h3>Tutorial</h3>
            <p>10x10 maze, few obstacles</p>
            <p>Time: 5 minutes</p>
            <button class="btn-difficulty">Select</button>
          </div>

          <div class="difficulty-card" data-difficulty="EASY">
            <h3>Easy</h3>
            <p>15x15 maze, moderate obstacles</p>
            <p>Time: 4 minutes</p>
            <button class="btn-difficulty">Select</button>
          </div>

          <div class="difficulty-card" data-difficulty="MEDIUM">
            <h3>Medium</h3>
            <p>20x20 maze, challenging</p>
            <p>Time: 3 minutes</p>
            <button class="btn-difficulty">Select</button>
          </div>

          <div class="difficulty-card" data-difficulty="HARD">
            <h3>Hard</h3>
            <p>25x25 maze, very difficult</p>
            <p>Time: 2 minutes</p>
            <button class="btn-difficulty">Select</button>
          </div>
        </div>

        <button id="back-btn" class="btn-secondary">Back</button>
      </div>
    `;

    // Add event listeners
    const difficultyButtons = this.container.querySelectorAll('.btn-difficulty');
    difficultyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.difficulty-card');
        const difficulty = card.dataset.difficulty;
        if (callback) {
          callback(difficulty);
        }
      });
    });

    document.getElementById('back-btn')?.addEventListener('click', () => {
      this.show();
    });
  }

  // Show agent selector (for Watch/Battle/Compare modes)
  showAgentSelector(mode, difficulty, callback) {
    this.container.innerHTML = `
      <div class="agent-selector">
        <h2>Select AI Agent Type</h2>
        <p class="subtitle">Each agent specializes in different strategies</p>

        <div class="agent-grid">
          <div class="agent-card" data-agent="explorer">
            <div class="agent-icon">🔍</div>
            <h3>Explorer</h3>
            <p class="agent-spec">Navigation Specialist</p>
            <div class="agent-stats">
              <div class="stat-bar"><span class="label">Navigation:</span><div class="bar"><div class="fill" style="width:90%"></div></div></div>
              <div class="stat-bar"><span class="label">Gems:</span><div class="bar"><div class="fill" style="width:5%"></div></div></div>
              <div class="stat-bar"><span class="label">Safety:</span><div class="bar"><div class="fill" style="width:5%"></div></div></div>
            </div>
            <p class="agent-desc">Finds optimal paths quickly. Best for reaching the goal.</p>
            <button class="btn-agent">Select</button>
          </div>

          <div class="agent-card" data-agent="collector">
            <div class="agent-icon">💎</div>
            <h3>Collector</h3>
            <p class="agent-spec">Resource Specialist</p>
            <div class="agent-stats">
              <div class="stat-bar"><span class="label">Navigation:</span><div class="bar"><div class="fill" style="width:30%"></div></div></div>
              <div class="stat-bar"><span class="label">Gems:</span><div class="bar"><div class="fill" style="width:60%"></div></div></div>
              <div class="stat-bar"><span class="label">Safety:</span><div class="bar"><div class="fill" style="width:10%"></div></div></div>
            </div>
            <p class="agent-desc">Maximizes gem collection. Best for high scores.</p>
            <button class="btn-agent">Select</button>
          </div>

          <div class="agent-card" data-agent="protector">
            <div class="agent-icon">🛡️</div>
            <h3>Protector</h3>
            <p class="agent-spec">Safety Specialist</p>
            <div class="agent-stats">
              <div class="stat-bar"><span class="label">Navigation:</span><div class="bar"><div class="fill" style="width:30%"></div></div></div>
              <div class="stat-bar"><span class="label">Gems:</span><div class="bar"><div class="fill" style="width:10%"></div></div></div>
              <div class="stat-bar"><span class="label">Safety:</span><div class="bar"><div class="fill" style="width:60%"></div></div></div>
            </div>
            <p class="agent-desc">Avoids hazards expertly. Best for survival.</p>
            <button class="btn-agent">Select</button>
          </div>
        </div>

        <button id="back-btn" class="btn-secondary">Back</button>
      </div>
    `;

    // Add event listeners
    const agentButtons = this.container.querySelectorAll('.btn-agent');
    agentButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.agent-card');
        const agentType = card.dataset.agent;
        if (callback) {
          callback(agentType);
        }
      });
    });

    document.getElementById('back-btn')?.addEventListener('click', () => {
      this.showDifficultySelector(mode, (diff) => {
        this.showAgentSelector(mode, diff, callback);
      });
    });
  }

  // Show demo library
  showDemoLibrary(demoRecorder, callback) {
    const stats = demoRecorder.getLibraryStats();
    const topDemos = demoRecorder.getTopDemos(5);

    this.container.innerHTML = `
      <div class="demo-library">
        <h2>📚 Demonstration Library</h2>

        <div class="demo-stats">
          <div class="stat">Total Demos: ${stats.totalDemos}</div>
          <div class="stat">Avg Quality: ${(stats.avgQuality * 100).toFixed(1)}%</div>
          <div class="stat">Success Rate: ${(stats.successRate * 100).toFixed(1)}%</div>
        </div>

        <h3>Top Demonstrations</h3>
        <div class="demo-list">
          ${topDemos.map((demo, i) => `
            <div class="demo-item">
              <span class="demo-rank">#${i + 1}</span>
              <span class="demo-type">${demo.agentType}</span>
              <span class="demo-quality">${(demo.metadata.quality * 100).toFixed(0)}%</span>
              <span class="demo-steps">${demo.metadata.steps} steps</span>
              <button class="btn-delete" data-id="${demo.id}">Delete</button>
            </div>
          `).join('')}
        </div>

        <div class="demo-actions">
          <button id="clear-demos-btn" class="btn-danger">Clear All</button>
          <button id="export-demos-btn" class="btn-secondary">Export</button>
          <button id="back-btn" class="btn-secondary">Back</button>
        </div>
      </div>
    `;

    // Event listeners
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const demoId = e.target.dataset.id;
        demoRecorder.deleteDemo(demoId);
        this.showDemoLibrary(demoRecorder, callback); // Refresh
      });
    });

    document.getElementById('clear-demos-btn')?.addEventListener('click', () => {
      if (confirm('Clear all demonstrations?')) {
        demoRecorder.clearAll();
        this.showDemoLibrary(demoRecorder, callback); // Refresh
      }
    });

    document.getElementById('export-demos-btn')?.addEventListener('click', () => {
      const json = demoRecorder.exportDemos();
      this.downloadJSON(json, 'maze-temple-demos.json');
    });

    document.getElementById('back-btn')?.addEventListener('click', () => {
      this.show();
    });
  }

  // Download JSON file
  downloadJSON(jsonString, filename) {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModeSelector;
}
