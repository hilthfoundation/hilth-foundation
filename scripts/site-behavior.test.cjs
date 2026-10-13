const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('js/main.js', 'utf8');
function element() {
    return {
        textContent: '', children: [], dataset: {}, attributes: {},
        append(...children) { this.children.push(...children); },
        replaceChildren(...children) { this.children = children; },
        setAttribute(key, value) { this.attributes[key] = value; },
        removeAttribute(key) { delete this.attributes[key]; }
    };
}
function fixture(overrides = {}) {
    const document = { addEventListener() {}, createElement: element, querySelector: () => null, querySelectorAll: () => [], ...overrides.document };
    const context = vm.createContext({ document, window: {}, console: { error() {}, warn() {} }, AbortController, URL, Intl, setTimeout, clearTimeout, ...overrides, document });
    vm.runInContext(source, context);
    return context;
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('a missing shared header does not abort header initialization', () => {
    const context = fixture({ document: { getElementById: () => null } });
    assert.doesNotThrow(() => context.initHeader());
});

test('mentorship disclosure removes closed fields from keyboard navigation', () => {
    let active = false;
    const container = { inert: true, classList: {
        toggle() { active = !active; }, contains() { return active; }
    } };
    const button = element();
    const context = fixture({ setTimeout() {}, document: {
        getElementById: id => id === 'mentorshipFormContainer' ? container : button
    } });
    context.toggleMentorshipForm();
    assert.equal(container.inert, false);
    assert.equal(button.attributes['aria-expanded'], 'true');
    context.toggleMentorshipForm();
    assert.equal(container.inert, true);
    assert.equal(button.attributes['aria-expanded'], 'false');
});

test('newsletter keeps the email and avoids success when Google gives no acknowledgement', async () => {
    const input = { value: 'ama@example.org' };
    const button = { innerHTML: 'Subscribe', disabled: false };
    const form = { ...element(), querySelector: selector => selector === '.newsletter-input' ? input : selector === '.newsletter-btn' ? button : null };
    const context = fixture({ fetch: async () => ({ type: 'opaque', status: 0, ok: false }) });
    const notifications = [];
    context.showNotification = (message, type) => notifications.push({ message, type });
    context.handleNewsletterSubmit({ preventDefault() {}, target: form });
    await settle();
    assert.equal(input.value, 'ama@example.org');
    assert.equal(button.disabled, false);
    assert.equal(notifications.some(note => note.type === 'success'), false);
    assert.match(notifications[0].message, /confirm/i);
    assert.equal(form.children.at(-1).attributes.role, 'status');
    assert.match(form.children.at(-1).textContent, /confirm/i);
});

test('mentorship keeps entered details and stays open without an acknowledgement', async () => {
    let submit, resets = 0, toggles = 0;
    const interests = [{ checked: true, addEventListener() {} }];
    const button = { innerText: 'Send interest', disabled: false };
    const form = {
        ...element(), querySelectorAll: () => interests, querySelector: selector => selector === 'button[type="submit"]' ? button : null,
        addEventListener(event, callback) { if (event === 'submit') submit = callback; },
        reset() { resets++; }
    };
    const context = fixture({
        fetch: async () => ({ type: 'opaque', status: 0, ok: false }),
        FormData: class { forEach(callback) { callback('Ama', 'name'); callback('Learning', 'interest'); } },
        document: { getElementById: id => id === 'mentorshipForm' ? form : element() }
    });
    const notifications = [];
    context.showNotification = (message, type) => notifications.push({ message, type });
    context.toggleMentorshipForm = () => { toggles++; };
    context.initMentorshipForm();
    submit.call(form, { preventDefault() {} });
    await settle();
    assert.equal(resets, 0);
    assert.equal(toggles, 0);
    assert.equal(button.disabled, false);
    assert.equal(notifications.some(note => note.type === 'success'), false);
});

test('stalled event and outreach feeds show loading, then an unavailable state', async () => {
    const events = element(), outreach = element();
    const context = fixture({
        setTimeout: callback => setTimeout(callback, 5),
        document: { querySelectorAll: selector => selector === '[data-events-list]' ? [events] : selector === '[data-outreach-list]' ? [outreach] : [] },
        fetch: (url, options) => url === 'data/content-source.json'
            ? Promise.resolve({ ok: true, json: async () => ({ url: 'https://script.google.com/macros/s/example/exec' }) })
            : new Promise((resolve, reject) => options.signal?.addEventListener('abort', () => reject(new Error('Timed out'))))
    });
    const completed = context.initFoundationListings();
    assert.match(events.children[0]?.children[0]?.textContent || '', /loading/i);
    assert.match(outreach.children[0]?.children[0]?.textContent || '', /loading/i);
    await Promise.race([completed, new Promise((resolve, reject) => setTimeout(() => reject(new Error('Listings never completed')), 100))]);
    assert.match(events.children[0].children[0].textContent, /unavailable/i);
    assert.match(outreach.children[0].children[0].textContent, /unavailable/i);
    assert.notEqual(events.attributes['aria-busy'], 'true');
    assert.notEqual(outreach.attributes['aria-busy'], 'true');
});

test('staff text excludes emoji and icon substitutes while retaining ordinary Unicode text', () => {
    const context = fixture();
    const text = context.makeFoundationText('h3', '', 'Visit 🎉 → ✓ 🇬🇭 1️⃣ Café — Kumasi').textContent;
    assert.equal(text, 'Visit Café — Kumasi');
});

test('a network error retains newsletter details and restores the submit control', async () => {
    const input = { value: 'ama@example.org' };
    const button = { innerHTML: 'Subscribe', disabled: false };
    const form = { ...element(), querySelector: selector => selector === '.newsletter-input' ? input : selector === '.newsletter-btn' ? button : null };
    const context = fixture({ fetch: async () => { throw new Error('Offline'); } });
    context.showNotification = () => {};
    context.handleNewsletterSubmit({ preventDefault() {}, target: form });
    await settle();
    assert.equal(input.value, 'ama@example.org');
    assert.equal(button.disabled, false);
    assert.match(form.children.at(-1).textContent, /confirm/i);
});

test('timeouts also abort a stalled response body', async () => {
    const context = fixture({
        setTimeout: callback => setTimeout(callback, 5),
        fetch: async (url, options) => ({ ok: true, json: () => new Promise((resolve, reject) => {
            options.signal.addEventListener('abort', () => reject(new Error('Body timed out')));
        }) })
    });
    await assert.rejects(context.fetchWithTimeout('/feed', {}, response => response.json()), /Body timed out/);
});

test('shop product labels and order choices exclude staff-supplied icons', async () => {
    const grid = element(), status = element(), select = element();
    select.add = option => select.children.push(option);
    const context = fixture({
        Option: class { constructor(text, value) { this.text = text; this.value = value; } },
        document: {
            getElementById: id => id === 'shopProducts' ? grid : status,
            querySelector: () => select, createElementNS: element
        },
        fetch: async url => ({ ok: true, json: async () => url === 'data/content-source.json'
            ? { url: 'https://script.google.com/macros/s/example/exec' }
            : { products: [{ published: true, name: 'Notebook 🎉', description: 'Guided journal ✓', sizes: 'Blue → Green', availability: 'Available', images: [] }] } })
    });
    await context.initShopCatalog();
    assert.equal(select.children[1].text, 'Notebook');
    assert.equal(select.children[1].value, 'Notebook');
    const content = node => [node.textContent, ...node.children.map(content)].join(' ');
    assert.match(content(grid), /Guided journal/);
    assert.doesNotMatch(content(grid), /🎉|✓|→/);
});
