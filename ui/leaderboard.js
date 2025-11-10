// Leaderboard - Track and display top scores

class Leaderboard {
  constructor(persistence) {
    this.persistence = persistence;
  }

  // Add entry to leaderboard
  addEntry(playerType, playerName, performance, mazeConfig) {
    const entry = {
      playerType: playerType, // 'human' or agent type
      playerName: playerName,
      score: performance.score,
      steps: performance.steps,
      efficiency: performance.efficiency,
      gemsCollected: performance.gemsCollected,
      timeElapsed: performance.timeElapsed,
      mazeSize: mazeConfig.size,
      mazeDifficulty: mazeConfig.difficulty,
      completed: performance.completionRate === 1
    };

    this.persistence.saveLeaderboardEntry(entry);
  }

  // Get top entries
  getTopEntries(count = 10, filter = {}) {
    let entries = this.persistence.loadLeaderboard();

    // Apply filters
    if (filter.playerType) {
      entries = entries.filter(e => e.playerType === filter.playerType);
    }
    if (filter.difficulty) {
      entries = entries.filter(e => e.mazeDifficulty === filter.difficulty);
    }
    if (filter.completedOnly) {
      entries = entries.filter(e => e.completed);
    }

    return entries.slice(0, count);
  }

  // Display leaderboard in container
  display(containerId, options = {}) {
    const container = document.getElementById(containerId);
    const entries = this.getTopEntries(options.count || 10, options.filter || {});

    if (entries.length === 0) {
      container.innerHTML = '<p class="no-entries">No entries yet. Be the first!</p>';
      return;
    }

    let html = '<div class="leaderboard-table">';
    html += '<div class="leaderboard-header">';
    html += '<span class="rank">#</span>';
    html += '<span class="name">Player</span>';
    html += '<span class="score">Score</span>';
    html += '<span class="steps">Steps</span>';
    html += '<span class="efficiency">Efficiency</span>';
    html += '</div>';

    entries.forEach((entry, index) => {
      const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';

      html += `<div class="leaderboard-row ${rankClass}">`;
      html += `<span class="rank">${index + 1}</span>`;
      html += `<span class="name">${this.getDisplayName(entry)}</span>`;
      html += `<span class="score">${entry.score}</span>`;
      html += `<span class="steps">${entry.steps}</span>`;
      html += `<span class="efficiency">${(entry.efficiency * 100).toFixed(1)}%</span>`;
      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
  }

  // Get display name with icon
  getDisplayName(entry) {
    const icon = entry.playerType === 'human' ? '👤' : '🤖';
    return `${icon} ${entry.playerName}`;
  }

  // Get human vs AI stats
  getCompetitionStats() {
    const entries = this.persistence.loadLeaderboard();

    const humanEntries = entries.filter(e => e.playerType === 'human');
    const aiEntries = entries.filter(e => e.playerType !== 'human');

    const humanWins = humanEntries.filter((e, i) => {
      const topScore = entries[0]?.score || 0;
      return e.score === topScore;
    }).length;

    const aiWins = aiEntries.filter((e, i) => {
      const topScore = entries[0]?.score || 0;
      return e.score === topScore;
    }).length;

    return {
      humanWins: humanWins,
      aiWins: aiWins,
      totalHumanEntries: humanEntries.length,
      totalAIEntries: aiEntries.length,
      topHumanScore: humanEntries[0]?.score || 0,
      topAIScore: aiEntries[0]?.score || 0
    };
  }

  // Clear leaderboard
  clear() {
    this.persistence.clearLeaderboard();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Leaderboard;
}
