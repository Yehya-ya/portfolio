// Lightbox: a screenshot opens full size in a dialog, with its caption, and the arrow keys (or the buttons) step through
// the page's other screenshots. Escape, the close button or a click outside the image closes it, and focus goes back to
// the screenshot. Each screenshot is a link to its own image file, so without JavaScript a click still opens it.

const links = [...document.querySelectorAll('a[data-lightbox]')];

if (links.length) {
    startLightbox();
}

function startLightbox() {
    const dialog = document.createElement('dialog');
    dialog.className = 'lightbox';
    dialog.setAttribute('aria-labelledby', 'lightbox-caption');
    dialog.innerHTML = `
        <div class="lightbox-bar">
            <p class="lightbox-count" aria-live="polite"></p>
            <button type="button" class="lightbox-button" data-close aria-label="Close">${icon('M5 5l10 10M15 5 5 15')}</button>
        </div>
        <div class="lightbox-stage"><img class="lightbox-image" alt="" /></div>
        <div class="lightbox-bar">
            <button type="button" class="lightbox-button" data-step="-1" aria-label="Previous image">${icon('M12 4 6 10l6 6')}</button>
            <p class="lightbox-caption" id="lightbox-caption"></p>
            <button type="button" class="lightbox-button" data-step="1" aria-label="Next image">${icon('M8 4l6 6-6 6')}</button>
        </div>`;
    document.body.append(dialog);

    const image = dialog.querySelector('.lightbox-image');
    const caption = dialog.querySelector('.lightbox-caption');
    const count = dialog.querySelector('.lightbox-count');

    // A single screenshot has nowhere to step to.
    if (links.length < 2) {
        dialog.querySelectorAll('[data-step], .lightbox-count').forEach((element) => element.classList.add('invisible'));
    }

    let current = 0;

    async function show(index) {
        current = (index + links.length) % links.length;
        const link = links[current];

        // Keep the screenshot on screen until the next one is ready, instead of flashing an empty frame.
        const next = new Image();
        next.src = link.href;
        await next.decode().catch(() => {});

        // Stepping quickly can finish out of order; only the latest step gets shown.
        if (links[current] !== link) {
            return;
        }

        image.src = link.href;
        image.alt = link.querySelector('img')?.alt ?? '';
        image.classList.toggle('is-portrait', next.naturalHeight > next.naturalWidth);
        caption.textContent = link.closest('figure')?.querySelector('figcaption')?.textContent.trim() ?? '';
        count.textContent = `${current + 1} of ${links.length}`;
    }

    links.forEach((link, index) => {
        link.addEventListener('click', (event) => {
            // Leave new-tab and new-window clicks to the browser.
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            }

            event.preventDefault();
            image.removeAttribute('src');
            show(index);
            dialog.showModal();
        });
    });

    dialog.addEventListener('click', (event) => {
        const step = event.target.closest('[data-step]');

        if (step) {
            show(current + Number(step.dataset.step));
        } else if (event.target.closest('[data-close]') || !event.target.closest('img, p')) {
            dialog.close();
        }
    });

    dialog.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            show(current - 1);
        } else if (event.key === 'ArrowRight') {
            show(current + 1);
        }
    });
}

function icon(path) {
    return `<svg class="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}" /></svg>`;
}
