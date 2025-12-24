# Website Deconstruction Prompt for QuickBox v0.1

## Objective
Analyze a website screenshot and deconstruct it into a QuickBox JSON structure that can be used to create a wireframe mockup.

## Instructions

You are tasked with analyzing a website screenshot and converting its visual structure into a QuickBox-compatible JSON format. Follow these guidelines:

### 1. **Structural Analysis**
- Identify distinct sections: header, main content area, and footer
- Recognize repeating patterns (e.g., team member cards, service/feature grids)
- Note the visual hierarchy and layout structure

### 2. **Element Identification**
Break down the page into QuickBox elements:
- **Text boxes**: For headings, paragraphs, labels, buttons (buttons are currently represented as text boxes)
- **Image boxes**: For photos, icons, logos, illustrations
- **Menu boxes**: For navigation menus (horizontal or vertical)

### 3. **Content Summarization**
- For text content: Use maximum 5 words that summarize what's in the text box
- For images: Leave content blank (empty string) - these will be placeholder image boxes
- For buttons: Create a text box with the button label text only

### 4. **Layout Decomposition Rules**

#### Header Region:
- Extract logo/branding elements
- Extract navigation menu (as a menu box with menu items)
- Extract contact information (email, phone, social links)
- Extract any call-to-action buttons

#### Main Content Region:
- Extract section headers as separate text boxes
- For card/grid layouts (team members, services, features):
  - Each card image = 1 image box
  - Each card text/title = 1 text box below the image
  - Ignore card descriptions unless explicitly needed
- For welcome/hero sections:
  - Hero image = 1 image box
  - Hero text = 1 text box
  - CTA button = 1 text box with button label

#### Footer Region:
- Extract contact information
- Extract address/location details
- Extract branding/copyright text
- Extract any footer navigation or links

### 5. **Positioning Guidelines**
- Use approximate pixel positions based on visual layout
- Space elements logically (standard gaps: 20px between related items, 50px between sections)
- Image boxes for team/service cards: typically 150x150px
- Text boxes for names/titles: typically 150x40px
- Section headers: wider boxes (e.g., 1200px width) to span the content area

### 6. **JSON Structure Format**

```json
{
  "version": "0.4",
  "header": {
    "boxes": [
      // Header elements here
    ]
  },
  "footer": {
    "boxes": [
      // Footer elements here
    ]
  },
  "pages": [
    {
      "id": "page-1",
      "name": "Page 1",
      "canvasSize": "desktop",
      "boxes": [
        // Main content elements here
      ]
    }
  ],
  "currentPageId": "page-1"
}
```

### 7. **Box Template**

```json
{
  "id": "box-N",
  "name": "Type N",
  "type": "text|image|menu",
  "x": 0,
  "y": 0,
  "width": 200,
  "height": 150,
  "zIndex": N,
  "content": "Summary text or empty string",
  "fontSize": "16",
  "fontFamily": "'Architects Daughter', cursive",
  "linkTo": null
}
```

### 8. **Menu Box Template**

```json
{
  "id": "box-N",
  "name": "Menu N",
  "type": "menu",
  "x": 0,
  "y": 0,
  "width": 400,
  "height": 50,
  "zIndex": N,
  "content": "",
  "fontSize": "16",
  "fontFamily": "'Architects Daughter', cursive",
  "linkTo": null,
  "orientation": "horizontal",
  "menuItems": [
    {
      "id": "menu-item-1",
      "text": "Menu Text",
      "linkTo": null,
      "children": []
    }
  ]
}
```

### 9. **Important Notes**
- Ignore styling (colors, backgrounds, borders) - focus only on structure
- Ignore icons within cards unless they are primary content
- Skip "Learn More" or similar repetitive links - can be added later
- Maintain logical reading order for box IDs (top to bottom, left to right)
- Use sequential zIndex values matching box ID numbers
- All boxes should have unique IDs starting from box-1

### 10. **Output**
Provide the complete QuickBox JSON structure ready to be saved and opened in the QuickBox application.

## Example Analysis Checklist

Before generating the JSON, confirm:
- [ ] Header elements identified and counted
- [ ] Footer elements identified and counted
- [ ] Main section headers identified
- [ ] Grid/card layouts identified with element counts
- [ ] All images positioned as image boxes
- [ ] All text content summarized (max 5 words)
- [ ] Navigation menu items listed
- [ ] Box positions approximate the visual layout
- [ ] All IDs are sequential and unique
