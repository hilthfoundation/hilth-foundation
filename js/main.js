/**
 * Hilth Foundation - Main JavaScript
 * Includes: Donation Information, Carousel, Mobile Menu, Scroll Effects, Component Loader
 */

/**
 * Component Loader - Dynamically loads shared header and footer components
 */
class ComponentLoader {
    constructor() {
        this.componentsPath = 'components/';
        this.loadedComponents = new Map();
    }

    /**
     * Load an HTML component from file
     * @param {string} componentName - Name of the component file (without .html)
     * @returns {Promise<string>} - The HTML content
     */
    async loadComponent(componentName) {
        if (this.loadedComponents.has(componentName)) {
            return this.loadedComponents.get(componentName);
        }

        try {
            const response = await fetch(`${this.componentsPath}${componentName}.html?v=2`);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${componentName}`);
            }
            const html = await response.text();
            this.loadedComponents.set(componentName, html);
            return html;
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
            return '';
        }
    }

    /**
     * Inject a component into a target element
     * @param {string} componentName - Name of the component
     * @param {string} targetSelector - CSS selector for target element
     * @param {string} position - 'replace', 'prepend', or 'append'
     */
    async injectComponent(componentName, targetSelector, position = 'replace') {
        const html = await this.loadComponent(componentName);
        const target = document.querySelector(targetSelector);

        if (!target) {
            console.warn(`Target element not found: ${targetSelector}`);
            return;
        }

        switch (position) {
            case 'prepend':
                target.insertAdjacentHTML('afterbegin', html);
                break;
            case 'append':
                target.insertAdjacentHTML('beforeend', html);
                break;
            case 'replace':
            default:
                target.innerHTML = html;
                break;
        }

        // Re-initialize Lucide icons after injection
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Mark the active navigation link based on current page
     */
    setActiveNavLink() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const programmeDetails = ['school-impact.html', 'hilth-insights.html', '90-days.html', 'mentorship.html'];
        const navigationPage = programmeDetails.includes(currentPage) ? 'programs.html' : currentPage;
        const navLinks = document.querySelectorAll('.nav-link[data-page]');

        navLinks.forEach(link => {
            const page = link.getAttribute('data-page');
            if (navigationPage === `${page}.html` ||
                (page === 'home' && navigationPage === 'index.html')) {
                link.classList.add('active');
                // Accessibility: mark the active link
                link.setAttribute('aria-current', programmeDetails.includes(currentPage) ? 'true' : 'page');
            }
        });
    }

    /**
     * Adjust asset paths for subpages in subdirectories
     * @param {string} basePath - Relative path to root (e.g., '../' for subpages)
     */
    adjustAssetPaths(basePath = '') {
        if (!basePath) return;

        // Adjust image sources
        document.querySelectorAll('img[src^="assets/"]').forEach(img => {
            img.src = basePath + img.getAttribute('src');
        });

        // Adjust links
        document.querySelectorAll('a[href^="index.html"], a[href^="programs.html"], a[href^="team.html"], a[href^="privacy.html"]').forEach(link => {
            link.href = basePath + link.getAttribute('href');
        });
    }
}

// Create global instance
const componentLoader = new ComponentLoader();

/**
 * Motion helpers
 */
function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function rafThrottle(fn) {
    let ticking = false;
    return function (...args) {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            fn.apply(this, args);
            ticking = false;
        });
    };
}

/**
 * Initialize components when DOM is ready
 * Usage: Call loadSharedComponents() in your page's DOMContentLoaded handler
 */
async function loadSharedComponents(options = {}) {
    const { basePath = '', headerTarget = '#header-container', footerTarget = '#footer-container' } = options;

    // Check if using component containers
    const headerContainer = document.querySelector(headerTarget);
    const footerContainer = document.querySelector(footerTarget);

    if (headerContainer) {
        await componentLoader.injectComponent('header', headerTarget);
        componentLoader.setActiveNavLink();
    }

    if (footerContainer) {
        await componentLoader.injectComponent('footer', footerTarget);
    }

    if (basePath) {
        componentLoader.adjustAssetPaths(basePath);
    }
}

// Initialize Lucide icons - wait for library to load (deferred)
document.addEventListener('DOMContentLoaded', async function () {
    // These page-local features do not depend on the shared components.
    initMentorshipForm();

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        console.warn('Lucide library not loaded');
    }

    // Initialise shared controls after their markup has been injected.
    try {
        await loadSharedComponents();
    } catch (error) {
        console.warn('Failed to load shared components:', error);
    }

    initHeader();
    initDonationModal();
    initShopOrders();
    initShopCatalog();
    initMobileMenu();
    initAutoYear();
    initFoundationListings();
});

/* ================================
   Header Scroll Effect
   ================================ */
function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    const heroSection = document.getElementById('hero');

    function handleScroll() {
        // Get hero section height for donate button visibility
        const heroHeight = heroSection ? heroSection.offsetHeight : window.innerHeight;

        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Toggle header donate button visibility based on hero section
        // On mobile, hide the header donate button when in hero (since hero has its own CTA)
        if (window.scrollY > heroHeight - 100) {
            header.classList.add('past-hero');
        } else {
            header.classList.remove('past-hero');
        }
    }

    const onScroll = rafThrottle(handleScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll(); // Check initial state
}

/* ================================
   Mobile Menu
   ================================ */
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const nav = document.getElementById('nav');
    let isOpen = false;

    if (!mobileMenuBtn || !nav) return;
    const menuBreakpoint = document.body.classList.contains('agency-site') ? 900 : 767;
    let previousOverflow = '';

    function openMenu() {
        isOpen = true;
        document.body.classList.add('nav-open');
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        nav.style.display = 'flex';
        mobileMenuBtn.classList.add('menu-open');
        // Accessibility
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
        mobileMenuBtn.setAttribute('aria-label', 'Close navigation menu');
        if (nav) nav.setAttribute('aria-hidden', 'false');
        mobileMenuBtn.focus();
    }

    function closeMenu() {
        isOpen = false;
        document.body.classList.remove('nav-open');
        document.body.style.overflow = previousOverflow;
        nav.style.display = 'none';
        mobileMenuBtn.classList.remove('menu-open');
        // Accessibility
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.setAttribute('aria-label', 'Open navigation menu');
        if (nav) nav.setAttribute('aria-hidden', 'true');
    }

    mobileMenuBtn.addEventListener('click', function () {
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    // Close menu when clicking a link
    const navLinks = nav.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (window.innerWidth <= menuBreakpoint) {
                closeMenu();
            }
        });
    });

    const closeBeforeDonation = () => {
        if (isOpen) {
            closeMenu();
            // The dialog must return focus to a control outside the hidden menu.
            mobileMenuBtn.focus();
        }
    };
    nav.querySelector('.nav-donate-btn')?.addEventListener('click', closeBeforeDonation, true);
    document.querySelector('.btn-donate-header')?.addEventListener('click', closeBeforeDonation, true);
    document.addEventListener('keydown', event => {
        if (!isOpen) return;
        if (event.key === 'Escape') {
            closeMenu();
            mobileMenuBtn.focus();
        } else if (event.key === 'Tab') {
            const focusable = [mobileMenuBtn, ...nav.querySelectorAll('a[href], button')]
                .filter(element => element.getClientRects().length);
            const current = focusable.indexOf(document.activeElement);
            const next = current < 0 ? (event.shiftKey ? focusable.length - 1 : 0)
                : (current + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
            event.preventDefault();
            focusable[next]?.focus();
        }
    });
    function syncMenuViewport() {
        if (window.innerWidth > menuBreakpoint) {
            if (isOpen) closeMenu();
            nav.style.removeProperty('display');
            nav.setAttribute('aria-hidden', 'false');
        } else if (!isOpen) {
            nav.setAttribute('aria-hidden', 'true');
        }
    }
    window.addEventListener('resize', rafThrottle(syncMenuViewport));
    syncMenuViewport();
}

/* ================================
   Donation information dialog
   ================================ */
let donationTrigger = null;
let donationPreviousOverflow = '';
let donationBackground = [];
function initDonationModal() {
    document.addEventListener('click', event => {
        if (event.target.closest('[data-open-donation]')) {
            openDonationModal();
        }
    });
    const modal = document.getElementById('donationModal');
    const closeBtn = document.getElementById('modalClose');
    if (!modal || !closeBtn) return;
    closeBtn.addEventListener('click', closeDonationModal);
    modal.addEventListener('click', event => {
        if (event.target === modal) closeDonationModal();
    });
    modal.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeDonationModal();
        }
        if (event.key !== 'Tab') return;
        const controls = [...modal.querySelectorAll('button, a[href]')];
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first.focus();
        }
    });
}
function openDonationModal() {
    const modal = document.getElementById('donationModal');
    if (!modal || modal.classList.contains('active')) return;
    donationTrigger = document.activeElement;
    donationPreviousOverflow = document.body.style.overflow;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    donationBackground = [...document.querySelectorAll('#header-container, main, #footer')].map(element => ({ element, inert: element.inert }));
    donationBackground.forEach(({ element }) => { element.inert = true; });
    document.body.style.overflow = 'hidden';
    document.getElementById('modalClose').focus();
}
function closeDonationModal() {
    const modal = document.getElementById('donationModal');
    if (!modal || !modal.classList.contains('active')) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = donationPreviousOverflow;
    donationBackground.forEach(({ element, inert }) => { element.inert = inert; });
    donationBackground = [];
    if (donationTrigger?.isConnected) donationTrigger.focus();
}
window.openDonationModal = openDonationModal;
window.closeDonationModal = closeDonationModal;

async function submitNetlifyForm(form, overrides = {}) {
    const data = new FormData(form);
    Object.entries(overrides).forEach(([key, value]) => data.set(key, value));
    const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString()
    });
    if (!response.ok) throw new Error(`Form submission failed with status ${response.status}`);
}

function initShopOrders() {
    const form = document.getElementById('shopOrderForm');
    const status = document.getElementById('shopOrderStatus');
    const draft = document.getElementById('shopOrderDraft');
    if (!form || !status || !draft) return;
    document.addEventListener('click', event => {
        const link = event.target.closest('[data-shop-product]');
        if (link) form.elements.product.value = link.dataset.shopProduct;
    });
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        draft.hidden = true;
        draft.removeAttribute('href');
        const fields = new FormData(form);
        const value = key => String(fields.get(key) || '').trim();
        if (!value('customer') || !value('location')) {
            status.textContent = 'Please enter your name and delivery town or country.';
            return;
        }
        const message = [
            'Hello Hilth, I would like to enquire about an order.',
            `Name: ${value('customer')}`,
            `Product: ${value('product')}`,
            `Quantity: ${value('quantity')}`,
            ...(value('size') ? [`Preferred size / option: ${value('size')}`] : []),
            `Delivery town / country: ${value('location')}`,
            ...(value('notes') ? [`Notes: ${value('notes')}`] : []),
            'Please confirm availability, total including delivery, and payment instructions.'
        ].join('\n');
        const email = event.submitter?.value === 'email';
        const url = email
            ? `mailto:admin@hilthfoundation.org?subject=${encodeURIComponent('Hilth shop order enquiry')}&body=${encodeURIComponent(message)}`
            : `https://wa.me/233543790817?text=${encodeURIComponent(message)}`;
        const buttons = [...form.querySelectorAll('button[type="submit"]')];
        buttons.forEach(button => { button.disabled = true; });
        status.textContent = 'Saving your enquiry...';
        try {
            await submitNetlifyForm(form, { channel: email ? 'email' : 'whatsapp' });
            draft.href = url;
            draft.target = email ? '_self' : '_blank';
            draft.textContent = email ? 'Open email draft' : 'Open WhatsApp draft';
            draft.hidden = false;
            status.textContent = `Your enquiry was recorded. To follow up, open the ${email ? 'email' : 'WhatsApp'} draft and press Send.`;
        } catch (error) {
            console.error('Shop enquiry:', error);
            status.textContent = 'We could not send your enquiry. Your details are still here. Check your connection and try again.';
        } finally {
            buttons.forEach(button => { button.disabled = false; });
        }
    });
}

function toggleMentorshipForm() {
    const formContainer = document.getElementById('mentorshipFormContainer');
    const toggleBtn = document.getElementById('toggleFormBtn');

    if (formContainer && toggleBtn) {
        formContainer.classList.toggle('active');
        const isActive = formContainer.classList.contains('active');
        formContainer.inert = !isActive;
        toggleBtn.textContent = isActive ? "Close interest form" : "Express interest in mentorship";
        toggleBtn.setAttribute('aria-expanded', String(isActive));

        // Slight scroll if opening to ensure visibility
        if (isActive) {
            setTimeout(() => {
                formContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);
        }
    }
}
window.toggleMentorshipForm = toggleMentorshipForm;

/* ================================
   Auto-Update Copyright Year
   ================================ */
function initAutoYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

/* ================================
   Request Helpers
   ================================ */
async function fetchWithTimeout(url, options = {}, readResponse = response => response) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
        return await readResponse(await fetch(url, { ...options, signal: controller.signal }));
    } finally {
        clearTimeout(timer);
    }
}

/* ================================
   Mentorship Form Handler
   ================================ */
function initMentorshipForm() {
    const toggleBtn = document.getElementById('toggleFormBtn');
    if (toggleBtn && typeof toggleBtn.addEventListener === 'function') {
        toggleBtn.addEventListener('click', toggleMentorshipForm);
    }
    const mentorshipForm = document.getElementById('mentorshipForm');
    if (mentorshipForm) {
        const interests = Array.from(mentorshipForm.querySelectorAll('input[name="interest"]'));
        const interestHint = document.getElementById('interest-hint');
        const interestError = document.getElementById('interest-error');
        const updateInterests = () => {
            const selected = interests.filter(input => input.checked).length;
            interests.forEach(input => { input.disabled = selected >= 3 && !input.checked; });
            if (interestHint) interestHint.textContent = `Choose up to three life areas. ${selected} of 3 selected.`;
            if (interestError) interestError.textContent = '';
        };
        interests.forEach(input => input.addEventListener('change', updateInterests));
        mentorshipForm.addEventListener('reset', () => setTimeout(updateInterests, 0));
        mentorshipForm.addEventListener('submit', function (e) {
            const selected = interests.filter(input => input.checked).length;
            if (selected < 1 || selected > 3) {
                e.preventDefault();
                if (interestError) interestError.textContent = 'Please choose between one and three life areas.';
                interests[0]?.focus();
                return false;
            }
            return true;
        });
    }
}

/* ================================
   Foundation events and outreach records
   Approved records live in data/*.json.
   ================================ */
const FOUNDATION_PROGRAMMES = ['HSIP', 'Insights', '90 Days', 'Mentorship', 'Community'];

function isFoundationDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value || '') &&
        !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) &&
        new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}

async function initFoundationListings() {
    const eventContainers = document.querySelectorAll('[data-events-list]');
    const outreachContainers = document.querySelectorAll('[data-outreach-list]');
    if (!eventContainers.length && !outreachContainers.length) return;
    eventContainers.forEach(container => {
        container.setAttribute('aria-busy', 'true');
        container.replaceChildren(makeFoundationEmpty('Loading event information...'));
    });
    outreachContainers.forEach(container => {
        container.setAttribute('aria-busy', 'true');
        container.replaceChildren(makeFoundationEmpty('Loading outreach records...'));
    });
    // A separate public feed can be connected without changing the form endpoint.
    const source = await fetchWithTimeout('data/content-source.json', { cache: 'no-store' },
        response => response.ok ? response.json() : {}).catch(() => ({}));
    let remote;
    async function readRecords(kind) {
        let records;
        if (source.url) {
            if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(source.url)) {
                throw new Error('Invalid Foundation content feed URL');
            }
            remote ||= fetchWithTimeout(source.url, { cache: 'no-store' }, response => {
                if (!response.ok) throw new Error('Content feed unavailable');
                return response.json();
            });
            records = (await remote)[kind];
        } else {
            records = await fetchWithTimeout(`data/${kind}.json`, { cache: 'no-store' }, response => {
                if (!response.ok) throw new Error(`Cannot load ${kind}: ${response.status}`);
                return response.json();
            });
        }
        if (!Array.isArray(records)) throw new Error(`${kind} must contain an array`);
        return records.filter(record => record && typeof record === 'object' && record.published === true)
            .map(record => {
                const cleaned = { ...record };
                ['title', 'school', 'time', 'location', 'programme', 'description', 'summary', 'story', 'imageAlt']
                    .forEach(key => { if (typeof cleaned[key] === 'string') cleaned[key] = publicFoundationText(cleaned[key]); });
                return cleaned;
            });
    }
    await Promise.all([
        (async () => {
            if (!eventContainers.length) return;
            try {
                const events = (await readRecords('events')).filter(event => isFoundationDate(event.date) && event.title);
                const render = () => {
                    const selected = document.querySelector('[data-event-filter]:checked')?.dataset.eventFilter || 'upcoming';
                    const today = new Date().toISOString().slice(0, 10);
                    const relevant = events.filter(event => selected === 'past' ? event.date < today : event.date >= today)
                        .sort((a, b) => selected === 'past' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
                    eventContainers.forEach(container => {
                        container.replaceChildren();
                        if (!relevant.length) {
                            container.append(makeFoundationEmpty(selected === 'past'
                                ? 'No past events are listed.'
                                : 'No upcoming events are listed.'));
                        } else relevant.slice(0, Number(container.dataset.limit) || relevant.length)
                            .forEach(event => container.append(makeEventCard(event)));
                    });
                };
                if (events.length) showFoundationFilters('event');
                bindFoundationFilters('event', render);
                render();
            } catch (error) {
                console.error(error);
                eventContainers.forEach(container => container.replaceChildren(makeFoundationEmpty('The event calendar is temporarily unavailable.')));
            } finally {
                eventContainers.forEach(container => container.setAttribute('aria-busy', 'false'));
            }
        })(),
        (async () => {
            if (!outreachContainers.length) return;
            try {
                const records = (await readRecords('outreach'))
                    .filter(record => (record.title || record.school) && isFoundationDate(record.date))
                    .sort((a, b) => b.date.localeCompare(a.date));
                const render = () => {
                    const selected = document.querySelector('[data-outreach-filter][aria-pressed="true"]')?.dataset.outreachFilter || 'All';
                    const relevant = records.filter(record => selected === 'All' || record.programme === selected);
                    outreachContainers.forEach(container => {
                        container.replaceChildren();
                        if (!relevant.length) {
                            container.append(makeFoundationEmpty(records.length
                                ? 'No documented visits in this programme yet. Choose another programme to explore our work.'
                                : 'No additional outreach records are listed.'));
                        } else relevant.slice(0, Number(container.dataset.limit) || relevant.length)
                            .forEach(record => container.append(makeOutreachCard(record)));
                    });
                };
                if (records.length) showFoundationFilters('outreach');
                bindFoundationFilters('outreach', render);
                render();
            } catch (error) {
                console.error(error);
                outreachContainers.forEach(container => container.replaceChildren(makeFoundationEmpty('The outreach archive is temporarily unavailable.')));
            } finally {
                outreachContainers.forEach(container => container.setAttribute('aria-busy', 'false'));
            }
        })()
    ]);
}

function showFoundationFilters(kind) {
    document.querySelectorAll(`[data-foundation-filters="${kind}"]`).forEach(group => { group.hidden = false; });
}

function bindFoundationFilters(kind, render) {
    const buttons = document.querySelectorAll(`[data-${kind}-filter]`);
    if (kind === 'event') {
        buttons.forEach(button => button.addEventListener('change', render));
        return;
    }
    buttons.forEach(button => button.addEventListener('click', () => {
        buttons.forEach(tab => {
            tab.classList.toggle('is-selected', tab === button);
            tab.setAttribute('aria-pressed', String(tab === button));
        });
        render();
    }));
}

function makeFoundationEmpty(message) {
    const element = document.createElement('div');
    element.className = 'foundation-empty-state';
    element.append(makeFoundationText('p', '', message));
    return element;
}

function publicFoundationText(value) {
    const text = String(value ?? '').replace(/[0-9#*]\p{Variation_Selector}?\p{Enclosing_Mark}/gu, '');
    return Array.from(text).filter(character => {
        const point = character.codePointAt(0);
        return !((point >= 0x1F000 && point <= 0x1FAFF) ||
            (point >= 0x2600 && point <= 0x27BF) ||
            (point >= 0x2190 && point <= 0x21FF) ||
            (point >= 0xE0020 && point <= 0xE007F) ||
            [0xFE0F, 0x20E3, 0x200D].includes(point));
    }).join('').replace(/[^\S\r\n]+/g, ' ').trim();
}

function makeFoundationText(tag, className, value) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = publicFoundationText(value);
    return element;
}

function formatFoundationDate(isoDate, monthOnly = false) {
    return new Intl.DateTimeFormat('en-GB', { ...(monthOnly ? {} : { day: 'numeric' }), month: 'long', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(`${isoDate}T12:00:00Z`));
}

function foundationTag(programme) {
    return FOUNDATION_PROGRAMMES.includes(programme) ? makeFoundationText('span', 'foundation-tag', programme) : null;
}

function makeEventCard(event) {
    const card = document.createElement('article');
    card.className = 'foundation-record-card foundation-event-card';
    const date = new Date(`${event.date}T12:00:00Z`);
    const block = document.createElement('time');
    block.className = 'foundation-date-block';
    block.dateTime = event.date;
    block.setAttribute('aria-label', formatFoundationDate(event.date));
    block.append(makeFoundationText('strong', '', date.getUTCDate()));
    block.append(makeFoundationText('span', '', date.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })));
    card.append(block);
    const content = makeFoundationText('div', 'foundation-record-body', '');
    const tag = foundationTag(event.programme);
    if (tag) content.append(tag);
    content.append(makeFoundationText('h3', '', event.title));
    content.append(makeFoundationText('p', 'foundation-record-detail', [event.time, event.location].filter(Boolean).join(' · ')));
    if (event.description) content.append(makeFoundationText('p', 'foundation-record-description', event.description));
    const actions = makeFoundationText('div', 'foundation-record-actions', '');
    const url = event.registrationUrl || event.link;
    if (/^https:\/\//i.test(url || '')) {
        const register = makeFoundationText('a', 'btn btn-primary', event.registrationUrl ? 'Register' : 'Learn more');
        register.href = url;
        register.target = '_blank';
        register.rel = 'noopener noreferrer';
        actions.append(register);
    }
    const share = makeFoundationText('a', 'foundation-share-link', 'Share on WhatsApp');
    share.href = 'https://wa.me/?text=' + encodeURIComponent(`${event.title} — ${formatFoundationDate(event.date)}${event.time ? `, ${event.time}` : ''}${event.location ? `, ${event.location}` : ''}\n${url && /^https:\/\//i.test(url) ? url : new URL('events.html', window.location.href).href}`);
    share.target = '_blank';
    share.rel = 'noopener noreferrer';
    actions.append(share);
    content.append(actions);
    card.append(content);
    return card;
}

function foundationPhotos(record) {
    const photos = [record.image, ...(Array.isArray(record.gallery) ? record.gallery : [])];
    return [...new Set(photos)].filter(path => typeof path === 'string' && /^assets\/images\/[\w-]+\.(?:webp|jpg|jpeg|png)$/i.test(path)).slice(0, 8);
}

function makeOutreachCard(record) {
    const card = makeFoundationText('article', 'foundation-record-card', '');
    const photos = foundationPhotos(record);
    if (photos.length) {
        const cover = makeFoundationText('button', 'foundation-gallery-trigger', '');
        cover.type = 'button';
        cover.setAttribute('aria-label', `Open gallery: ${record.title || record.school}`);
        const photo = document.createElement('img');
        photo.className = 'foundation-record-image';
        photo.src = photos[0];
        photo.loading = 'lazy';
        photo.alt = record.imageAlt || `Documented outreach at ${record.school || record.title}`;
        cover.append(photo, makeFoundationText('span', 'foundation-gallery-label', `View gallery · ${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`));
        cover.addEventListener('click', () => openFoundationGallery(record, photos));
        card.append(cover);
    }
    const body = makeFoundationText('div', 'foundation-record-body', '');
    const tag = foundationTag(record.programme);
    if (tag) body.append(tag);
    body.append(makeFoundationText('h3', '', record.title || `HSIP at ${record.school}`));
    body.append(makeFoundationText('p', 'foundation-record-date', `${formatFoundationDate(record.date, true)}${record.location ? ` · ${record.location}` : ''}`));
    if (record.summary) body.append(makeFoundationText('p', 'foundation-record-description', String(record.summary).trim().split(/\s+/).slice(0, 40).join(' ')));
    if (Number.isInteger(record.attendance) && record.attendance > 0) body.append(makeFoundationText('p', 'foundation-record-detail', `${record.attendance.toLocaleString('en-GH')} students reached`));
    card.append(body);
    return card;
}

function openFoundationGallery(record, photos) {
    const dialog = document.createElement('dialog');
    dialog.className = 'foundation-lightbox';
    dialog.setAttribute('aria-labelledby', 'foundation-gallery-title');
    const close = makeFoundationText('button', 'foundation-lightbox-close', 'Close gallery');
    close.type = 'button';
    close.addEventListener('click', () => dialog.close());
    const title = makeFoundationText('h2', '', record.title || record.school);
    title.id = 'foundation-gallery-title';
    const photo = document.createElement('img');
    const count = makeFoundationText('p', 'foundation-photo-count', '');
    count.setAttribute('aria-live', 'polite');
    let current = 0;
    const show = () => {
        photo.src = photos[current];
        photo.alt = `${record.imageAlt || `Documented outreach at ${record.school || record.title}`} — photo ${current + 1}`;
        count.textContent = `${current + 1} of ${photos.length}`;
    };
    const controls = makeFoundationText('div', 'foundation-gallery-controls', '');
    [-1, 1].forEach(step => {
        const button = makeFoundationText('button', 'btn btn-primary', step < 0 ? 'Previous photo' : 'Next photo');
        button.type = 'button';
        button.disabled = photos.length < 2;
        button.addEventListener('click', () => { current = (current + step + photos.length) % photos.length; show(); });
        controls.append(button);
    });
    dialog.append(close, title, photo, count, controls,
        makeFoundationText('p', 'foundation-record-date', `${formatFoundationDate(record.date)}${record.location ? ` · ${record.location}` : ''}`),
        makeFoundationText('p', 'foundation-gallery-story', record.story || record.summary));
    dialog.addEventListener('keydown', event => {
        if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
            current = (current + (event.key === 'ArrowLeft' ? -1 : 1) + photos.length) % photos.length;
            show();
        }
    });
    const previousOverflow = document.body.style.overflow;
    const opener = document.activeElement;
    dialog.addEventListener('close', () => { dialog.remove(); document.body.style.overflow = previousOverflow; opener?.focus(); });
    document.body.append(dialog);
    show();
    dialog.showModal();
    document.body.style.overflow = 'hidden';
}

/* Staff-managed shop catalogue. DOM nodes keep submitted content out of HTML. */
function safeShopMedia(value) {
    if (typeof value !== 'string') return '';
    if (/^assets\/images\/[\w./-]+$/.test(value) && !value.includes('..')) return value;
    try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; }
    catch { return ''; }
}
async function initShopCatalog() {
    const grid = document.getElementById('shopProducts');
    if (!grid) return;
    const select = document.querySelector('#shopOrderForm select[name="product"]');
    try {
        const config = await fetchWithTimeout('data/content-source.json', { cache: 'no-store' }, response => {
            if (!response.ok) throw new Error('Configuration unavailable');
            return response.json();
        });
        let products;
        if (config.url) {
            if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(config.url)) throw new Error('Invalid content source');
            const feed = await fetchWithTimeout(config.url, { cache: 'no-store' }, response => {
                if (!response.ok) throw new Error('Shop feed unavailable');
                return response.json();
            });
            products = feed.products;
        }
        // Compatibility for the old event-only deployment, until the new version is deployed.
        if (products === undefined) {
            products = await fetchWithTimeout('data/products.json', { cache: 'no-store' }, response => {
                if (!response.ok) throw new Error('Catalogue unavailable');
                return response.json();
            });
        }
        if (!Array.isArray(products)) throw new Error('Invalid catalogue');
        products = products.filter(product => product && product.published === true && typeof product.name === 'string' && product.name.trim() && ['Available', 'Coming soon', 'Sold out'].includes(product.availability)).slice(0, 100);
        products = products.map(product => ({ ...product,
            name: publicFoundationText(product.name), description: publicFoundationText(product.description), sizes: publicFoundationText(product.sizes) }))
            .filter(product => product.name);
        grid.replaceChildren();
        select.replaceChildren(new Option('Choose a product', ''));
        products.forEach(product => {
            grid.append(makeShopProductCard(product));
            if (product.availability === 'Available') select.add(new Option(product.name, product.name));
        });
        if (!products.length) {
            const message = document.createElement('p'); message.className = 'shop-catalog-status';
            message.textContent = 'New products are on their way. Contact Hilth for details.'; grid.append(message);
        }
        const noOrders = !products.some(product => product.availability === 'Available');
        select.disabled = noOrders;
        document.querySelectorAll('#shopOrderForm button[type="submit"]').forEach(button => { button.disabled = noOrders; });
        if (noOrders) document.getElementById('shopOrderStatus').textContent = 'No items are currently available to order. Contact admin@hilthfoundation.org for enquiries.';
    } catch (error) {
        select.replaceChildren(new Option('Products unavailable', ''));
        select.disabled = true;
        document.querySelectorAll('#shopOrderForm button[type="submit"]').forEach(button => { button.disabled = true; });
        document.getElementById('shopOrderStatus').textContent = 'Contact Hilth by email or phone to enquire about products.';
        grid.replaceChildren();
        const message = document.createElement('p'); message.className = 'shop-catalog-status';
        message.textContent = 'The collection is temporarily unavailable. Contact Hilth at admin@hilthfoundation.org or 0543790817.'; grid.append(message);
        console.warn('Shop catalogue:', error.message);
    }
}
function makeShopProductCard(product) {
    const node = (tag, className, text) => {
        const element = document.createElement(tag); element.className = className;
        if (text !== undefined) element.textContent = publicFoundationText(text); return element;
    };
    const card = node('article', 'shop-card');
    const media = node('div', 'shop-product-media');
    const images = (Array.isArray(product.images) ? product.images : []).map(safeShopMedia).filter(Boolean).slice(0, 4);
    if (!images.length) media.append(node('span', 'shop-media-placeholder', 'Product photo coming soon'));
    images.forEach((url, index) => {
        const image = node('img', 'shop-catalog-image'); image.src = url;
        image.alt = `${publicFoundationText(product.name)} — photo ${index + 1}`; image.loading = 'lazy';
        image.addEventListener('error', () => {
            image.replaceWith(node('span', 'shop-media-placeholder', 'Photo unavailable'));
        }, { once: true }); media.append(image);
    });
    if (images.length > 1 && !prefersReducedMotion()) {
        media.classList.add('is-auto-gallery');
        let activeImage = 0;
        let timer = null;
        const start = () => {
            if (timer) return;
            timer = window.setInterval(() => {
                activeImage = (activeImage + 1) % images.length;
                media.scrollTo({ left: activeImage * media.clientWidth, behavior: 'smooth' });
            }, 4500);
        };
        const stop = () => {
            window.clearInterval(timer);
            timer = null;
        };
        media.addEventListener('pointerenter', stop);
        media.addEventListener('pointerleave', start);
        media.addEventListener('focusin', stop);
        media.addEventListener('focusout', start);
        const observer = new IntersectionObserver(([entry]) => entry.isIntersecting ? start() : stop(), { threshold: 0.35 });
        observer.observe(media);
    }
    card.append(media);
    const copy = node('div', 'shop-card-copy');
    copy.append(node('span', 'agency-label', product.availability), node('h3', '', product.name), node('p', '', String(product.description || '')));
    const priced = typeof product.price === 'number' && Number.isFinite(product.price) && product.price >= 0;
    copy.append(node('p', 'shop-price', priced ? new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(product.price) : 'Price on enquiry'));
    if (product.sizes) copy.append(node('p', 'shop-product-note', `Options: ${String(product.sizes)}`));
    const video = safeShopMedia(product.video);
    if (video && video.startsWith('https:')) {
        const link = node('a', 'shop-video-link', 'Watch product video'); link.href = video;
        link.target = '_blank'; link.rel = 'noopener noreferrer'; copy.append(link);
    }
    if (product.availability === 'Available') {
        const link = node('a', 'agency-link', 'Order this item'); link.href = '#order'; link.dataset.shopProduct = product.name;
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        arrow.setAttribute('class', 'agency-arrow');
        arrow.setAttribute('viewBox', '0 0 48 48');
        arrow.setAttribute('aria-hidden', 'true');
        const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        symbol.setAttribute('href', 'assets/icons/hilth-symbols.svg#arrow');
        arrow.append(symbol);
        link.append(arrow);
        copy.append(link);
    } else copy.append(node('p', 'shop-product-note', product.availability === 'Sold out' ? 'Currently unavailable to order.' : 'Order details will follow.'));
    card.append(copy); return card;
}
