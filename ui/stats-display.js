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
    const h = battleStatus.human;
    const a = battleStatus.ai;

    this.container.innerHTML = `
      <div class="battle-stats">
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
          ${h.stats.completed ? '<div class="stat-completed">✓</div>' : '<div class="stat-active">●</div>'}
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
          ${a.stats.completed ? '<div class="stat-completed">✓</div>' : '<div class="stat-active">●</div>'}
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
        <div class="stat-row">
          <span class="stat-label">Episode:</span>
          <span class="stat-value">${stats.episode}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Phase:</span>
          <span class="stat-value ${phaseClass}">${phase}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Avg Reward:</span>
          <span class="stat-value">${stats.avgReward.toFixed(1)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Success Rate:</span>
          <span class="stat-value">${(stats.successRate * 100).toFixed(1)}%</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Epsilon:</span>
          <span class="stat-value">${stats.epsilon.toFixed(3)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Imitation:</span>
          <span class="stat-value">${(stats.imitationWeight * 100).toFixed(1)}%</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Loss:</span>
          <span class="stat-value">${stats.loss.toFixed(4)}</span>
        </div>
      </div>
    `;
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
