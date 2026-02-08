# Hilth Foundation

Website for the Hilth Foundation - an education-focused organization in Ghana helping students develop thinking skills, self-awareness, and life direction.

## Tech Stack

- HTML5
- CSS3 (custom properties, flexbox, grid)
- Vanilla JavaScript
- Lucide Icons
- Paystack (payment processing)

## Structure

```
├── index.html          # Main page
├── payment-success.html # Donation success redirect
├── css/
│   └── styles.css      # All styles
├── js/
│   └── main.js         # All functionality
├── assets/
│   └── images/         # Site images
└── Videos/             # Video content
```

## Features

- Responsive design
- Hero slider with auto-advancement
- Donation modal with Paystack integration
- Video modal player
- Animated stats counter
- Mobile navigation with animated icon

## Local Development

Just open `index.html` in a browser. No build step needed.

## Payment Setup

The site uses Paystack for donations. To configure:

1. Add your public key in `js/main.js` (line 427)
2. Set callback URL in Paystack dashboard to point to `payment-success.html`

Test mode is currently active. Switch to live keys when ready for production.

## Browser Support

Works on all modern browsers (Chrome, Firefox, Safari, Edge).
