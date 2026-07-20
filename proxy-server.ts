const express = require("express");
const cors = require("cors");

type ZentridProxyHeaders = {
  accept?: string;
  authorization?: string;
};

type ZentridProxyRequest = {
  originalUrl: string;
  method: string;
  headers: ZentridProxyHeaders;
  body?: unknown;
};

type ZentridProxyNext = () => void;

type ZentridProxyResponse = {
  json(payload: unknown): void;
  status(code: number): ZentridProxyResponse;
  setHeader(name: string, value: string): void;
  send(payload: string): void;
};

const app = express();
const PORT = process.env.PORT || 5050;
const AUTH_TARGET = process.env.ZENTRID_AUTH_TARGET || "https://fleetosauth.unisys.am";
const DATA_TARGET = process.env.ZENTRID_DATA_TARGET || "https://fleetosapi.unisys.am";
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src-elem 'self'",
  "script-src-attr 'unsafe-inline'",
  "style-src-elem 'self'",
  "style-src-attr 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "connect-src 'self' http://localhost:5050 https://fleetosauth.unisys.am https://fleetosapi.unisys.am",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "manifest-src 'self'"
].join("; ");
const CONTENT_SECURITY_POLICY_REPORT_ONLY = CONTENT_SECURITY_POLICY
  .replace("script-src-attr 'unsafe-inline'", "script-src-attr 'none'")
  .replace("style-src-attr 'unsafe-inline'", "style-src-attr 'none'");

app.use((_req: ZentridProxyRequest, res: ZentridProxyResponse, next: ZentridProxyNext) => {
  res.setHeader("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  res.setHeader("Content-Security-Policy-Report-Only", CONTENT_SECURITY_POLICY_REPORT_ONLY);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  next();
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req: ZentridProxyRequest, res: ZentridProxyResponse) => {
  res.json({ status: "ok", service: "Zentrid local proxy", port: PORT });
});

async function proxyRequest(targetBaseUrl: string, req: ZentridProxyRequest, res: ZentridProxyResponse): Promise<void> {
  try {
    const requestBody = ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body || {});
    const response = await fetch(`${targetBaseUrl}${req.originalUrl}`, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "Accept": req.headers.accept || "application/json",
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
      ...(requestBody !== undefined ? { body: requestBody } : {})
    });

    const text = await response.text();
    res.status(response.status);
    res.setHeader("Content-Type", response.headers.get("content-type") || "application/json");
    res.send(text);
  } catch (error) {
    res.status(500).json({
      message: "Proxy error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

app.use("/api/Auth", (req: ZentridProxyRequest, res: ZentridProxyResponse) => proxyRequest(AUTH_TARGET, req, res));
app.use("/.well-known", (req: ZentridProxyRequest, res: ZentridProxyResponse) => proxyRequest(AUTH_TARGET, req, res));
app.use("/api", (req: ZentridProxyRequest, res: ZentridProxyResponse) => proxyRequest(DATA_TARGET, req, res));

// The compiled proxy lives inside dist, so __dirname is the generated application root.
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Zentrid proxy running on http://localhost:${PORT}`);
  console.log(`Auth API -> ${AUTH_TARGET}`);
  console.log(`Data API -> ${DATA_TARGET}`);
});
