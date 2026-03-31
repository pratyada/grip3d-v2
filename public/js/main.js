(() => {
  // Carousel (home + use-cases page)
  const carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    const track = carousel.querySelector('.carousel__track');
    const slides = Array.from(carousel.querySelectorAll('.carousel__slide'));
    const thumbs = Array.from(carousel.querySelectorAll('.carousel__thumb'));
    const prev = carousel.querySelector('[data-prev]');
    const next = carousel.querySelector('[data-next]');
    let idx = 0;

    const update = () => {
      track.style.transform = `translate3d(${-idx * 100}%, 0, 0)`;
      thumbs.forEach((t, i) => t.classList.toggle('is-active', i === idx));
    };

    const go = (n) => {
      idx = (n + slides.length) % slides.length;
      update();
    };

    prev?.addEventListener('click', () => go(idx - 1));
    next?.addEventListener('click', () => go(idx + 1));
    thumbs.forEach((t, i) => t.addEventListener('click', () => go(i)));

    // swipe
    let startX = 0;
    let isDown = false;
    const viewport = carousel.querySelector('.carousel__viewport');
    viewport?.addEventListener('pointerdown', (e) => { isDown = true; startX = e.clientX; });
    viewport?.addEventListener('pointerup', (e) => {
      if (!isDown) return;
      isDown = false;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 40) go(dx < 0 ? idx + 1 : idx - 1);
    });

    update();
  }

  // Contact form (mailto prototype)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('c_email')?.value || '';
      const msg = document.getElementById('c_msg')?.value || '';
      const to = 'bill@grip3d.com,prat@grip3d.com';
      const subject = encodeURIComponent('GRIP 3D Demo / Contact');
      const body = encodeURIComponent(`From: ${email}\n\nMessage:\n${msg}\n\n— Sent from grip3d.com prototype`);
      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    });
  }
})();


// Contact form -> mailto (prototype)
const contactForm = document.getElementById('contactForm');
if (contactForm) {
	contactForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const email = document.getElementById('email')?.value || '';
		const msg = document.getElementById('message')?.value || '';
		const subject = encodeURIComponent('GRIP 3D — Contact');
		const body = encodeURIComponent(`From: ${email}

${msg}`);
		window.location.href = `mailto:bill@grip3d.com,prat@grip3d.com?subject=${subject}&body=${body}`;
	});
}

