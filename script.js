(() => {
  const expressionEl = document.getElementById('expression');
  const outputEl = document.getElementById('output');
  const keysEl = document.querySelector('.keys');
  const themeToggle = document.getElementById('theme-toggle');

  const MAX_DIGITS = 15;
  const OPERATORS = { '÷': '/', '×': '*', '−': '-', '+': '+' };

  let state = {
    current: '0',
    previous: null,
    operator: null,
    overwrite: false,
  };

  function safeFormat(value) {
    if (value === 'Error') return 'Error';
    const num = Number(value);
    if (!Number.isFinite(num)) return 'Error';
    if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-9 && num !== 0)) {
      return num.toExponential(6);
    }
    const parts = value.split('.');
    const intFormatted = new Intl.NumberFormat('en-US').format(parts[0]);
    return parts.length > 1 ? `${intFormatted}.${parts[1]}` : intFormatted;
  }

  function render() {
    outputEl.textContent = safeFormat(state.current);
    if (state.operator && state.previous !== null) {
      expressionEl.textContent = `${safeFormat(state.previous)} ${state.operator}`;
    } else {
      expressionEl.textContent = '';
    }
  }

  function inputDigit(digit) {
    if (state.current === 'Error' || state.overwrite) {
      state.current = digit;
      state.overwrite = false;
      render();
      return;
    }
    if (state.current === '0') {
      state.current = digit;
    } else if (state.current.replace('-', '').replace('.', '').length < MAX_DIGITS) {
      state.current += digit;
    }
    render();
  }

  function inputDecimal() {
    if (state.current === 'Error' || state.overwrite) {
      state.current = '0.';
      state.overwrite = false;
      render();
      return;
    }
    if (!state.current.includes('.')) {
      state.current += '.';
    }
    render();
  }

  function clearAll() {
    state = { current: '0', previous: null, operator: null, overwrite: false };
    render();
  }

  function backspace() {
    if (state.current === 'Error' || state.overwrite) {
      clearAll();
      return;
    }
    state.current = state.current.length > 1 ? state.current.slice(0, -1) : '0';
    render();
  }

  function toggleSign() {
    if (state.current === '0' || state.current === 'Error') return;
    state.current = state.current.startsWith('-') ? state.current.slice(1) : `-${state.current}`;
    render();
  }

  function percent() {
    if (state.current === 'Error') return;
    state.current = String(Number(state.current) / 100);
    render();
  }

  function compute(a, b, op) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? NaN : a / b;
      default: return b;
    }
  }

  function setOperator(symbol) {
    if (state.current === 'Error') return;
    if (state.operator && !state.overwrite) {
      const result = compute(Number(state.previous), Number(state.current), OPERATORS[state.operator]);
      state.previous = Number.isNaN(result) ? 'Error' : trimResult(result);
      state.current = state.previous;
    } else {
      state.previous = state.current;
    }
    state.operator = symbol;
    state.overwrite = true;
    render();
  }

  function trimResult(num) {
    if (!Number.isFinite(num)) return 'Error';
    const rounded = Math.round((num + Number.EPSILON) * 1e10) / 1e10;
    return String(rounded);
  }

  function evaluate() {
    if (!state.operator || state.previous === null || state.current === 'Error') return;
    const result = compute(Number(state.previous), Number(state.current), OPERATORS[state.operator]);
    state.current = trimResult(result);
    state.previous = null;
    state.operator = null;
    state.overwrite = true;
    render();
  }

  keysEl.addEventListener('click', (event) => {
    const button = event.target.closest('.key');
    if (!button) return;
    const { action, digit, operator } = button.dataset;

    switch (action) {
      case 'digit':
        inputDigit(digit);
        break;
      case 'decimal':
        inputDecimal();
        break;
      case 'clear':
        clearAll();
        break;
      case 'backspace':
        backspace();
        break;
      case 'percent':
        percent();
        break;
      case 'operator':
        setOperator(operator);
        break;
      case 'equals':
        evaluate();
        break;
      default:
        break;
    }
  });

  const KEY_MAP = { '*': '×', '/': '÷', '-': '−', '+': '+' };

  window.addEventListener('keydown', (event) => {
    const { key } = event;
    if (/^[0-9]$/.test(key)) {
      inputDigit(key);
    } else if (key === '.') {
      inputDecimal();
    } else if (['+', '-', '*', '/'].includes(key)) {
      setOperator(KEY_MAP[key]);
    } else if (key === 'Enter' || key === '=') {
      event.preventDefault();
      evaluate();
    } else if (key === 'Backspace') {
      backspace();
    } else if (key === 'Escape') {
      clearAll();
    } else if (key === '%') {
      percent();
    }
  });

  const THEME_KEY = 'calculator-theme';

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.setAttribute('aria-pressed', 'true');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      themeToggle.setAttribute('aria-pressed', 'false');
    }
  }

  function initTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) {
      applyTheme(stored);
      return;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });

  initTheme();
  render();
})();
