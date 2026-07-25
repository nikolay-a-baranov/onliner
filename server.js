const http = require("node:http");
const https = require("node:https");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const port = Number(process.env.PORT || 8787);
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const secret = process.env.FEEDBACK_SECRET;
const origins = String(process.env.FEEDBACK_ORIGIN || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const logFile = "/var/log/onliner-feedback/feedback.jsonl";
const requestTimeout = 8000;
const retryLimit = 2;
const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const logger = {
  write(event, context = {}) {
    console.error(
      JSON.stringify({
        time: new Date().toISOString(),
        event,
        ...context,
      }),
    );
  },
};
const cors = {
  origin(request) {
    return String(request.headers.origin || "");
  },
  allowed(origin) {
    return !origin || origins.includes(origin);
  },
  headers(origin) {
    if (!origin || !cors.allowed(origin)) return {};
    return {
      "Access-Control-Allow-Origin": origin,
      Vary: "Origin",
    };
  },
};
const send = (response, status, data, origin = "") => {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...cors.headers(origin),
  });
  response.end(JSON.stringify(data));
};
const read = (request) =>
  new Promise((resolve, reject) => {
    let data = "";
    request.on("data", (chunk) => {
      data += chunk;
      if (data.length <= 64 * 1024) return;
      const error = new Error("payload_too_large");
      error.code = "PAYLOAD_TOO_LARGE";
      request.destroy(error);
    });
    request.on("end", () => resolve(data));
    request.on("error", reject);
  });
const parse = (string) => {
  try {
    return JSON.parse(string || "{}");
  } catch {
    return null;
  }
};
const auth = {
  configured() {
    return Boolean(secret);
  },
  valid(request) {
    const value = String(request.headers["x-feedback-secret"] || "");
    if (!secret || !value) return false;
    const expected = Buffer.from(secret);
    const received = Buffer.from(value);
    if (expected.length !== received.length) return false;
    return crypto.timingSafeEqual(expected, received);
  },
};
const message = {
  build(data) {
    return [
      `Feedback`,
      `URL: ${data.url || "-"}`,
      `Context: ${data.context || "-"}`,
      `Message: ${data.message || "-"}`,
    ].join("\n");
  },
  retry(status) {
    return status === 408 || status === 429 || status >= 500;
  },
  delay(response, attempt) {
    const value = Number(response?.headers?.["retry-after"]);
    if (Number.isFinite(value) && value >= 0) {
      return Math.min(value * 1000, 2000);
    }
    return Math.min(250 * 2 ** attempt, 1000);
  },
  request(text) {
    return new Promise((resolve, reject) => {
      const body = new URLSearchParams({
        chat_id: chatId,
        text,
      }).toString();
      const request = https.request(
        {
          hostname: "api.telegram.org",
          path: `/bot${token}/sendMessage`,
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(body),
          },
        },
        (response) => {
          let data = "";
          response.on("data", (chunk) => (data += chunk));
          response.on("end", () =>
            resolve({
              status: response.statusCode || 0,
              headers: response.headers,
              data: parse(data),
            }),
          );
        },
      );
      request.setTimeout(requestTimeout, () => {
        const error = new Error("telegram_timeout");
        error.code = "TELEGRAM_TIMEOUT";
        request.destroy(error);
      });
      request.on("error", reject);
      request.write(body);
      request.end();
    });
  },
  async send(text) {
    for (let attempt = 0; attempt < retryLimit; attempt += 1) {
      try {
        const result = await message.request(text);
        if (!message.retry(result.status) || attempt === retryLimit - 1) {
          return result;
        }
        logger.write("telegram_retry", {
          attempt: attempt + 1,
          status: result.status,
        });
        await wait(message.delay(result, attempt));
      } catch (error) {
        if (attempt === retryLimit - 1) throw error;
        logger.write("telegram_retry", {
          attempt: attempt + 1,
          error: error.code || error.name || "network_error",
        });
        await wait(message.delay(null, attempt));
      }
    }
    return null;
  },
};
const log = {
  build(data) {
    return (
      JSON.stringify({
        time: new Date().toISOString(),
        ...data,
      }) + "\n"
    );
  },
  write(data) {
    return fs
      .mkdir(path.dirname(logFile), { recursive: true })
      .then(() => fs.appendFile(logFile, log.build(data), "utf8"));
  },
};
const server = http.createServer(async (request, response) => {
  const origin = cors.origin(request);
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    if (url.pathname !== "/feedback") {
      return send(response, 404, { ok: false, error: "not_found" }, origin);
    }
    if (!auth.configured()) {
      logger.write("feedback_rejected", { reason: "missing_env" });
      return send(response, 503, { ok: false, error: "missing_env" }, origin);
    }
    if (!cors.allowed(origin)) {
      logger.write("feedback_rejected", { reason: "origin_denied", origin });
      return send(response, 403, { ok: false, error: "origin_denied" });
    }
    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        ...cors.headers(origin),
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Feedback-Secret",
        "Access-Control-Max-Age": "86400",
      });
      return response.end();
    }
    if (request.method !== "POST") {
      return send(response, 404, { ok: false, error: "not_found" }, origin);
    }
    if (!auth.valid(request)) {
      logger.write("feedback_rejected", { reason: "unauthorized", origin });
      return send(response, 401, { ok: false, error: "unauthorized" }, origin);
    }
    if (!token || !chatId) {
      logger.write("feedback_failed", { reason: "missing_telegram_env" });
      return send(response, 500, { ok: false, error: "missing_env" }, origin);
    }
    const body = await read(request);
    const data = parse(body);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return send(response, 400, { ok: false, error: "bad_json" }, origin);
    }
    await log.write(data);
    const result = await message.send(message.build(data));
    if (!result || result.status < 200 || result.status >= 300 || !result.data?.ok) {
      logger.write("feedback_failed", {
        reason: "telegram_failed",
        status: result?.status || 0,
      });
      return send(
        response,
        502,
        { ok: false, error: "telegram_failed" },
        origin,
      );
    }
    return send(response, 200, { ok: true }, origin);
  } catch (error) {
    const payloadTooLarge = error.code === "PAYLOAD_TOO_LARGE";
    logger.write("feedback_failed", {
      reason: payloadTooLarge ? "payload_too_large" : "internal_error",
      error: error.code || error.name || "unknown_error",
    });
    if (response.headersSent) return response.end();
    return send(
      response,
      payloadTooLarge ? 413 : 500,
      {
        ok: false,
        error: payloadTooLarge ? "payload_too_large" : "internal_error",
      },
      origin,
    );
  }
});
server.listen(port, "127.0.0.1", () => {
  console.log(`feedback server listening on ${port}`);
});
