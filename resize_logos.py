#!/usr/bin/env python3
"""
Resize logos for KASA app
"""
from PIL import Image
import os

def main():
    assets_dir = os.path.join('frontend', 'assets')
    
    if not os.path.exists(assets_dir):
        print(f"ERROR: Directory not found: {assets_dir}")
        return
    
    icon_path = os.path.join(assets_dir, 'icon.png')
    splash_path = os.path.join(assets_dir, 'splash.png')
    
    if not os.path.exists(icon_path):
        print(f"ERROR: icon.png not found")
        return
    
    if not os.path.exists(splash_path):
        print(f"ERROR: splash.png not found")
        return
    
    # Resize splash.png to 1242x2436 filled with logo's background color
    splash_img = Image.open(splash_path)
    target_size = (1242, 2436)
    
    # Scale logo to fit width (1242) while maintaining square aspect ratio
    logo_size = (1242, 1242)
    splash_resized = splash_img.resize(logo_size, Image.Resampling.LANCZOS)
    
    # Extract background color from logo (get corner pixel color)
    # Convert to RGB if needed
    if splash_resized.mode != 'RGB':
        splash_rgb = Image.new('RGB', splash_resized.size)
        if splash_resized.mode == 'RGBA':
            splash_rgb.paste(splash_resized, mask=splash_resized.split()[3])  # Use alpha channel
        else:
            splash_rgb.paste(splash_resized)
        bg_color = splash_rgb.getpixel((0, 0))  # Get top-left corner color
    else:
        bg_color = splash_resized.getpixel((0, 0))  # Get top-left corner color
    
    # Create canvas filled with logo's background color
    new_img = Image.new('RGB', target_size, bg_color)
    
    # Center logo vertically
    x = (target_size[0] - logo_size[0]) // 2  # Center horizontally (should be 0)
    y = (target_size[1] - logo_size[1]) // 2  # Center vertically = (2436 - 1242) / 2 = 597
    
    # Paste logo onto canvas
    if splash_resized.mode == 'RGBA':
        new_img.paste(splash_resized, (x, y), splash_resized.split()[3])  # Use alpha channel as mask
    else:
        new_img.paste(splash_resized, (x, y))
    
    new_img.save(splash_path, 'PNG')
    print("Resized splash.png to 1242x2436 filled with logo's background color")
    
    print("\nDone!")

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"ERROR: {e}")
        print("Make sure Pillow is installed: pip install Pillow")

