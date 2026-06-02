import * as Tone from 'tone';

// ============================================
// 1. CONFIGURATION & STATE
// ============================================

// Pool of notes for new drums (extends automatically)
const NOTE_POOL = [
    "C1", "D1", "E1", "F1", "F#1", "G1", "A1", "B1",
    "C2", "D2", "E2", "F2", "F#2", "G2", "A2", "B2",
    "C3", "D3", "E3", "F3", "F#3", "G3", "A3", "B3"
];

// Initial Kit
let drumKit = [
    { name: "Kick", note: "C1", color: "#FF9800" },
    { name: "Snare", note: "D1", color: "#2196F3" },
    { name: "Tom 1", note: "E1", color: "#3F51B5" },
    { name: "Tom 2", note: "F1", color: "#3F51B5" },
    { name: "Floor Tom", note: "G1", color: "#3F51B5" },
    { name: "Hi-Hat Cl", note: "F#1", color: "#9C27B0" },
    { name: "Hi-Hat Op", note: "A1", color: "#9C27B0" },
    { name: "Crash", note: "B1", color: "#E91E63" }
];

// Audio Setup
const kit = new Tone.Sampler({
    urls: {},
    volume: -10 // Initial headroom to prevent clipping
});

// Effects chain to "glue" sounds and prevent "farting"/clipping
const compressor = new Tone.Compressor({
    threshold: -18,
    ratio: 4
});

const limiter = new Tone.Limiter(-1).toDestination();

// Chain: Sampler -> Compressor -> Limiter -> Output
kit.chain(compressor, limiter);

const recorder = new Tone.Recorder();
limiter.connect(recorder); // Record the final processed signal

// UI References
const gridCanvas = document.getElementById('grid-canvas');
const gridCtx = gridCanvas.getContext('2d');
const timelineCanvas = document.getElementById('timeline-canvas');
const tCtx = timelineCanvas.getContext('2d');
const rackContainer = document.getElementById('drum-rack-container');
const playBtn = document.getElementById('play-button');
const stepsInput = document.getElementById('pattern-steps'); // NEW

// Constants
const CELL_HEIGHT = 40;
const TIMELINE_BARS = 64; // Long timeline (scrollable)
const TIMELINE_BAR_WIDTH = 100; 

// State Variables
let currentSteps = 16;   // Dynamic Step Count (Default 16)
let gridData = [];       // The current pattern being edited
let patternLibrary = {}; // Saved patterns
let songTimeline = [];   // Arrangement
let currentActivePattern = null; // Tracks which pattern we are "Live Editing"

// Initialize Timeline Width for Scrolling
timelineCanvas.width = TIMELINE_BARS * TIMELINE_BAR_WIDTH;

// Initialize Grid Data based on Kit size and current steps
function resetGridData() {
    gridData = Array(drumKit.length).fill().map(() => Array(currentSteps).fill(0));
}
resetGridData();


// ============================================
// 2. DRUM RACK & DYNAMIC KIT
// ============================================

function renderDrumRack() {
    rackContainer.innerHTML = "";
    
    drumKit.forEach((drum, index) => {
        const pad = document.createElement('div');
        pad.className = 'pad';
        pad.style.borderTop = `3px solid ${drum.color}`;
        pad.innerHTML = `
            <label style="font-weight:bold; font-size: 0.9rem;">${drum.name}</label>
            <span style="font-size:0.7rem; color:#666;">Note: ${drum.note}</span>
            <input type="file" accept="audio/wav" id="upload-${index}">
        `;
        rackContainer.appendChild(pad);

        // Upload Listener
        pad.querySelector('input').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                await kit.add(drum.note, url);
                pad.style.background = "#383838"; // Visual feedback
                console.log(`Loaded sample for ${drum.name}`);
            }
        });
    });
}

// "Add New Piece" Button
document.getElementById('add-piece-button').addEventListener('click', () => {
    const name = prompt("Enter name for new piece (e.g. Cowbell):");
    if (!name) return;

    // Find next unused note
    const usedNotes = drumKit.map(d => d.note);
    const nextNote = NOTE_POOL.find(n => !usedNotes.includes(n));

    if (!nextNote) {
        alert("Max drum limit reached!");
        return;
    }

    // Add to Kit
    drumKit.push({ name: name, note: nextNote, color: "#ffffff" });

    // Expand current Grid Data (add empty row)
    gridData.push(Array(currentSteps).fill(0));

    // Update UI
    renderDrumRack();
    updateCanvasHeight();
});

function updateCanvasHeight() {
    gridCanvas.height = drumKit.length * CELL_HEIGHT;
    drawGrid();
}


// ============================================
// 3. GRID EDITOR (Dynamic Steps & Auto-Save)
// ============================================

// Listen for Step Count Change
stepsInput.addEventListener('change', (e) => {
    const newSteps = parseInt(e.target.value);
    if (newSteps > 0 && newSteps <= 64) {
        currentSteps = newSteps;
        adjustGridSize(currentSteps);
    }
});

function adjustGridSize(newStepCount) {
    // Resize every row in the current gridData
    gridData = gridData.map(row => {
        const newRow = new Array(newStepCount).fill(0);
        // Copy existing notes over
        row.forEach((note, index) => {
            if (index < newStepCount) newRow[index] = note;
        });
        return newRow;
    });
    
    // Redraw and Auto-save
    drawGrid();
    if (currentActivePattern) {
        saveCurrentToLibrary();
    }
}

function drawGrid() {
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    
    // DYNAMIC WIDTH CALCULATION
    const CELL_WIDTH = gridCanvas.width / currentSteps;
    
    for (let r = 0; r < drumKit.length; r++) {
        // Background
        gridCtx.fillStyle = r % 2 === 0 ? "#2a2a2a" : "#252525";
        gridCtx.fillRect(0, r * CELL_HEIGHT, gridCanvas.width, CELL_HEIGHT);

        for (let s = 0; s < currentSteps; s++) {
            // Grid Lines
            gridCtx.strokeStyle = '#444';
            gridCtx.strokeRect(s * CELL_WIDTH, r * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
            
            // Notes
            if (gridData[r] && gridData[r][s] === 1) {
                gridCtx.fillStyle = drumKit[r].color;
                gridCtx.fillRect(s * CELL_WIDTH + 2, r * CELL_HEIGHT + 2, CELL_WIDTH - 4, CELL_HEIGHT - 4);
            }
        }
        // Labels
        gridCtx.fillStyle = "rgba(255,255,255,0.5)";
        gridCtx.font = "12px Arial";
        gridCtx.fillText(drumKit[r].name, 5, r * CELL_HEIGHT + 25);
    }
}

gridCanvas.addEventListener('mousedown', async (e) => {
    // Ensure AudioContext is started on first interaction
    if (Tone.context.state !== 'running') await Tone.start();

    const rect = gridCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const CELL_WIDTH = gridCanvas.width / currentSteps; // Dynamic Width

    const step = Math.floor(x / CELL_WIDTH);
    const row = Math.floor(y / CELL_HEIGHT);

    // Bounds Check
    if (row >= drumKit.length || step >= currentSteps) return;

    // Toggle Note
    gridData[row][step] = gridData[row][step] === 1 ? 0 : 1;
    drawGrid();

    // Play Sound - Removed kit.loaded check as it can be unreliable with dynamic loading
    if (gridData[row][step] === 1) {
        try {
            kit.triggerAttackRelease(drumKit[row].note, "8n");
        } catch (err) {
            console.warn("Sampler not ready or note not found:", err);
        }
    }

    // Auto-Save
    if (currentActivePattern) {
        saveCurrentToLibrary();
        
        const status = document.getElementById('auto-save-status');
        if(status) {
            status.innerText = "Saved ✓";
            status.style.color = "#4CAF50";
            setTimeout(() => status.innerText = "", 1000);
        }
    }
});

function saveCurrentToLibrary() {
    if(!currentActivePattern) return;
    patternLibrary[currentActivePattern] = JSON.parse(JSON.stringify(gridData));
}

document.getElementById('clear-button').addEventListener('click', () => {
    resetGridData();
    if (currentActivePattern) saveCurrentToLibrary();
    drawGrid();
});


// ============================================
// 4. LIBRARY SYSTEM (Save As / Load)
// ============================================

document.getElementById('save-part-button').addEventListener('click', () => {
    const nameInput = document.getElementById('part-name');
    const name = nameInput.value.trim();
    
    if (!name) { alert("Enter a name!"); return; }

    // Save As
    patternLibrary[name] = JSON.parse(JSON.stringify(gridData));
    
    // Switch Active Mode
    currentActivePattern = name;
    
    updateLibraryUI();
    highlightPattern(name);
    console.log(`Saved/Switched to: ${name}`);
});

function updateLibraryUI() {
    const listContainer = document.getElementById('library-list');
    if (!listContainer) return; 

    listContainer.innerHTML = "";
    Object.keys(patternLibrary).forEach(name => {
        const btn = document.createElement('button');
        btn.className = 'pattern-btn'; 
        btn.style.margin = "5px";
        btn.innerText = name;
        btn.onclick = () => loadPattern(name);
        listContainer.appendChild(btn);
    });
}

function loadPattern(name) {
    const savedData = patternLibrary[name];
    if (!savedData) return;

    currentActivePattern = name;
    document.getElementById('part-name').value = name;

    // 1. DETERMINE LENGTH
    // Look at first row to see steps
    const savedSteps = savedData[0] ? savedData[0].length : 16;
    currentSteps = savedSteps;
    stepsInput.value = currentSteps;

    // 2. DEEP COPY & MERGE
    gridData = drumKit.map((_, index) => {
        if (savedData[index]) {
            return [...savedData[index]]; 
        } else {
            return Array(currentSteps).fill(0); // Empty row for new drums
        }
    });

    drawGrid();
    highlightPattern(name);
}

function highlightPattern(name) {
    const btns = document.querySelectorAll('.pattern-btn');
    btns.forEach(b => {
        if (b.innerText === name) {
            b.classList.add('active'); // Use CSS class instead of inline styles
            b.style.border = "2px solid #4CAF50";
        } else {
            b.classList.remove('active');
            b.style.border = "1px solid #555";
        }
    });
}


// ============================================
// 5. TIMELINE ARRANGER
// ============================================

function drawTimeline() {
    tCtx.clearRect(0, 0, timelineCanvas.width, timelineCanvas.height);
    
    // Draw Bars
    for (let i = 0; i < TIMELINE_BARS; i++) {
        tCtx.strokeStyle = '#444';
        tCtx.strokeRect(i * TIMELINE_BAR_WIDTH, 0, TIMELINE_BAR_WIDTH, timelineCanvas.height);
        tCtx.fillStyle = '#666';
        tCtx.fillText(i + 1, i * TIMELINE_BAR_WIDTH + 5, 15);
    }

    // Draw Blocks
    songTimeline.forEach(block => {
        const x = block.startBar * TIMELINE_BAR_WIDTH;
        tCtx.fillStyle = '#4CAF50';
        tCtx.fillRect(x + 1, 20, TIMELINE_BAR_WIDTH - 2, 70);
        tCtx.fillStyle = 'white';
        tCtx.font = "bold 13px Arial";
        tCtx.fillText(block.name, x + 5, 60);
    });
}

timelineCanvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; 
    
    const x = e.clientX - timelineCanvas.getBoundingClientRect().left;
    const bar = Math.floor(x / TIMELINE_BAR_WIDTH);

    const name = document.getElementById('part-name').value.trim();

    if (patternLibrary[name]) {
        songTimeline = songTimeline.filter(b => b.startBar !== bar);
        songTimeline.push({ name: name, startBar: bar });
        drawTimeline();
    } else {
        alert("Pattern not found! Save or Select one first.");
    }
});

// Right Click Delete
timelineCanvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const x = e.clientX - timelineCanvas.getBoundingClientRect().left;
    const bar = Math.floor(x / TIMELINE_BAR_WIDTH);
    
    const idx = songTimeline.findIndex(b => b.startBar === bar);
    if (idx !== -1) {
        songTimeline.splice(idx, 1);
        drawTimeline();
    }
});


// ============================================
// 6. PLAYBACK ENGINE (Smart "Playlist" Logic)
// ============================================

let globalStep = 0;

Tone.Transport.scheduleRepeat((time) => {
    
    let patternToPlay = null;
    let localStep = 0;

    if (songTimeline.length === 0) {
        // PREVIEW MODE: If nothing is in the timeline, loop the current grid editor
        patternToPlay = gridData;
        localStep = globalStep % currentSteps;
    } else {
        // SONG MODE: Find which block we should be playing based on its startBar
        // Assuming 1 bar = 16 steps for simplicity in the timeline calculation
        const STEPS_PER_BAR = 16; 
        
        let foundBlock = null;
        for (const block of songTimeline) {
            const pattern = patternLibrary[block.name];
            if (pattern) {
                const patternLength = pattern[0].length;
                const blockStartStep = block.startBar * STEPS_PER_BAR;
                
                if (globalStep >= blockStartStep && globalStep < blockStartStep + patternLength) {
                    foundBlock = block;
                    patternToPlay = pattern;
                    localStep = globalStep - blockStartStep;
                    break;
                }
            }
        }

        // If we are past the last block in the timeline, stop playback
        const lastBlock = songTimeline.reduce((max, b) => {
            const p = patternLibrary[b.name];
            const len = p ? p[0].length : 0;
            return Math.max(max, b.startBar * STEPS_PER_BAR + len);
        }, 0);

        if (globalStep >= lastBlock && lastBlock > 0) {
            stopPlayback();
            return;
        }
    }

    // 3. Trigger Sounds
    if (patternToPlay) {
        for (let r = 0; r < patternToPlay.length; r++) {
            if (drumKit[r] && patternToPlay[r][localStep] === 1) {
                try {
                    kit.triggerAttack(drumKit[r].note, time);
                } catch (err) {
                    console.error("Playback error:", err);
                }
            }
        }
    }

    globalStep++;
}, "16n");

function stopPlayback() {
    Tone.Transport.stop();
    globalStep = 0;
    playBtn.innerText = "Play";
    playBtn.style.background = "#2196F3";
}

playBtn.addEventListener('click', async () => {
    if (Tone.context.state !== 'running') await Tone.start();

    if (Tone.Transport.state === 'started') {
        stopPlayback();
    } else {
        Tone.Transport.start();
        playBtn.innerText = "Stop";
        playBtn.style.background = "#f44336";
    }
});

// BPM
document.getElementById('bpm-input').addEventListener('change', (e) => {
    const bpm = +e.target.value;
    if (bpm >= 20 && bpm <= 300) Tone.Transport.bpm.rampTo(bpm, 0.1);
});

// Export
document.getElementById('export-button').addEventListener('click', async () => {
    const wasPlaying = Tone.Transport.state === 'started';
    stopPlayback();
    
    const lastBar = songTimeline.reduce((max, b) => Math.max(max, b.startBar), 0);
    const durationSecs = (60 / Tone.Transport.bpm.value) * 4 * (lastBar + 1);

    recorder.start();
    Tone.Transport.start();

    setTimeout(async () => {
        Tone.Transport.stop();
        const recording = await recorder.stop();
        const url = URL.createObjectURL(recording);
        const a = document.createElement("a");
        a.download = "izi-drummer-export.wav";
        a.href = url;
        a.click();
        
        if (wasPlaying) Tone.Transport.start();
    }, durationSecs * 1000 + 500);
});

// --- INIT ---
renderDrumRack();
updateCanvasHeight();
drawTimeline();