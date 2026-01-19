# Esther Bio Page - Design Documentation

**Version:** 1.0
**Last Updated:** 2026-01-19
**Live URL:** https://url-tester-d28e6.web.app/esther-bio.html

## Overview

A responsive bio/counselor profile page for Esther Chu of Integrate Counselling. Features a two-column layout with interactive accordion sections and a live Page Options panel for design customization.

## Design Specifications

### Typography & Colors
- **Font Family:** Assistant (Google Fonts)
- **Heading Size:** 24pt
- **Heading Color:** #304473 (dark blue)
- **Body Font Size:** 18px
- **Body Text Color:** #3d404d (dark grey)
- **Canvas Background:** #f0f0f0 (light grey)

### Layout
- **Desktop:** Two-column layout (1/3 left sidebar, 2/3 right content)
- **Mobile:** Single-column stack (responsive at 768px breakpoint)
- **Max Width:** 1200px centered

### Spacing
- **Box Padding:** 8px vertical, 15px horizontal
- **Section Margin Bottom:** 5px
- **Button Spacing:** 5px top and bottom
- **Paragraph Line Height:** 1.3

### Box Shadow
- **Offset:** 4px horizontal, 4px vertical
- **Blur Radius:** 4px
- **Spread:** 2px
- **Color:** #d4d4d4 (light grey)

## File Structure

```
public/
├── esther-bio.html          # Main HTML file (single-file application)
├── esther-bio.css           # Stylesheet with CSS variables
├── README-esther-bio.md     # This file
└── media/                   # Images (Esther.png, logos, etc.)
```

## Key Features

### 1. Accordion Sections
- Collapsible sections for "Areas & Issues", "Types of Therapy"
- Click header to expand/collapse
- Smooth transitions

### 2. Page Options Panel (Bottom-Right)
- **Font Selection:** Choose from 40+ Google Fonts
- **Text Colors:** Adjust heading and body text colors
- **Background Color:** Customize canvas background
- **Box Shadow:** Adjust shadow color, blur, and spread

Interactive controls with live preview, Apply/Reset buttons for each section.

### 3. Responsive Design
- Desktop: Fixed sidebar, scrollable content
- Tablet/Mobile: Stacked single-column layout
- All elements adapt to screen width

## Technical Implementation

### CSS Variables
All design tokens centralized in `:root`:
```css
--font-family: 'Assistant', Arial, Helvetica, sans-serif;
--heading-color: #304473;
--text-color: #3d404d;
--canvas-bg: #f0f0f0;
--sidebar-box-bg: #ffffff;
```

### JavaScript DEFAULTS Constant
Single source of truth for all default values:
```javascript
const DEFAULTS = {
    font: "'Assistant', Arial, Helvetica, sans-serif",
    headingColor: "#304473",
    textColor: "#3d404d",
    bgColor: "#f0f0f0",
    shadow: {
        color: "#d4d4d4",
        blur: 4,
        spread: 2,
        offsetX: 4,
        offsetY: 4
    }
};
```

## Deployment

### Firebase Hosting
```bash
firebase deploy
```

Deploys to: `url-tester-d28e6.web.app/esther-bio.html`

### Local Development
1. Open `esther-bio.html` directly in browser, or
2. Use Vite dev server: `npm run dev` (if configured)

## Customization Guide

### Change Default Colors
Edit `DEFAULTS` constant in `esther-bio.html` (around line 408):
```javascript
const DEFAULTS = {
    headingColor: "#YOUR_COLOR",  // Change here
    textColor: "#YOUR_COLOR",
    bgColor: "#YOUR_COLOR",
    shadow: { color: "#YOUR_COLOR", ... }
};
```

### Add New Font Options
Add to font dropdown in HTML (line 209+):
```html
<option value="Your Font Name">Your Font Name</option>
```

### Modify Layout Widths
Edit CSS variables in `esther-bio.css` (line 33+):
```css
--left-column-width: 33.333%;
--right-column-width: 66.667%;
--max-container-width: 1200px;
```

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Responsive design tested on iOS/Android

## Notes

- Single-file HTML application - no build process required
- All defaults documented in `Typography and Spacing Reference.txt`
- Page Options panel allows live customization without code changes
- Images stored in `/media` folder (not embedded as base64)

## Support

For issues or questions, contact Integrate Counselling or refer to the Typography and Spacing Reference.txt file for detailed specifications.
