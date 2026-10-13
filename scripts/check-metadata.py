"""Validate public page metadata, structured data and sitemap coverage."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://hilthfoundation.org/'

class Metadata(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.meta, self.canonical, self.titles, self.schemas = {}, [], [], []
        self.capture = None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta':
            key = attrs.get('name', attrs.get('property', ''))
            self.meta.setdefault(key, []).append(attrs.get('content', ''))
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical.append(attrs.get('href'))
        if tag == 'title' or (tag == 'script' and attrs.get('type') == 'application/ld+json'):
            self.capture = (tag, [])

    def handle_data(self, data):
        if self.capture:
            self.capture[1].append(data)

    def handle_endtag(self, tag):
        if self.capture and tag == self.capture[0]:
            value = ''.join(self.capture[1])
            (self.titles if tag == 'title' else self.schemas).append(value)
            self.capture = None

errors, titles, indexable = [], [], set()
for path in ROOT.glob('*.html'):
    if path.name.startswith('google'):
        continue
    page = Metadata(path.read_text(encoding='utf-8'))
    expected = BASE + ('' if path.name == 'index.html' else path.name)
    def check(condition, message):
        if not condition:
            errors.append(f'{path.name}: {message}')
    check(len(page.titles) == 1 and bool(page.titles[0]), 'exactly one nonempty title required')
    check(page.canonical == [expected], 'canonical does not match route')
    for key in ('description', 'og:url', 'og:title', 'og:description', 'og:image', 'og:image:alt', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt'):
        check(len(page.meta.get(key, [])) == 1 and bool(page.meta[key][0]), f'missing or duplicate {key}')
    for key in ('title', 'description', 'image'):
        check(page.meta.get('og:' + key) == page.meta.get('twitter:' + key), f'social {key} mismatch')
    check(page.meta.get('og:title') == page.titles, 'title and social title mismatch')
    check(page.meta.get('og:description') == page.meta.get('description'), 'description mismatch')
    check(page.meta.get('og:url') == [expected], 'Open Graph URL mismatch')
    for value in page.meta.get('og:image', []):
        check(value.startswith(BASE) and (ROOT / urlsplit(value).path.lstrip('/')).is_file(), 'social image missing')
    for schema in page.schemas:
        try:
            json.loads(schema)
        except json.JSONDecodeError:
            errors.append(f'{path.name}: invalid structured data')
    if 'noindex' not in ' '.join(page.meta.get('robots', [])):
        indexable.add(expected)
        titles.extend(page.titles)
    if path.name == 'payment-success.html':
        check('noindex' in ' '.join(page.meta.get('robots', [])), 'payment callback must be noindex')
sitemap = [node.text for node in ET.parse(ROOT / 'sitemap.xml').iter() if node.tag.endswith('}loc')]
if set(sitemap) != indexable or len(sitemap) != len(set(sitemap)):
    errors.append('Sitemap must contain every indexable page exactly once')
if any(count > 1 for count in Counter(titles).values()):
    errors.append('Duplicate public page titles')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'Passed: metadata, social images, JSON-LD and sitemap for {len(indexable)} public pages.')
