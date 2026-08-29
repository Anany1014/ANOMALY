# 🌌 ANOMALY — Interactive 3D WebGL Website & Multiverse Exhibition

**ANOMALY** is a state-of-the-art interactive 3D WebGL website designed to showcase procedural space-time phenomena. Fusing digital brutalism with high-tech cybernetics, the site invites users to navigate customized physical chambers to inspect, interact with, and calibrate shape-shifting quantum sculptures in real-time.

---

## 🎨 Design Systems & Visual Aesthetics

The experience is centered around a stark, futuristic command center aesthetic:
- **Digital Brutalism**: Monolithic architecture, concrete columns, high-contrast typography, and floating diagnostic wireframes.
- **Quantum Android Avatar**: A procedurally animated mannequin equipped with a VR visor element, detailed multi-layer boots/pants, and active floor-contact glow halos.
- **Cinematic Rendering**: Integrated real-time postprocessing pipelines overlaying Bloom glow transitions, Vignette scoping filters, and Chromatic Aberration lens shifts.
- **Responsive HUD**: Floating sidebar panels containing Wardrobe equipment selections and exhibit logs that smoothly auto-slide off-screen during focused interactive inspections.

---

## ⚡ Interactive 3D Exhibits

Each pedestal contains a fully interactive 3D WebGL canvas simulation:

1. **The Tesseract (Dimensional Space)**
   - A 4D hypercube rendering wireframe folds continuously through three-dimensional space.
   - *Calibration*: Dynamic hyper-rotation speed controller.

2. **The Chronic Hourglass (Time Dilation)**
   - A gravitational sandbox housing floating liquid mercury droplets that react in real-time.
   - *Calibration*: Dilation slider to accelerate, freeze, or reverse the flow of time.

3. **The Möbius Loop (Wave Mechanics)**
   - A non-orientable parametric closed loop pulsing with glowing energy ribbons.
   - *Calibration*: Active frequency visualizer diagnostics synced (simulated) to sound drone harmonics.

4. **The Portal Mirror (Interdimensional Physics)**
   - A fractured concrete portal projecting non-Euclidean event horizons.
   - *Calibration*: Angle-of-incidence depth tracking displaying concurrent skybox dimensions.

---

## 🕹️ Interface Controls

| System Key | Interaction |
|---|---|
| **W, A, S, D** / Arrows | Drive avatar traversal movement |
| **Shift** (Hold) | Sprint acceleration |
| **Mouse Drag** | Rotate orbits and inspect details |
| **E** / **Click Pedestal** | Engage specific chamber inspection |
| **Esc** | Disengage details view |
| **Tab** / **H** / HUD Button | Toggle wardrobe customization menu |

---

## ⚙️ Development & Quickstart

### Prerequisites
- Node.js (v18 or higher)
- npm package manager

### System Boot Setup

1. **Install required packages:**
   ```bash
   npm install
   ```

2. **Boot local development server:**
   ```bash
   npm run dev
   ```
   *The local WebGL server will launch at `http://localhost:5173/`.*

3. **Verify type compilation:**
   ```bash
   npx tsc --noEmit
   ```

4. **Build production bundle:**
   ```bash
   npm run build
   ```

---

## 📂 Directories Layout

```yaml
ANOMALY/
├── Context/                 # Design specs and requirements
├── src/                     # Core React & 3D layout codebase
│   ├── scene/               # R3F WebGL elements
│   │   ├── player/          # Avatar meshes & physics camera
│   │   ├── gallery/         # Exhibits setup & lighting
│   │   └── artifacts/       # 3D math & custom shaders
│   ├── state/               # Zustand global store files
│   └── ui/                  # Centered inspection modal & HUD overlays
├── index.html               # WebGL canvas container mount
└── .gitignore               # Excludes build caches & dependencies
```
