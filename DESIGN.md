# Hilth Foundation

An editorial education nonprofit website: documentary photography, rounded Quicksand typography, generous paper-colored surfaces, and clear, practical actions.

## Live reference review

The five reference homepages informed the design. Temporary comparison screenshots have been removed from the repository.

- City Year — https://www.cityyear.org/: photographic scale, tinted image fields, student-centered language.
- The Humane League — https://thehumaneleague.org/: emphatic headline hierarchy, highlighted phrases, angular section edge.
- Girls Who Code — https://girlswhocode.com/: expressive graphic marks, color blocking, distinct programme routes.
- charity: water — https://www.charitywater.org/: authentic human photography and a clear primary action.
- GiveDirectly — https://www.givedirectly.org/: concise conversion copy and factual proof near the hero.

The implementation is original HTML/CSS. Reference photographs, logos, proprietary fonts and source code are not included in the website.

## Tokens

- Logo purple: `#5143DE` (dominant flat color in logo.jpeg).
- Logo green: `#06D7A0` (dominant accent in favicon.jpeg).
- Deep purple: `#4032BC` (interactive hover).
- White: `#FFFFFF`
- Alternate surface: `#F5F4FA`
- Text: `#211C39`; body: `#49435B`
- Rules: `#DEDBE9`
- Type: Quicksand across headings, body copy, forms, navigation and shared components; weights 400–700.
- Corners: 0–4px. No decorative glows or floating card shadows.

## Rules

No emojis or Unicode glyphs used as icons anywhere on the website, including navigation, buttons, notifications and staff-supplied content. Use the existing Lucide SVG icons or `assets/icons/hilth-symbols.svg` instead. Decorative icons must have `aria-hidden="true"`; icon-only controls must have an accessible name.

Use the existing Hilth logo and real Foundation photos. Feature one school programme beside a linked catalogue of the other three. Programme symbols use the local SVG sprite in `assets/icons/hilth-symbols.svg`; interface and social icons retain the existing library. Arrows signal navigable actions and are hidden from assistive technology.

Mobile uses a distinct photo-first hero composition. The header keeps donation and menu actions visible. At 900px and below, navigation becomes a keyboard-accessible menu with scroll locking, Escape support and focus containment. At 600px and below, programme layouts become one column.

Do not add unverified quotes, statistics, events or launch claims. Retain proposed-programme labels and existing content-feed behavior. Changes to colors or type go in `css/agency.css`, loaded after the legacy functional stylesheet on every page.

The shared footer closes with a large newsletter invitation, then a three-column brand, navigation and contact directory. Mobile stacks the newsletter and brand above two compact link columns. Main color fields use the sampled logo purple and green; neutrals support readable text.

Interior campaign heroes (Leadership, Programmes, Work and Events) share a documentary photo field, purple wash, green headline marker and angular white lower edge. Desktop pairs headline and supporting copy; mobile keeps the main photographic area above the text. Page-specific links scroll into existing content.

Programme information architecture: programs.html is a short directory retaining #hsip, #insights, #90days and #mentorship. Four root-level detail pages hold the full descriptions and existing form. about.html contains the belief statement, four-step learning path and regional context. Chris is featured separately on the home page. All seven leadership profiles, including Stephen Abuakwah, share one consistent card layout with full photographs in matching 4:5 portrait frames, fitted without cropping or distortion and flat neutral surfaces. Cards stack vertically on phones and use equal heights at each screen size.
