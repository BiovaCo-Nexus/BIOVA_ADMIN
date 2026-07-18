import os
import glob

replacements = {
    'bg-[#7DA0FA] hover:bg-[#678eee]': 'bg-primary hover:bg-primary/90',
    'bg-secondary text-secondary-foreground hover:bg-[#069a43]': 'bg-primary text-primary-foreground hover:bg-primary/90',
    'bg-secondary text-secondary-foreground hover:bg-[#06803B]': 'bg-primary text-primary-foreground hover:bg-primary/90',
    'bg-foreground text-background hover:bg-[#021f44]': 'bg-primary text-primary-foreground hover:bg-primary/90',
    'bg-foreground text-background hover:bg-foreground text-background/90': 'bg-primary text-primary-foreground hover:bg-primary/90',
    'hover:bg-foreground text-background/5': 'hover:bg-primary hover:text-primary-foreground',
    'bg-foreground text-background text-white': 'bg-primary text-primary-foreground',
    'bg-foreground text-background': 'bg-primary text-primary-foreground',
    'hover:bg-foreground text-background hover:text-white': 'hover:bg-primary hover:text-primary-foreground',
    'bg-primary/10 text-primary-foreground': 'bg-primary/10 text-primary',
    'bg-[#7DA0FA]/10 text-[#7DA0FA] border-0': 'bg-primary/10 text-primary border-0',
    'border-border text-foreground hover:bg-foreground text-background hover:text-white': 'border-primary text-primary hover:bg-primary hover:text-primary-foreground',
    'text-foreground hover:bg-foreground text-background hover:text-white': 'text-primary hover:bg-primary hover:text-primary-foreground',
    'bg-primary text-primary-foreground hover:bg-primary text-primary-foreground': 'bg-primary text-primary-foreground hover:bg-primary/90',
    'bg-[#032E63] text-white hover:bg-[#021D42]': 'bg-primary text-primary-foreground hover:bg-primary/90'
}

for filepath in glob.glob("src/**/*.tsx", recursive=True):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
            
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

print("Done.")
