#!/usr/bin/env python3
"""
Generate imprint images for bot protection
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Create output directory if it doesn't exist
output_dir = "assets/images"
os.makedirs(output_dir, exist_ok=True)

# Color scheme - transparent background, white text
bg_color = (0, 0, 0, 0)  # Fully transparent
text_color = (255, 255, 255)  # White

def create_contact_image():
    """Create the contact information image"""
    # Create image with transparency
    img = Image.new('RGBA', (600, 180), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    # Try to use a nice font, fallback to default
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
    except:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
        except:
            font = ImageFont.load_default()
    
    # Contact information
    text = """Yasmin Sarbaoui and Gaia Parolini"""
    
    # Draw text with padding
    draw.text((30, 70), text, fill=text_color, font=font)
    
    # Save
    img.save(f"{output_dir}/imprint-contact.png")
    print(f"✅ Created {output_dir}/imprint-contact.png")

def create_email_image():
    """Create the email contact image"""
    # Create image with transparency
    img = Image.new('RGBA', (600, 120), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    # Try to use a nice font, fallback to default
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
    except:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
        except:
            font = ImageFont.load_default()
    
    # Email
    text = "Email: info@sedna.fm"
    
    # Draw text with padding
    draw.text((30, 45), text, fill=text_color, font=font)
    
    # Save
    img.save(f"{output_dir}/imprint-email.png")
    print(f"✅ Created {output_dir}/imprint-email.png")

if __name__ == "__main__":
    print("Creating imprint images...")
    create_contact_image()
    create_email_image()
    print("\n✨ All images created successfully!")
    print("\nImages are saved in: assets/images/")
    print("- imprint-contact.png")
    print("- imprint-email.png")
