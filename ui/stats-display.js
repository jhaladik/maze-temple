// Stats Display - Live metrics and performance indicators

class StatsDisplay {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  // Update single player stats
  updatePlayer(player, maze) {
    const timeRemaining = player.getRemainingTime ? player.getRemainingTime() : 0;

    this.container.innerHTML = `
      <div class="stat-row">
        <span class="stat-label">Score:</span>
        <span class="stat-value">${player.stats.score}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Steps:</span>
        <span class="stat-value">${player.stats.steps}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Gems:</span>
        <span class="stat-value">${player.stats.gemsCollected}/${maze.positiveGems}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Time:</span>
        <span class="stat-value">${Math.floor(timeRemaining)}s</span>
      </div>
      ${player.stats.completed ? '<div class="stat-completed">✓ COMPLETED!</div>' : ''}
    `;
  }

  // Update battle mode stats (split)
  updateBattle(battleStatus) {
    if (!this.container) {
      console.error('❌ Stats container not found!');
      return;
    }

    // Debug log once per second (not every frame)
    if (CONFIG.DEBUG.ENABLED && !this._lastStatsLog) {
      this._lastStatsLog = Date.now();
    }
    if (CONFIG.DEBUG.ENABLED && Date.now() - this._lastStatsLog > 1000) {
      console.log('📊 Updating battle stats - Human score:', battleStatus.human.stats.score, 'AI score:', battleStatus.ai.stats.score, 'Container:', this.container.id);
      this._lastStatsLog = Date.now();
    }

    const h = battleStatus.human;
    const a = battleStatus.ai;

    // Calculate who's ahead
    const scoreDiff = h.stats.score - a.stats.score;
    const leader = scoreDiff > 0 ? 'HUMAN' : scoreDiff < 0 ? 'AI' : 'TIE';
    const leaderClass = scoreDiff > 0 ? 'leader-human' : scoreDiff < 0 ? 'leader-ai' : 'leader-tie';

    // Calculate distances to goal (Manhattan distance)
    let humanDist = '?';
    let aiDist = '?';

    try {
      if (battleStatus.humanMaze && battleStatus.humanMaze.goalX !== undefined) {
        humanDist = Math.abs(battleStatus.humanMaze.goalX - h.x) + Math.abs(battleStatus.humanMaze.goalY - h.y);
      }
      if (battleStatus.aiMaze && battleStatus.aiMaze.goalX !== undefined) {
        aiDist = Math.abs(battleStatus.aiMaze.goalX - a.x) + Math.abs(battleStatus.aiMaze.goalY - a.y);
      }
    } catch (err) {
      console.error('Error calculating distances:', err);
    }

    this.container.innerHTML = `
      <div class="battle-stats">
        <div class="battle-header ${leaderClass}">
          <strong>${leader} LEADS</strong>
          <span class="score-diff">(${scoreDiff > 0 ? '+' : ''}${scoreDiff})</span>
        </div>

        <div class="battle-comparison">
          <div class="battle-column">
            <h3>HUMAN</h3>
            <div class="stat-row">
              <span class="stat-label">Score:</span>
              <span class="stat-value">${h.stats.score}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Steps:</span>
              <span class="stat-value">${h.stats.steps}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Gems:</span>
              <span class="stat-value">${h.stats.gemsCollected}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Distance:</span>
              <span class="stat-value">${humanDist} cells</span>
            </div>
            ${h.stats.completed ? '<div class="stat-completed">✓ FINISHED</div>' : '<div class="stat-active">● PLAYING</div>'}
          </div>

          <div class="battle-divider">VS</div>

          <div class="battle-column">
            <h3>AI</h3>
            <div class="stat-row">
              <span class="stat-label">Score:</span>
              <span class="stat-value">${a.stats.score}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Steps:</span>
              <span class="stat-value">${a.stats.steps}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Gems:</span>
              <span class="stat-value">${a.stats.gemsCollected}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Distance:</span>
              <span class="stat-value">${aiDist} cells</span>
            </div>
            ${a.stats.completed ? '<div class="stat-completed">✓ FINISHED</div>' : '<div class="stat-active">● PLAYING</div>'}
          </div>
        </div>

        <div class="battle-info">
          <small>Time: ${Math.floor(battleStatus.timeElapsed / 1000)}s</small>
        </div>
      </div>
    `;
  }

  // Update training stats
  updateTraining(stats) {
    const phase = stats.phase.toUpperCase();
    const phaseClass = `phase-${stats.phase}`;

    this.container.innerHTML = `
      <div class="training-stats">
        <h3>📊 Training Progress</h3>
        <div class="stat-row">
          <span class="stat-label">Agent Type:</span>
          <span class="stat-value">${stats.agentType || 'explorer'}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Episode:</span>
          <span class="stat-value">${stats.episode}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Phase:</span>
          <span class="stat-value ${phaseClass}">${phase}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Current Reward:</span>
          <span class="stat-value">${stats.reward ? stats.reward.toFixed(1) : '0.0'}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Steps:</span>
          <span class="stat-value">${stats.steps || 0}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Success:</span>
          <span class="stat-value">${stats.success ? '✓ Yes' : '✗ No'}</span>
        </div>
        <hr>
        <div class="stat-row">
          <span class="stat-label">Avg Reward (10):</span>
          <span class="stat-value">${stats.avgReward.toFixed(1)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Success Rate (10):</span>
          <span class="stat-value">${(stats.successRate * 100).toFixed(0)}%</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Exploration (ε):</span>
          <span class="stat-value">${(stats.epsilon * 100).toFixed(1)}%</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Imitation:</span>
          <span class="stat-value">${(stats.imitationWeight * 100).toFixed(0)}%</span>
        </div>
        ${stats.loss !== undefined && stats.loss > 0 ? `
        <div class="stat-row">
          <span class="stat-label">Loss:</span>
          <span class="stat-value">${stats.loss.toFixed(4)}</span>
        </div>` : ''}
        <hr>
        <button id="save-agent-btn" class="btn-primary" style="width: 100%; margin-top: 10px;" data-stats='${JSON.stringify(stats).replace(/'/g, "&apos;")}'>
          💾 Save Agent
        </button>
        <button id="load-agents-btn" class="btn-secondary" style="width: 100%; margin-top: 5px;">
          📂 Load Saved Agents
        </button>
      </div>
    `;

    // Store reference for button handlers
    this._currentStats = stats;
  }

  // Show battle results
  showBattleResults(results) {
    const winnerClass = results.winner === 'human' ? 'winner-human' :
                       results.winner === 'ai' ? 'winner-ai' : 'winner-tie';

    const winnerText = results.winner === 'tie' ? 'TIE!' :
                      `${results.winner.toUpperCase()} WINS!`;

    this.container.innerHTML = `
      <div class="battle-results ${winnerClass}">
        <h2>${winnerText}</h2>

        <div class="results-comparison">
          <div class="results-column">
            <h3>Human</h3>
            <p>Score: ${results.human.score.toFixed(0)}</p>
            <p>Steps: ${results.human.stats.steps}</p>
            <p>Gems: ${results.human.stats.gemsCollected}</p>
            <p>Efficiency: ${(results.human.performance.efficiency * 100).toFixed(1)}%</p>
          </div>

          <div class="results-column">
            <h3>AI</h3>
            <p>Score: ${results.ai.score.toFixed(0)}</p>
            <p>Steps: ${results.ai.stats.steps}</p>
            <p>Gems: ${results.ai.stats.gemsCollected}</p>
            <p>Efficiency: ${(results.ai.performance.efficiency * 100).toFixed(1)}%</p>
          </div>
        </div>

        <button id="rematch-btn" class="btn-primary">Rematch</button>
        <button id="menu-btn" class="btn-secondary">Main Menu</button>
      </div>
    `;
  }

  // Clear display
  clear() {
    this.container.innerHTML = '';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StatsDisplay;
}
