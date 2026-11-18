const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const source = readFileSync('js/main.js', 'utf8');
const orderCode = source.slice(source.indexOf('function initShopOrders()'), source.indexOf('function toggleMentorshipForm()'));
function fixture(overrides = {}, valid = true, save = async () => {}) {
    const fields = { customer: 'Ama & Kojo', product: 'Hilth T-shirt', quantity: '2', size: 'M', location: 'Kumasi, Ghana', notes: 'Collection please', ...overrides };
    const status = { textContent: '' };
    const draft = { hidden: true, removeAttribute(name) { delete this[name]; } };
    const submissions = [], opened = [], buttons = [{ disabled: false }, { disabled: false }];
    let submit;
    const form = {
        reportValidity: () => valid,
        elements: { product: { value: '' } },
        querySelectorAll: () => buttons,
        addEventListener: (_, callback) => { submit = callback; }
    };
    const window = { open: (...args) => opened.push(args), location: { href: '' } };
    const context = {
        document: {
            getElementById: id => ({ shopOrderForm: form, shopOrderStatus: status, shopOrderDraft: draft })[id],
            addEventListener() {}
        },
        window,
        FormData: class { get(key) { return fields[key]; } },
        submitNetlifyForm: (submittedForm, { channel }) => {
            assert.equal(submittedForm, form);
            submissions.push(channel);
            return save();
        },
        console: { error() {} }
    };
    vm.runInNewContext(orderCode + '\ninitShopOrders();', context);
    return { status, draft, submissions, opened, window, buttons, submit: channel => submit({ preventDefault() {}, submitter: { value: channel } }) };
}
test('WhatsApp draft becomes a link only after the enquiry is saved', async () => {
    let finishSaving;
    const f = fixture({}, true, () => new Promise(resolve => { finishSaving = resolve; }));
    assert.deepEqual(f.submissions, []);
    const pending = f.submit();
    assert.deepEqual(f.submissions, ['whatsapp']);
    assert.equal(f.draft.hidden, true);
    assert.ok(f.buttons.every(button => button.disabled));
    finishSaving();
    await pending;
    assert.equal(f.opened.length, 0);
    assert.equal(f.draft.hidden, false);
    const url = new URL(f.draft.href);
    assert.equal(url.hostname, 'wa.me');
    assert.equal(url.pathname, '/233543790817');
    assert.equal(f.draft.target, '_blank');
    assert.match(url.searchParams.get('text'), /Name: Ama & Kojo\nProduct: Hilth T-shirt\nQuantity: 2\nPreferred size \/ option: M/);
    assert.match(url.searchParams.get('text'), /Delivery town \/ country: Kumasi, Ghana/);
    assert.match(f.draft.textContent, /WhatsApp/);
    assert.match(f.status.textContent, /recorded/);
    assert.ok(f.buttons.every(button => !button.disabled));
});
test('email link addresses Foundation and excludes an unspecified size', async () => {
    const f = fixture({ product: '90 Days of Transformation notebook', size: '' });
    await f.submit('email');
    assert.deepEqual(f.submissions, ['email']);
    assert.equal(f.window.location.href, '');
    assert.equal(f.draft.hidden, false);
    assert.equal(f.draft.target, '_self');
    assert.ok(f.draft.href.startsWith('mailto:admin@hilthfoundation.org?'));
    const message = new URL(f.draft.href).searchParams.get('body');
    assert.match(message, /90 Days of Transformation notebook/);
    assert.doesNotMatch(message, /Preferred size/);
});
test('invalid or whitespace-only buyer details do not submit an enquiry', async () => {
    for (const f of [fixture({}, false), fixture({ customer: '   ' })]) {
        await f.submit();
        assert.deepEqual(f.submissions, []);
        assert.equal(f.draft.hidden, true);
    }
});
test('a failed save clears the previous draft and allows another attempt', async () => {
    let saveFailed = false;
    const f = fixture({}, true, async () => {
        if (saveFailed) throw new Error('Submission failed');
    });
    await f.submit();
    assert.equal(f.draft.hidden, false);
    saveFailed = true;
    await f.submit('email');
    assert.equal(f.draft.hidden, true);
    assert.equal(f.draft.href, undefined);
    assert.match(f.status.textContent, /try again/);
    assert.ok(f.buttons.every(button => !button.disabled));
});
