import fs from "node:fs";
import path from "node:path";
import { loadDotEnv } from "./env.js";

loadDotEnv();

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const INDEX_HTML = path.join(PUBLIC_DIR, "index.html");

function mustReadJson(p) {
  if (!fs.existsSync(p)) throw new Error(`Missing file: ${p}. Run: npm run fetch`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function htmlEscape(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderIndex({ title = "Reimagine 2026 Photo" } = {}) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${htmlEscape(title)}</title>
    <link rel="icon" type="image/png" href="./assets/favicon.png" />
    <link rel="apple-touch-icon" href="./assets/favicon.png" />
    <meta property="og:title" content="${htmlEscape(title)}" />
    <style>
      :root { color-scheme: light; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; background:#0b0d12; color:#e7e9ee; }
      a { color: inherit; }
      .wrap { max-width: 1200px; margin: 0 auto; padding: 20px 14px 56px; }
      .nav { display:flex; align-items:center; justify-content:flex-start; margin-bottom: 16px; }
      .nav a { display:flex; align-items:center; gap:10px; }
      .nav img { height: 27px; width:auto; display:block; }
      .banner {
        width: 100%;
        margin-bottom: 24px;
        line-height: 0;
        font-size: 0;
        overflow: hidden;
        border-radius: 14px;
        background: #0b0d12;
      }
      .banner img { 
        width: 100%; 
        height: 100%;
        display: block; 
        vertical-align: middle;
        object-fit: cover;
        /* Avoid 1px hairlines from subpixel scaling */
        transform: translateZ(0) scale(1.01);
        transform-origin: center;
      }
      .top { display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap; }
      h1 { margin:0; font-size:18px; font-weight:700; letter-spacing: .2px; }
      .layout { display:flex; gap: 14px; margin-top: 14px; align-items:flex-start; }
      .sidebar { width: 220px; flex: 0 0 auto; position: sticky; top: 14px; align-self: flex-start; }
      .main { flex: 1 1 auto; min-width: 0; display:flex; flex-direction: column; gap: 10px; }
      .tabs { display:flex; gap:8px; flex-wrap:wrap; }
      .tabs.vertical { flex-direction: column; gap:10px; }
      .tab { border:1px solid rgba(255,255,255,.20); color:#ffffff; background: rgba(255,255,255,.07); padding:8px 10px; border-radius:999px; cursor:pointer; font-size:13px; }
      .tab:hover { background: rgba(255,255,255,.10); }
      .tab[aria-pressed="true"] { background: rgba(99,102,241,.72); border-color: rgba(99,102,241,.95); box-shadow: 0 8px 22px rgba(99,102,241,.22); }
      .meta { opacity:.75; font-size:12px; }
      .grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; flex: 1 1 auto; align-content: start; grid-auto-rows: 150px; }
      @media (min-width: 720px) { .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; grid-auto-rows: 170px; } }
      @media (min-width: 1024px) { .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
      @media (max-width: 720px) {
        .layout { flex-direction: column; }
        .sidebar {
          width: 100%;
          position: sticky;
          top: 0;
          z-index: 30;
          padding-top: 8px;
          padding-bottom: 8px;
          margin: 0 -2px;
          background: rgba(11,13,18,.78);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255,255,255,.10);
        }
        .tabs.vertical { flex-direction: row; flex-wrap: wrap; }
        .pager-desktop { display: none; }
        .pager-mobile { display: flex; }
      }
      .pager {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        padding: 8px 10px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 14px;
        background: rgba(255,255,255,.05);
      }
      .pager .info { font-size: 12px; color: rgba(255,255,255,.78); white-space: nowrap; }
      .pager .controls { display:flex; gap:8px; align-items:center; }
      .pager button {
        font-size: 12px;
        padding: 7px 10px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,.16);
        background: rgba(255,255,255,.06);
        color: #fff;
        cursor: pointer;
      }
      .pager button:disabled { opacity: .35; cursor: not-allowed; }
      .pager-mobile { display: none; }
      .card { border-radius: 14px; overflow: hidden; border:1px solid rgba(255,255,255,.10); background: rgba(255,255,255,.04); position: relative; height: 100%; }
      .card.landscape { grid-row: span 1; }
      .card.portrait { grid-row: span 2; }
      .card img { width:100%; height:100%; display:block; background:#111; object-fit: cover; }
      .card .zoomhint {
        position:absolute;
        inset:0;
        display:none;
        align-items:center;
        justify-content:center;
        pointer-events:none;
        background: rgba(0,0,0,.22);
        color: rgba(255,255,255,.92);
        font-size: 34px;
        letter-spacing: 1px;
      }
      @media (hover: hover) and (pointer: fine) {
        .card:hover .zoomhint { display:flex; }
        .card:hover img { cursor: zoom-in; }
      }
      .card .cap { position:absolute; left:0; right:0; bottom:0; display:flex; align-items:center; justify-content:flex-end; gap:10px; padding: 10px 10px; background: linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,0)); }
      .cap .btn {
        font-size:12px;
        padding:7px 10px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,.18);
        background: rgba(2,6,23,.88);
        color: #fff;
        text-decoration:none;
        flex:0 0 auto;
        display:inline-flex;
        align-items:center;
        gap:6px;
        backdrop-filter: blur(6px);
      }
      .cap .btn:hover { background: rgba(2,6,23,.96); border-color: rgba(255,255,255,.24); }
      .cap .btn svg { width: 14px; height: 14px; display:block; opacity: .95; }
      dialog { border:1px solid rgba(255,255,255,.18); border-radius: 16px; padding:0; background:#0b0d12; color:#e7e9ee; width:min(92vw, 980px); max-height: 92vh; overflow: hidden; }
      dialog::backdrop { background: rgba(0,0,0,.72); }
      .dlg-img { width:100%; height:auto; display:block; background:#111; }
      dialog[open] { display: flex; flex-direction: column; }
      .dlg-img { flex: 1 1 auto; width: 100%; height: auto; max-height: calc(92vh - 56px); object-fit: contain; }
      .dlg-bar { flex: 0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px; border-top:1px solid rgba(255,255,255,.10); }
      .dlg-title { font-size:13px; opacity:.9; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .dlg-actions { display:flex; gap:8px; flex:0 0 auto; }
      .dlg-actions a, .dlg-actions button {
        font-size:12px;
        padding:8px 10px;
        border-radius: 10px;
        border:1px solid rgba(255,255,255,.16);
        background: rgba(255,255,255,.06);
        color:inherit;
        cursor:pointer;
        text-decoration:none;
        display:inline-flex;
        align-items:center;
        gap:6px;
      }
      .dlg-actions a svg { width: 14px; height: 14px; display:block; opacity:.95; }
      .dlg-actions a:hover, .dlg-actions button:hover { background: rgba(255,255,255,.10); }
      .navzone {
        position: absolute;
        top: 0;
        bottom: 56px;
        width: 24%;
        cursor: pointer;
        user-select: none;
        display:flex;
        align-items:center;
      }
      .navzone.left { left: 0; }
      .navzone.left { justify-content:flex-start; padding-left: 10px; }
      .navzone.right { right: 0; }
      .navzone.right { justify-content:flex-end; padding-right: 10px; }
      .navbtn {
        width: 42px;
        height: 42px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.18);
        background: rgba(2,6,23,.70);
        color: rgba(255,255,255,.92);
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow: 0 10px 26px rgba(0,0,0,.25);
        backdrop-filter: blur(8px);
        opacity: .0;
        transform: translateY(0) scale(.98);
        transition: opacity .15s ease, transform .15s ease, background .15s ease;
      }
      .navbtn svg { width: 18px; height: 18px; display:block; }
      dialog:hover .navbtn { opacity: 1; transform: scale(1); }
      .navzone:active .navbtn { background: rgba(2,6,23,.86); }
      @media (hover: none) {
        .navbtn { opacity: 1; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="nav">
        <a href="https://www.larksuite.com" target="_blank" rel="noopener noreferrer" aria-label="Go to Lark website">
          <img src="./assets/lark-logo.png" alt="Lark" />
        </a>
      </div>
      <div class="banner" role="img" aria-label="Reimagine 2026 banner">
        <img src="./assets/banner.png?v=${Date.now()}" alt="Reimagine 2026" />
      </div>
      <div class="layout">
        <div class="sidebar">
          <div class="tabs vertical" id="tabs"></div>
          <div class="pager pager-desktop" id="pagerDesktop" aria-label="Pagination">
            <div class="info" id="pagerInfoDesktop"></div>
            <div class="controls">
              <button type="button" id="pagerPrevDesktop">Prev</button>
              <button type="button" id="pagerNextDesktop">Next</button>
            </div>
          </div>
        </div>
        <div class="main">
          <div class="pager pager-mobile" id="pagerMobile" aria-label="Pagination">
            <div class="info" id="pagerInfoMobile"></div>
            <div class="controls">
              <button type="button" id="pagerPrevMobile">Prev</button>
              <button type="button" id="pagerNextMobile">Next</button>
            </div>
          </div>
          <div class="grid" id="grid"></div>
        </div>
      </div>
    </div>

    <dialog id="dlg">
      <div class="navzone left" id="navPrev" aria-label="Previous photo">
        <div class="navbtn" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
      <div class="navzone right" id="navNext" aria-label="Next photo">
        <div class="navbtn" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
      <img class="dlg-img" id="dlgImg" alt="" />
      <div class="dlg-bar">
        <div class="dlg-title" id="dlgTitle"></div>
        <div class="dlg-actions">
          <a id="dlgDownload" href="#" download>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3v10m0 0l4-4m-4 4l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M4 17v3h16v-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Download original
          </a>
          <button id="dlgClose">Close</button>
        </div>
      </div>
    </dialog>

    <script>
      const $ = (s) => document.querySelector(s);
      const tabsEl = $("#tabs");
      const gridEl = $("#grid");
      const pagerInfoDesktop = $("#pagerInfoDesktop");
      const pagerInfoMobile = $("#pagerInfoMobile");
      const pagerPrevDesktop = $("#pagerPrevDesktop");
      const pagerNextDesktop = $("#pagerNextDesktop");
      const pagerPrevMobile = $("#pagerPrevMobile");
      const pagerNextMobile = $("#pagerNextMobile");
      const dlg = $("#dlg");
      const dlgImg = $("#dlgImg");
      const dlgTitle = $("#dlgTitle");
      const dlgDownload = $("#dlgDownload");
      const dlgClose = $("#dlgClose");
      const navPrev = $("#navPrev");
      const navNext = $("#navNext");

      let all = null;
      let active = "All photos";
      let currentList = [];
      let currentIndex = -1;
      const PAGE_SIZE = 24;
      let page = 0;

      function setActive(cat) {
        active = cat;
        page = 0;
        for (const b of tabsEl.querySelectorAll("button")) {
          b.setAttribute("aria-pressed", b.dataset.cat === cat ? "true" : "false");
        }
        renderGrid();
      }

      function showAt(idx) {
        if (!currentList.length) return;
        const n = currentList.length;
        currentIndex = ((idx % n) + n) % n;
        const p = currentList[currentIndex];
        dlgImg.src = p.original;
        dlgTitle.textContent = "";
        dlgDownload.href = p.original;
        dlgDownload.download = (p.title || p.id || "photo") + ".jpg";
      }

      function openDialog(p) {
        // When opening, use current filtered order.
        currentList = all.photos.filter((x) => active === "All photos" ? true : x.category === active);
        currentIndex = Math.max(0, currentList.findIndex((x) => x.id === p.id));
        showAt(currentIndex);
        dlg.showModal();
      }

      dlgClose.addEventListener("click", () => dlg.close());
      dlg.addEventListener("click", (e) => {
        const r = dlg.getBoundingClientRect();
        const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (!inside) dlg.close();
      });
      navPrev.addEventListener("click", () => showAt(currentIndex - 1));
      navNext.addEventListener("click", () => showAt(currentIndex + 1));
      window.addEventListener("keydown", (e) => {
        if (!dlg.open) return;
        if (e.key === "ArrowLeft") { e.preventDefault(); showAt(currentIndex - 1); }
        if (e.key === "ArrowRight") { e.preventDefault(); showAt(currentIndex + 1); }
        if (e.key === "Escape") { dlg.close(); }
      });

      function renderTabs(categories) {
        tabsEl.innerHTML = "";
        const counts = new Map();
        for (const p of (all?.photos || [])) counts.set(p.category, (counts.get(p.category) || 0) + 1);
        const allCount = (all?.photos || []).length;
        const allCats = ["All photos", ...categories];
        for (const c of allCats) {
          const count = c === "All photos" ? allCount : (counts.get(c) || 0);
          const b = document.createElement("button");
          b.className = "tab";
          b.type = "button";
          b.dataset.cat = c;
          b.textContent = \`\${c} (\${count})\`;
          b.setAttribute("aria-pressed", c === active ? "true" : "false");
          b.addEventListener("click", () => setActive(c));
          tabsEl.appendChild(b);
        }
      }

      function renderPager(total) {
        const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        if (page >= pages) page = 0;
        const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
        const end = Math.min(total, (page + 1) * PAGE_SIZE);
        const text = total === 0 ? "0 photos" : \`Showing \${start}-\${end} of \${total} · Page \${page + 1}/\${pages}\`;
        pagerInfoDesktop.textContent = text;
        pagerInfoMobile.textContent = text;
        const atStart = page <= 0;
        const atEnd = page >= pages - 1 || total === 0;
        pagerPrevDesktop.disabled = atStart;
        pagerNextDesktop.disabled = atEnd;
        pagerPrevMobile.disabled = atStart;
        pagerNextMobile.disabled = atEnd;
      }

      function goPage(delta) {
        if (!all) return;
        const total = all.photos.filter((p) => active === "All photos" ? true : p.category === active).length;
        const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        page = Math.min(Math.max(0, page + delta), pages - 1);
        renderGrid();
        if (!dlg.open) {
          gridEl.scrollIntoView({ block: "start", behavior: "smooth" });
        }
      }

      pagerPrevDesktop.addEventListener("click", () => goPage(-1));
      pagerNextDesktop.addEventListener("click", () => goPage(1));
      pagerPrevMobile.addEventListener("click", () => goPage(-1));
      pagerNextMobile.addEventListener("click", () => goPage(1));

      function renderGrid() {
        if (!all) return;
        const photos = all.photos.filter((p) => active === "All photos" ? true : p.category === active);
        renderPager(photos.length);
        const slice = photos.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
        gridEl.innerHTML = "";
        for (const p of slice) {
          const card = document.createElement("div");
          card.className = "card " + (p.is_portrait ? "portrait" : "landscape");
          const img = document.createElement("img");
          img.loading = "lazy";
          img.decoding = "async";
          img.src = p.thumb;
          img.alt = "";
          img.addEventListener("click", () => openDialog(p));
          const hint = document.createElement("div");
          hint.className = "zoomhint";
          hint.setAttribute("aria-hidden", "true");
          hint.textContent = "🔍";
          const cap = document.createElement("div");
          cap.className = "cap";
          const a = document.createElement("a");
          a.className = "btn";
          a.href = p.original;
          a.download = (p.title || p.id || "photo") + ".jpg";
          a.innerHTML = \`
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3v10m0 0l4-4m-4 4l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M4 17v3h16v-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Download</span>
          \`;
          cap.appendChild(a);
          card.appendChild(img);
          card.appendChild(hint);
          card.appendChild(cap);
          gridEl.appendChild(card);
        }
      }

      async function main() {
        const res = await fetch("./photos.json", { cache: "no-cache" });
        all = await res.json();
        renderTabs(all.categories || []);
        setActive("All photos");
      }
      main().catch((e) => {
        console.error(e);
      });
    </script>
  </body>
</html>`;
}

function main() {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  const photos = mustReadJson(path.join(PUBLIC_DIR, "photos.json"));
  const title = process.env.SITE_TITLE || "Reimagine 2026 Photo";
  fs.writeFileSync(INDEX_HTML, renderIndex({ title }), "utf8");
  console.log(`Built public/index.html (photos=${photos.photos?.length || 0})`);
}

main();

