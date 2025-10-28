const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,OPTIONS,DELETE",
  "Access-Control-Allow-Headers": "*"
};

const TEXT_PLAIN_HEADER = { "Content-Type": "text/plain; charset=utf-8" };
const SYSTEM_LOGIN = "c23defe5-07d3-4de0-b01a-32c82d7fcfc1";

function corsMiddleware(req, res, next) {
  res.set(CORS_HEADERS);
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
}

function readFileAsync(filePath, createReadStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    stream.on("error", reject);
  });
}

function generateSha1Hash(text, crypto) {
  return crypto.createHash("sha1").update(text).digest("hex");
}

function readHttpResponse(response) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    response.on("data", (chunk) => chunks.push(chunk));
    response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    response.on("error", reject);
  });
}

async function fetchUrlData(url, http) {
  return new Promise((resolve, reject) => {
    http.get(url, async (response) => {
      try {
        const data = await readHttpResponse(response);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    }).on("error", reject);
  });
}

function createApp(express, bodyParser, createReadStream, crypto, http, currentFilePath) {
  const app = express();
  app.disable("x-powered-by");
  app.set("etag", false);

  app.use(corsMiddleware);
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(bodyParser.text({ type: "*/*" }));

  app.get("/login/", (_req, res) => {
    res.set(TEXT_PLAIN_HEADER).set("Cache-Control", "no-store").status(200).send(SYSTEM_LOGIN);
  });

  app.get("/code/", async (_req, res) => {
    try {
      const fileContent = await readFileAsync(currentFilePath, createReadStream);
      res.set(TEXT_PLAIN_HEADER).status(200).send(fileContent);
    } catch {
      res.set(TEXT_PLAIN_HEADER).status(500).send("cannot read app.js");
    }
  });

  app.get("/sha1/:input/", (req, res) => {
    const hash = generateSha1Hash(String(req.params.input), crypto);
    res.set(TEXT_PLAIN_HEADER).status(200).send(hash);
  });

  const reqHandler = async (req, res) => {
    const addr = req.method === "POST"
      ? (typeof req.body === "string" ? req.body : req.body && req.body.addr)
      : req.query && req.query.addr;

    if (!addr || typeof addr !== "string")
      return res.status(400).set(TEXT_PLAIN_HEADER).send("addr is required");

    try {
      const data = await fetchUrlData(addr, http);
      res.set(TEXT_PLAIN_HEADER).status(200).send(data);
    } catch (err) {
      res.set(TEXT_PLAIN_HEADER).status(502).send(String(err));
    }
  };

  app.get("/req", reqHandler);
  app.get("/req/", reqHandler);
  app.post("/req", reqHandler);
  app.post("/req/", reqHandler);

  app.all(/.*/, (_req, res) => {
    res.set(TEXT_PLAIN_HEADER).status(200).send(SYSTEM_LOGIN);
  });

  return app;
}

module.exports = { createApp, SYSTEM_LOGIN };
