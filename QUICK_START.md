# Quick Start Guide - Poster Generator

## 🚀 Setup (5 minutes)

### Step 1: Install Dependencies
```powershell
pip install pillow pandas
```

### Step 2: Prepare Your Data
1. Create `data/members.csv` with columns: `full_name`, `region`, `place`, `district`
2. Ensure your CSV has users with `region = "West Rayalaseema"`

### Step 3: Add Font (Optional)
- Download a font (e.g., Roboto-Bold.ttf)
- Place it in `fonts/` folder
- If no font is provided, default system font will be used

### Step 4: Find Text Coordinates
```powershell
python find_text_coordinates.py
```
- Click where Name should appear
- Click where Place should appear  
- Right-click to finish
- Copy coordinates to `generate_posters.py`

### Step 5: Configure Script
Edit `generate_posters.py` and update:
- `NAME_POSITION` - coordinates from step 4
- `PLACE_POSITION` - coordinates from step 4
- `TEXT_COLOR` - RGB color matching your poster (default: black)
- `FONT_SIZE_NAME` and `FONT_SIZE_PLACE` - adjust as needed

### Step 6: Run Generator
```powershell
python generate_posters.py
```

## ✅ Output
- All posters saved in: `output_west_rayalaseema/`
- Format: `<Full_Name>.jpg`
- Quality: 300 DPI, print-ready

## 📝 Notes
- Only processes "West Rayalaseema" region
- Study/Profession field remains empty
- Place format: "City, District"

