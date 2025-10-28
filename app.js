const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT",
  "Access-Control-Allow-Headers": "*",
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
    response.on("data", (c) => chunks.push(c));
    response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    response.on("error", reject);
  });
}

function fetchUrlData(url, http) {
  return new Promise((resolve, reject) => {
    http.get(url, async (response) => {
      try {
        const data = await readHttpResponse(response);
        resolve(data);
      } catch (e) {
        reject(e);
      }
    }).on("error", reject);
  });
}

export function createApp(express, bodyParser, createReadStream, crypto, http) {
  const app = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(corsMiddleware);

  app.get("/login/", (_req, res) => {
    res.set(TEXT_PLAIN_HEADER).send(SYSTEM_LOGIN);
  });

  app.get("/code/", async (_req, res) => {
    const isWin = typeof process !== "undefined" && process.platform === "win32";
    const filePath = isWin ? import.meta.url.substring(8) : import.meta.url.substring(7);
    try {
      const fileContent = await readFileAsync(filePath, createReadStream);
      res.set(TEXT_PLAIN_HEADER).send(fileContent);
    } catch {
      res.status(500).set(TEXT_PLAIN_HEADER).send("cannot read app.js");
    }
  });

  app.get("/sha1/:input/", (req, res) => {
    const hash = generateSha1Hash(String(req.params.input), crypto);
    res.set(TEXT_PLAIN_HEADER).send(hash);
  });

  const reqHandler = async (req, res) => {
    const addr = req.method === "POST" ? req.body?.addr : req.query?.addr;
    if (!addr) return res.status(400).set(TEXT_PLAIN_HEADER).send("addr is required");
    try {
      const data = await fetchUrlData(addr, http);
      res.set(TEXT_PLAIN_HEADER).send(data);
    } catch (e) {
      res.status(500).set(TEXT_PLAIN_HEADER).send(String(e));
    }
  };

  app.get("/req/", reqHandler);
  app.post("/req/", reqHandler);

  app.all(/.*/, (_req, res) => {
    res.set(TEXT_PLAIN_HEADER).send(SYSTEM_LOGIN);
  });

  return app;
}