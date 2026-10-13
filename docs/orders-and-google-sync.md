# Orders and website updates

## How Hilth receives orders

The shop form prepares an order enquiry containing the buyer's name, product, quantity, preferred T-shirt size, delivery town and notes. The buyer sends it through WhatsApp to **0543790817**, or by email to **admin@hilthfoundation.org**. Completing the website form alone does not send or save an enquiry. The buyer's WhatsApp number or email identifies how to reply.

Assign someone to monitor these contacts. Confirm the listed phone is active on WhatsApp. Email provides an alternative.

Reply with stock availability, confirmed price, delivery charge and the Foundation's approved payment instructions. Do not ask for card details. After verifying the money has arrived, confirm the order and arrange delivery. A screenshot alone is not payment verification.

Keep a private order tracker with: order number, date, customer/contact, product, size, quantity, delivery details, total, status (enquiry / awaiting payment / paid / delivered), payment reference and notes. This is a manual workflow; the website does not automatically sync orders into Google Sheets. Keep customer/order data separate from the public website content Sheet.

Suggested reply:

> Hi [name], thanks for your interest in Hilth! We can confirm [product, size, quantity]. The total is GHS [amount], including delivery to [town]. You can pay using [Foundation-approved instructions]. Please include reference [order number]. We will confirm your order after verifying payment.

## Finish Google event syncing

1. In the Foundation's content Sheet, open **Extensions > Apps Script**. Paste the latest `scripts/content-spreadsheet.gs`, keeping your existing Form ID in `EXISTING_EVENT_FORM_ID`.
2. Save, run **setupWebsiteContent**, then **setupEventsForm**. Preview the staff Form and publish any updates.
3. Choose **Deploy > New deployment > Web app**, execute as **Me**, access **Anyone**. If already deployed, use **Manage deployments > Edit > New version** to keep its current address.
4. Copy the web-app URL ending in **/exec**. Send that URL to the website developer to add to `data/content-source.json` and deploy the website. Do not send the Form editor or Sheet URL instead.
5. Submit a real upcoming event through the staff Form. In **Event submissions**, set its **Approved** cell to **Yes**. Refresh the website to check it appears. Clear approval or set **No** to hide it.

The deployed endpoint should return JSON with `events` and `outreach` arrays when opened without signing in. Only approved event data and published outreach are intended for this public feed. Never put customer orders, financial records or private contact details in this content Sheet.

Events are read when a page loads; staff do not need a new website deployment for each approved event. New images still require uploading to the website. Newsletter and mentorship submissions use a separate existing endpoint and need their own delivery check.

Reference: [Google web-app deployment](https://developers.google.com/apps-script/guides/web).
