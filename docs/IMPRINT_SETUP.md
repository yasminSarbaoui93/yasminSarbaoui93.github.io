# Imprint Images Guide

## Overview
To protect your personal contact information from bots and web scrapers, your imprint page uses images instead of text. This prevents automated data collection while still displaying the required legal information.

## Required Images

You need to create **two images** and place them in the `assets/images/` folder:

### 1. `imprint-contact.png`
This image should contain your name and address information. Create an image with:
- **Your name**
- **Street address**
- **Postal code and city**
- **Country** (if applicable)

**Example:**
```
Max Mustermann
Musterstraße 123
12345 Musterstadt
Germany
```

### 2. `imprint-email.png`
This image should contain your email contact information:
- **Email address**

**Example:**
```
Email: contact@sednafm.example
```

## How to Create These Images

### Option 1: Using an Image Editor (Recommended)

1. **Use any image editor:**
   - Canva (free, online)
   - Photoshop
   - GIMP (free)
   - Preview (Mac)
   - Paint (Windows)

2. **Image specifications:**
   - Dimensions: 600px width x auto height
   - Background: Semi-transparent or matching your site's color scheme (#1a1a2e or similar)
   - Text color: White (#ffffff)
   - Font: Clean, readable font (like Arial, Helvetica, or similar)
   - Font size: 16-20px for body text

3. **Design tips:**
   - Keep text left-aligned
   - Add padding around text (20-30px)
   - Use clear, easy-to-read fonts
   - Ensure good contrast between text and background

### Option 2: Using a Simple HTML-to-Image Tool

1. Create a simple HTML file with your text
2. Use a screenshot tool or HTML-to-image converter
3. Save as PNG with transparency

### Option 3: Using Code (Python/Pillow)

```python
from PIL import Image, ImageDraw, ImageFont

# Create image
img = Image.new('RGB', (600, 200), color='#1a1a2e')
d = ImageDraw.Draw(img)

# Add text
font = ImageFont.truetype('Arial.ttf', 18)
text = """Max Mustermann
Musterstraße 123
12345 Musterstadt
Germany"""

d.multiline_text((30, 30), text, fill='white', font=font)
img.save('assets/images/imprint-contact.png')
```

## Important Notes

### Bot Protection
- **DO NOT** use actual text in the HTML - keep using images
- **DO NOT** add alt text with your real email or address
- The meta tag `<meta name="robots" content="noindex, nofollow">` is already added to prevent search engine indexing

### Privacy Tips
- Consider using a P.O. Box or business address if available
- Use a dedicated email address for the website (not your personal one)
- For hobby projects, you can use a pseudonym if German law permits

### German Law (TMG) Requirements
Your imprint page now includes all required sections:
- ✅ Responsible for Content (§ 5 TMG)
- ✅ Contact information
- ✅ Responsible according to § 55 Abs. 2 RStV
- ✅ Disclaimer for hobby/non-commercial project
- ✅ Dispute Resolution
- ✅ Liability for Content
- ✅ Liability for Links
- ✅ Copyright notice

## Testing

After creating and uploading the images:

1. Open `imprint.html` in your browser
2. Check that both images display correctly
3. Verify text is readable
4. Test on mobile devices to ensure responsive display

## Example Image Templates

You can create your images following this visual layout:

**imprint-contact.png:**
```
┌─────────────────────────────┐
│                             │
│  [Your Full Name]           │
│  [Street Address]           │
│  [Postal Code City]         │
│  [Country]                  │
│                             │
└─────────────────────────────┘
```

**imprint-email.png:**
```
┌─────────────────────────────┐
│                             │
│  Email: [your@email.com]    │
│                             │
└─────────────────────────────┘
```

## File Locations

- Place images in: `/assets/images/`
- Final paths should be:
  - `/assets/images/imprint-contact.png`
  - `/assets/images/imprint-email.png`

## Need Help?

If you don't have image editing software, you can:
1. Use online tools like Canva (free)
2. Use screenshot tools to capture text
3. Ask a friend with design software
4. Use simple online HTML-to-image converters
