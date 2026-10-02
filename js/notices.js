/**
 * Zila Parishad Primary School, Ghorad
 * Notice Board Module
 * — Fetches from backend API with graceful fallback to sample data
 */

document.addEventListener('DOMContentLoaded', () => {
  initNoticeBoard();
});

/* ==========================================================================
   Sample / Fallback Data (shown while loading or if backend is offline)
   ========================================================================== */
const sampleNoticesData = [
  {
    id: 1,
    category: 'academic',
    categoryName: 'Academic',
    title: 'Commencement of New Academic Session & Book Distribution',
    dateDay: '15',
    dateMonth: 'Jun',
    dateFull: '15 June 2026',
    refNo: 'ZP-GHD/ACAD/2026/01',
    description: 'All parents and guardians are informed that the new academic year commences as per the state educational calendar. Free textbooks will be distributed to all enrolled students.',
    fullContent: 'All respected parents and community members of Ghorad village are hereby notified that classes for the new academic session 2026-27 will begin from 15th June. Under the Samagra Shiksha scheme, 100% free government textbooks and learning materials will be distributed to all enrolled students on the opening day. Regular attendance from day one is requested for all students from Class 1 to Class 5.',
    isSample: true
  },
  {
    id: 2,
    category: 'admission',
    categoryName: 'Admissions',
    title: 'Primary School Admissions Open for Class 1 (Session 2026-27)',
    dateDay: '01',
    dateMonth: 'Jun',
    dateFull: '01 June 2026',
    refNo: 'ZP-GHD/ADM/2026/04',
    description: 'Admissions are open for Class 1. Parents residing in Ghorad and nearby rural areas can submit child birth certificate, Aadhaar card, and passport photos at the school office.',
    fullContent: 'Admissions are cordially invited for fresh enrolment in Class 1 for the upcoming academic year. Children who have completed 6 years of age as per government norms are eligible. Documents required: 1. Birth Certificate 2. Aadhaar Card copy 3. Recent passport size photograph 4. Bank account details (for DBT government schemes). Admission is completely free under Right to Education (RTE).',
    isSample: true
  },
  {
    id: 3,
    category: 'midday',
    categoryName: 'PM POSHAN',
    title: 'Monthly Mid-Day Meal Menu & Quality Monitoring Committee Notice',
    dateDay: '20',
    dateMonth: 'May',
    dateFull: '20 May 2026',
    refNo: 'ZP-GHD/MDM/2026/08',
    description: 'School Management Committee (SMC) has reviewed and approved the nutritious hot cooked meal menu including pulses, vegetables, and weekly egg/fruit supplementation.',
    fullContent: 'Under the Pradhan Mantri Poshan Shakti Nirman (PM POSHAN) scheme, the updated weekly menu has been finalized in consultation with the School Management Committee and local parents. Fresh, clean, hygienic, and nutritious food is prepared daily using fortified salt and clean drinking water. Parents are welcome to inspect meal quality during lunch hours.',
    isSample: true
  },
  {
    id: 4,
    category: 'celebration',
    categoryName: 'Celebrations',
    title: 'Celebration of Maharashtra Day & International Labour Day',
    dateDay: '01',
    dateMonth: 'May',
    dateFull: '01 May 2026',
    refNo: 'ZP-GHD/EVT/2026/03',
    description: 'Flag hoisting ceremony and student cultural presentations on Maharashtra culture and social reformers held at the school campus at 7:30 AM.',
    fullContent: 'On the auspicious occasion of Maharashtra Day, flag hoisting will be held in the school courtyard at 7:30 AM, followed by patriotic songs, student speeches in Marathi, and tribute to social reformers who contributed to Maharashtra\'s heritage. All village elders, SMC members, and parents are invited.',
    isSample: true
  },
  {
    id: 5,
    category: 'gov',
    categoryName: 'Govt Circular',
    title: 'FLN / NIPUN Bharat Foundational Literacy & Numeracy Campaign',
    dateDay: '12',
    dateMonth: 'Apr',
    dateFull: '12 April 2026',
    refNo: 'ZP-NAG/EDU/FLN/2026/19',
    description: 'Special pedagogical activities initiated to ensure foundational reading, writing, and basic arithmetic skills for every child in grades 1 through 3.',
    fullContent: 'In compliance with the national NIPUN Bharat mission and Maharashtra State Education Department guidelines, special joy-based reading workshops, math kits, and storytelling hours are being conducted regularly to ensure age-appropriate foundational learning benchmarks.',
    isSample: true
  },
  {
    id: 6,
    category: 'holiday',
    categoryName: 'Holidays',
    title: 'School Summer Vacation Notice (Grades 1 to 5)',
    dateDay: '01',
    dateMonth: 'May',
    dateFull: '01 May 2026',
    refNo: 'ZP-GHD/HOL/2026/02',
    description: 'Annual summer vacation schedule for students with fun activity sheets and home reading guidelines provided by teachers.',
    fullContent: 'Summer vacations will be observed in accordance with the official calendar of the Zilla Parishad Nagpur Education Department. Students have been provided with joyful activity sheets and storybooks to keep their curiosity and learning alive during the holiday period.',
    isSample: true
  }
];

/* ==========================================================================
   API Configuration (mirrors contact.js logic)
   ========================================================================== */
function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.API_BASE_URL) {
    return window.API_BASE_URL.replace(/\/+$/, '');
  }
  const hostname = window.location.hostname;
  const port = window.location.port;
  if (port === '5000') return '';
  if (hostname === 'localhost' || hostname === '127.0.0.1' || window.location.protocol === 'file:' || !hostname) {
    return 'https://zp-school.onrender.com';
  }
  return '';
}

/* ==========================================================================
   Fetch Notices from Backend (with timeout + fallback)
   ========================================================================== */
async function fetchNotices() {
  const container = document.getElementById('noticesContainer');
  
  // Show skeleton loading state
  if (container) {
    container.innerHTML = `
      <div class="notices-loading" aria-live="polite" aria-label="Loading notices...">
        ${[1,2,3].map(() => `
          <div class="notice-card notice-skeleton" aria-hidden="true">
            <div class="skeleton-date"></div>
            <div class="skeleton-body">
              <div class="skeleton-line short"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line medium"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  try {
    const baseUrl = getApiBaseUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(`${baseUrl}/api/notices`, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      // Expect { success: true, data: [...] } or array directly
      const notices = Array.isArray(data) ? data : (data.data || data.notices || []);
      if (notices.length > 0) {
        return notices.map(n => ({
          id: n._id || n.id,
          category: n.category || 'general',
          categoryName: n.categoryName || capitalise(n.category) || 'General',
          title: n.title || n.subject || 'Notice',
          dateDay: formatDay(n.createdAt || n.date),
          dateMonth: formatMonth(n.createdAt || n.date),
          dateFull: formatDateFull(n.createdAt || n.date),
          refNo: n.refNo || n.ref || `ZP-GHD/${new Date().getFullYear()}`,
          description: n.description || n.summary || '',
          fullContent: n.fullContent || n.body || n.description || '',
          isSample: false
        }));
      }
    }
  } catch (err) {
    // Network error or timeout — silent fallback
    console.info('[Notice Board] Backend unavailable, using sample data.');
  }

  // Fallback to sample data
  return sampleNoticesData;
}

/* ==========================================================================
   Date Formatting Helpers
   ========================================================================== */
function formatDay(dateStr) {
  if (!dateStr) return '--';
  return new Date(dateStr).getDate().toString().padStart(2, '0');
}
function formatMonth(dateStr) {
  if (!dateStr) return '---';
  return new Date(dateStr).toLocaleString('en-IN', { month: 'short' });
}
function formatDateFull(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ==========================================================================
   Notice Board Render & Interaction
   ========================================================================== */
async function initNoticeBoard() {
  const container = document.getElementById('noticesContainer');
  const searchInput = document.getElementById('noticeSearchInput');
  const tabBtns = document.querySelectorAll('.notice-tab-btn');
  const modal = document.getElementById('noticeModal');

  if (!container) return;

  // Fetch data (live or fallback)
  let noticesData = await fetchNotices();

  let currentCategory = 'all';
  let currentSearch = '';

  function renderNotices() {
    const filtered = noticesData.filter(notice => {
      const matchCat = currentCategory === 'all' || notice.category === currentCategory;
      const searchLower = currentSearch.toLowerCase();
      const matchSearch = !currentSearch ||
        (notice.title || '').toLowerCase().includes(searchLower) ||
        (notice.description || '').toLowerCase().includes(searchLower) ||
        (notice.refNo || '').toLowerCase().includes(searchLower);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding:3rem 1.5rem;">
          <div style="font-size:2.5rem; color:var(--text-light); margin-bottom:1rem;">📋</div>
          <h3 style="color:var(--primary-dark);">No notices found</h3>
          <p style="color:var(--text-muted);">Try adjusting your search terms or category filter.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((notice, i) => `
      <div class="notice-card scroll-reveal revealed" data-category="${notice.category}" style="animation-delay:${i * 0.07}s">
        <div class="notice-date-badge">
          <div class="notice-date-day">${notice.dateDay}</div>
          <div class="notice-date-month">${notice.dateMonth}</div>
        </div>
        <div class="notice-main">
          <div class="notice-meta-line">
            <span class="notice-category-tag">${notice.categoryName}</span>
            <span style="font-size:0.75rem; color:var(--text-light);">Ref: ${notice.refNo}</span>
            ${notice.isSample ? '<span class="placeholder-tag" style="margin-top:0;">Demo / Sample Notice</span>' : ''}
          </div>
          <h3 class="notice-title">${notice.title}</h3>
          <p class="notice-desc">${notice.description}</p>
        </div>
        <div class="notice-action">
          <button type="button" class="btn btn-outline btn-sm view-notice-btn" data-id="${notice.id}" aria-label="Read full notice: ${notice.title}">
            Read More
          </button>
        </div>
      </div>
    `).join('');

    // Attach click events for modals
    container.querySelectorAll('.view-notice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const notice = noticesData.find(n => String(n.id) === String(id));
        if (notice) openNoticeModal(notice);
      });
    });
  }

  function openNoticeModal(notice) {
    if (!modal) return;

    modal.querySelector('.modal-notice-title').textContent = notice.title;
    modal.querySelector('.modal-notice-date').textContent = `Date: ${notice.dateFull} | Ref No: ${notice.refNo}`;
    modal.querySelector('.modal-notice-category').textContent = notice.categoryName;
    modal.querySelector('.modal-notice-body').textContent = notice.fullContent;

    const sampleTag = modal.querySelector('.modal-sample-tag');
    if (sampleTag) {
      sampleTag.style.display = notice.isSample ? 'inline-flex' : 'none';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus close button for accessibility
    const closeBtn = modal.querySelector('.modal-close-btn');
    if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
  }

  function closeNoticeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (modal) {
    const closeBtn = modal.querySelector('.modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeNoticeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeNoticeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeNoticeModal();
      }
    });

    const printBtn = modal.querySelector('.modal-print-btn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }
  }

  // Filter Tabs
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-category');
      renderNotices();
    });
  });

  // Search Input (debounced)
  if (searchInput) {
    let searchTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        currentSearch = e.target.value;
        renderNotices();
      }, 250);
    });
  }

  // Initial render
  renderNotices();
}
