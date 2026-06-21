const http = require("node:http");
const https = require("node:https");
const fs = require("node:fs/promises");
const path = require("node:path");
const port = Number(process.env.PORT || 8787);
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const secret = process.env.FEEDBACK_SECRET;
const logFile = "/var/log/onliner-feedback/feedback.jsonl";
const send = (response, status, data) => {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  response.end(JSON.stringify(data));
};
const read = (request) =>
  new Promise((resolve, reject) => {
    let data = "";
    request.on("data", (chunk) => {
      data += chunk;
      if (data.length > 64 * 1024) request.destroy();
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
const message = {
  build(data) {
    return [
      `Feedback`,
      `URL: ${data.url || "-"}`,
      `Context: ${data.context || "-"}`,
      `Message: ${data.message || "-"}`,
    ].join("\n");
  },
  send(text) {
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
          response.on("end", () => resolve(parse(data)));
        },
      );
      request.on("error", reject);
      request.write(body);
      request.end();
    });
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
  const url = new URL(request.url, "http://127.0.0.1");
  if (url.pathname !== "/feedback") {
    return send(response, 404, { ok: false, error: "not_found" });
  }
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    });
    return response.end();
  }
  if (request.method !== "POST") {
    return send(response, 404, { ok: false, error: "not_found" });
  }
  if (!token || !chatId) {
    return send(response, 500, { ok: false, error: "missing_env" });
  }
  const body = await read(request);
  const data = parse(body);
  if (!data) {
    send(response, 400, { ok: false, error: "bad_json" });
    return;
  }
  await log.write(data);
  const result = await message.send(message.build(data));
  if (!result || !result.ok) {
    send(response, 502, {
      ok: false,
      error: "telegram_failed",
      details: result,
    });
    return;
  }
  send(response, 200, { ok: true });
});
server.listen(port, "127.0.0.1", () => {
  console.log(`feedback server listening on ${port}`);
});
