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

function renderIndex({ title = "Conference Photos" } = {}) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${htmlEscape(title)}</title>
    <style>
      :root { color-scheme: light; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; background:#0b0d12; color:#e7e9ee; }
      a { color: inherit; }
      .wrap { max-width: 1200px; margin: 0 auto; padding: 20px 14px 56px; }
      .nav { display:flex; align-items:center; justify-content:flex-start; margin-bottom: 10px; }
      .nav a { display:flex; align-items:center; gap:10px; }
      .nav img { height: 27px; width:auto; display:block; }
      .banner {
        width: 100%;
        border-radius: 14px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.04);
      }
      .banner img { width: 100%; height: auto; display: block; }
      .top { display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap; }
      h1 { margin:0; font-size:18px; font-weight:700; letter-spacing: .2px; }
      .layout { display:flex; gap: 14px; margin-top: 14px; align-items:flex-start; }
      .sidebar { width: 220px; flex: 0 0 auto; position: sticky; top: 14px; align-self: flex-start; }
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
        .sidebar { width: 100%; position: static; top: auto; }
        .tabs.vertical { flex-direction: row; flex-wrap: wrap; }
      }
      .card { border-radius: 14px; overflow: hidden; border:1px solid rgba(255,255,255,.10); background: rgba(255,255,255,.04); position: relative; height: 100%; }
      .card.landscape { grid-row: span 1; }
      .card.portrait { grid-row: span 2; }
      .card img { width:100%; height:100%; display:block; background:#111; object-fit: cover; }
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
      dialog { border:1px solid rgba(255,255,255,.18); border-radius: 16px; padding:0; background:#0b0d12; color:#e7e9ee; width:min(92vw, 980px); }
      dialog::backdrop { background: rgba(0,0,0,.72); }
      .dlg-img { width:100%; height:auto; display:block; background:#111; }
      .dlg-bar { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px; border-top:1px solid rgba(255,255,255,.10); }
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
        </div>
        <div class="grid" id="grid"></div>
      </div>
    </div>

    <dialog id="dlg">
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
      const dlg = $("#dlg");
      const dlgImg = $("#dlgImg");
      const dlgTitle = $("#dlgTitle");
      const dlgDownload = $("#dlgDownload");
      const dlgClose = $("#dlgClose");

      let all = null;
      let active = "All photos";

      function setActive(cat) {
        active = cat;
        for (const b of tabsEl.querySelectorAll("button")) {
          b.setAttribute("aria-pressed", b.dataset.cat === cat ? "true" : "false");
        }
        renderGrid();
      }

      function openDialog(p) {
        dlgImg.src = p.original;
        dlgTitle.textContent = "";
        dlgDownload.href = p.original;
        dlgDownload.download = (p.title || p.id || "photo") + ".jpg";
        dlg.showModal();
      }

      dlgClose.addEventListener("click", () => dlg.close());
      dlg.addEventListener("click", (e) => {
        const r = dlg.getBoundingClientRect();
        const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (!inside) dlg.close();
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

      function renderGrid() {
        if (!all) return;
        const photos = all.photos.filter((p) => active === "All photos" ? true : p.category === active);
        gridEl.innerHTML = "";
        for (const p of photos) {
          const card = document.createElement("div");
          card.className = "card " + (p.is_portrait ? "portrait" : "landscape");
          const img = document.createElement("img");
          img.loading = "lazy";
          img.decoding = "async";
          img.src = p.thumb;
          img.alt = "";
          img.addEventListener("click", () => openDialog(p));
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
  const title = process.env.SITE_TITLE || "Conference Photos";
  fs.writeFileSync(INDEX_HTML, renderIndex({ title }), "utf8");
  console.log(`Built public/index.html (photos=${photos.photos?.length || 0})`);
}

main();

