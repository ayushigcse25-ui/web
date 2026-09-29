/**
 * Zila Parishad Primary School, Ghorad
 * Main Global JavaScript Module
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initAccessibility();
  initLanguageSwitcher();
  initBackToTop();
  initNoticeTicker();
  initActiveNavLink();
  initScrollReveal();
  initNavbarScrollEffect();
});

/* ==========================================================================
   Mobile Navigation Drawer
   ========================================================================== */
function initMobileNav() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const overlay = document.querySelector('.mobile-overlay');

  if (!menuToggle || !navLinks) return;

  function openMenu() {
    navLinks.classList.add('active');
    if (overlay) overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    menuToggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    navLinks.classList.remove('active');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.contains('active');
    if (isOpen) closeMenu();
    else openMenu();
  });

  if (overlay) {
    overlay.addEventListener('click', closeMenu);
  }

  // Close when clicking nav items on mobile
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 868) {
        closeMenu();
      }
    });
  });

  // Mobile close button if exists
  const closeBtn = document.querySelector('.mobile-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeMenu);
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('active')) {
      closeMenu();
      menuToggle.focus();
    }
  });
}

/* ==========================================================================
   Active Nav Link — Auto-detect from URL
   ========================================================================== */
function initActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    // Remove any existing active from HTML (only keep JS-driven one)
    link.classList.remove('active');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/* ==========================================================================
   Accessibility Controls (Font Resizer & High Contrast)
   ========================================================================== */
function initAccessibility() {
  const fontBtns = document.querySelectorAll('.font-btn');
  const contrastBtn = document.querySelector('.contrast-btn');

  // Font size scale
  const currentScale = localStorage.getItem('school_font_scale') || '100';
  applyFontScale(currentScale);

  fontBtns.forEach(btn => {
    const scale = btn.getAttribute('data-scale');
    if (scale === currentScale) btn.classList.add('active');
    else btn.classList.remove('active');

    btn.addEventListener('click', () => {
      fontBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetScale = btn.getAttribute('data-scale');
      applyFontScale(targetScale);
      localStorage.setItem('school_font_scale', targetScale);
    });
  });

  function applyFontScale(scale) {
    if (scale === '90') {
      document.documentElement.style.fontSize = '90%';
    } else if (scale === '110') {
      document.documentElement.style.fontSize = '110%';
    } else {
      document.documentElement.style.fontSize = '100%';
    }
  }

  // High contrast
  const isHighContrast = localStorage.getItem('school_high_contrast') === 'true';
  if (isHighContrast) document.body.classList.add('high-contrast');

  if (contrastBtn) {
    contrastBtn.addEventListener('click', () => {
      document.body.classList.toggle('high-contrast');
      const active = document.body.classList.contains('high-contrast');
      localStorage.setItem('school_high_contrast', active);
    });
  }
}

/* ==========================================================================
   Bilingual Language Switcher (English & Marathi)
   ========================================================================== */
const translations = {
  mr: {
    nav_home: 'मुख्यपृष्ठ',
    nav_about: 'शाळेबद्दल',
    nav_academics: 'शैक्षणिक',
    nav_facilities: 'सुविधा',
    nav_activities: 'उपक्रम',
    nav_gallery: 'चित्रदालन',
    nav_notices: 'सूचना फलक',
    nav_contact: 'संपर्क',
    hero_title: 'जिल्हा परिषद प्राथमिक शाळा, घोरड येथे आपले स्वागत आहे',
    hero_lead: 'गुणवत्तापूर्ण शिक्षण, संस्कार, सर्जनशीलता आणि सर्वांगीण विकासातून बालमनांची जडणघडण.',
    btn_explore: 'शाळेविषयी माहिती घ्या',
    btn_contact: 'संपर्क साधा',
    quick_stat_name: 'शाळेचे नाव',
    quick_stat_location: 'स्थान',
    quick_stat_level: 'शिक्षण स्तर',
    quick_stat_type: 'शाळा प्रकार',
    val_level: 'प्राथमिक (इ. १ ली ते ५ वी)',
    val_type: 'महाराष्ट्र शासन / जि. प.',
    val_loc: 'घोरड, कळमेश्वर, नागपूर',
    sec_about_title: 'शाळेबद्दल माहिती',
    sec_vision_title: 'आमचे ध्येय (Vision)',
    sec_mission_title: 'आमचे उद्दिष्ट (Mission)',
    sec_why_title: 'आमची शाळा का निवडावी?',
    ticker_label: 'महत्त्वाची सूचना',
    read_more: 'अधिक वाचा',
    footer_quick_links: 'जलद दुवे',
    footer_gov_links: 'शासकीय दुवे',
    footer_contact: 'संपर्क माहिती',
    footer_rights: '© २०२६ जिल्हा परिषद प्राथमिक शाळा, घोरड. सर्व हक्क राखीव.'
  },
  en: {
    nav_home: 'Home',
    nav_about: 'About School',
    nav_academics: 'Academics',
    nav_facilities: 'Facilities',
    nav_activities: 'Activities',
    nav_gallery: 'Gallery',
    nav_notices: 'Notices',
    nav_contact: 'Contact',
    hero_title: 'Welcome to Zila Parishad Primary School, Ghorad',
    hero_lead: 'Nurturing young minds through quality education, values, creativity and holistic development.',
    btn_explore: 'Explore Our School',
    btn_contact: 'Contact Us',
    quick_stat_name: 'School Name',
    quick_stat_location: 'Location',
    quick_stat_level: 'Education Level',
    quick_stat_type: 'School Type',
    val_level: 'Primary (Class 1 to 5)',
    val_type: 'Maharashtra Govt / ZP',
    val_loc: 'Ghorad, Kalmeshwar, Nagpur',
    sec_about_title: 'About Our School',
    sec_vision_title: 'Our Vision',
    sec_mission_title: 'Our Mission',
    sec_why_title: 'Why Choose Our School',
    ticker_label: 'Important Notice',
    read_more: 'Read More',
    footer_quick_links: 'Quick Links',
    footer_gov_links: 'Government Links',
    footer_contact: 'Contact Info',
    footer_rights: '© 2026 Zila Parishad Primary School, Ghorad. All Rights Reserved.'
  }
};

function initLanguageSwitcher() {
  const langBtns = document.querySelectorAll('.lang-btn');
  let currentLang = localStorage.getItem('school_lang') || 'en';

  setLanguage(currentLang);

  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      if (lang) {
        setLanguage(lang);
        localStorage.setItem('school_lang', lang);
      }
    });
  });

  function setLanguage(lang) {
    langBtns.forEach(b => {
      if (b.getAttribute('data-lang') === lang) b.classList.add('active');
      else b.classList.remove('active');
    });

    const dict = translations[lang] || translations.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });
  }
}

/* ==========================================================================
   Back to Top Button
   ========================================================================== */
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/* ==========================================================================
   Notice Ticker — Pause on hover/focus, seamless loop
   ========================================================================== */
function initNoticeTicker() {
  const ticker = document.querySelector('.ticker-text');
  const tickerContent = document.querySelector('.ticker-content');
  if (!ticker || !tickerContent) return;

  // Clone ticker content for seamless infinite loop
  const clone = ticker.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  tickerContent.appendChild(clone);

  // Pause on hover (CSS handles it but reinforce via JS for touch)
  const noticeTickerEl = document.querySelector('.notice-ticker');
  if (noticeTickerEl) {
    noticeTickerEl.addEventListener('mouseenter', () => {
      ticker.style.animationPlayState = 'paused';
      clone.style.animationPlayState = 'paused';
    });
    noticeTickerEl.addEventListener('mouseleave', () => {
      ticker.style.animationPlayState = 'running';
      clone.style.animationPlayState = 'running';
    });
    noticeTickerEl.addEventListener('focusin', () => {
      ticker.style.animationPlayState = 'paused';
      clone.style.animationPlayState = 'paused';
    });
    noticeTickerEl.addEventListener('focusout', () => {
      ticker.style.animationPlayState = 'running';
      clone.style.animationPlayState = 'running';
    });
  }
}

/* ==========================================================================
   Scroll Reveal — Animate sections/cards on scroll into view
   ========================================================================== */
function initScrollReveal() {
  // Add reveal class to key elements
  const revealTargets = document.querySelectorAll(
    '.feature-card, .vm-card, .info-card, .notice-card, .gallery-item, ' +
    '.about-summary-grid, .section-header, .hero-content, .hero-image-col'
  );

  revealTargets.forEach((el, i) => {
    el.classList.add('scroll-reveal');
    // Stagger cards in grids
    if (el.closest('.features-grid, .info-cards-grid, .gallery-grid, .notices-list')) {
      el.style.transitionDelay = `${(i % 6) * 0.08}s`;
    }
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target); // Animate once
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  revealTargets.forEach(el => observer.observe(el));
}

/* ==========================================================================
   Navbar Scroll Effect — deeper shadow when page is scrolled
   ========================================================================== */
function initNavbarScrollEffect() {
  const navbar = document.querySelector('.navbar-wrapper');
  if (!navbar) return;

  const onScroll = () => {
    if (window.pageYOffset > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Run on load in case page starts scrolled
}
