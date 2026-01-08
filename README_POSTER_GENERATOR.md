# SPICON-2026 Poster Generator

## Overview
This script generates personalized A4 posters for West Rayalaseema region users from a CSV database.

## Prerequisites

### 1. Install Python Dependencies
```bash
pip install pillow pandas
```

Or create a `requirements.txt` and install:
```bash
pip install -r requirements.txt
```

### 2. Prepare Your Data

#### CSV File Structure
Create a file at: `data/members.csv`

Required columns:
- `full_name`: Full name of the user
- `region`: Region name (must be "West Rayalaseema" for processing)
- `place`: City/town name
- `district`: District name

Example CSV:
```csv
full_name,region,place,district
John Doe,West Rayalaseema,Proddatur,YSR Kadapa District
Jane Smith,West Rayalaseema,Kurnool,Kurnool District
```

### 3. Font Setup

Download a print-quality font (e.g., Roboto-Bold) and place it in the `fonts/` folder:
- Recommended: `fonts/Roboto-Bold.ttf`
- Or use any TTF font file suitable for printing

**Note:** If the font file is not found, the script will use the default system font.

## Configuration

Before running, edit `generate_posters.py` and adjust these settings at the top:

### Text Position Coordinates
You need to determine the exact pixel coordinates where text should be placed on your template:

```python
NAME_POSITION = (400, 2400)  # (x, y) - Adjust based on your template
PLACE_POSITION = (400, 2500)  # (x, y) - Adjust based on your template
```

**How to find coordinates (Method 1 - Using Helper Script):**
1. Run the coordinate finder script:
   ```bash
   python find_text_coordinates.py
   ```
2. Click on the image where you want the Name text to appear
3. Click where you want the Place text to appear
4. Right-click to finish and see the coordinates
5. Copy the coordinates to `generate_posters.py`

**How to find coordinates (Method 2 - Manual):**
1. Open your template image in an image editor (e.g., GIMP, Photoshop, or online tools)
2. Hover over the text field positions
3. Note the X and Y pixel coordinates
4. Update the script with these values

### Font Settings
```python
FONT_SIZE_NAME = 48   # Adjust as needed
FONT_SIZE_PLACE = 42  # Adjust as needed
TEXT_COLOR = (0, 0, 0)  # RGB color - Black (0,0,0) or adjust to match poster
```

### File Paths
All paths are configured at the top of the script. Adjust if needed:
- `TEMPLATE_IMAGE_PATH`: Path to your template image
- `CSV_DATA_PATH`: Path to your CSV file
- `FONT_PATH`: Path to your font file
- `OUTPUT_DIR`: Where generated posters will be saved

## Running the Script

### Windows PowerShell:
```powershell
cd "C:\Users\syedn\Desktop (1)\projects\Expenses\Expenses_FE"
python generate_posters.py
```

### Windows Command Prompt:
```cmd
cd "C:\Users\syedn\Desktop (1)\projects\Expenses\Expenses_FE"
python generate_posters.py
```

## Output

- Generated posters will be saved in: `output_west_rayalaseema/`
- Each file is named: `<Full_Name>.jpg`
- Files are sanitized (special characters removed/replaced)
- Images are saved at 300 DPI print quality

## Features

✅ Filters only West Rayalaseema region users  
✅ Leaves Study/Profession field empty  
✅ Combines place + district in format: "Place, District"  
✅ Sanitizes filenames automatically  
✅ Progress tracking during generation  
✅ Error handling and reporting  
✅ Print-quality output (300 DPI, JPEG quality 95)

## Troubleshooting

### "Template image not found"
- Verify the template image path is correct
- Check that the file exists at the specified location

### "CSV data file not found"
- Create the `data/` folder if it doesn't exist
- Ensure `members.csv` is in the `data/` folder
- Check the CSV path in the script configuration

### "Font file not found"
- The script will use default font if custom font is missing
- Download a font and place it in `fonts/` folder for better results

### Text position is wrong
- Open your template in an image editor
- Find the exact pixel coordinates for text fields
- Update `NAME_POSITION` and `PLACE_POSITION` in the script

### Text color doesn't match
- Adjust `TEXT_COLOR` RGB values in the script
- Example: Dark blue = (0, 0, 139), Red = (255, 0, 0)

## Expected Output Structure

```
Expenses_FE/
├── generate_posters.py
├── WhatsApp Image 2026-01-08 at 19.41.40.jpeg (template)
├── data/
│   └── members.csv
├── fonts/
│   └── Roboto-Bold.ttf (or your font)
└── output_west_rayalaseema/
    ├── John_Doe.jpg
    ├── Jane_Smith.jpg
    └── ... (≈400 images)
```

## Notes

- Only users with `region = "West Rayalaseema"` are processed
- East Rayalaseema users are automatically skipped
- Study/Profession field remains blank as per requirements
- Each poster maintains A4 size and 300 DPI print quality

