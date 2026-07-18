import os
import glob

replacements = {
    "#032E63": "#4B49AC",  # Navy -> Skydash Primary
    "#021D42": "#3e3d93",  # Navy Hover -> Skydash Primary Hover
    "#08A04B": "#7DA0FA",  # Green -> Skydash Accent (Light Blue)
    "#078f42": "#678eee",  # Green Hover -> Skydash Accent Hover
    "#f0f7f3": "#f2f6ff",  # Green Light BG -> Skydash Accent Light BG
    "#e1f0e8": "#e6eeff",  # Green Light Hover -> Skydash Accent Light Hover
    "text-navy": "text-skydash-primary",
    "text-deep-navy": "text-skydash-primary-hover",
    "text-innovation-green": "text-skydash-accent",
    "bg-navy": "bg-skydash-primary",
    "bg-innovation-green": "bg-skydash-accent",
}

for filepath in glob.glob("src/**/*.tsx", recursive=True) + glob.glob("src/**/*.ts", recursive=True) + glob.glob("src/**/*.css", recursive=True):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        # Case insensitive replacement for hex codes, but exact case for class names
        if old.startswith("#"):
            new_content = new_content.replace(old, new)
            new_content = new_content.replace(old.lower(), new)
        else:
            new_content = new_content.replace(old, new)
            
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

print("Done replacing colors.")
