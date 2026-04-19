import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { loadDotEnv, mustGetEnv } from "./env.js";
import { larkApi } from "./lark.js";

loadDotEnv();

const BITABLE_APP_TOKEN = mustGetEnv("BITABLE_APP_TOKEN");
const BITABLE_TABLE_ID = mustGetEnv("BITABLE_TABLE_ID");
const PHOTO_FIELD = mustGetEnv("BITABLE_PHOTO_FIELD");
const CATEGORY_FIELD = mustGetEnv("BITABLE_CATEGORY_FIELD");
const CATEGORIES = (process.env.CATEGORIES || "Foyer,First session,Room 1,Room 2")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const OUT_PUBLIC_DIR = path.resolve(process.cwd(), "public");
const OUT_ORIGINAL_DIR = path.join(OUT_PUBLIC_DIR, "photos", "original");
const OUT_THUMB_DIR = path.join(OUT_PUBLIC_DIR, "photos", "thumb");
const OUT_META_DIR = path.resolve(process.cwd(), ".cache");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function safeExtFromName(name = "") {
  const ext = path.extname(name).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic"].includes(ext)) return ext === ".jpeg" ? ".jpg" : ext;
  return "";
}

function sha1(s) {
  return crypto.createHash("sha1").update(s).digest("hex");
}

async function listAllRecords() {
  const records = [];
  let pageToken = undefined;
  for (;;) {
    const { json } = await larkApi(
      `/open-apis/bitable/v1/apps/${BITABLE_APP_TOKEN}/tables/${BITABLE_TABLE_ID}/records/search`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        query: { page_token: pageToken, page_size: 500 },
        body: JSON.stringify({})
      }
    );

    const items = json?.data?.items || [];
    for (const r of items) records.push(r);

    pageToken = json?.data?.page_token;
    if (!pageToken) break;
  }
  return records;
}

async function downloadMedia(fileToken, destPath) {
  const { res } = await larkApi(`/open-apis/drive/v1/medias/${encodeURIComponent(fileToken)}/download`);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Download media failed: http=${res.status} ${txt}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
}

async function makeThumb(originalPath, thumbPath) {
  await sharp(originalPath)
    .rotate()
    .resize({ width: 960, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toFile(thumbPath);
}

function pickCategory(fields) {
  const raw = fields?.[CATEGORY_FIELD];
  const val = Array.isArray(raw) ? raw[0] : raw;
  const text =
    typeof val === "string"
      ? val
      : val && typeof val === "object" && typeof val.text === "string"
        ? val.text
        : "";
  const trimmed = text.trim();
  if (!trimmed) return null;
  return CATEGORIES.includes(trimmed) ? trimmed : null;
}

function getFirstAttachment(fields) {
  const v = fields?.[PHOTO_FIELD];
  if (!v) return null;
  const list = Array.isArray(v) ? v : [v];
  const first = list[0];
  if (!first?.file_token) return null;
  return first;
}

async function main() {
  ensureDir(OUT_ORIGINAL_DIR);
  ensureDir(OUT_THUMB_DIR);
  ensureDir(OUT_META_DIR);

  const records = await listAllRecords();

  const out = {
    generated_at: new Date().toISOString(),
    categories: [...CATEGORIES],
    photos: []
  };

  for (const r of records) {
    const recordId = r?.record_id;
    const fields = r?.fields || {};
    const attachment = getFirstAttachment(fields);
    if (!recordId || !attachment) continue;
    const category = pickCategory(fields);
    if (!category) continue;

    const fileToken = attachment.file_token;
    const ext = safeExtFromName(attachment.name) || ".jpg";
    const stableId = sha1(`${recordId}:${fileToken}`);
    const originalRel = `photos/original/${stableId}${ext}`;
    const thumbRel = `photos/thumb/${stableId}.jpg`;
    const originalAbs = path.join(OUT_PUBLIC_DIR, originalRel);
    const thumbAbs = path.join(OUT_PUBLIC_DIR, thumbRel);

    if (!fs.existsSync(originalAbs)) {
      await downloadMedia(fileToken, originalAbs);
    }
    if (!fs.existsSync(thumbAbs)) {
      await makeThumb(originalAbs, thumbAbs);
    }
    const meta = await sharp(originalAbs).metadata();
    const width = typeof meta.width === "number" ? meta.width : null;
    const height = typeof meta.height === "number" ? meta.height : null;
    const isPortrait = !!(width && height && height > width);

    out.photos.push({
      id: stableId,
      category,
      title: fields?.title || fields?.Title || attachment.name || "",
      original: `/${originalRel}`,
      thumb: `/${thumbRel}`,
      width,
      height,
      is_portrait: isPortrait,
      record_id: recordId
    });
  }

  out.photos.sort(
    (a, b) =>
      (a.category || "").localeCompare(b.category || "") || (a.title || "").localeCompare(b.title || "")
  );

  fs.writeFileSync(path.join(OUT_PUBLIC_DIR, "photos.json"), JSON.stringify(out, null, 2), "utf8");
  fs.writeFileSync(path.join(OUT_META_DIR, "records.raw.json"), JSON.stringify(records, null, 2), "utf8");

  console.log(`Fetched ${out.photos.length} photos. Output: public/photos.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

