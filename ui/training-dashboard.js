// Training Dashboard - Live visualization and parameter controls
// AI Agent School - Monitor and adjust learning in real-time

class TrainingDashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.charts = {
      reward: [],
      success: [],
      epsilon: [],
      loss: []
    };
    this.maxDataPoints = 50;

    // Current agent reference
    this.agent = null;
    this.trainingManager = null;
  }

  // Initialize dashboard
  init(agent, trainingManager) {
    this.agent = agent;
    this.trainingManager = trainingManager;
    this.render();
  }

  // Main render
  render() {
    if (!this.agent) return;

    // Add class to stats panel for wider layout
    this.container.classList.add('dashboard-active');

    this.container.innerHTML = `
      <div class="training-dashboard">
        <!-- Agent Info Header -->
        <div class="dashboard-header">
          <h2>🎓 AI Agent School</h2>
          <div class="agent-info">
            <span class="agent-type">${this.agent.agentType.toUpperCase()}</span>
            <span class="episode-count">Episode: <strong id="current-episode">0</strong></span>
          </div>
        </div>

        <!-- Live Learning Metrics -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">🎲 Exploration (ε)</div>
            <div class="metric-value">
              <span id="epsilon-value">90.0</span>%
            </div>
            <div class="metric-bar">
              <div class="metric-bar-fill" id="epsilon-bar" style="width: 90%"></div>
            </div>
            <div class="metric-hint">Randomness Level</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">🎯 Success Rate</div>
            <div class="metric-value">
              <span id="success-rate">0</span>%
            </div>
            <div class="metric-bar">
              <div class="metric-bar-fill success" id="success-bar" style="width: 0%"></div>
            </div>
            <div class="metric-hint">Last 10 episodes</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">📚 Imitation</div>
            <div class="metric-value">
              <span id="imitation-value">50.0</span>%
            </div>
            <div class="metric-bar">
              <div class="metric-bar-fill imitation" id="imitation-bar" style="width: 50%"></div>
            </div>
            <div class="metric-hint">Learning from demos</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">⚡ Avg Reward</div>
            <div class="metric-value">
              <span id="avg-reward">0.0</span>
            </div>
            <div class="metric-trend" id="reward-trend">→</div>
            <div class="metric-hint">Performance metric</div>
          </div>
        </div>

        <!-- Mini Charts -->
        <div class="mini-charts">
          <div class="mini-chart">
            <div class="chart-title">Reward Trend</div>
            <canvas id="reward-chart" width="440" height="80"></canvas>
          </div>
          <div class="mini-chart">
            <div class="chart-title">Success Rate</div>
            <canvas id="success-chart" width="440" height="80"></canvas>
          </div>
        </div>

        <!-- Parameter Controls -->
        <div class="parameter-controls">
          <h3>⚙️ Training Parameters</h3>
          <div class="controls-grid">

            <div class="control-group">
              <label for="learning-rate">Learning Rate</label>
              <input type="range" id="learning-rate" min="0.0001" max="0.01" step="0.0001" value="0.001">
              <span class="control-value" id="learning-rate-value">0.001</span>
            </div>

            <div class="control-group">
              <label for="gamma">Discount (γ)</label>
              <input type="range" id="gamma" min="0.9" max="0.999" step="0.001" value="0.99">
              <span class="control-value" id="gamma-value">0.99</span>
            </div>

            <div class="control-group">
              <label for="epsilon-decay">Epsilon Decay</label>
              <input type="range" id="epsilon-decay" min="0.98" max="0.999" step="0.001" value="0.995">
              <span class="control-value" id="epsilon-decay-value">0.995</span>
            </div>

            <div class="control-group">
              <label for="update-speed">Update Speed (ms)</label>
              <input type="range" id="update-speed" min="10" max="500" step="10" value="100">
              <span class="control-value" id="update-speed-value">100</span>
            </div>

          </div>
        </div>

        <!-- Action Buttons -->
        <div class="dashboard-actions">
          <button id="save-agent-btn" class="btn-primary">💾 Save Agent</button>
          <button id="reset-training-btn" class="btn-secondary">🔄 Reset Training</button>
          <button id="load-agents-btn" class="btn-secondary">📂 Load Agent</button>
        </div>

      </div>
    `;

    this.setupControls();
    this.setupCharts();
  }

  // Setup parameter controls
  setupControls() {
    // Learning rate
    const lrSlider = document.getElementById('learning-rate');
    const lrValue = document.getElementById('learning-rate-value');
    if (lrSlider) {
      lrSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        lrValue.textContent = value.toFixed(4);
        if (this.agent && this.agent.dqn) {
          this.agent.dqn.learningRate = value;
          console.log('📊 Learning rate adjusted to:', value);
        }
      });
    }

    // Gamma
    const gammaSlider = document.getElementById('gamma');
    const gammaValue = document.getElementById('gamma-value');
    if (gammaSlider) {
      gammaSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        gammaValue.textContent = value.toFixed(3);
        if (this.agent && this.agent.dqn) {
          this.agent.dqn.gamma = value;
          console.log('📊 Gamma adjusted to:', value);
        }
      });
    }

    // Epsilon decay
    const epsilonDecaySlider = document.getElementById('epsilon-decay');
    const epsilonDecayValue = document.getElementById('epsilon-decay-value');
    if (epsilonDecaySlider) {
      epsilonDecaySlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        epsilonDecayValue.textContent = value.toFixed(3);
        if (this.agent && this.agent.dqn) {
          this.agent.dqn.epsilonDecay = value;
          console.log('📊 Epsilon decay adjusted to:', value);
        }
      });
    }

    // Update speed
    const speedSlider = document.getElementById('update-speed');
    const speedValue = document.getElementById('update-speed-value');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        speedValue.textContent = value;
        if (this.trainingManager) {
          this.trainingManager.updateDelay = value;
          console.log('📊 Update speed adjusted to:', value, 'ms');
        }
      });
    }
  }

  // Setup mini charts
  setupCharts() {
    this.rewardChart = document.getElementById('reward-chart');
    this.successChart = document.getElementById('success-chart');

    if (this.rewardChart) {
      this.rewardCtx = this.rewardChart.getContext('2d');
    }
    if (this.successChart) {
      this.successCtx = this.successChart.getContext('2d');
    }
  }

  // Update with new episode stats
  update(stats) {
    // Update episode count
    const episodeEl = document.getElementById('current-episode');
    if (episodeEl) episodeEl.textContent = stats.episode;

    // Update epsilon
    const epsilonValue = document.getElementById('epsilon-value');
    const epsilonBar = document.getElementById('epsilon-bar');
    if (epsilonValue && epsilonBar) {
      const epsilonPct = (stats.epsilon * 100).toFixed(1);
      epsilonValue.textContent = epsilonPct;
      epsilonBar.style.width = epsilonPct + '%';
    }

    // Update success rate
    const successRate = document.getElementById('success-rate');
    const successBar = document.getElementById('success-bar');
    if (successRate && successBar) {
      const successPct = (stats.successRate * 100).toFixed(0);
      successRate.textContent = successPct;
      successBar.style.width = successPct + '%';
    }

    // Update imitation
    const imitationValue = document.getElementById('imitation-value');
    const imitationBar = document.getElementById('imitation-bar');
    if (imitationValue && imitationBar) {
      const imitationPct = (stats.imitationWeight * 100).toFixed(1);
      imitationValue.textContent = imitationPct;
      imitationBar.style.width = imitationPct + '%';
    }

    // Update avg reward
    const avgReward = document.getElementById('avg-reward');
    const rewardTrend = document.getElementById('reward-trend');
    if (avgReward && rewardTrend) {
      avgReward.textContent = stats.avgReward.toFixed(1);

      // Show trend
      if (this.charts.reward.length > 1) {
        const prev = this.charts.reward[this.charts.reward.length - 1];
        if (stats.avgReward > prev) {
          rewardTrend.textContent = '↗';
          rewardTrend.className = 'metric-trend up';
        } else if (stats.avgReward < prev) {
          rewardTrend.textContent = '↘';
          rewardTrend.className = 'metric-trend down';
        } else {
          rewardTrend.textContent = '→';
          rewardTrend.className = 'metric-trend neutral';
        }
      }
    }

    // Update chart data
    this.charts.reward.push(stats.avgReward);
    this.charts.success.push(stats.successRate * 100);

    // Keep only last N points
    if (this.charts.reward.length > this.maxDataPoints) {
      this.charts.reward.shift();
      this.charts.success.shift();
    }

    // Redraw charts
    this.drawChart(this.rewardCtx, this.charts.reward, '#4CAF50');
    this.drawChart(this.successCtx, this.charts.success, '#2196F3');
  }

  // Draw simple line chart
  drawChart(ctx, data, color) {
    if (!ctx || data.length === 0) return;

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 10;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Find min/max
    const min = Math.min(...data, 0);
    const max = Math.max(...data, 1);
    const range = max - min || 1;

    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (height - 2 * padding) * i / 4;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = padding + (width - 2 * padding) * index / (this.maxDataPoints - 1);
      const y = height - padding - (height - 2 * padding) * (value - min) / range;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = color;
    data.forEach((value, index) => {
      const x = padding + (width - 2 * padding) * index / (this.maxDataPoints - 1);
      const y = height - padding - (height - 2 * padding) * (value - min) / range;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  // Clear dashboard
  clear() {
    this.charts = {
      reward: [],
      success: [],
      epsilon: [],
      loss: []
    };
    this.agent = null;
    this.trainingManager = null;

    // Remove dashboard-active class from container
    this.container.classList.remove('dashboard-active');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TrainingDashboard;
}
