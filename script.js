/**
 * ============================================================================
 * Modern Calculator Application
 * Logic & State Engine
 * ============================================================================
 */

class Calculator {
  constructor(historyDisplayEl, currentDisplayEl) {
    this.historyDisplayEl = historyDisplayEl;
    this.currentDisplayEl = currentDisplayEl;
    this.history = [];
    this.soundEnabled = true;
    this.audioCtx = null;
    this.clearAll();
  }

  /**
   * Resets all internal calculator state to default.
   */
  clearAll() {
    this.currentOperand = '0';
    this.previousOperand = '';
    this.operation = null;
    this.shouldResetScreen = false;
    this.isErrorState = false;
    this.updateDisplay();
  }

  /**
   * Deletes the last entered character from the current operand.
   */
  deleteDigit() {
    if (this.isErrorState) {
      this.clearAll();
      return;
    }
    if (this.shouldResetScreen) {
      this.currentOperand = '0';
      this.shouldResetScreen = false;
      this.updateDisplay();
      return;
    }

    if (this.currentOperand.length === 1 || (this.currentOperand.length === 2 && this.currentOperand.startsWith('-'))) {
      this.currentOperand = '0';
    } else {
      this.currentOperand = this.currentOperand.slice(0, -1);
    }
    this.updateDisplay();
  }

  /**
   * Appends a number digit (0-9) to the current operand.
   */
  appendNumber(number) {
    if (this.isErrorState || this.shouldResetScreen) {
      this.currentOperand = '';
      this.shouldResetScreen = false;
      this.isErrorState = false;
    }

    // Prevent multiple leading zeroes
    if (this.currentOperand === '0' && number === '0') return;
    if (this.currentOperand === '0' && number !== '.') {
      this.currentOperand = number;
    } else {
      // Limit operand length to avoid overflow
      if (this.currentOperand.replace(/[-.]/g, '').length >= 14) return;
      this.currentOperand += number;
    }
    this.updateDisplay();
  }

  /**
   * Appends a decimal point, ensuring only one decimal point exists per operand.
   */
  appendDecimal() {
    if (this.isErrorState || this.shouldResetScreen) {
      this.currentOperand = '0';
      this.shouldResetScreen = false;
      this.isErrorState = false;
    }

    if (!this.currentOperand.includes('.')) {
      this.currentOperand = (this.currentOperand === '' ? '0' : this.currentOperand) + '.';
    }
    this.updateDisplay();
  }

  /**
   * Toggles the current value between positive and negative (±).
   */
  toggleSign() {
    if (this.isErrorState || this.currentOperand === '0') return;

    if (this.currentOperand.startsWith('-')) {
      this.currentOperand = this.currentOperand.slice(1);
    } else {
      this.currentOperand = '-' + this.currentOperand;
    }
    this.updateDisplay();
  }

  /**
   * Computes percentage calculation.
   * - If an operator is already chosen (e.g., 200 + 10%), it evaluates 10% of 200 (= 20).
   * - If no operator is pending, it simply divides the number by 100.
   */
  applyPercent() {
    if (this.isErrorState || this.currentOperand === '') return;

    const current = parseFloat(this.currentOperand);
    if (isNaN(current)) return;

    if (this.previousOperand !== '' && this.operation !== null) {
      const prev = parseFloat(this.previousOperand);
      if (!isNaN(prev)) {
        // e.g. 50 + 10% -> 50 + (50 * 0.10)
        const percentValue = (prev * current) / 100;
        this.currentOperand = this.formatPrecision(percentValue).toString();
        this.updateDisplay();
        return;
      }
    }

    // Default standalone percentage
    const result = current / 100;
    this.currentOperand = this.formatPrecision(result).toString();
    this.updateDisplay();
  }

  /**
   * Sets the active arithmetic operator (+, -, ×, ÷).
   * If an operator was already selected and a second operand is entered,
   * calculates intermediate result first.
   */
  chooseOperation(op) {
    if (this.isErrorState) return;

    // Normalizing display operator symbols
    let normalizedOp = op;
    if (op === '*') normalizedOp = '×';
    if (op === '/') normalizedOp = '÷';
    if (op === '-') normalizedOp = '−';

    if (this.currentOperand === '' && this.previousOperand !== '') {
      // User is changing the operator before entering next operand
      this.operation = normalizedOp;
      this.updateDisplay();
      return;
    }

    if (this.previousOperand !== '') {
      this.compute(false);
    }

    this.operation = normalizedOp;
    this.previousOperand = this.currentOperand;
    this.shouldResetScreen = true;
    this.updateDisplay();
  }

  /**
   * Calculates the result of the pending operation.
   * @param {boolean} finalize - If true, records to history tape and resets operator
   */
  compute(finalize = true) {
    if (this.isErrorState || !this.operation || this.previousOperand === '') return;

    const prev = parseFloat(this.previousOperand);
    const curr = parseFloat(this.currentOperand);

    if (isNaN(prev) || isNaN(curr)) return;

    let result;

    switch (this.operation) {
      case '+':
        result = prev + curr;
        break;
      case '−':
      case '-':
        result = prev - curr;
        break;
      case '×':
      case '*':
        result = prev * curr;
        break;
      case '÷':
      case '/':
        // Division by zero safe handling
        if (curr === 0) {
          this.triggerError('Cannot divide by 0');
          return;
        }
        result = prev / curr;
        break;
      default:
        return;
    }

    const cleanedResult = this.formatPrecision(result);
    const expressionString = `${prev} ${this.operation} ${curr}`;

    if (finalize) {
      this.addToHistory(expressionString, cleanedResult);
      this.historyDisplayEl.textContent = `${expressionString} =`;
      this.previousOperand = '';
      this.operation = null;
    } else {
      this.previousOperand = cleanedResult.toString();
    }

    this.currentOperand = cleanedResult.toString();
    this.shouldResetScreen = true;
    this.updateDisplay();
  }

  /**
   * Scientific unary operations (x², √x, 1/x, π).
   */
  applyScientific(action) {
    if (this.isErrorState) return;
    const current = parseFloat(this.currentOperand);

    switch (action) {
      case 'sci-square': {
        if (isNaN(current)) return;
        const res = this.formatPrecision(Math.pow(current, 2));
        this.addToHistory(`${current}²`, res);
        this.historyDisplayEl.textContent = `sqr(${current}) =`;
        this.currentOperand = res.toString();
        this.shouldResetScreen = true;
        break;
      }
      case 'sci-sqrt': {
        if (isNaN(current)) return;
        if (current < 0) {
          this.triggerError('Invalid input');
          return;
        }
        const res = this.formatPrecision(Math.sqrt(current));
        this.addToHistory(`√(${current})`, res);
        this.historyDisplayEl.textContent = `√(${current}) =`;
        this.currentOperand = res.toString();
        this.shouldResetScreen = true;
        break;
      }
      case 'sci-inverse': {
        if (isNaN(current)) return;
        if (current === 0) {
          this.triggerError('Cannot divide by 0');
          return;
        }
        const res = this.formatPrecision(1 / current);
        this.addToHistory(`1 / (${current})`, res);
        this.historyDisplayEl.textContent = `1 / (${current}) =`;
        this.currentOperand = res.toString();
        this.shouldResetScreen = true;
        break;
      }
      case 'sci-pi': {
        const piValue = this.formatPrecision(Math.PI);
        this.currentOperand = piValue.toString();
        this.shouldResetScreen = true;
        break;
      }
    }
    this.updateDisplay();
  }

  /**
   * Solves floating-point precision issues (e.g., 0.1 + 0.2 = 0.30000000000000004).
   * Rounds neatly while preserving accuracy.
   */
  formatPrecision(num) {
    if (!isFinite(num)) return num;
    // Fix IEEE-754 precision up to 12 significant decimal places
    const factor = 1e12;
    const rounded = Math.round((num + Number.EPSILON) * factor) / factor;
    // Convert scientific notation if extremely large/small
    if (Math.abs(rounded) >= 1e14 || (Math.abs(rounded) > 0 && Math.abs(rounded) < 1e-6)) {
      return Number(rounded.toPrecision(8));
    }
    return rounded;
  }

  /**
   * Formats numbers with localized thousands grouping separators for display.
   */
  formatDisplayNumber(numberStr) {
    if (this.isErrorState) return numberStr;
    if (numberStr === '' || numberStr === '-') return numberStr;

    const parts = numberStr.split('.');
    const integerPart = parseFloat(parts[0]);
    const decimalPart = parts[1];

    let integerDisplay = '';
    if (isNaN(integerPart)) {
      integerDisplay = '0';
    } else {
      integerDisplay = integerPart.toLocaleString('en-US', {
        maximumFractionDigits: 0
      });
    }

    if (decimalPart !== undefined) {
      return `${integerDisplay}.${decimalPart}`;
    }
    return integerDisplay;
  }

  /**
   * Updates the UI displays.
   */
  updateDisplay() {
    if (this.isErrorState) {
      this.currentDisplayEl.textContent = this.currentOperand;
      this.currentDisplayEl.classList.add('error-state');
      return;
    }

    this.currentDisplayEl.classList.remove('error-state');
    this.currentDisplayEl.textContent = this.formatDisplayNumber(this.currentOperand);

    if (this.operation != null && this.previousOperand !== '') {
      this.historyDisplayEl.textContent = `${this.formatDisplayNumber(this.previousOperand)} ${this.operation}`;
    } else if (!this.historyDisplayEl.textContent.includes('=')) {
      this.historyDisplayEl.textContent = '';
    }

    // Highlight active operator button
    document.querySelectorAll('.btn-op').forEach(btn => {
      const op = btn.getAttribute('data-op');
      if (this.operation && op === this.operation && this.shouldResetScreen) {
        btn.classList.add('active-op');
      } else {
        btn.classList.remove('active-op');
      }
    });
  }

  /**
   * Handles errors gracefully (e.g. division by zero).
   */
  triggerError(message) {
    this.isErrorState = true;
    this.currentOperand = message;
    this.previousOperand = '';
    this.operation = null;
    this.updateDisplay();
  }

  /**
   * Adds an entry to calculation history.
   */
  addToHistory(expression, result) {
    this.history.unshift({
      expression,
      result,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    this.renderHistory();
  }

  /**
   * Renders the calculation history drawer items.
   */
  renderHistory() {
    const listEl = document.getElementById('history-list');
    if (!listEl) return;

    if (this.history.length === 0) {
      listEl.innerHTML = '<div class="empty-state">No calculations yet</div>';
      return;
    }

    listEl.innerHTML = this.history
      .map(
        (item, index) => `
        <div class="history-item" data-index="${index}" title="Click to recall result">
          <div class="hist-expr">${item.expression} =</div>
          <div class="hist-result">${item.result}</div>
        </div>
      `
      )
      .join('');

    // Attach recall click handler
    listEl.querySelectorAll('.history-item').forEach(itemEl => {
      itemEl.addEventListener('click', () => {
        const idx = parseInt(itemEl.getAttribute('data-index'), 10);
        if (!isNaN(idx) && this.history[idx]) {
          this.currentOperand = this.history[idx].result.toString();
          this.shouldResetScreen = true;
          this.isErrorState = false;
          this.updateDisplay();
          // Close drawer on selection
          toggleHistoryDrawer(false);
          this.playClickSound(520);
        }
      });
    });
  }

  /**
   * Clears the calculation history.
   */
  clearHistory() {
    this.history = [];
    this.renderHistory();
  }

  /**
   * Synthesizes audio feedback using Web Audio API.
   * Completely self-contained, no external mp3 assets needed.
   */
  playClickSound(freq = 440) {
    if (!this.soundEnabled) return;

    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.05);
    } catch (e) {
      // Audio autoplay or browser policy fallback
    }
  }
}

/* ==========================================================================
   DOM Initialization & Event Bindings
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const historyDisplay = document.getElementById('history-display');
  const currentDisplay = document.getElementById('current-display');
  const calculator = new Calculator(historyDisplay, currentDisplay);

  // Sound Toggle Button
  const soundBtn = document.getElementById('toggle-sound-btn');
  const soundIconOn = document.getElementById('sound-icon-on');
  const soundIconOff = document.getElementById('sound-icon-off');

  soundBtn.addEventListener('click', () => {
    calculator.soundEnabled = !calculator.soundEnabled;
    soundIconOn.classList.toggle('hidden', !calculator.soundEnabled);
    soundIconOff.classList.toggle('hidden', calculator.soundEnabled);
    soundBtn.title = calculator.soundEnabled ? 'Mute Sound' : 'Enable Sound';
  });

  // History Drawer Controls
  const historyDrawer = document.getElementById('history-drawer');
  const toggleHistoryBtn = document.getElementById('toggle-history-btn');
  const closeHistoryBtn = document.getElementById('close-history-btn');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  window.toggleHistoryDrawer = function (open) {
    if (open !== undefined) {
      historyDrawer.classList.toggle('open', open);
      historyDrawer.setAttribute('aria-hidden', !open);
    } else {
      const isOpen = historyDrawer.classList.toggle('open');
      historyDrawer.setAttribute('aria-hidden', !isOpen);
    }
  };

  toggleHistoryBtn.addEventListener('click', () => toggleHistoryDrawer());
  closeHistoryBtn.addEventListener('click', () => toggleHistoryDrawer(false));
  clearHistoryBtn.addEventListener('click', () => calculator.clearHistory());

  // Scientific Mode Drawer Toggle
  const sciToggleBtn = document.getElementById('toggle-scientific-btn');
  const sciPanel = document.getElementById('scientific-panel');

  sciToggleBtn.addEventListener('click', () => {
    sciPanel.classList.toggle('open');
    sciToggleBtn.classList.toggle('active');
  });

  // Keypad Click Event Delegation
  document.querySelector('.keypad-grid').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;

    calculator.playClickSound(600);

    // Number buttons
    if (btn.dataset.num !== undefined) {
      calculator.appendNumber(btn.dataset.num);
      return;
    }

    // Operator buttons
    if (btn.dataset.op !== undefined) {
      calculator.chooseOperation(btn.dataset.op);
      return;
    }

    // Special Action buttons
    if (btn.dataset.action !== undefined) {
      switch (btn.dataset.action) {
        case 'all-clear':
          calculator.clearAll();
          break;
        case 'delete':
          calculator.deleteDigit();
          break;
        case 'percent':
          calculator.applyPercent();
          break;
        case 'decimal':
          calculator.appendDecimal();
          break;
        case 'negate':
          calculator.toggleSign();
          break;
        case 'calculate':
          calculator.compute(true);
          calculator.playClickSound(800);
          break;
      }
    }
  });

  // Scientific Keys Event Delegation
  document.getElementById('scientific-panel').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn || !btn.dataset.action) return;

    calculator.playClickSound(680);
    calculator.applyScientific(btn.dataset.action);
  });

  /* ==========================================================================
     Keyboard Support
     ========================================================================== */
  window.addEventListener('keydown', e => {
    // If modal/drawer is open and Escape is pressed, close it
    if (e.key === 'Escape' && historyDrawer.classList.contains('open')) {
      toggleHistoryDrawer(false);
      return;
    }

    let targetButton = null;

    // Digits
    if (/^[0-9]$/.test(e.key)) {
      calculator.appendNumber(e.key);
      targetButton = document.querySelector(`[data-num="${e.key}"]`);
    } else if (e.key === '.') {
      calculator.appendDecimal();
      targetButton = document.querySelector('[data-action="decimal"]');
    } else if (e.key === '+' || e.key === '-') {
      const op = e.key === '-' ? '−' : '+';
      calculator.chooseOperation(op);
      targetButton = document.querySelector(`[data-op="${op}"]`);
    } else if (e.key === '*') {
      calculator.chooseOperation('×');
      targetButton = document.querySelector('[data-op="×"]');
    } else if (e.key === '/') {
      e.preventDefault(); // Prevent Firefox quick search shortcut
      calculator.chooseOperation('÷');
      targetButton = document.querySelector('[data-op="÷"]');
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      calculator.compute(true);
      targetButton = document.querySelector('[data-action="calculate"]');
      calculator.playClickSound(800);
    } else if (e.key === 'Backspace') {
      calculator.deleteDigit();
      targetButton = document.querySelector('[data-action="delete"]');
    } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
      calculator.clearAll();
      targetButton = document.querySelector('[data-action="all-clear"]');
    } else if (e.key === '%') {
      calculator.applyPercent();
      targetButton = document.querySelector('[data-action="percent"]');
    }

    // Visual button press animation feedback for keyboard inputs
    if (targetButton) {
      calculator.playClickSound(580);
      targetButton.classList.add('keyboard-pressed');
      setTimeout(() => targetButton.classList.remove('keyboard-pressed'), 120);
    }
  });
});

