# Programmatic Instructions for QuickBox v0.2

## CRITICAL: Verify Client File Location

**Before starting ANY task, ask the user to confirm the current client mockup file location.** The QuickBox engine is used to create mockups for different clients, and mockups are stored in respective client folders. Always verify you are working with the correct client's JSON file - do not assume or guess the file path.

## Making JSON Edits

### Read First
1. Read the JSON file before making any edits
2. Find existing examples of the structure you're modifying
3. Match the exact structure format

### Edit Strategy
- **Single or few changes (1-2)**: Use the Edit tool with full hierarchical path context. Include parent properties and surrounding fields to ensure uniqueness.
- **Multiple similar changes (3+)**: Use a Node.js script via Bash for efficiency - reads file once, makes all changes in memory, writes once.

### Validation
Validate JSON syntax after editing: `node -e "JSON.parse(require('fs').readFileSync('file.json'))"`

## Box IDs and Numbering

### Critical Rule
**All box IDs must be globally unique across the entire structure** (all pages, header, footer).

### Finding Next Available ID
1. Scan all boxes in structure
2. Extract the highest number from existing box IDs
3. Next available ID = `box-<highest + 1>`

### When Copying Elements or Pages
1. Copy all content, layout, and structure
2. Do NOT copy box IDs
3. Generate new IDs starting from the next available number
4. Update internal references (if boxes within copied section link to each other, maintain those relationships with new IDs)
5. External links (between pages) require manual review and update

### Box Counter Logic
The app maintains `state.boxCounter` in memory:
- Initializes on file load by scanning max box ID in JSON
- Increments before creating each new box
- Does not persist in JSON file
- Recalculates on load from the JSON structure

When programmatically creating boxes, follow same logic: find max ID and increment.

## LinkTo Format

Links use object format, not simple strings:

**Correct:**
```json
"linkTo": { "type": "page", "target": "page-4" }
```

**Incorrect:**
```json
"linkTo": "page-4"
```

## File Naming

Save new versions with incremented numbers: `quickbox-mockupv0.21.json`, `quickbox-mockupv0.22.json`

## Content Creation Request Template

When requesting an LLM to add or modify content, use this structure:

```
OBJECTIVE: [What are you adding/modifying?]

LOCATION: [Which page(s)? page-1 (home), page-2, etc.]

DETAILS:
- Element type: [text, button, accordion, menu, image, etc.]
- Content: [What text/data should it contain?]
- Position: [Where on the page? After which element?]
- Styling: [Any specific sizing, fonts, colors needed?]

LINKS:
- Should any menu items link to this?
- Should this link to other pages?
- Any existing links need updating?

REFERENCE EXAMPLES:
[If using a specific format or template, paste examples here]
```

### Execution Checklist

Before execution, the agent will:
1. Verify the current max box ID to ensure new IDs don't collide
2. Check all linkTo references for correct page targets
3. Match existing element structures exactly
4. Validate JSON syntax after changes
5. Report all new box IDs created and their locations

### Request Examples

**Example 1: Add a Page and Menu Link**
```
OBJECTIVE: Create a new Podcasts page and add navigation link

LOCATION: page-1 (home page) and new page

DETAILS:
- New page name: Podcasts
- New menu item text: "Podcasts"
- Position menu item: After "Testimonials" menu item

LINKS:
- Menu item should link to Podcasts page
```

**Example 2: Add Q&A Section Using Template**
```
OBJECTIVE: Add Q&A accordion section from provided content

LOCATION: page-3 (FAQ page)

DETAILS:
- Element type: accordion box
- Content format: Use Q&A template provided below
- Position: After existing FAQ section

REFERENCE EXAMPLES:
Q: What are your hours?
A: Monday-Friday 9am-5pm

Q: Do you offer virtual sessions?
A: Yes, all sessions available via Zoom
```
