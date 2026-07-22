const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('#site-nav');
const year = document.querySelector('#year');

if (year) {
  year.textContent = new Date().getFullYear();
}

if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 18);
  }, { passive: true });
}

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    navigation.classList.toggle('open', !open);
  });

  navigation.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navigation.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(element => {
    observer.observe(element);
  });
} else {
  document.querySelectorAll('.reveal').forEach(element => {
    element.classList.add('visible');
  });
}

/* =========================================================
   CARRUSEL DE VIDEOS
   ========================================================= */

const videoCarousel = document.querySelector('[data-video-carousel]');
const videoPrev = document.querySelector('[data-video-prev]');
const videoNext = document.querySelector('[data-video-next]');
const videoProgress = document.querySelector('[data-video-progress]');

function getVideoScrollStep() {
  if (!videoCarousel) return 0;

  const firstCard = videoCarousel.querySelector('[data-video-card]');
  if (!firstCard) return videoCarousel.clientWidth;

  const styles = window.getComputedStyle(videoCarousel);
  const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;

  return firstCard.getBoundingClientRect().width + gap;
}

function updateVideoCarouselControls() {
  if (!videoCarousel) return;

  const maxScroll = Math.max(
    videoCarousel.scrollWidth - videoCarousel.clientWidth,
    0
  );
  const currentScroll = Math.min(
    Math.max(videoCarousel.scrollLeft, 0),
    maxScroll
  );

  if (videoPrev) {
    videoPrev.disabled = currentScroll <= 4;
  }

  if (videoNext) {
    videoNext.disabled = currentScroll >= maxScroll - 4;
  }

  if (videoProgress) {
    const progress = maxScroll === 0
      ? 100
      : (currentScroll / maxScroll) * 100;

    videoProgress.style.width = `${Math.max(progress, 5)}%`;
  }
}

if (videoCarousel) {
  videoPrev?.addEventListener('click', () => {
    videoCarousel.scrollBy({
      left: -getVideoScrollStep(),
      behavior: 'smooth'
    });
  });

  videoNext?.addEventListener('click', () => {
    videoCarousel.scrollBy({
      left: getVideoScrollStep(),
      behavior: 'smooth'
    });
  });

  videoCarousel.addEventListener(
    'scroll',
    updateVideoCarouselControls,
    { passive: true }
  );

  videoCarousel.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      videoCarousel.scrollBy({
        left: -getVideoScrollStep(),
        behavior: 'smooth'
      });
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      videoCarousel.scrollBy({
        left: getVideoScrollStep(),
        behavior: 'smooth'
      });
    }
  });

  videoCarousel.querySelectorAll('[data-video-id]').forEach(button => {
    button.addEventListener('click', () => {
      const videoId = button.dataset.videoId;
      if (!videoId) return;

      const iframe = document.createElement('iframe');
      iframe.className = 'video-frame';
      iframe.src =
        `https://www.youtube-nocookie.com/embed/${videoId}` +
        '?autoplay=1&rel=0&modestbranding=1';
      iframe.title = button.getAttribute('aria-label') || 'Video de YouTube';
      iframe.loading = 'lazy';
      iframe.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; ' +
        'gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allowFullscreen = true;

      button.replaceWith(iframe);
    });
  });

  window.addEventListener('resize', updateVideoCarouselControls);
  updateVideoCarouselControls();
}
