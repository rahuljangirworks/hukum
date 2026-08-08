import os
import re

ROOT_DIR = '/home/rahul/work/personal-projacts/hukum'

IGNORE_DIRS = {'.git', 'node_modules', 'dist', 'build', '.agent', '.hukum', 'bun.lock', '.cursor', '.windsurf'}
IGNORE_EXTS = {'.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.lock', '.woff', '.woff2', '.ttf', '.eot', '.pdf'}

REPLACEMENTS = [
    (re.compile(r'hukumai', re.IGNORECASE), lambda m: 'hukumai' if m.group(0).islower() else ('HUKUMAI' if m.group(0).isupper() else 'HukumAI')),
    (re.compile(r'hukum', re.IGNORECASE), lambda m: 'hukum' if m.group(0).islower() else ('HUKUM' if m.group(0).isupper() else 'Hukum'))
]

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        for pattern, repl in REPLACEMENTS:
            new_content = pattern.sub(repl, new_content)
            
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
    except (UnicodeDecodeError, PermissionError):
        # Skip binary or inaccessible files
        pass
    return False

def main():
    modified_count = 0
    for root, dirs, files in os.walk(ROOT_DIR):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            _, ext = os.path.splitext(file)
            if ext.lower() in IGNORE_EXTS:
                continue
                
            filepath = os.path.join(root, file)
            if process_file(filepath):
                modified_count += 1
                
    print(f"Modified {modified_count} files.")

if __name__ == '__main__':
    main()
