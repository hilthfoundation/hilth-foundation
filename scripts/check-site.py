"""Check local HTML links, image assets, duplicate IDs and SVG references."""
from pathlib import Path
from html import unescape
import re
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids, self.duplicates, self.refs = set(), [], []
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            if attrs['id'] in self.ids:
                self.duplicates.append(attrs['id'])
            self.ids.add(attrs['id'])
        for attr in ('src', 'href'):
            if attrs.get(attr):
                self.refs.append(attrs[attr])

paths = list(ROOT.glob('*.html')) + list((ROOT / 'components').glob('*.html'))
pages = {path: Page(path.read_text(encoding='utf-8')) for path in paths}
errors = []
# Keep public UI and feed files free of emojis and text-based icon substitutes.
icon_glyphs = re.compile(r'[\U0001F000-\U0001FAFF\u2600-\u27BF\u2190-\u21FF\uFE0F\u20E3\uD800-\uDBFF]')
sources = paths + [path for folder in ('js', 'css', 'data')
                   for path in (ROOT / folder).rglob('*')
                   if path.suffix in ('.js', '.css', '.json')]
for path in sources:
    text = unescape(path.read_text(encoding='utf-8'))
    text = re.sub(r'\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})',
                  lambda match: chr(int(match.group(1) or match.group(2), 16)), text)
    if icon_glyphs.search(text):
        errors.append(f'{path.relative_to(ROOT)}: use SVG icons instead of emojis or icon glyphs')
for path, page in pages.items():
    errors += [f'{path.name}: duplicate id {value}' for value in page.duplicates]
    for ref in page.refs:
        parsed = urlsplit(ref)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        # Shared components are injected into root-level pages.
        dest = ROOT / unquote(parsed.path)
        if not dest.exists():
            errors.append(f'{path.name}: missing {ref}')
        elif parsed.fragment and dest.suffix == '.html' and dest in pages and parsed.fragment not in pages[dest].ids:
            errors.append(f'{path.name}: missing anchor {ref}')
        elif parsed.fragment and dest.suffix == '.svg':
            ids = {node.attrib.get('id') for node in ET.parse(dest).iter()}
            if parsed.fragment not in ids:
                errors.append(f'{path.name}: missing symbol {ref}')
if errors:
    print('\n'.join(errors))
    raise SystemExit(1)
print(f'Passed: {len(paths)} HTML files, local assets, cross-page anchors and SVG symbols.')
