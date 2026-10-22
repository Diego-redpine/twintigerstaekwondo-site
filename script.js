/* ========================================
   Twin Tigers Taekwondo - JavaScript
   Neo-Brutalist Edition
   ======================================== */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {

    // Initialize AOS with error handling
    try {
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 600,
                easing: 'ease-out',
                once: true,
                offset: 50,
                disable: 'mobile' // Disable on mobile for better performance
            });

            // Refresh AOS after a short delay to catch any missed elements
            setTimeout(() => {
                AOS.refresh();
            }, 500);
        }
    } catch (e) {
        console.log('AOS init error:', e);
    }

    // Register GSAP plugins with error handling
    try {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);

            // Small delay to ensure DOM is fully painted
            setTimeout(() => {
                initGSAPAnimations();
            }, 100);
        }
    } catch (e) {
        console.log('GSAP init error:', e);
    }

    // Initialize other functionality
    initMobileMenu();
    initFAQ();
    initCursor();
    initSmoothScroll();
    initBeltHover();
    renderBeltJourneyCards();
    initBeltModal();

    // Fallback: ensure all elements are visible after 2 seconds
    setTimeout(() => {
        document.querySelectorAll('.program-card, .belt-item, .testimonial-card, .faq-item').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }, 2000);
});

// ========================================
// Mobile Menu
// ========================================
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
}

// ========================================
// FAQ Accordion
// ========================================
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                faqItems.forEach(otherItem => otherItem.classList.remove('active'));
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });
}

// ========================================
// Custom Cursor
// ========================================
function initCursor() {
    const cursorFollower = document.querySelector('.cursor-follower');

    if (cursorFollower && window.innerWidth >= 1024 && typeof gsap !== 'undefined') {
        document.addEventListener('mousemove', (e) => {
            gsap.to(cursorFollower, {
                x: e.clientX - 10,
                y: e.clientY - 10,
                duration: 0.1,
                ease: 'power2.out'
            });
        });

        const interactiveElements = document.querySelectorAll('a, button, .program-card, .testimonial-card, .belt-item');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(cursorFollower, { scale: 2, duration: 0.3 });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(cursorFollower, { scale: 1, duration: 0.3 });
            });
        });
    }
}

// ========================================
// GSAP Animations
// ========================================
function initGSAPAnimations() {
    // Header scroll effect
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 100) {
                header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
            } else {
                header.style.boxShadow = 'none';
            }
        });
    }

    // Hero parallax
    if (document.querySelector('.hero-img')) {
        gsap.to('.hero-img', {
            yPercent: 30,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });
    }

    // Stats counter - simpler approach
    document.querySelectorAll('.stat-number').forEach(stat => {
        const target = stat.innerText;
        const hasPlus = target.includes('+');
        const number = parseInt(target.replace(/\D/g, ''));

        gsap.from(stat, {
            textContent: 0,
            duration: 2,
            ease: 'power1.out',
            snap: { textContent: 1 },
            scrollTrigger: {
                trigger: stat,
                start: 'top 85%',
                once: true
            },
            onUpdate: function() {
                stat.textContent = Math.ceil(stat.textContent) + (hasPlus ? '+' : '');
            }
        });
    });

    // Image stack parallax
    gsap.utils.toArray('.img-card').forEach((card, i) => {
        gsap.to(card, {
            y: (i + 1) * -20,
            ease: 'none',
            scrollTrigger: {
                trigger: '.img-stack',
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });
    });

    // Program cards - animate on scroll
    const programCards = document.querySelectorAll('.program-card');
    if (programCards.length > 0) {
        gsap.fromTo(programCards,
            { y: 40, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.6,
                stagger: 0.15,
                ease: 'power2.out',
                immediateRender: false,
                scrollTrigger: {
                    trigger: '.programs-grid',
                    start: 'top 85%',
                    once: true,
                    onEnter: () => {
                        // Ensure visibility after animation completes
                        setTimeout(() => {
                            programCards.forEach(card => {
                                card.style.opacity = '1';
                                card.style.transform = 'none';
                            });
                        }, 1000);
                    }
                }
            }
        );
    }

    // Belt items - animate on scroll
    const beltItems = document.querySelectorAll('.belt-item');
    if (beltItems.length > 0) {
        gsap.fromTo(beltItems,
            { scale: 0.8, opacity: 0 },
            {
                scale: 1,
                opacity: 1,
                duration: 0.4,
                stagger: 0.08,
                ease: 'back.out(1.5)',
                immediateRender: false,
                scrollTrigger: {
                    trigger: '.belt-showcase',
                    start: 'top 85%',
                    once: true,
                    onEnter: () => {
                        setTimeout(() => {
                            beltItems.forEach(item => {
                                item.style.opacity = '1';
                                item.style.transform = 'none';
                            });
                        }, 800);
                    }
                }
            }
        );
    }

    // Testimonial cards - animate on scroll
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    if (testimonialCards.length > 0) {
        gsap.fromTo(testimonialCards,
            { y: 30, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.5,
                stagger: 0.1,
                ease: 'power2.out',
                immediateRender: false,
                scrollTrigger: {
                    trigger: '.testimonials-grid',
                    start: 'top 85%',
                    once: true,
                    onEnter: () => {
                        setTimeout(() => {
                            testimonialCards.forEach(card => {
                                card.style.opacity = '1';
                                card.style.transform = 'none';
                            });
                        }, 800);
                    }
                }
            }
        );
    }

    // FAQ items - animate on scroll
    const faqItemsEl = document.querySelectorAll('.faq-item');
    if (faqItemsEl.length > 0) {
        gsap.fromTo(faqItemsEl,
            { x: 30, opacity: 0 },
            {
                x: 0,
                opacity: 1,
                duration: 0.4,
                stagger: 0.08,
                ease: 'power2.out',
                immediateRender: false,
                scrollTrigger: {
                    trigger: '.faq-list',
                    start: 'top 85%',
                    once: true,
                    onEnter: () => {
                        setTimeout(() => {
                            faqItemsEl.forEach(item => {
                                item.style.opacity = '1';
                                item.style.transform = 'none';
                            });
                        }, 800);
                    }
                }
            }
        );
    }
}

// ========================================
// Smooth Scroll
// ========================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const header = document.querySelector('.header');
                    const headerHeight = header ? header.offsetHeight : 0;
                    const targetPosition = target.offsetTop - headerHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// ========================================
// Belt Hover Effects
// ========================================
function initBeltHover() {
    if (typeof gsap === 'undefined') return;

    document.querySelectorAll('.belt-item').forEach(item => {
        const img = item.querySelector('img');
        if (img) {
            item.addEventListener('mouseenter', () => {
                gsap.to(img, { rotation: 10, duration: 0.3, ease: 'power2.out' });
            });
            item.addEventListener('mouseleave', () => {
                gsap.to(img, { rotation: 0, duration: 0.3, ease: 'power2.out' });
            });
        }
    });
}

// ========================================
// Belt Data — single source of truth shared by
// home (modal) and contact-us (belt-journey grid)
// ========================================
const TT_BELTS = [
    { key: 'white',        name: 'White Belt',  meaning: 'Beginning / Innocence', img: 'assets/images/7.png',  blurb: 'A blank slate. Open to learning and beginning your martial arts journey.' },
    { key: 'yellow',       name: 'Yellow Belt', meaning: 'Foundation',            img: 'assets/images/9.png',  blurb: 'The earth from which a plant sprouts. Laying the groundwork.' },
    { key: 'purple',       name: 'Purple Belt', meaning: 'Transition',            img: 'assets/images/11.png', blurb: 'Progress from beginner to intermediate. Confidence grows.' },
    { key: 'orange',       name: 'Orange Belt', meaning: 'Awakening',             img: 'assets/images/12.png', blurb: 'The sun warming the earth. Beginning to apply fundamental skills.' },
    { key: 'green',        name: 'Green Belt',  meaning: 'Growth',                img: 'assets/images/13.png', blurb: 'Skills improving. Coordination and balance developing.' },
    { key: 'blue',         name: 'Blue Belt',   meaning: 'Expansion',             img: 'assets/images/14.png', blurb: 'Like the sky. Deepening understanding and expanding abilities.' },
    { key: 'brown',        name: 'Brown Belt',  meaning: 'Maturity',              img: 'assets/images/15.png', blurb: 'Techniques sharp and controlled. Ready for advanced application.' },
    { key: 'red',          name: 'Red Belt',    meaning: 'Danger',                img: 'assets/images/16.png', blurb: 'Significant power. Learning to use it wisely with self-control.' },
    { key: 'black',        name: 'Black Belt',  meaning: 'Mastery & New Beginning', img: 'assets/images/19.png', blurb: 'Not the end, but the start of a deeper journey.', featured: true }
];

// Renders the contact-us belt-journey grid from TT_BELTS.
function renderBeltJourneyCards() {
    const grid = document.querySelector('.belt-cards-grid');
    if (!grid) return;
    const colors = ['layer-red', 'layer-blue'];
    grid.innerHTML = TT_BELTS.map((b, i) => {
        const a = colors[i % 2];
        const c = colors[(i + 1) % 2];
        return `
            <div class="belt-journey-card${b.featured ? ' featured' : ''}">
                <div class="bjc-layer ${a}"></div>
                <div class="bjc-layer ${c}"></div>
                <div class="bjc-main">
                    <img src="${b.img}" alt="${b.name}" class="belt-icon">
                    <div class="belt-info">
                        <h4>${b.name}</h4>
                        <span class="belt-meaning">${b.meaning}</span>
                        <p>${b.blurb}</p>
                    </div>
                </div>
            </div>`;
    }).join('');
}

// ========================================
// Belt Modal (home page tap-to-expand)
// ========================================
function initBeltModal() {
    const triggers = document.querySelectorAll('.belt-item[data-belt]');
    const modal = document.getElementById('belt-modal');
    if (!triggers.length || !modal) return;

    const card = modal.querySelector('.belt-modal-card');
    const closeBtn = modal.querySelector('.belt-modal-close');
    const backdrop = modal.querySelector('.belt-modal-backdrop');
    const titleEl = modal.querySelector('#belt-modal-title');
    const meaningEl = modal.querySelector('.belt-modal-meaning');
    const imgEl = modal.querySelector('.belt-modal-img');
    const blurbEl = modal.querySelector('.belt-modal-blurb');

    let lastTrigger = null;
    let prevBodyOverflow = '';

    // Map data-belt key -> belt object. Strip "-stripe" / "poom" -> nearest tier shown on contact.
    const bestMatch = (key) => {
        if (!key) return null;
        const direct = TT_BELTS.find(b => b.key === key);
        if (direct) return direct;
        // Stripe variants and Poom inherit from their nearest base belt.
        if (key === 'white-stripe')  return TT_BELTS.find(b => b.key === 'white');
        if (key === 'yellow-stripe') return TT_BELTS.find(b => b.key === 'yellow');
        if (key === 'red-stripe')    return TT_BELTS.find(b => b.key === 'red');
        if (key === 'poom')          return TT_BELTS.find(b => b.key === 'black');
        return null;
    };

    function open(trigger) {
        const data = bestMatch(trigger.getAttribute('data-belt'));
        if (!data) return;
        lastTrigger = trigger;
        titleEl.textContent = data.name;
        meaningEl.textContent = data.meaning;
        imgEl.src = data.img;
        imgEl.alt = data.name;
        blurbEl.textContent = data.blurb;

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        prevBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        // Focus close button so ESC + tab stays inside.
        setTimeout(() => closeBtn.focus(), 20);
    }

    function close() {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = prevBodyOverflow;
        if (lastTrigger && typeof lastTrigger.focus === 'function') {
            lastTrigger.focus();
        }
    }

    // Convert each .belt-item into a real button for accessibility.
    triggers.forEach(el => {
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-haspopup', 'dialog');
        const label = el.querySelector('span');
        if (label) el.setAttribute('aria-label', `${label.textContent.trim()} belt: tap to read more`);

        el.addEventListener('click', () => open(el));
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open(el);
            }
        });
    });

    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('is-open')) return;
        if (e.key === 'Escape') {
            close();
            return;
        }
        if (e.key === 'Tab') {
            // Focus trap: only the close button is focusable inside the card.
            // Keep focus on it regardless of Tab / Shift+Tab.
            const focusables = modal.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });
}

// ========================================
// Scroll Progress Indicator
// ========================================
const scrollProgress = document.createElement('div');
scrollProgress.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 4px;
    background: linear-gradient(90deg, #c60d31, #013378);
    z-index: 9999;
    transform-origin: left;
    transform: scaleX(0);
    width: 100%;
`;
document.body.appendChild(scrollProgress);

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;
    scrollProgress.style.transform = `scaleX(${scrollPercent})`;
});
