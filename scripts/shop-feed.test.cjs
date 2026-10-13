const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('scripts/content-spreadsheet.gs', 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context);

function products(rows) {
    const headers = ['Product name', 'Product description', 'Price in GHS (optional)', 'Sizes or options (optional)', 'Availability', 'Product photos', 'Product video (optional)', 'Photo links (optional)', 'Video link (optional)', 'Publication status'];
    const spreadsheet = { getSheetByName: () => ({ getLastRow: () => rows.length + 1, getDataRange: () => ({ getValues: () => [[...headers], ...rows.map(row => [...row])] }) }) };
    return JSON.parse(JSON.stringify(context.readShopProducts_(spreadsheet)));
}
test('publishes processed products without approval and hides Hidden or failed rows', () => {
    const row = ['Shirt', 'White shirt', '75.50', 'M, L', 'Available', '', '', '', '', 'Published'];
    const hidden = [...row]; hidden[4] = 'Hidden';
    const pending = [...row]; pending[9] = '';
    const failed = [...row]; failed[9] = 'Media error: private file';
    const data = products([row, hidden, pending, failed]);
    assert.equal(data.length, 1);
    assert.equal(data[0].price, 75.5);
    assert.equal(data[0].published, true);
});
test('unknown prices stay null and upload URLs map to image previews and video links', () => {
    const row = ['Notebook', 'Guided journal', '', '', 'Available', 'https://drive.google.com/open?id=photo_123', 'https://drive.google.com/file/d/video_123/view', '', '', 'Published'];
    const [item] = products([row]);
    assert.equal(item.price, null);
    assert.deepEqual(item.images, ['https://drive.google.com/thumbnail?id=photo_123&sz=w1000']);
    assert.equal(item.video, 'https://drive.google.com/file/d/video_123/view');
    row[2] = '-1';
    assert.equal(products([row])[0].price, null);
});
test('unsafe media links are excluded', () => {
    const result = context.shopMediaLinks_('javascript:alert(1)\nhttp://example.org/photo.jpg\nhttps://example.org/photo.jpg', true);
    assert.deepEqual(JSON.parse(JSON.stringify(result)), ['https://example.org/photo.jpg']);
});
test('automatic publication shares only media and records a failure instead of publishing documents', () => {
    const headers = ['Product photos', 'Publication status'];
    let status, shared = 0;
    const sheet = { getLastColumn: () => 2, getRange: (row, col) => ({ getDisplayValues: () => row === 1 ? [headers] : [['https://drive.google.com/open?id=photo_123', '']], setValue: value => { status = value; } }) };
    context.DriveApp = { Access: { ANYONE_WITH_LINK: 'public' }, Permission: { VIEW: 'view' }, getFileById: () => ({ getMimeType: () => 'image/jpeg', setSharing: () => { shared++; } }) };
    context.console = { error() {} };
    context.publishShopRow_(sheet, 2);
    assert.equal(status, 'Published');
    assert.equal(shared, 1);
    context.DriveApp.getFileById = () => ({ getMimeType: () => 'application/pdf', setSharing: () => { shared++; } });
    context.publishShopRow_(sheet, 2);
    assert.match(status, /^Media error:/);
    assert.equal(shared, 1);
});
