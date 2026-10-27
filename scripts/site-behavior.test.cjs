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
    const context = vm.createContext({ document, window: {}, console: { error() {}, warn() {} }, AbortController, URL, URLSearchParams, Intl, setTimeout, clearTimeout, ...overrides, document });
    vm.runInContext(source, context);
    return context;
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('event history controls use native single-choice radios', () => {
    const html = fs.readFileSync('events.html', 'utf8');
    assert.match(html, /class="foundation-tabs"[^>]*role="radiogroup"[^>]*aria-label="Event history"/);
    assert.match(html, /type="radio"[^>]*name="event-history"[^>]*data-event-filter="upcoming"/);
    assert.match(html, /type="radio"[^>]*name="event-history"[^>]*data-event-filter="past"/);
    assert.doesNotMatch(html, /data-event-filter="(?:upcoming|past)"[^>]*aria-pressed/);
});

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

test('public forms are configured for Netlify handling', () => {
    const forms = [
        ['inquiry.html', 'hilth-inquiry'],
        ['volunteer.html', 'hilth-volunteer-application'],
        ['components/footer.html', 'hilth-newsletter'],
        ['mentorship.html', 'hilth-mentorship-interest'],
        ['shop.html', 'hilth-shop-enquiry']
    ];
    forms.forEach(([file, name]) => {
        const html = fs.readFileSync(file, 'utf8');
        assert.match(html, new RegExp(`<form[^>]+name=["']${name}["'][^>]+data-netlify=["']true["']`, 'i'));
        assert.match(html, new RegExp(`name=["']form-name["'][^>]+value=["']${name}["']`, 'i'));
    });
});

test('mentorship requires at least one interest before Netlify submission', () => {
    let submit;
    let prevented = 0;
    const interests = [{ checked: false, addEventListener() {}, focus() {} }];
    const form = {
        ...element(), querySelectorAll: () => interests,
        addEventListener(event, callback) { if (event === 'submit') submit = callback; },
        reset() {}
    };
    const hint = element(), error = element();
    const context = fixture({ document: { getElementById: id => id === 'mentorshipForm' ? form : id === 'interest-hint' ? hint : error } });
    context.initMentorshipForm();
    const invalidResult = submit.call(form, { preventDefault() { prevented++; } });
    assert.equal(prevented, 1);
    assert.equal(invalidResult, false);
    assert.match(error.textContent, /between one and three/i);
    interests[0].checked = true;
    const validResult = submit.call(form, { preventDefault() { prevented++; } });
    assert.equal(prevented, 1);
    assert.equal(validResult, true);
});

test('Netlify submission helper posts encoded form data and rejects failed responses', async () => {
    class TestFormData {
        constructor(form) { this.values = new Map(Object.entries(form.fields || {})); }
        set(key, value) { this.values.set(key, value); }
        [Symbol.iterator]() { return this.values[Symbol.iterator](); }
    }
    let request;
    const context = fixture({
        FormData: TestFormData,
        fetch: async (url, options) => {
            request = { url, options };
            return { ok: true, status: 200 };
        }
    });
    await context.submitNetlifyForm({ fields: { 'form-name': 'hilth-shop-enquiry', customer: 'Ama' } }, { channel: 'whatsapp' });
    assert.equal(request.url, '/');
    assert.equal(request.options.method, 'POST');
    assert.match(request.options.body, /form-name=hilth-shop-enquiry/);
    assert.match(request.options.body, /customer=Ama/);
    assert.match(request.options.body, /channel=whatsapp/);

    context.fetch = async () => ({ ok: false, status: 500 });
    await assert.rejects(
        context.submitNetlifyForm({ fields: { 'form-name': 'hilth-shop-enquiry' } }),
        /status 500/
    );
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
