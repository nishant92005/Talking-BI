import re

css_path = 'src/index.css'
with open(css_path, 'r') as f:
    css = f.read()

# Find lines with our variables and replace the commas with spaces
def fix_commas(match):
    prefix = match.group(1)
    values = match.group(2).replace(',', ' ')
    return f"{prefix}:{values}"

css = re.sub(r'(--c-[a-zA-Z0-9-]+):([0-9\s,]+);', fix_commas, css)

with open(css_path, 'w') as f:
    f.write(css)

print("Fixed commas to spaces in CSS variables!")
