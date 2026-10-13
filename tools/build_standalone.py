"""Bundle local assets so players can open one HTML file without companion files."""
from pathlib import Path

root = Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + (root / 'style.css').read_text(encoding='utf-8') + '\n</style>')
for name in ['data.js', 'battle.js', 'game.js']:
    script = (root / name).read_text(encoding='utf-8').replace('</script', '<\\/script')
    html = html.replace(f'<script defer src="{name}"></script>', '')
    html = html.replace('</body>', '<script>\n' + script + '\n</script></body>')
(root / '엘리멘트리.html').write_text(html, encoding='utf-8')
print('Built 엘리멘트리.html')
