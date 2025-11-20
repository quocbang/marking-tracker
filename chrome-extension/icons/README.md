# Icon Generation Instructions

Since we cannot directly create PNG files, you'll need to create the following icon files:

## Required Icons

1. **icon16.png** - 16x16 pixels
2. **icon48.png** - 48x48 pixels  
3. **icon128.png** - 128x128 pixels

## Design Suggestions

The icons should represent the Marking Tracker theme. Consider:

- A checkmark with a document
- A grading/marking symbol (like a red pen)
- The Dũng English Speaking logo
- A combination of book + checkmark

## Color Scheme

Use the extension's color scheme:
- Primary: #667eea (purple-blue)
- Secondary: #764ba2 (purple)
- Accent: #4CAF50 (green for completion)

## How to Create

### Option 1: Using Online Tools

1. Go to https://www.favicon-generator.org/ or similar
2. Upload your logo or create a simple icon
3. Generate icons in 16x16, 48x48, and 128x128 sizes
4. Download and save in the `chrome-extension/icons/` folder

### Option 2: Using Design Software

1. Use Figma, Photoshop, or GIMP
2. Create a square canvas (128x128 recommended for quality)
3. Design your icon with the branding colors
4. Export as PNG in three sizes: 16x16, 48x48, 128x128
5. Save in the `chrome-extension/icons/` folder

### Option 3: Using SVG to PNG Converter

1. Create an SVG icon (scalable vector)
2. Use a converter like https://cloudconvert.com/svg-to-png
3. Convert to 16x16, 48x48, and 128x128 PNG files
4. Save in the `chrome-extension/icons/` folder

## Simple SVG Template

Here's a simple SVG template you can use as a starting point:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="url(#grad)"/>
  
  <!-- Checkmark -->
  <path d="M 35 65 L 55 85 L 95 45" 
        stroke="white" 
        stroke-width="12" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        fill="none"/>
</svg>
```

Save this as `icon.svg` then convert to PNG files at the required sizes.

## Placeholder Icons

Until you create proper icons, the extension will use the default Chrome extension icon. The extension will still work, but having custom icons improves the user experience.
