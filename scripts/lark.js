import { loadDotEnv, mustGetEnv } from "./env.js";

loadDotEnv();

const LARK_APP_ID = mustGetEnv("LARK_APP_ID");
const LARK_APP_SECRET = mustGetEnv("LARK_APP_SECRET");

let cachedTenantToken = null;
let cachedTenantTokenExpireAtMs = 0;

export async function getTenantAccessToken() {
  const now = Date.now();
  if (cachedTenantToken && now < cachedTenantTokenExpireAtMs - 60_000) return cachedTenantToken;

  const controller = new AbortController();
  const timeoutMs = Number(process.env.LARK_HTTP_TIMEOUT_MS || 60_000);
  const t = setTimeout(() => controller.abort(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
  const res = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ app_id: LARK_APP_ID, app_secret: LARK_APP_SECRET }),
    signal: controller.signal
  });
  clearTimeout(t);
  const json = await res.json();
  if (!res.ok || json?.code !== 0) {
    throw new Error(`Tenant token error: http=${res.status} body=${JSON.stringify(json)}`);
  }

  cachedTenantToken = json.tenant_access_token;
  cachedTenantTokenExpireAtMs = now + (json.expire || 0) * 1000;
  return cachedTenantToken;
}

export async function larkApi(path, { method = "GET", headers = {}, query, body } = {}) {
  const token = await getTenantAccessToken();
  const url = new URL(`https://open.feishu.cn${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }

  const controller = new AbortController();
  const timeoutMs = Number(process.env.LARK_HTTP_TIMEOUT_MS || 60_000);
  const t = setTimeout(() => controller.abort(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...headers
    },
    body,
    signal: controller.signal
  });
  clearTimeout(t);

  // Some endpoints return binary.
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const json = await res.json();
    if (!res.ok || (json && typeof json.code === "number" && json.code !== 0)) {
      throw new Error(`Lark API error: ${method} ${url} http=${res.status} body=${JSON.stringify(json)}`);
    }
    return { res, json };
  }

  return { res, json: null };
}

