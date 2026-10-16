# Hilth Foundation

Website for the Hilth Foundation - an education-focused organisation headquartered in Ghana, helping young people across Africa develop thinking skills, self-awareness and life direction.

## Icon policy

Do not use emojis or text characters as icons. Use Lucide SVG icons or the local Hilth SVG sprite, including for shop actions and staff-supplied content. This rule is recorded in `AGENTS.md` and `DESIGN.md`.

## Tech Stack

- HTML5
- CSS3 (custom properties, flexbox, grid)
- Vanilla JavaScript
- Lucide Icons

## Structure

```
├── index.html          # Main page
├── about.html          # Foundation story and approach
├── programs.html       # Programme directory
├── 90-days.html        # 90 Days programme
├── mentorship.html     # Mentorship programme
├── school-impact.html  # School impact programme
├── hilth-insights.html # Hilth Insights programme
├── team.html           # Leadership profiles
├── work.html           # Programme galleries and outreach filters
├── events.html         # Upcoming and past events
├── shop.html           # Product catalogue and order enquiries
├── data/               # Public records and optional Google Sheets feed
├── scripts/            # Google Apps Script and local validation tools
├── docs/               # Staff setup and content guidance
├── privacy.html        # Privacy policy
├── payment-success.html # Safe non-receipt page for old payment redirects
├── components/
│   ├── header.html     # Shared navigation
│   └── footer.html     # Shared footer and donation information
├── css/
│   ├── styles.css      # Shared site styles
│   └── agency.css      # Interior-page design system
├── js/
│   └── main.js         # All functionality
└── assets/
    └── images/         # Site images and logos
```

## Features

- Responsive design
- Hero slider with auto-advancement
- Donation enquiries while online payments are being prepared
- Shop catalogue with WhatsApp and email order enquiries
- Animated stats counter
- Mobile navigation with animated icon

## Local Development

Serve the repository over HTTP so the shared header and footer can load:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/index.html. No dependency installation or build step is needed.

Edit page content in the root HTML files, shared navigation/footer in `components/`, styling in `css/`, and behaviour in `js/main.js`. Shared controls initialise after their components load; page-local form and image behaviour initialise from the same startup handler.

Check JavaScript syntax after editing:

```powershell
node --check js/main.js
```

## Payment Setup

Online donations and shop checkout show **Online payments coming soon**. No checkout or payment credentials are shipped. Product enquiries go to the Foundation by email or WhatsApp; the notebook uses the same order enquiry flow.

Before enabling checkout: confirm the approved live account, final prices and delivery rules, then implement server-side transaction verification before showing a receipt. Never treat a browser callback or URL reference as proof of payment.

Public website forms use Netlify Forms: general enquiries (`hilth-inquiry`), volunteer applications (`hilth-volunteer-application`), newsletter subscriptions (`hilth-newsletter`), mentorship interest (`hilth-mentorship-interest`) and shop enquiries (`hilth-shop-enquiry`). Keep Netlify form detection enabled and redeploy after adding or changing a form so Netlify can register it. Configure email alerts under Forms > Submission notifications. Keep private payment keys and repository credentials out of browser code.

## Browser Support

Works on all modern browsers (Chrome, Firefox, Safari, Edge).

## Updating events and past programmes

The pages load only entries with `published: true`. Dates must be real `YYYY-MM-DD` dates. Upcoming events include today and sort soonest first; past events sort newest first. The homepage shows six outreach cards and three upcoming events. Programme filters accept HSIP, Insights, 90 Days, Mentorship or Community.

Until a spreadsheet is connected, edit `data/events.json` and `data/outreach.json`. Both currently contain empty arrays because the Foundation has not supplied verified records. Do not publish the examples below as real activity.

Event schema:

```json
{
  "published": false,
  "title": "",
  "date": "YYYY-MM-DD",
  "time": "",
  "location": "",
  "programme": "HSIP",
  "description": "",
  "registrationUrl": "",
  "link": ""
}
```

Outreach schema:

```json
{
  "published": false,
  "title": "",
  "school": "",
  "date": "YYYY-MM-DD",
  "location": "",
  "programme": "HSIP",
  "summary": "Up to 40 words",
  "attendance": null,
  "image": "assets/images/school-group.webp",
  "imageAlt": "Accurate description of the approved photograph",
  "gallery": [],
  "story": ""
}
```

Use town and country in `location`. Set attendance only when recorded. Galleries accept up to eight distinct local image paths. Existing approved photographs can be selected; adding new image files still requires uploading them to the website assets folder. Store consent records separately from public content.

### Events by Google Form

Hilth staff add events with a Google Form that writes into a Google Sheet, which the website reads. The Form is a staff content-entry tool. Event visitors use the separate registration link entered by staff. Nothing is public until a Hilth content editor approves it.

One-time setup (Foundation Google account):

1. Create a Google Sheet for public website content only (for example "Hilth website content").
2. Open Extensions > Apps Script, replace the code with `scripts/content-spreadsheet.gs`, and save. To reuse an existing blank event Form, copy its ID from the edit URL into `EXISTING_EVENT_FORM_ID`; otherwise leave it blank to create a new Form.
3. Run `setupWebsiteContent`, then `setupEventsForm`. Authorise when asked. Open Executions to copy the form link from the log.
4. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Copy the `/exec` URL.
5. Put that URL in `data/content-source.json` as `{ "url": "https://script.google.com/macros/s/.../exec" }` and upload it with the website.

Day to day: anyone on the team opens the form link on a phone and submits an event. In the "Event submissions" sheet, set the Approved column to Yes on that row to publish it. Set it to No or clear it to remove it. Past programme cards still use the `outreach` tab with the `published` checkbox.

To update the existing staff Form: replace `Code.gs` with the latest `scripts/content-spreadsheet.gs`, retain your existing Form ID in `EXISTING_EVENT_FORM_ID`, save, and run `setupEventsForm`. This repairs blank question titles, adds examples and refreshes required fields. Setup remembers its Form ID so repeated runs reuse the same Form. Existing submissions and approval values are retained. Preview the Form and publish any pending changes. If the web app has already been deployed, update its deployment to a new version while retaining the same `/exec` URL.

Each submission describes one event: title, date, local start time, venue/town/country, Hilth programme, short public description, and optional registration/more-information links. Keep this responder link within the Hilth team; designated editors manage the Sheet and approve entries. To correct a submitted event, the content editor updates its row rather than submitting a duplicate.
Reference: [Google Apps Script content service](https://developers.google.com/apps-script/guides/content) and [web app deployment](https://developers.google.com/apps-script/guides/web).

## Remaining Foundation inputs before publishing

- Verified school visit records: school, month/year, location, description, attendance where available, and approved photographs.
- Actual upcoming event dates, times, places and links.
- Confirmation of 10,000+ in-person attendees and the current activity in Nigeria and Kenya.
- Public pages omit unverified reach totals and country activity claims until supporting records are approved.
- Approved leadership bios, Gideon's name order and Theophilus's final title. Abigail Kuzue is included; Stephen is retained as an advisor; Ransford and Bola are removed from the displayed team.
- Precept Prints logo and both partners' contribution descriptions.
- Hilth Insights destination and approved mentorship waitlist/mentor form links. Existing interest submissions retain the original provider; delivery has not been verified with a live submission.
- Mentorship plan approval, appointed Safeguarding Lead and adopted policy before adding a launch claim or the Safe by Design commitment.
- School/guardian permissions for student photographs and one designated content editor.

The design and existing page URLs remain intact. AI-generated photographs have been removed and replaced with supplied activity photos. Image filenames use lowercase hyphens. Online payments are disabled until the Foundation is ready to launch checkout. These local updates do not constitute a production deployment.

## Shop and SEO

`shop.html` uses the Foundation-supplied front/back T-shirt design previews. Tags have a clearly labelled illustration until approved photos arrive. Prices, sizes, stock and delivery costs must be confirmed before checkout is enabled. Add future product photos under `assets/images/shop/`.

Public pages have unique descriptions, canonical URLs and matching social metadata. Interior pages include breadcrumb structured data. The sitemap includes the shop and excludes the inactive payment callback, which uses noindex. After deployment, submit `https://hilthfoundation.org/sitemap.xml` in Google Search Console and inspect the homepage and shop URL. Local metadata checks do not certify live indexing or ranking.

## Direct orders and donations

The shop form first stores the enquiry in Netlify Forms, then prepares a WhatsApp message to the existing Hilth contact (0543790817), or an email to admin@hilthfoundation.org. The customer can continue the conversation in their chosen app. Admins receive customer identity, product, quantity, preferred size, delivery town and notes in the stored submission and, when sent, through the chosen channel. Confirm price, stock, delivery and available payment details in the reply; verify funds before marking paid. There is no automatic payment confirmation or order dashboard.

See `docs/orders-and-google-sync.md` for the staff workflow and Google events setup. Confirm that the Foundation's listed phone is monitored on WhatsApp; email remains available if it is not.

## Staff-managed shop catalogue

Run `setupShopForm` from the updated content script, add the two upload questions in Google Forms, then deploy a new version of the existing web app. See `docs/shop-form-setup.md`. Shop submissions publish automatically after their media is processed; there is no product approval column. Staff can edit price/options directly in the Sheet, set Sold out or Coming soon, or hide a product with Hidden. Uploads are made publicly viewable by the installed Foundation-owned trigger. Share this Form only with staff.

The website reads `products` from the same feed as events/outreach. `data/products.json` is a starter catalogue used only while the older event-only deployment has no products field. Once the updated feed includes products, that list is authoritative, including when empty. Product videos open as external links. Orders remain manual WhatsApp/email enquiries.
