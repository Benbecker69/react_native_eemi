#!/usr/bin/env node
"use strict";

/**
 * Allow-list gateway for the mobile app's tunnel (see CLAUDE.md § Backend,
 * § Pièges, and .claude/PLAN.md Phase 2).
 *
 * ngrok exposes THIS process to the public internet, not the Next.js server
 * directly — so only /api/mobile/v1/* ever leaves the LAN. The website and
 * the admin back-office (demo accounts, password `demo1234`) stay
 * unreachable through the tunnel, even though the same Next.js process
 * serves them on the same port. No dependency: Node's built-in `http` only.
 *
 * Usage:
 *   node tools/api-gateway/server.js
 *   UPSTREAM=http://127.0.0.1:3100 node tools/api-gateway/server.js   (demo day, `next start`)
 *
 * Default upstream targets the IPv6 loopback: on this machine another,
 * unrelated project's server occupies 127.0.0.1:3000 (IPv4), while the
 * Next.js dev server answers on [::1]:3000 — verified in CLAUDE.md.
 */

const http = require("node:http");

const PORT = Number(process.env.GATEWAY_PORT || 3200);
const UPSTREAM = process.env.UPSTREAM || "http://[::1]:3000";
const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH"]);
const ALLOWED_PREFIX = "/api/mobile/v1/";
const MAX_BODY_BYTES = 1_000_000; // 1 MB — generous for the JSON bodies this API expects

// Hop-by-hop headers (RFC 7230 §6.1) plus `host`/`content-length`, which must
// be recomputed for the upstream request rather than copied from the tunnel.
const STRIP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
]);
const STRIP_RESPONSE_HEADERS = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "content-length",
]);

const upstreamUrl = new URL(UPSTREAM);

/**
 * True only for the exact allow-listed prefix, on a path Node has already
 * parsed as a normal (non-traversal) path. `URL` resolves `..` segments
 * itself when constructing `requestUrl`, but a literal `..` surviving into
 * `pathname` (e.g. a raw `%2e%2e` some client sent) is rejected outright
 * rather than trusted to resolve harmlessly.
 */
function isAllowedPath(pathname) {
  if (pathname.includes("..")) return false;
  return pathname === ALLOWED_PREFIX.slice(0, -1) || pathname.startsWith(ALLOWED_PREFIX);
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  let requestUrl;
  try {
    requestUrl = new URL(req.url, "http://gateway.local");
  } catch {
    return sendJson(res, 400, { error: { code: "BAD_REQUEST", message: "Invalid URL." } });
  }

  if (!ALLOWED_METHODS.has(req.method) || !isAllowedPath(requestUrl.pathname)) {
    return sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Not found." } });
  }

  const chunks = [];
  let size = 0;
  let rejected = false;

  req.on("data", (chunk) => {
    if (rejected) return;
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      rejected = true;
      sendJson(res, 413, { error: { code: "PAYLOAD_TOO_LARGE", message: "Request body too large." } });
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on("end", () => {
    if (rejected) return;
    const body = Buffer.concat(chunks);

    const forwardHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (!STRIP_REQUEST_HEADERS.has(key.toLowerCase())) forwardHeaders[key] = value;
    }
    forwardHeaders.host = upstreamUrl.host;
    if (body.length > 0) forwardHeaders["content-length"] = String(body.length);

    const upstreamReq = http.request(
      {
        hostname: upstreamUrl.hostname,
        port: upstreamUrl.port,
        path: requestUrl.pathname + requestUrl.search,
        method: req.method,
        headers: forwardHeaders,
      },
      (upstreamRes) => {
        const responseHeaders = {};
        for (const [key, value] of Object.entries(upstreamRes.headers)) {
          if (!STRIP_RESPONSE_HEADERS.has(key.toLowerCase())) responseHeaders[key] = value;
        }
        res.writeHead(upstreamRes.statusCode || 502, responseHeaders);
        upstreamRes.pipe(res);
      },
    );

    upstreamReq.on("error", (error) => {
      console.error("[api-gateway] upstream error:", error.message);
      if (!res.headersSent) {
        sendJson(res, 502, { error: { code: "BAD_GATEWAY", message: "Backend unreachable." } });
      } else {
        res.destroy();
      }
    });

    upstreamReq.end(body.length > 0 ? body : undefined);
  });

  req.on("error", () => {
    if (!res.headersSent) sendJson(res, 400, { error: { code: "BAD_REQUEST", message: "Request error." } });
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[api-gateway] listening on http://127.0.0.1:${PORT}`);
  console.log(
    `[api-gateway] forwarding ${ALLOWED_PREFIX}* (${[...ALLOWED_METHODS].join("/")}) to ${UPSTREAM}`,
  );
  console.log("[api-gateway] everything else — including the website and /admin — returns 404");
});
