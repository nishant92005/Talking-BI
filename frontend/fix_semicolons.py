import re

css_path = 'src/index.css'
with open(css_path, 'r') as f:
    css = f.read()

# Add semicolons back to lines that start with --c and don't have them
def fix_semis(match):
    return match.group(0) + ";"

css = re.sub(r'(--c-[a-zA-Z0-9-]+: [0-9 ]+)(?!\s*;)', fix_semis, css)

with open(css_path, 'w') as f:
    f.write(css)

print("Added semicolons back!")
