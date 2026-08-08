import os
import re

ROOT_DIR = '/home/rahul/work/personal-projacts/traycer'
IGNORE_DIRS = {'.git', 'node_modules', 'dist', 'build', '.agent', '.traycer'}

def main():
    rename_count = 0
    # Walk bottom-up to safely rename directories without breaking paths
    for root, dirs, files in os.walk(ROOT_DIR, topdown=False):
        # Skip ignored directories
        if any(ignored in root.split(os.sep) for ignored in IGNORE_DIRS):
            continue
            
        for name in files + dirs:
            if 'traycer' in name.lower():
                old_path = os.path.join(root, name)
                
                if 'traycer' in name:
                    new_name = name.replace('traycer', 'hukum')
                elif 'Traycer' in name:
                    new_name = name.replace('Traycer', 'Hukum')
                elif 'TRAYCER' in name:
                    new_name = name.replace('TRAYCER', 'HUKUM')
                else:
                    new_name = re.sub(r'traycer', 'hukum', name, flags=re.IGNORECASE)
                    
                new_path = os.path.join(root, new_name)
                
                try:
                    os.rename(old_path, new_path)
                    rename_count += 1
                except OSError as e:
                    print(f"Error renaming {old_path}: {e}")
                    
    print(f"Renamed {rename_count} files/directories.")

if __name__ == '__main__':
    main()
