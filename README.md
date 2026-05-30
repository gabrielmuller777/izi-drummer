# IZI-DRUMMER 🥁

A sleek, web-based drum machine and sequencer designed for quick pattern creation and song arrangement.

**Live App:** [https://gabrielmuller777.github.io/izi-drummer/](https://gabrielmuller777.github.io/izi-drummer/)

## 🚀 Features

- **Customizable Drum Kit:** 
  - Add as many drum pieces as you need.
  - Upload your own WAV samples for each pad.
  - Visual feedback for loaded samples.
- **Dynamic Step Sequencer:**
  - Create patterns with variable lengths (from 1 to 64 steps).
  - Intuitive grid editor with color-coded notes.
  - Auto-save functionality for pattern editing.
- **Pattern Library:**
  - Save multiple patterns (e.g., Verse, Chorus, Fill).
  - Switch between patterns instantly to edit or arrange.
- **Timeline Arranger:**
  - Drag-and-drop style arrangement (Left-click to place, Right-click to delete).
  - Horizontal scrolling for long song structures.
- **Production Tools:**
  - Precise BPM control (40 - 300 BPM).
  - **Export to WAV:** Record and download your final arrangement directly from the browser.

## 🛠️ Tech Stack

- **Core:** HTML5 Canvas, CSS3
- **Logic:** JavaScript (ES6+)
- **Audio Engine:** [Tone.js](https://tonejs.github.io/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Deployment:** GitHub Pages

## 💻 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gabrielmuller777/izi-drummer.git
   cd izi-drummer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 📦 Deployment

The project is configured to deploy to GitHub Pages using the `gh-pages` package.

To deploy a new version:
```bash
npm run deploy
```

## 📄 License

This project is licensed under the ISC License.
