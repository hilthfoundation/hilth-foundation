/**
 * Hilth Foundation - Main JavaScript
 * Includes: Paystack Integration, Carousel, Mobile Menu, Scroll Effects, Component Loader
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
            const response = await fetch(`${this.componentsPath}${componentName}.html`);
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
        const navLinks = document.querySelectorAll('.nav-link[data-page]');

        navLinks.forEach(link => {
            const page = link.getAttribute('data-page');
            if (currentPage.includes(page) ||
                (page === 'home' && (currentPage === 'index.html' || currentPage === ''))) {
                link.classList.add('active');
                // Accessibility: mark the active link
                link.setAttribute('aria-current', 'page');
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
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        console.warn('Lucide library not loaded');
    }

    // Load shared header/footer components if the loader is available
    if (typeof loadSharedComponents === 'function') {
        try {
            await loadSharedComponents();
        } catch (e) {
            console.warn('Failed to load shared components:', e);
        }
    }

    initPreloader();
    initHeader();
    initHeroSlider();
    initCarousel();
    initDonationModal();
    initMobileMenu();
    initCounterAnimation();
    initSmoothScroll();
    initScrollToTop();
    initScrollAnimations();
    initVideoThumbnails();
    initAutoYear();
    initContentToggles();
    initPartnerAnimations();
    initAboutSwap();
});

/* ================================
   About layout swap
   Adds the ability to interchange text/image by toggling about-1/about-2 classes
   ================================ */
function initAboutSwap() {
    const layout = document.querySelector('.split-layout');
    if (!layout) return;

    // Respect users who prefer reduced motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    // Start with non-swapped state; toggle `.swapped` on the layout at intervals
    let swapped = false;
    const intervalMs = 6000;

    // Small initial delay so page load feels stable
    setTimeout(() => {
        // toggle immediately then continue on interval
        swapped = !swapped;
        layout.classList.toggle('swapped', swapped);
        setInterval(() => {
            swapped = !swapped;
            layout.classList.toggle('swapped', swapped);
        }, intervalMs);
    }, 1200);
}

/* ================================
   Hilth Insights Image Cross-Fade Swap
   Auto-toggles between two images on programs.html
   ================================ */
function initInsightsSwap() {
    const container = document.querySelector('.insights-swap-container');
    if (!container) return;

    // Respect users who prefer reduced motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    let swapped = false;
    const intervalMs = 5000;

    setInterval(() => {
        swapped = !swapped;
        container.classList.toggle('swapped', swapped);
    }, intervalMs);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initInsightsSwap();
});

/* ================================
    // Update active item on scroll
    carousel.addEventListener('scroll', () => {
        window.requestAnimationFrame(() => {
            updateActiveItem();
            updateArrows();
        });
    });

    // Update arrows based on scroll position
    function updateArrows() {
        if (!prev || !next) return;
        const maxScroll = carousel.scrollWidth - carousel.clientWidth - 2;
        prev.disabled = carousel.scrollLeft <= 2;
        next.disabled = carousel.scrollLeft >= maxScroll - 2;
        prev.setAttribute('aria-disabled', prev.disabled);
        next.setAttribute('aria-disabled', next.disabled);
    }

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateActiveItem();
            updateArrows();
        }, 250);
    });

    // Initial setup
    updateActiveItem();
    updateArrows();
}

/* ================================
   Partner Card Entrance Animations
   Uses IntersectionObserver to add 'in-view' class with a staggered delay
   ================================ */
function initPartnerAnimations() {
    const cards = Array.from(document.querySelectorAll('.partner-card'));
    if (cards.length === 0) return;

    const onIntersect = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const index = cards.indexOf(el);
                const delay = Math.min(200 + index * 90, 600); // ms
                // apply stagger using timeout so transitionDelay isn't required
                setTimeout(() => el.classList.add('in-view'), delay);
                observer.unobserve(el);
            }
        });
    };

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(onIntersect, { root: null, threshold: 0.15 });
        cards.forEach(c => io.observe(c));
    } else {
        // Fallback: reveal with a simple stagger
        cards.forEach((c, i) => setTimeout(() => c.classList.add('in-view'), 200 + i * 90));
    }
}

/* ================================
   Security Utilities
   ================================ */

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} str - The string to sanitize
 * @returns {string} - Sanitized string with HTML entities escaped
 */
function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Validate and sanitize form input
 * @param {string} input - The input to validate
 * @param {string} type - Type of validation ('text', 'email', 'number')
 * @returns {string|null} - Sanitized input or null if invalid
 */
function validateInput(input, type = 'text') {
    if (typeof input !== 'string') return null;

    // Trim and basic sanitization
    let sanitized = input.trim();

    // Remove any HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    switch (type) {
        case 'email':
            // Stricter email validation
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            return emailRegex.test(sanitized) ? sanitized : null;
        case 'number':
            const num = parseFloat(sanitized);
            return !isNaN(num) && num >= 0 ? num : null;
        case 'text':
        default:
            // Allow only alphanumeric, spaces, hyphens, apostrophes for names
            return sanitized.replace(/[^a-zA-Z0-9\s\-']/g, '').substring(0, 100);
    }
}

/* ================================
   Hero Slider
   ================================ */
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.slider-dot');
    let currentSlide = 0;
    let autoplayInterval;

    if (slides.length === 0) return;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    function startAutoplay() {
        autoplayInterval = setInterval(nextSlide, 5000);
    }

    function resetAutoplay() {
        clearInterval(autoplayInterval);
        startAutoplay();
    }

    // Dot click handlers
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            resetAutoplay();
        });
    });

    // Start autoplay
    startAutoplay();
}

/* ================================
   Header Scroll Effect
   ================================ */
function initHeader() {
    const header = document.getElementById('header');
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
    const navCloseBtn = document.getElementById('navCloseBtn');
    let isOpen = false;

    if (!mobileMenuBtn) return;

    function openMenu() {
        isOpen = true;
        nav.style.display = 'block';
        mobileMenuBtn.classList.add('menu-open');
        // Accessibility
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
        if (nav) nav.setAttribute('aria-hidden', 'false');
    }

    function closeMenu() {
        isOpen = false;
        nav.style.display = 'none';
        mobileMenuBtn.classList.remove('menu-open');
        // Accessibility
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        if (nav) nav.setAttribute('aria-hidden', 'true');
    }

    mobileMenuBtn.addEventListener('click', function () {
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    // Close button
    if (navCloseBtn) {
        navCloseBtn.addEventListener('click', closeMenu);
    }

    // Close menu when clicking a link
    const navLinks = nav.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (window.innerWidth < 768) {
                closeMenu();
            }
        });
    });
}

/* ================================
   Smooth Scroll
   ================================ */
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* ================================
   Counter Animation
   ================================ */
function initCounterAnimation() {
    const counters = document.querySelectorAll('.impact-number');
    let animated = false;

    if (!counters.length) return;

    function animateCounter(counter) {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const step = target / (duration / 16); // 60fps
        let current = 0;

        function updateCounter() {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current).toLocaleString();
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target.toLocaleString();
            }
        }

        updateCounter();
    }

    const impactSection = document.getElementById('impact');
    if (!impactSection) return;

    if (prefersReducedMotion()) {
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            counter.textContent = target.toLocaleString();
        });
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting || animated) return;
            animated = true;
            counters.forEach(counter => animateCounter(counter));
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -80px 0px'
    });

    observer.observe(impactSection);
}

/* ================================
   Carousel
   ================================ */
function initCarousel() {
    const carousel = document.getElementById('carousel');
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('carouselDots');

    if (!carousel || !track) return;

    const cards = track.querySelectorAll('.story-card');
    let currentIndex = 0;
    let cardsPerView = getCardsPerView();
    let totalSlides = Math.ceil(cards.length / cardsPerView);
    let autoplayInterval;

    // Create dots
    function createDots() {
        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
    }

    function getCardsPerView() {
        if (window.innerWidth >= 1024) return 3;
        if (window.innerWidth >= 768) return 2;
        return 1;
    }

    function getCardWidth() {
        const card = cards[0];
        const gap = 24; // var(--space-lg)
        return card.offsetWidth + gap;
    }

    function updateCarousel() {
        const offset = currentIndex * getCardWidth() * cardsPerView;
        track.style.transform = `translateX(-${offset}px)`;

        // Update dots
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    function goToSlide(index) {
        currentIndex = Math.max(0, Math.min(index, totalSlides - 1));
        updateCarousel();
        resetAutoplay();
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % totalSlides;
        updateCarousel();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        updateCarousel();
    }

    function startAutoplay() {
        autoplayInterval = setInterval(nextSlide, 5000);
    }

    function resetAutoplay() {
        clearInterval(autoplayInterval);
        startAutoplay();
    }

    // Event listeners
    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetAutoplay(); });

    // Handle resize
    window.addEventListener('resize', function () {
        const newCardsPerView = getCardsPerView();
        if (newCardsPerView !== cardsPerView) {
            cardsPerView = newCardsPerView;
            totalSlides = Math.ceil(cards.length / cardsPerView);
            currentIndex = 0;
            createDots();
            updateCarousel();
        }
    });

    // Touch support
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
            resetAutoplay();
        }
    }

    // Initialize
    createDots();
    startAutoplay();
}

/* ================================
   Donation Modal & Paystack
   ================================ */
function initDonationModal() {
    const modal = document.getElementById('donationModal');
    const closeBtn = document.getElementById('modalClose');
    const form = document.getElementById('donationForm');
    const amountBtns = document.querySelectorAll('.amount-btn');
    const amountInput = document.getElementById('amount');

    // Guard against missing elements
    if (!modal || !closeBtn || !form || !amountInput) {
        console.warn('Donation modal elements not found, skipping initialization');
        return;
    }

    // Amount suggestion buttons
    amountBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const amount = this.getAttribute('data-amount');
            amountInput.value = amount;

            // Update active state
            amountBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Clear active state when manually typing
    amountInput.addEventListener('input', function () {
        amountBtns.forEach(b => b.classList.remove('active'));
    });

    // Close modal
    closeBtn.addEventListener('click', closeDonationModal);
    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeDonationModal();
    });

    // Handle ESC key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeDonationModal();
            closeThankYouModal();
        }
    });

    // Form submission with input sanitization
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Sanitize and validate all inputs
        const firstName = validateInput(document.getElementById('firstName').value, 'text');
        const lastName = validateInput(document.getElementById('lastName').value, 'text');
        const email = validateInput(document.getElementById('email').value, 'email');
        const amount = validateInput(document.getElementById('amount').value, 'number');

        // Validation with specific error messages
        if (!firstName) {
            showNotification('Please enter a valid first name (letters only).', 'error');
            return;
        }
        if (!lastName) {
            showNotification('Please enter a valid last name (letters only).', 'error');
            return;
        }
        if (!email) {
            showNotification('Please enter a valid email address.', 'error');
            return;
        }
        if (!amount || amount < 1) {
            showNotification('Please enter a valid donation amount (minimum GHS 1).', 'error');
            return;
        }

        // Call Paystack with sanitized inputs
        payWithPaystack(email, amount, firstName, lastName);
    });
}

function openDonationModal() {
    const modal = document.getElementById('donationModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset form
    document.getElementById('donationForm').reset();
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
}

function closeDonationModal() {
    const modal = document.getElementById('donationModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function payWithPaystack(email, amount, firstName, lastName) {
    // ========================================
    // ⚠️ PAYSTACK INTEGRATION - CONFIGURATION
    // ========================================
    // SECURITY NOTE: This is currently using a TEST key.
    // 
    // TODO: Before deploying to production:
    // 1. Replace 'pk_test_...' with your live public key 'pk_live_...'
    // 2. Ensure your Paystack dashboard webhooks are configured
    // 3. Test thoroughly in test mode first
    // 
    // The public key is safe to expose (it's designed for client-side use)
    // but NEVER expose your secret key.
    // ========================================
    const publicKey = 'pk_test_4dd46d0571ad48e64dd69b033d1224e9824cdf8d';

    const handler = PaystackPop.setup({
        key: publicKey,
        email: email,
        amount: amount * 100, // Paystack expects amount in pesewas (kobo equivalent)
        currency: 'GHS',
        firstname: firstName,
        lastname: lastName,
        metadata: {
            custom_fields: [
                {
                    display_name: "Donation to Hilth Foundation",
                    variable_name: "donation_type",
                    value: "General Donation"
                }
            ]
        },
        callback: function (response) {
            // Close donation modal
            closeDonationModal();

            // Show thank you modal
            showThankYouModal(response.reference);
        },
        onClose: function () {
            // User closed the payment window (no action needed)
        }
    });

    handler.openIframe();
}

function showThankYouModal(reference) {
    const modal = document.getElementById('thankYouModal');
    const refText = document.getElementById('referenceText');

    if (reference) {
        refText.textContent = `Reference: ${reference}`;
    }

    modal.classList.add('active');
}

function closeThankYouModal() {
    const modal = document.getElementById('thankYouModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}



// Make functions globally available
window.openDonationModal = openDonationModal;
window.closeDonationModal = closeDonationModal;
window.closeThankYouModal = closeThankYouModal;

function toggleMentorshipForm() {
    const formContainer = document.getElementById('mentorshipFormContainer');
    const toggleBtn = document.getElementById('toggleFormBtn');

    if (formContainer && toggleBtn) {
        formContainer.classList.toggle('active');
        const isActive = formContainer.classList.contains('active');
        toggleBtn.textContent = isActive ? "Close Sign Up Form" : "Sign Up for Mentorship";

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
   Preloader

   ================================ */
function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    // Hide preloader after DOM is ready (much faster than waiting for 'load')
    setTimeout(() => {
        preloader.classList.add('hidden');
    }, 300);

    // Fallback: ensure preloader is hidden after all resources load
    window.addEventListener('load', () => {
        preloader.classList.add('hidden');
    });
}

/* ================================
   Scroll to Top Button
   ================================ */
function initScrollToTop() {
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (!scrollBtn) return;

    const updateScrollBtn = rafThrottle(() => {
        if (window.scrollY > 500) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });

    window.addEventListener('scroll', updateScrollBtn, { passive: true });

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/* ================================
   Scroll Animations - Enhanced with Staggered Reveal
   ================================ */
function initScrollAnimations() {
    if (prefersReducedMotion()) {
        document.querySelectorAll('.section-header, .impact-grid, .video-grid, .about-grid, .testimonials-grid, .vision-mission-section, .mentorship-features, .modules-grid, .insights-topics, .mentorship-outcomes')
            .forEach(el => {
                el.classList.add('reveal', 'revealed');
            });

        document.querySelectorAll('.impact-grid, .video-grid, .testimonials-grid, .mentorship-features, .modules-grid, .topics-grid, .mentorship-outcomes')
            .forEach(grid => {
                grid.classList.add('stagger-reveal', 'revealed');
            });

        document.querySelectorAll('.animate-on-scroll, .section-header').forEach(el => {
            el.classList.add('animate-on-scroll', 'animated');
        });
        return;
    }

    // Elements to animate on scroll
    const revealElements = document.querySelectorAll('.section-header, .impact-grid, .video-grid, .about-grid, .testimonials-grid, .vision-mission-section, .mentorship-features, .modules-grid, .insights-topics, .mentorship-outcomes');

    // Staggered reveal grids (children animate with delay)
    const staggerGrids = document.querySelectorAll('.impact-grid, .video-grid, .testimonials-grid, .mentorship-features, .modules-grid, .topics-grid, .mentorship-outcomes');

    // Add reveal classes
    revealElements.forEach(el => {
        el.classList.add('reveal');
    });

    staggerGrids.forEach(grid => {
        grid.classList.add('stagger-reveal');
    });

    // Intersection Observer for reveal animations
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.willChange = 'transform, opacity';
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
                if (entry.target.classList.contains('stagger-reveal')) {
                    const children = Array.from(entry.target.children);
                    setTimeout(() => {
                        children.forEach(child => {
                            child.style.willChange = '';
                        });
                    }, 900);
                }
                setTimeout(() => {
                    entry.target.style.willChange = '';
                }, 700);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -80px 0px'
    });

    // Observe all reveal elements
    document.querySelectorAll('.reveal, .stagger-reveal').forEach(el => {
        revealObserver.observe(el);
        if (el.classList.contains('stagger-reveal')) {
            Array.from(el.children).forEach(child => {
                child.style.willChange = 'transform, opacity';
            });
        }
    });

    // Generic observer for any element with .animate-on-scroll class
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                scrollObserver.unobserve(entry.target);
                setTimeout(() => {
                    entry.target.style.willChange = '';
                }, 600);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.style.willChange = 'transform, opacity';
        scrollObserver.observe(el);
    });

    // Legacy support: Add animate-on-scroll to section headers explicitly
    const sections = document.querySelectorAll('.section-header');
    sections.forEach(section => {
        section.classList.add('animate-on-scroll');
        section.style.willChange = 'transform, opacity';
        scrollObserver.observe(section);
    });
}

/* ================================
   Newsletter Form
   ================================ */


/* ================================
   Video Thumbnails - Autoplay on Hover
   ================================ */
function initVideoThumbnails() {
    const videoCards = document.querySelectorAll('.video-card');

    videoCards.forEach(card => {
        const video = card.querySelector('.video-thumbnail video');
        if (!video) return;

        // Force load and set initial frame
        video.load();
        video.addEventListener('loadedmetadata', function () {
            this.currentTime = 0.5;
        });

        // Play on hover
        card.addEventListener('mouseenter', () => {
            video.play().catch(() => { });
        });

        // Pause and reset on mouse leave
        card.addEventListener('mouseleave', () => {
            video.pause();
            video.currentTime = 0.5;
        });
    });
}

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
   Newsletter Form Handler
   ================================ */
// Google Apps Script Web App endpoint for form + newsletter submissions
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxnaTGi9C8u50vV6fKJ2MINVl5TGQWamSb7WjTxSOTu_YvUkulP6p9q0jviDhBzsVg/exec';

function handleNewsletterSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const emailInput = form.querySelector('.newsletter-input');
    const email = emailInput.value.trim();

    if (!email) {
        showNotification('Please enter your email address.', 'error');
        return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address.', 'error');
        return false;
    }

    const submitBtn = form.querySelector('.newsletter-btn');
    const originalContent = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i>';
    submitBtn.disabled = true;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Send to Google Sheets
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'subscribe', email: email }),
        mode: 'no-cors', // Important for Google Apps Script
        headers: { 'Content-Type': 'application/json' }
    })
        .then(() => {
            // Since mode is no-cors, we assume success if no network error
            submitBtn.innerHTML = '<i data-lucide="check"></i>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
            showNotification('Thank you for subscribing!', 'success');
            emailInput.value = '';
            setTimeout(() => {
                submitBtn.innerHTML = originalContent;
                submitBtn.disabled = false;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }, 3000);
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Subscription failed. Please check your connection.', 'error');
            submitBtn.innerHTML = originalContent;
            submitBtn.disabled = false;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });

    return false;
}

/* ================================
   Mentorship Form Handler
   ================================ */
document.addEventListener('DOMContentLoaded', () => {
    const mentorshipForm = document.getElementById('mentorshipForm');
    if (mentorshipForm) {
        mentorshipForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Submitting...';
            submitBtn.disabled = true;

            const formData = new FormData(this);
            const data = {};
            formData.forEach((value, key) => {
                // Handle multiple checkboxes with same name
                if (data[key]) {
                    if (!Array.isArray(data[key])) {
                        data[key] = [data[key]];
                    }
                    data[key].push(value);
                } else {
                    data[key] = value;
                }
            });

            // Convert array values to string
            for (let key in data) {
                if (Array.isArray(data[key])) {
                    data[key] = data[key].join(', ');
                }
            }

            data.action = 'mentorship_application';

            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(data),
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' }
            })
                .then(() => {
                    showNotification('Application submitted successfully! We will contact you soon.', 'success');
                    this.reset();
                    toggleMentorshipForm(); // Close form
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification('Submission failed. Please try again.', 'error');
                })
                .finally(() => {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                });
        });
    }
});


/* ================================
   Content Toggle (Learn More)
   ================================ */
function initContentToggles() {
    const toggleBtn = document.getElementById('mentorship-learn-more-btn');
    const content = document.getElementById('mentorship-details');

    if (!toggleBtn || !content) return;

    toggleBtn.addEventListener('click', function () {
        const isHidden = content.classList.contains('content-hidden');
        const span = this.querySelector('span');

        if (isHidden) {
            // Expand
            content.classList.remove('content-hidden');
            content.classList.add('content-visible');
            this.classList.add('expanded');
            if (span) span.textContent = 'Show Less';
        } else {
            // Collapse
            content.classList.remove('content-visible');
            content.classList.add('content-hidden');
            this.classList.remove('expanded');
            if (span) span.textContent = 'Learn More';
        }
    });
}

/* ================================
   Video Highlights - Auto-Play on Scroll
   ================================ */
function initVideoThumbnails() {
    // Select videos
    const scrollVideos = document.querySelectorAll('.scroll-video');

    if (scrollVideos.length === 0) return;

    // Intersection Observer Options
    const options = {
        root: null, // Viewport
        rootMargin: '0px',
        threshold: 0.5 // Play when 50% visible
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            const wrapper = video.closest('.video-wrapper');

            if (entry.isIntersecting) {
                // Play video when in view
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.then(_ => {
                        if (wrapper) wrapper.classList.add('is-playing');
                    }).catch(error => {
                        console.log("Auto-play prevented (likely browser restriction):", error);
                    });
                }
            } else {
                // Pause when out of view
                video.pause();
                if (wrapper) wrapper.classList.remove('is-playing');
            }
        });
    }, options);

    scrollVideos.forEach(video => {
        observer.observe(video);

        // Add click listener to toggle sound/controls
        video.parentElement.addEventListener('click', () => {
            if (video.muted) {
                video.muted = false;
                video.currentTime = 0; // Restart with sound
                video.play();
                video.controls = true; // Enable controls for full watching
            } else {
                if (video.paused) video.play();
                else video.pause();
            }
        });
    });
}

/* ================================
   Notification System
   ================================ */
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Sanitize type to prevent injection
    const validTypes = ['info', 'success', 'error', 'warning'];
    const safeType = validTypes.includes(type) ? type : 'info';

    // Map type to icon name
    const iconMap = {
        'success': 'check-circle',
        'error': 'alert-circle',
        'warning': 'alert-triangle',
        'info': 'info'
    };

    // Create notification element safely (prevent XSS)
    const notification = document.createElement('div');
    notification.className = `notification notification-${safeType}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'notification-content';

    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', iconMap[safeType]);

    const messageSpan = document.createElement('span');
    messageSpan.textContent = message; // Safe: textContent escapes HTML

    contentDiv.appendChild(icon);
    contentDiv.appendChild(messageSpan);
    notification.appendChild(contentDiv);

    document.body.appendChild(notification);

    // Initialize icon
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Make newsletter handler globally available
window.handleNewsletterSubmit = handleNewsletterSubmit;
