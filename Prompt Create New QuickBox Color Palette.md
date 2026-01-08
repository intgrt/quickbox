  Prompt: Create New QuickBox Color Palette

  You are tasked with creating a new color palette for QuickBox, a wireframe mockup tool. You have been provided with color values for a design theme.

  Your Task

  Create two files to add a new palette to QuickBox:

  1. Create the palette JSON file in /palettes/[palette-id].json
  2. Update the manifest at /palettes/index.json to register the new palette

  Palette JSON Structure

  Create a file named [palette-id].json (e.g., ocean-breeze.json) with this structure:

  {
    "name": "[Human-readable name]",
    "notes": "[Brief description of the palette theme]",
    "canvas": "[hex color for canvas background]",
    "header": "[hex color for header region background]",
    "footer": "[hex color for footer region background]",
    "elements": {
      "text": {
        "fill": "[background color for text boxes]",
        "border": "[border color for text boxes]",
        "textColor": "[text color inside text boxes]"
      },
      "image": {
        "fill": "[background color for image boxes]",
        "border": "[border color for image boxes]",
        "textColor": "[placeholder text color]"
      },
      "menu": {
        "fill": "[background color for menu boxes]",
        "border": "[border color for menu boxes]",
        "textColor": "[menu item text color]"
      },
      "button": {
        "fill": "[background color for buttons]",
        "border": "[border color for buttons]",
        "textColor": "[button text color]"
      },
      "accordion": {
        "fill": "[background color for accordion sections]",
        "border": "[border color for accordion]",
        "textColor": "[accordion text color]"
      }
    }
  }

  Palette ID Naming Convention

  - Use lowercase letters only
  - Use hyphens to separate words (kebab-case)
  - Be descriptive but concise
  - Examples: ocean-breeze, sunset-gradient, corporate-blue

  Color Guidelines

  1. All colors must be hex format: #RRGGBB (e.g., #3a5a7f)
  2. Ensure sufficient contrast: Text colors should be readable on their backgrounds
  3. Consider harmony: Choose colors that work well together
  4. Canvas should be neutral: Typically a light background color
  5. Header/Footer: Can be same as canvas or slightly different for visual separation

  Update the Manifest

  After creating the palette file, update /palettes/index.json:

  Add a new entry to the palettes array:

  {
    "palettes": [
      {
        "id": "[same as filename without .json]",
        "name": "[same as palette name property]",
        "file": "[filename].json"
      }
    ]
  }

  IMPORTANT: Preserve all existing palette entries - only add the new one to the array.

  Example Complete Workflow

  Given colors:
  - Primary: #2c5f7f (dark blue)
  - Secondary: #e8f4f8 (light cyan)
  - Accent: #ff6b35 (coral)
  - Neutral: #f5f5f5 (light gray)

  Step 1: Create /palettes/ocean-breeze.json:

  {
    "name": "Ocean Breeze",
    "notes": "Cool blues inspired by ocean waves and coastal air",
    "canvas": "#f5f5f5",
    "header": "#e8f4f8",
    "footer": "#e8f4f8",
    "elements": {
      "text": {
        "fill": "#ffffff",
        "border": "#2c5f7f",
        "textColor": "#2c5f7f"
      },
      "image": {
        "fill": "#e8f4f8",
        "border": "#2c5f7f",
        "textColor": "#2c5f7f"
      },
      "menu": {
        "fill": "#e8f4f8",
        "border": "#2c5f7f",
        "textColor": "#2c5f7f"
      },
      "button": {
        "fill": "#ff6b35",
        "border": "#2c5f7f",
        "textColor": "#ffffff"
      },
      "accordion": {
        "fill": "#ffffff",
        "border": "#2c5f7f",
        "textColor": "#2c5f7f"
      }
    }
  }

  Step 2: Update /palettes/index.json:

  {
    "palettes": [
      {
        "id": "sketch",
        "name": "Sketch",
        "file": "sketch.json"
      },
      {
        "id": "botanical-sanctuary",
        "name": "Botanical Sanctuary",
        "file": "botanical-sanctuary.json"
      },
      {
        "id": "golden-hour",
        "name": "Golden Hour",
        "file": "golden-hour.json"
      },
      {
        "id": "ocean-breeze",
        "name": "Ocean Breeze",
        "file": "ocean-breeze.json"
      }
    ]
  }

  Validation Checklist

  Before finishing, verify:
  - Palette ID uses kebab-case (lowercase with hyphens)
  - All color values are valid hex codes starting with #
  - The name property matches the manifest entry
  - The file property in manifest matches actual filename
  - The id property in manifest matches the filename (without .json)
  - All five element types are defined (text, image, menu, button, accordion)
  - Each element has all three color properties (fill, border, textColor)
  - Text colors have sufficient contrast against fill colors for readability

  After Creation

  The user will need to refresh their browser to see the new palette in the dropdown. The palette system will automatically load and apply the new colors when selected.

---
  Now create the palette based on the colors provided to you.