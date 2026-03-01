# QuickBox Project-Specific Instructions

**Project:** QuickBox - Browser-based wireframe mockup tool
**Status:** Alpha
**Purpose:** Rapid web page prototyping tool for designers

---

## Startup Instructions

Read the README.md and the SYSTEM_DESIGN.md before starting work.

---

## WHAT (Tech Stack & Structure)

### Technology Stack
- HTML5, CSS3, Vanilla JavaScript (no frameworks)
- Google Fonts (Architects Daughter)
- Single-file application architecture

### File Structure
```
quickbox/
├── index.html          # Main application markup
├── app.js              # Core application logic
├── styles.css          # All styling
├── vite.config.js      # Dev server configuration (optional)
├── SYSTEM_DESIGN.md    # Complete architecture documentation
├── README.md           # User documentation
├── palettes/           # Color theme definitions
│   ├── index.json      # Palette manifest
│   └── *.json          # Individual palette files
└── media/              # Image assets (user-managed, external)
```

### Code Navigation
- ANM v0.4 markers used throughout codebase for navigation
- See SYSTEM_DESIGN.md for detailed architecture and code organization

---

## WHY (Purpose & Function)

Browser-based wireframe mockup tool for rapid web page prototyping without coding. Target audience is designers creating clickable mockups for client review.

---

## HOW (Development Workflow)

### Running the Application
- **Browser:** Open `index.html` directly in any modern browser
- **Dev Server (optional):** `npm run dev` starts Vite dev server

### Verification & Testing
- Use Chrome browser automation extension to validate actions in browser
- If extension not available, provide instructions on how to activate at startup
- Manual browser testing required
- Tests, type checks, and compilation steps are not applicable at this time

---

## Development Conventions

### JavaScript vs CSS Decision Guide

QuickBox is prototype code - prioritize simplicity and rapid iteration.

**Use CSS for:**
- Static styling (colors, fonts, spacing, borders, backgrounds)
- Mode-based appearance (`.design-mode`, `.navigate-mode` classes)
- Hover/focus states (`:hover`, `:focus` pseudo-classes)
- Layout and positioning (when not dynamic)
- Transitions and animations

**Use JavaScript for:**
- Dynamic calculations (heights, positions based on content/state)
- User interactions (drag, resize, click handlers)
- State-dependent styling (selected boxes, groups)
- Runtime data (palette overrides, per-box properties from state)
- Calculations requiring access to DOM measurements (scrollHeight, etc.)

**Default Rule:**
If styling can be achieved with a CSS class toggle, prefer that over inline styles.
Reserve inline styles for values that must be calculated at runtime.

**Rationale:** CSS changes don't require touching application logic. Use JavaScript only when CSS cannot access the required data or perform the necessary calculation.

---

## Detailed Documentation

**For all implementation details, see:**
- **SYSTEM_DESIGN.md** - Complete architecture, data model, rendering pipeline, algorithms, extension points
- **README.md** - User-facing features and documentation
