# Hilth staff product Form

Products publish automatically. There is no approval step. Keep the responder link within the Hilth team, and restrict Form responder access to staff Google accounts where possible.

## One-time setup

1. Open **Hilth website content > Extensions > Apps Script**.
2. Replace `Code.gs` with the latest `scripts/content-spreadsheet.gs`. Keep your existing event Form ID in `EXISTING_EVENT_FORM_ID`. Save.
3. Select **setupShopForm**, click **Run**, and authorise. This creates/reuses the shop Form, connects **Shop submissions**, and installs automatic media publication. Copy the Form editor link from the execution log.
4. In that Form, add two questions using **+ > File upload**:
   - Exact title: **Product photos**. Allow images only, up to 4 files, maximum 10 MB each. Make required if every product should have a photo.
   - Exact title: **Product video (optional)**. Allow videos only, 1 file, maximum 100 MB. Leave optional.
5. Publish the Form and give its responder link to Hilth staff. Upload questions require Google sign-in. The script creates the other seven labelled questions automatically.
6. In Apps Script choose **Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy**. Keep the existing web-app URL so the website connection remains the same. Execute as **Me**, access **Anyone**.
7. Submit one product to test. In **Shop submissions**, its **Publication status** should change to **Published**. Refresh the website shop. If it shows **Media error**, check the execution/trigger log and the file owner's sharing permissions, then run **refreshShopMedia**.

The current deployed endpoint only contains events/outreach until you deploy this new version. The website retains its starter catalogue for that old endpoint. After the updated endpoint returns `products`, it becomes the only shop catalogue; submit the T-shirt and notebook again through the Form to include them. An empty `products` array shows an empty catalogue rather than bringing back old items.

## Daily use

- Submit one Form per new product: name, description, numeric GHS price, sizes/options, availability and photos. Video is optional.
- Uploaded images/videos are automatically shared as **Anyone with the link / Viewer**, so website visitors can view them. Upload public product media only. Do not upload customer details or payment records.
- To update price, description or sizes, edit that product's row in **Shop submissions** and refresh the shop. No website deployment is needed.
- Use **Coming soon** or **Sold out** to show an item without an order button. Use **Hidden** to remove it entirely.
- To replace media, update the media cell with a Google Drive share link and run **refreshShopMedia**. This makes the replacement file viewable and reprocesses the row. Do not change **Publication status** manually.
- Removing a product from the website does not revoke its existing Drive link. Remove sharing from an old file separately if it should no longer be viewable.
- Direct public image URLs can be entered under **Photo links (optional)**. Uploaded videos open through a **Watch product video** link; they do not autoplay.

Orders remain WhatsApp/email enquiries. Product publication does not introduce online checkout or automatic order/payment tracking. The event Form retains its existing approval process.

Reference: [Google Forms upload requirements](https://support.google.com/docs/answer/15473134?hl=en).
