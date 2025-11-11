// Human Controls - Input handling for keyboard, touch, and virtual D-pad
// Supports multiple control schemes for accessibility

class Controls {
  constructor() {
    this.inputBuffer = [];
    this.lastInputTime = 0;
    this.inputDelay = 50; // ms between inputs (prevents double-taps)

    this.keyMap = this.buildKeyMap();
    this.touchStartX = 0;
    this.touchStartY = 0;

    this.enabled = true;

    // Track event listeners for cleanup
    this.listeners = [];

    this.setupKeyboard();
    if (CONFIG.CONTROLS.ENABLE_TOUCH) {
      this.setupTouch();
    }
  }

  buildKeyMap() {
    const map = {};

    // Map all keys to actions
    CONFIG.CONTROLS.KEYS.UP.forEach(key => map[key] = CONFIG.ACTIONS.UP);
    CONFIG.CONTROLS.KEYS.DOWN.forEach(key => map[key] = CONFIG.ACTIONS.DOWN);
    CONFIG.CONTROLS.KEYS.LEFT.forEach(key => map[key] = CONFIG.ACTIONS.LEFT);
    CONFIG.CONTROLS.KEYS.RIGHT.forEach(key => map[key] = CONFIG.ACTIONS.RIGHT);

    return map;
  }

  setupKeyboard() {
    const handler = (e) => {
      if (!this.enabled) return;

      if (this.keyMap.hasOwnProperty(e.key)) {
        e.preventDefault();
        this.addInput(this.keyMap[e.key]);
      }
    };

    document.addEventListener('keydown', handler);
    // Track for cleanup
    this.listeners.push({ element: document, event: 'keydown', handler });
  }

  setupTouch() {
    // Swipe detection - touchstart handler
    const touchStartHandler = (e) => {
      if (!this.enabled) return;
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    };

    const touchEndHandler = (e) => {
      if (!this.enabled) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const dx = touchEndX - this.touchStartX;
      const dy = touchEndY - this.touchStartY;

      const threshold = CONFIG.CONTROLS.TOUCH_SWIPE_THRESHOLD;

      // Determine swipe direction
      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        e.preventDefault();

        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal swipe
          this.addInput(dx > 0 ? CONFIG.ACTIONS.RIGHT : CONFIG.ACTIONS.LEFT);
        } else {
          // Vertical swipe
          this.addInput(dy > 0 ? CONFIG.ACTIONS.DOWN : CONFIG.ACTIONS.UP);
        }
      }
    };

    document.addEventListener('touchstart', touchStartHandler, { passive: false });
    document.addEventListener('touchend', touchEndHandler, { passive: false });

    // Track for cleanup
    this.listeners.push({ element: document, event: 'touchstart', handler: touchStartHandler });
    this.listeners.push({ element: document, event: 'touchend', handler: touchEndHandler });
  }

  addInput(action) {
    const now = Date.now();
    if (now - this.lastInputTime >= this.inputDelay) {
      this.inputBuffer.push(action);
      this.lastInputTime = now;
    }
  }

  getInput() {
    // Don't use || because 0 is falsy! Check for undefined explicitly
    const action = this.inputBuffer.shift();
    return action !== undefined ? action : null;
  }

  hasInput() {
    return this.inputBuffer.length > 0;
  }

  clearBuffer() {
    this.inputBuffer = [];
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
    this.clearBuffer();
  }

  // Cleanup - remove all event listeners to prevent memory leaks
  destroy() {
    console.log('🧹 Cleaning up Controls - removing', this.listeners.length, 'event listeners');
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];
    this.enabled = false;
    this.clearBuffer();
  }
}

// Virtual D-Pad for mobile/touch devices
class VirtualDPad {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.enabled = CONFIG.CONTROLS.ENABLE_VIRTUAL_DPAD;
    this.inputCallback = null;

    if (this.enabled && this.container) {
      this.create();
    }
  }

  create() {
    this.container.innerHTML = `
      <div class="dpad">
        <button class="dpad-btn dpad-up" data-action="${CONFIG.ACTIONS.UP}">▲</button>
        <div class="dpad-middle">
          <button class="dpad-btn dpad-left" data-action="${CONFIG.ACTIONS.LEFT}">◄</button>
          <div class="dpad-center"></div>
          <button class="dpad-btn dpad-right" data-action="${CONFIG.ACTIONS.RIGHT}">►</button>
        </div>
        <button class="dpad-btn dpad-down" data-action="${CONFIG.ACTIONS.DOWN}">▼</button>
      </div>
    `;

    // Add event listeners
    const buttons = this.container.querySelectorAll('.dpad-btn');
    buttons.forEach(btn => {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const action = parseInt(btn.dataset.action);
        if (this.inputCallback) {
          this.inputCallback(action);
        }
        btn.classList.add('active');
      });

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        btn.classList.remove('active');
      });

      // Also support mouse for testing on desktop
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const action = parseInt(btn.dataset.action);
        if (this.inputCallback) {
          this.inputCallback(action);
        }
        btn.classList.add('active');
      });

      btn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        btn.classList.remove('active');
      });
    });
  }

  onInput(callback) {
    this.inputCallback = callback;
  }

  show() {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Controls, VirtualDPad };
}
