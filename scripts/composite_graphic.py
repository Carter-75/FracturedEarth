from PIL import Image, ImageChops

def composite():
    # Paths
    bg_path = 'c:\\Users\\carte\\OneDrive\\Desktop\\Code\\Apps\\FracturedEarth\\assets\\brand\\play_store_featured_1024x500.png'
    logo_path = 'C:\\Users\\carte\\.gemini\\antigravity\\brain\\8c59c48f-df15-4a40-b123-57f4d58a9970\\fractured_earth_logo_text_1775018423940.png'
    output_path = 'c:\\Users\\carte\\OneDrive\\Desktop\\Code\\Apps\\FracturedEarth\\assets\\brand\\play_store_featured_1024x500.png'

    # Load
    bg = Image.open(bg_path).convert('RGBA')
    logo = Image.open(logo_path).convert('RGBA')

    # Simple background removal (anything very dark becomes transparent)
    # Get the RGB data
    r, g, b, a = logo.split()
    # Create mask: where brightness > threshold
    threshold = 20
    mask = Image.eval(ImageOps.grayscale(logo), lambda x: 255 if x > threshold else 0)
    logo.putalpha(mask)

    # Resize logo to fit nicely (70% of width)
    target_w = 700
    scale = target_w / logo.width
    target_h = int(logo.height * scale)
    logo = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # Center horizontally, place 100px from top
    pos_x = (bg.width - target_w) // 2
    pos_y = (bg.height - target_h) // 2 - 20 # Centered vertically but up a bit
    
    bg.paste(logo, (pos_x, pos_y), logo)
    
    # Save as RGB for Play Store
    final = bg.convert('RGB')
    final.save(output_path, 'PNG')
    print(f"Successfully saved to {output_path}")

try:
    from PIL import ImageOps
    composite()
except Exception as e:
    print(f"Error: {e}")
