const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const source = readFileSync('js/main.js', 'utf8');
const orderCode = source.slice(source.indexOf('function initShopOrders()'), source.indexOf('function toggleMentorshipForm()'));
function fixture(overrides = {}, valid = true) {
    const fields = { customer: 'Ama & Kojo', product: 'Hilth T-shirt', quantity: '2', size: 'M', location: 'Kumasi, Ghana', notes: 'Collection please', ...overrides };
    const status = { textContent: '' }, opened = [];
    let submit;
    const form = { reportValidity: () => valid, elements: { product: { value: '' } }, addEventListener: (_, callback) => { submit = callback; } };
    const window = { open: (...args) => opened.push(args), location: { href: '' } };
    const context = { document: { getElementById: id => id === 'shopOrderForm' ? form : status, querySelectorAll: () => [], addEventListener() {} }, window, FormData: class { get(key) { return fields[key]; } }, encodeURIComponent };
    vm.runInNewContext(orderCode + '\ninitShopOrders();', context);
    return { status, opened, window, submit: channel => submit({ preventDefault() {}, submitter: { value: channel } }) };
}
test('order is not transmitted on initialization and WhatsApp draft contains buyer details', () => {
    const f = fixture();
    assert.equal(f.opened.length, 0);
    f.submit();
    const [href, target, features] = f.opened[0];
    const url = new URL(href);
    assert.equal(url.hostname, 'wa.me');
    assert.equal(url.pathname, '/233543790817');
    assert.match(url.searchParams.get('text'), /Name: Ama & Kojo\nProduct: Hilth T-shirt\nQuantity: 2\nPreferred size \/ option: M/);
    assert.match(url.searchParams.get('text'), /Delivery town \/ country: Kumasi, Ghana/);
    assert.equal(target, '_blank');
    assert.equal(features, 'noopener,noreferrer');
    assert.match(f.status.textContent, /Press Send/);
});
test('email fallback addresses Foundation and excludes T-shirt size for notebook', () => {
    const f = fixture({ product: '90 Days of Transformation notebook', size: '' });
    f.submit('email');
    assert.equal(f.opened.length, 0);
    assert.ok(f.window.location.href.startsWith('mailto:admin@hilthfoundation.org?'));
    const message = decodeURIComponent(f.window.location.href.split('&body=')[1]);
    assert.match(message, /90 Days of Transformation notebook/);
    assert.doesNotMatch(message, /Preferred size/);
});
test('invalid or whitespace-only buyer details do not open a draft', () => {
    for (const f of [fixture({}, false), fixture({ customer: '   ' })]) {
        f.submit();
        assert.equal(f.opened.length, 0);
        assert.equal(f.window.location.href, '');
    }
});
