# Modern Dark-Mode Calculator

A sleek, responsive, and fully featured web calculator built with semantic HTML5, modern CSS3, and vanilla JavaScript.

---

## ✨ Features

- **Modern Dark-Mode Aesthetics**: Glassmorphic blur effects, macOS-style window controls, glowing operator accents, and smooth button press feedback.
- **Core Operations**: Addition (`+`), Subtraction (`−`), Multiplication (`×`), Division (`÷`), Percentage (`%`), Sign Inversion (`±`), and Clear (`AC` / `⌫`).
- **Safe Math & Precision Handling**:
  - Handles floating-point IEEE-754 precision issues (e.g. `0.1 + 0.2 = 0.3`).
  - Safe division by zero detection (`Cannot divide by 0`) without breaking UI or producing `NaN`.
- **Expression Display & Live Result**: Live history bar displaying previous operations alongside large, dynamically formatted values with comma separators.
- **Calculation History Drawer**: Keeps track of recent calculations. Clicking on any previous calculation immediately recalls that result to the screen.
- **Collapsible Scientific Tray**: Toggle additional math functions on demand: Square ($x^2$), Square Root ($\sqrt{x}$), Reciprocal ($1/x$), and Pi ($\pi$).
- **Audio Feedback**: Subtle synthesized click sound using the Web Audio API (can be toggled on/off, zero external sound files required).
- **Full Keyboard Navigation**: Type calculations directly using standard number keys, numpad, and shortcuts.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `0` - `9` | Input Numbers |
| `.` | Decimal point |
| `+`, `-`, `*`, `/` | Basic Operators |
| `Enter` or `=` | Calculate Result |
| `Backspace` | Delete last digit |
| `Escape` or `C` | Clear All (`AC`) |
| `%` | Percentage |

---

## 🚀 How to Run

1. Simply double-click [`index.html`](file:///c:/Users/ADMIN/Desktop/calculater%20anti/index.html) to open it in any web browser (Chrome, Edge, Firefox, Safari).
2. No build tools, package managers, or server installations required!

---

## 📂 Project Structure

```
calculater anti/
├── index.html       # Application markup and structure
├── style.css        # Dark-mode styling, glassmorphism, responsive grid
├── script.js        # Calculator state engine, math logic, keyboard events
└── README.md        # Documentation and shortcut guide
```

