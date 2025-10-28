const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,OPTIONS,DELETE",
  "Access-Control-Allow-Headers": "*",
};

const TEXT_PLAIN_HEADER = { "Content-Type": "text/plain; charset=utf-8" };
const SYSTEM_LOGIN = "c23defe5-07d3-4de0-b01a-32c82d7fcfc1";

function corsMiddleware(req, res, next) {
  res.set(CORS_HEADERS);
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
}

export function createApp(express, bodyParser, createReadStream, crypto, http) {
  const app = express();

  app.disable("x-powered-by");
  app.set("etag", false);

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(corsMiddleware);

  app.get("/login/", (_req, res) => {
    res.set(TEXT_PLAIN_HEADER)
       .set("Cache-Control", "no-store")
       .status(200)
       .send(SYSTEM_LOGIN);
  });

  app.get("/code/", async (_req, res) => {
    const isWin = typeof process !== "undefined" && process.platform === "win32";
    const filePath = isWin ? import.meta.url.substring(8) : import.meta.url.substring(7);
    try {
      const fileContent = await readFileAsync(filePath, createReadStream);
      res.set(TEXT_PLAIN_HEADER).status(200).send(fileContent);
    } catch {
      res.set(TEXT_PLAIN_HEADER).status(500).send("cannot read app.js");
    }
  });

  app.get("/sha1/:input/", (req, res) => {
    const hash = crypto.createHash("sha1").update(String(req.params.input)).digest("hex");
    res.set(TEXT_PLAIN_HEADER).status(200).send(hash);
  });

  const reqHandler = async (req, res) => {
    const addr = req.method === "POST" ? req.body?.addr : req.query?.addr;
    if (!addr) return res.status(400).set(TEXT_PLAIN_HEADER).send("addr is required");
    try {
      const data = await new Promise((resolve, reject) => {
        http.get(addr, up => {
          const chunks = [];
          up.on("data", c => chunks.push(c));
          up.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
          up.on("error", reject);
        }).on("error", reject);
      });
      res.set(TEXT_PLAIN_HEADER).status(200).send(data);
    } catch (e) {
      res.set(TEXT_PLAIN_HEADER).status(502).send(String(e));
    }
  };

  app.get("/req/", reqHandler);
  app.post("/req/", reqHandler);

  app.all(/.*/, (_req, res) => {
    res.set(TEXT_PLAIN_HEADER).status(200).send(SYSTEM_LOGIN);
  });

  return app;
}

function readFileAsync(filePath, createReadStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const stream = createReadStream(filePath);
    stream.on("data", c => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    stream.on("error", reject);
  });
}
