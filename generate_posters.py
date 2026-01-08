"""
SPICON-2026 Poster Generator
Generates personalized A4 posters for West Rayalaseema region users.

Author: Senior Python Automation Engineer
Date: 2026
"""

import os
import pandas as pd
from PIL import Image, ImageDraw, ImageFont
import re

# =============================================================================
# CONFIGURATION
# =============================================================================

TEMPLATE_IMAGE_PATH = r"C:\Users\syedn\Desktop (1)\projects\Expenses\Expenses_FE\WhatsApp Image 2026-01-08 at 19.41.40.jpeg"
CSV_DATA_PATH = r"C:\Users\syedn\Desktop (1)\projects\Expenses\Expenses_FE\data\members.csv"
FONT_PATH = r"C:\Users\syedn\Desktop (1)\projects\Expenses\Expenses_FE\fonts\Roboto-Bold.ttf"
OUTPUT_DIR = r"C:\Users\syedn\Desktop (1)\projects\Expenses\Expenses_FE\output_west_rayalaseema"

TARGET_REGION = "West Rayalaseema"

# Font sizes
FONT_SIZE_NAME = 40
FONT_SIZE_PLACE = 40

# Text color – solid black (very visible on beige background)
TEXT_COLOR = (0, 0, 0)

# ✅ FINAL FIXED COORDINATES (FOR YOUR IMAGE)
NAME_POSITION = (250, 1323)
PLACE_POSITION = (250, 1383)

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def sanitize_filename(name):
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'\s+', '_', name)
    return name.strip('_')

def format_place(place, district):
    place = "" if pd.isna(place) else str(place).strip()
    district = "" if pd.isna(district) else str(district).strip()

    if place and district:
        return f"{place}, {district} (District)"
    return place or district


def load_font(path, size):
    if os.path.exists(path):
        return ImageFont.truetype(path, size)
    print("⚠ Font not found, using default font")
    return ImageFont.load_default()

# =============================================================================
# POSTER GENERATION
# =============================================================================

def generate_poster(template_path, name, place, output_path,
                    name_font, place_font):

    img = Image.open(template_path).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Draw NAME
    draw.text(NAME_POSITION, name, fill=TEXT_COLOR, font=name_font)

    # Draw PLACE
    draw.text(PLACE_POSITION, place, fill=TEXT_COLOR, font=place_font)

    # Profession row intentionally left blank

    img.save(output_path, "JPEG", quality=95, dpi=(300, 300))

# =============================================================================
# MAIN
# =============================================================================

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    name_font = load_font(FONT_PATH, FONT_SIZE_NAME)
    place_font = load_font(FONT_PATH, FONT_SIZE_PLACE)

    df = pd.read_csv(CSV_DATA_PATH)

    west_users = df[
        df["region"].str.strip().str.lower() ==
        TARGET_REGION.lower()
    ]

    print(f"Found {len(west_users)} West Rayalaseema users")

    for i, row in west_users.iterrows():
        full_name = str(row["full_name"]).strip()
        place = format_place(row["place"], row["district"])

        filename = sanitize_filename(full_name) + ".jpg"
        output_path = os.path.join(OUTPUT_DIR, filename)

        generate_poster(
            TEMPLATE_IMAGE_PATH,
            full_name,
            place,
            output_path,
            name_font,
            place_font
        )

        if (i + 1) % 50 == 0:
            print(f"Generated {i + 1} posters")

    print("✅ All posters generated successfully")

if __name__ == "__main__":
    main()
