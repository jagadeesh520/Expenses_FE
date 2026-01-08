"""
Helper script to find text coordinates on the template image.
This will help you determine the exact pixel positions for NAME_POSITION and PLACE_POSITION.

Usage:
1. Run this script
2. Click on the template image where you want the text to appear
3. The coordinates will be printed to the console
4. Copy those coordinates to generate_posters.py
"""

import os
from PIL import Image, ImageDraw, ImageFont
import tkinter as tk
from tkinter import filedialog

# Template image path
TEMPLATE_IMAGE_PATH = r"C:\Users\syedn\Desktop (1)\projects\Expenses\Expenses_FE\WhatsApp Image 2026-01-08 at 19.41.40.jpeg"

class CoordinateFinder:
    def __init__(self, image_path):
        self.image_path = image_path
        self.coordinates = []
        
        # Load image
        if not os.path.exists(image_path):
            print(f"ERROR: Image not found at: {image_path}")
            return
        
        self.img = Image.open(image_path)
        self.width, self.height = self.img.size
        
        print(f"Image loaded: {self.width}x{self.height} pixels")
        print("Click on the image where you want to place the text.")
        print("Right-click to finish and see coordinates.")
        print()
        
    def on_click(self, event):
        x, y = event.x, event.y
        self.coordinates.append((x, y))
        print(f"Clicked at: ({x}, {y})")
        
    def on_right_click(self, event):
        print()
        print("=" * 50)
        print("COORDINATES COLLECTED:")
        print("=" * 50)
        if len(self.coordinates) >= 1:
            print(f"NAME_POSITION = {self.coordinates[0]}")
        if len(self.coordinates) >= 2:
            print(f"PLACE_POSITION = {self.coordinates[1]}")
        print("=" * 50)
        print()
        print("Copy these coordinates to generate_posters.py")
        self.root.quit()
    
    def run(self):
        # Create Tkinter window
        self.root = tk.Tk()
        self.root.title("Click on Text Positions - Right-click when done")
        
        # Convert PIL image to PhotoImage
        from PIL import ImageTk
        photo = ImageTk.PhotoImage(self.img)
        
        # Create label with image
        label = tk.Label(self.root, image=photo)
        label.pack()
        label.bind("<Button-1>", self.on_click)
        label.bind("<Button-3>", self.on_right_click)  # Right-click
        
        # Keep reference to photo
        label.image = photo
        
        self.root.mainloop()

if __name__ == "__main__":
    finder = CoordinateFinder(TEMPLATE_IMAGE_PATH)
    finder.run()

