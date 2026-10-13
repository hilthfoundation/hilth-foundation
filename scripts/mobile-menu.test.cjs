const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('js/main.js', 'utf8');
const menuCode = source.slice(source.indexOf('function initMobileMenu()'), source.indexOf('function initSmoothScroll()'));
function fixture() {
    const keys = {}, resize = {};
    const document = { activeElement: null, addEventListener: (key, callback) => { keys[key] = callback; } };
    const element = () => ({
        style: { removeProperty(key) { delete this[key]; } }, attributes: {}, listeners: {},
        classList: { add() {}, remove() {}, contains: () => true },
        setAttribute(key, value) { this.attributes[key] = value; },
        addEventListener(key, callback) { this.listeners[key] = callback; },
        focus() { document.activeElement = this; },
        getClientRects: () => [{}]
    });
    const toggle = element(), oldClose = element(), firstLink = element(), lastLink = element(), donate = element();
    const nav = { ...element(), querySelectorAll: selector => selector === '.nav-link' ? [firstLink, lastLink] : [firstLink, lastLink, donate], querySelector: () => donate };
    document.body = { ...element(), style: { overflow: 'auto' } };
    document.getElementById = id => ({ mobileMenuBtn: toggle, nav, navCloseBtn: oldClose })[id];
    document.querySelector = () => element();
    const window = { innerWidth: 390, addEventListener: (key, callback) => { resize[key] = callback; } };
    vm.runInNewContext(menuCode + '\ninitMobileMenu();', { document, window, rafThrottle: callback => callback });
    const key = (name, shift = false) => {
        let prevented = false;
        keys.keydown({ key: name, shiftKey: shift, preventDefault() { prevented = true; } });
        return prevented;
    };
    return { toggle, firstLink, donate, nav, document, window, resize, key, click: () => toggle.listeners.click() };
}

test('the same menu control receives focus when it becomes the close control', () => {
    const f = fixture();
    f.toggle.focus();
    f.click();
    assert.equal(f.document.activeElement, f.toggle);
    assert.equal(f.toggle.attributes['aria-expanded'], 'true');
    assert.equal(f.toggle.attributes['aria-label'], 'Close navigation menu');
    f.click();
    assert.equal(f.toggle.attributes['aria-expanded'], 'false');
    assert.equal(f.document.body.style.overflow, 'auto');
});

test('Tab includes the close control and wraps through navigation in both directions', () => {
    const f = fixture();
    f.click();
    f.toggle.focus();
    assert.equal(f.key('Tab'), true);
    assert.equal(f.document.activeElement, f.firstLink);
    f.donate.focus();
    f.key('Tab');
    assert.equal(f.document.activeElement, f.toggle);
    f.key('Tab', true);
    assert.equal(f.document.activeElement, f.donate);
});

test('Escape returns focus and desktop resizing clears the mobile scroll lock', () => {
    const f = fixture();
    f.click();
    f.firstLink.focus();
    f.key('Escape');
    assert.equal(f.document.activeElement, f.toggle);
    assert.equal(f.document.body.style.overflow, 'auto');
    f.click();
    f.window.innerWidth = 1100;
    f.resize.resize();
    assert.equal(f.nav.attributes['aria-hidden'], 'false');
    assert.equal(f.nav.style.display, undefined);
    assert.equal(f.document.body.style.overflow, 'auto');
});

test('opening donations from navigation leaves a visible return-focus control', () => {
    const f = fixture();
    f.click();
    f.donate.focus();
    f.donate.listeners.click();
    assert.equal(f.document.activeElement, f.toggle);
    assert.equal(f.nav.style.display, 'none');
    assert.equal(f.document.body.style.overflow, 'auto');
});
