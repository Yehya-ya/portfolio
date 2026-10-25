# yehya.dev

My portfolio: plain HTML, Tailwind CSS and a little JavaScript, built with Vite into static files.

## What's where

- `index.html`: the home page.
- `work/<slug>/index.html`: one page per case study.
- `cv/index.html`: the printable source of `public/yehya-yasser-cv.pdf`.
- `404.html`: the not-found page.
- `src/css/app.css`: Tailwind styles, plus the motion: the opening, page transitions and scroll reveals.
- `src/js/sonar.js`: the dot grid in the hero and contact sections.
- `public/`: copied into the build as it is. It holds the images, CV, preview image, icon, `sitemap.xml` and `robots.txt`.

## Working on it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # writes dist/
npm run preview   # serves dist/ at http://localhost:4173
```

## Adding a case study

1. Copy a page in `work/` to `work/<new-slug>/index.html`. Update its `<title>`, description, canonical and `og:url`, then the content.
2. Add a row for it to the list in `index.html`, under Selected work or Personal projects.
3. Point the "Next" link on the page before it at the new page, and the new page's "Next" at the one after.
4. Add its URL to `public/sitemap.xml`.
5. Put images in `public/images/projects/<slug>/` as WebP, with `width` and `height` on each `<img>`.

Case study URLs end in a slash (`/work/masroofi/`), so every link to one should too.

## Updating the CV PDF

Edit `cv/index.html`, then print it with headless Chrome or Edge:

```bash
npm run build && npm run preview
msedge --headless=new --no-pdf-header-footer --print-to-pdf=public/yehya-yasser-cv.pdf http://localhost:4173/cv/
```

## Deploying to Laravel Cloud

Create the application from this repository and turn on **Run as a static website**:

- **Static root path:** `dist`
- **Build command:** `npm ci && npm run build`

After the first deploy, check on the free `laravel.cloud` domain that the case study URLs open and an unknown path shows the 404 page. Then attach `yehya.dev`.

## Why it's fast

- **No server code:** every page is a static file served from the edge.
- **Small assets:** one stylesheet (about 6 KB compressed) and one font file.
- **Little JavaScript:** the only script is the home page's dot grid, about 2 KB compressed. Case study pages ship none.
- **Light images:** WebP, lazy-loaded, with sizes set so nothing jumps while they load.
