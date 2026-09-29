/**
 * Zila Parishad Primary School, Ghorad
 * Gallery & Lightbox Module
 */

document.addEventListener('DOMContentLoaded', () => {
  initGalleryFilter();
  initLightbox();
});

const galleryData = [
  {
    id: 1,
    title: 'School Campus & Main Courtyard',
    category: 'campus',
    categoryName: 'School Campus',
    image: 'assets/images/hero_banner.jpg',
    caption: 'Clean, open courtyard with the National Flag and tree-lined campus at ZP Primary School, Ghorad.'
  },
  {
    id: 2,
    title: 'Interactive Classroom Learning',
    category: 'classrooms',
    categoryName: 'Classrooms',
    image: 'assets/images/classroom.jpg',
    caption: 'Students engaged in joyful learning with interactive teaching charts and attentive teacher guidance.'
  },
  {
    id: 3,
    title: 'Morning Assembly & Prayer',
    category: 'celebrations',
    categoryName: 'Celebrations',
    image: 'assets/images/assembly.jpg',
    caption: 'Disciplined morning assembly fostering values, unity, and national pride.'
  },
  {
    id: 4,
    title: 'Sports & Traditional Outdoor Games',
    category: 'sports',
    categoryName: 'Sports',
    image: 'assets/images/sports.jpg',
    caption: 'Primary children enthusiastically playing traditional games on the open playground.'
  },
  {
    id: 5,
    title: 'Cultural Festival & Annual Day',
    category: 'cultural',
    categoryName: 'Cultural Events',
    image: 'assets/images/cultural.jpg',
    caption: 'Vibrant cultural performances celebrating Maharashtra folk heritage and music.'
  },
  {
    id: 6,
    title: 'Nutritious Mid-Day Meal (PM POSHAN)',
    category: 'activities',
    categoryName: 'Activities',
    image: 'assets/images/midday_meal.jpg',
    caption: 'Wholesome, hot, hygienic meals served daily to support student health and development.'
  },
  {
    id: 7,
    title: 'Reading Corner & Bal Vachanalaya',
    category: 'activities',
    categoryName: 'Activities',
    image: 'assets/images/library.jpg',
    caption: 'Encouraging reading habits with illustrated Marathi & English storybooks and picture encyclopedias.'
  },
  {
    id: 8,
    title: 'Art, Drawing & Creative Expression',
    category: 'activities',
    categoryName: 'Activities',
    image: 'assets/images/art_craft.jpg',
    caption: 'Young students creating colorful drawings celebrating nature, community, and national symbols.'
  }
];

function initGalleryFilter() {
  const filterBtns = document.querySelectorAll('.gallery-filters .filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      galleryItems.forEach((item, index) => {
        const itemCat = item.getAttribute('data-category');
        if (filter === 'all' || itemCat === filter) {
          item.style.display = 'block';
          item.style.animationDelay = `${(index % 8) * 0.06}s`;
          item.style.animation = 'none';
          // Force reflow to restart animation
          void item.offsetHeight;
          item.style.animation = 'galleryFadeIn 0.4s ease forwards';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

function initLightbox() {
  const lightbox = document.getElementById('galleryLightbox');
  if (!lightbox) return;

  const lightboxImg = lightbox.querySelector('.lightbox-img');
  const lightboxTitle = lightbox.querySelector('.lightbox-title');
  const lightboxDesc = lightbox.querySelector('.lightbox-desc');
  const lightboxCounter = lightbox.querySelector('.lightbox-counter');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');

  let currentIndex = 0;
  let visibleItems = [];
  let lastFocusedItem = null;

  function updateVisibleItems() {
    visibleItems = Array.from(document.querySelectorAll('.gallery-item'))
      .filter(item => item.style.display !== 'none')
      .map(item => parseInt(item.getAttribute('data-id'), 10));
  }

  function openLightbox(id, triggerEl) {
    lastFocusedItem = triggerEl || null;
    updateVisibleItems();
    currentIndex = visibleItems.indexOf(id);
    if (currentIndex === -1) currentIndex = 0;

    renderCurrentSlide();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Focus close button for accessibility
    setTimeout(() => closeBtn && closeBtn.focus(), 50);
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    // Return focus to triggering element
    if (lastFocusedItem) lastFocusedItem.focus();
  }

  function renderCurrentSlide() {
    const currentId = visibleItems[currentIndex];
    const data = galleryData.find(item => item.id === currentId);
    if (!data) return;

    // Fade transition
    if (lightboxImg) {
      lightboxImg.style.opacity = '0';
      setTimeout(() => {
        lightboxImg.src = data.image;
        lightboxImg.alt = data.title;
        lightboxImg.style.opacity = '1';
      }, 150);
    }
    if (lightboxTitle) lightboxTitle.textContent = data.title;
    if (lightboxDesc) lightboxDesc.textContent = data.caption;
    if (lightboxCounter) {
      lightboxCounter.textContent = `${currentIndex + 1} / ${visibleItems.length}`;
    }
  }

  function nextSlide() {
    if (visibleItems.length <= 1) return;
    currentIndex = (currentIndex + 1) % visibleItems.length;
    renderCurrentSlide();
  }

  function prevSlide() {
    if (visibleItems.length <= 1) return;
    currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
    renderCurrentSlide();
  }

  // Attach click AND keyboard (Enter/Space) to all gallery items
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseInt(item.getAttribute('data-id'), 10);
      openLightbox(id, item);
    });

    // Keyboard accessibility: Enter or Space opens lightbox
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = parseInt(item.getAttribute('data-id'), 10);
        openLightbox(id, item);
      }
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextSlide(); });
  if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevSlide(); });

  // Close when clicking background outside content
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
  });

  // Add CSS transition to lightbox image
  if (lightboxImg) {
    lightboxImg.style.transition = 'opacity 0.15s ease';
  }
}
