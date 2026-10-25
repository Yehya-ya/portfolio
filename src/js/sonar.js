// Sonar grid: a calm dot grid where rings ripple out from every tap, with an occasional ambient ping.
// Under a mouse the nearby dots swell and part around the cursor, trailing it slightly.
// The first time a grid scrolls into view, a ring leaves from behind its heading; in the hero that lands with the
// page's opening (.intro in app.css). Without JavaScript the static CSS grid stays in place; with reduced motion one
// ring is drawn around the heading, frozen, and the grid ignores the mouse.

const SPACING = 32; // Must match background-size in .dot-grid.
const DOT = 1.15;
const RING_SPEED = 0.22; // px per ms
const RING_WIDTH = 74;
const RING_LIFE = 3400; // ms
const AMBIENT_EVERY = [2600, 5200]; // ms, random between
const HOVER_RADIUS = 160;
const HOVER_GLOW = 0.6; // Peak glow under the cursor; a passing ring peaks at 1.
const HOVER_PUSH = 8; // px a dot right next to the cursor moves away from it
const HOVER_EASE = 0.012; // Share of the remaining distance covered per ms

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('[data-sonar]').forEach(startSonar);

function startSonar(canvas) {
    const area = canvas.parentElement;
    const context = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let columns = [];
    let rows = [];
    let rings = [];
    let colors = readColors();
    let visible = true;
    let running = false;
    let nextAmbient = 0;
    let lastFrame = 0;
    // Where the mouse is (viewport coordinates) and where the eased spotlight has got to (canvas coordinates).
    const hover = { clientX: 0, clientY: 0, inside: false, x: 0, y: 0, strength: 0 };

    function readColors() {
        const styles = getComputedStyle(canvas);

        return { dot: styles.getPropertyValue('--dot').trim(), ring: styles.getPropertyValue('--ink').trim() };
    }

    function resize() {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);

        // CSS centres the background tile, which puts a dot on the centre lines; start from there.
        columns = [];
        rows = [];
        for (let x = (width / 2) % SPACING; x < width; x += SPACING) columns.push(x);
        for (let y = (height / 2) % SPACING; y < height; y += SPACING) rows.push(y);
    }

    function ping(x, y, start = performance.now()) {
        rings.push({ x, y, start });
        play();
    }

    function headingCentre() {
        const heading = area.querySelector('h1, h2');

        if (!heading) {
            return { x: width / 2, y: height / 2 };
        }

        const box = heading.getBoundingClientRect();
        const bounds = canvas.getBoundingClientRect();

        return { x: box.left + box.width / 2 - bounds.left, y: box.top + box.height / 2 - bounds.top };
    }

    function draw(now) {
        rings = rings.filter((ring) => now - ring.start < RING_LIFE);
        context.clearRect(0, 0, width, height);

        // Resting dots share one path; dots on a ring are drawn after, bigger and darker.
        const lit = [];
        context.fillStyle = colors.dot;
        context.beginPath();

        for (const y of rows) {
            for (const x of columns) {
                let glow = 0;

                for (const ring of rings) {
                    const age = now - ring.start;
                    const offRing = Math.abs(Math.hypot(x - ring.x, y - ring.y) - age * RING_SPEED);

                    if (offRing < RING_WIDTH) {
                        glow = Math.max(glow, (1 - offRing / RING_WIDTH) * (1 - (age / RING_LIFE) ** 2));
                    }
                }

                let litX = x;
                let litY = y;

                if (hover.strength > 0.01) {
                    const dx = x - hover.x;
                    const dy = y - hover.y;
                    const distance = Math.hypot(dx, dy);

                    if (distance < HOVER_RADIUS) {
                        // Flat near the cursor, then a soft edge.
                        const pull = (1 - (distance / HOVER_RADIUS) ** 2) ** 2 * hover.strength;
                        glow = Math.max(glow, pull * HOVER_GLOW);

                        if (distance > 0) {
                            litX += (dx / distance) * pull * HOVER_PUSH;
                            litY += (dy / distance) * pull * HOVER_PUSH;
                        }
                    }
                }

                if (glow > 0.04) {
                    lit.push(litX, litY, glow);
                } else {
                    context.moveTo(x + DOT, y);
                    context.arc(x, y, DOT, 0, Math.PI * 2);
                }
            }
        }

        context.fill();
        context.fillStyle = colors.ring;

        for (let i = 0; i < lit.length; i += 3) {
            const glow = lit[i + 2];
            context.globalAlpha = 0.2 + glow * 0.8;
            context.beginPath();
            context.arc(lit[i], lit[i + 1], DOT + glow * 4.4, 0, Math.PI * 2);
            context.fill();
        }

        context.globalAlpha = 1;
    }

    function frame(now) {
        if (!visible) {
            running = false;

            return;
        }

        if (now >= nextAmbient) {
            ping(Math.random() * width, Math.random() * height, now);
            nextAmbient = now + AMBIENT_EVERY[0] + Math.random() * (AMBIENT_EVERY[1] - AMBIENT_EVERY[0]);
        }

        // Ease by elapsed time so the spotlight trails the cursor the same way at 60 Hz and 120 Hz.
        // Reading the bounds every frame keeps it under a still mouse while the page scrolls.
        const ease = 1 - (1 - HOVER_EASE) ** Math.min(now - lastFrame, 100);
        const bounds = canvas.getBoundingClientRect();
        hover.x += (hover.clientX - bounds.left - hover.x) * ease;
        hover.y += (hover.clientY - bounds.top - hover.y) * ease;
        hover.strength += ((hover.inside ? 1 : 0) - hover.strength) * ease;
        lastFrame = now;

        draw(now);
        requestAnimationFrame(frame);
    }

    function play() {
        if (!reducedMotion && visible && !running) {
            running = true;
            requestAnimationFrame(frame);
        }
    }

    area.addEventListener('pointerdown', (event) => {
        const bounds = canvas.getBoundingClientRect();
        ping(event.clientX - bounds.left, event.clientY - bounds.top);
    }, { passive: true });

    // Touch has no hover; a finger only sends rings.
    area.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch') {
            return;
        }

        hover.clientX = event.clientX;
        hover.clientY = event.clientY;

        // Coming back in after the spotlight has faded: start it under the cursor instead of gliding over from where it left.
        if (!hover.inside && hover.strength < 0.02) {
            const bounds = canvas.getBoundingClientRect();
            hover.x = event.clientX - bounds.left;
            hover.y = event.clientY - bounds.top;
        }

        hover.inside = true;
    }, { passive: true });

    area.addEventListener('pointerleave', () => {
        hover.inside = false;
    });

    new ResizeObserver(() => {
        resize();
        draw(performance.now());
    }).observe(area);

    let greeted = false;

    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;

        if (visible && !greeted && !reducedMotion) {
            greeted = true;
            const centre = headingCentre();
            ping(centre.x, centre.y);
            // Let that ring travel alone before the ambient pings start.
            nextAmbient = performance.now() + AMBIENT_EVERY[1];
        }

        play();
    }).observe(area);

    document.addEventListener('visibilitychange', () => {
        visible = !document.hidden;
        play();
    });

    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        colors = readColors();
        draw(performance.now());
    });

    resize();

    const now = performance.now();

    if (reducedMotion) {
        const centre = headingCentre();
        rings.push({ x: centre.x, y: centre.y, start: now - 1100 });
    }

    // The first frames can run before the observer reports, so hold the ambient pings back until it has.
    nextAmbient = now + AMBIENT_EVERY[1];
    draw(now);
    area.classList.remove('dot-grid');
    play();
}
