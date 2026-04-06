import re
import os

css_path = 'src/index.css'
with open(css_path, 'r') as f:
    css = f.read()

def hex_to_rgb(match):
    var_name = match.group(1)
    hex_val = match.group(2).lstrip('#')
    # handle 3 char hex
    if len(hex_val) == 3:
        hex_val = "".join([c*2 for c in hex_val])
    r = int(hex_val[0:2], 16)
    g = int(hex_val[2:4], 16)
    b = int(hex_val[4:6], 16)
    return f"{var_name}: {r}, {g}, {b}"
    
# Replace hex variables
css = re.sub(r'(--c-[a-zA-Z0-9-]+):\s*(#[A-Fa-f0-9]{3,6})', hex_to_rgb, css)

# Fix rgba variable formats (convert rgba(r,g,b,alpha) to just r,g,b and we'll handle opacity in components)
def rgba_to_rgb(match):
    var_name = match.group(1)
    rgba_val = match.group(2)
    vals = rgba_val.replace('rgba(', '').replace(')', '').split(',')
    r, g, b = vals[0].strip(), vals[1].strip(), vals[2].strip()
    return f"{var_name}: {r}, {g}, {b}"

css = re.sub(r'(--c-[a-zA-Z0-9-]+):\s*(rgba\([^)]+\))', rgba_to_rgb, css)

with open(css_path, 'w') as f:
    f.write(css)

# Now fix tailwind.config.js
tw_path = 'tailwind.config.js'
with open(tw_path, 'r') as f:
    tw = f.read()

tw = re.sub(r'"var\((--c-[a-zA-Z0-9-]+)\)"', r'"rgb(var(\1) / <alpha-value>)"', tw)

with open(tw_path, 'w') as f:
    f.write(tw)

print("Fixed variables!")
