const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,OPTIONS,DELETE",
  "Access-Control-Allow-Headers": "*"
};
const TEXT = { "Content-Type": "text/plain; charset=utf-8" };
const LOGIN = "c23defe5-07d3-4de0-b01a-32c82d7fcfc1";

function readFileAsync(p, createReadStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const s = createReadStream(p);
    s.on("data", c => chunks.push(c));
    s.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    s.on("error", reject);
  });
}

function proxyGet(addr, http) {
  return new Promise((resolve, reject) => {
    const rq = http.get(addr, up => {
      const chunks = [];
      up.on("data", c => chunks.push(c));
      up.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      up.on("error", reject);
    });
    rq.on("error", reject);
  });
}

export function createApp(express, bodyParser, createReadStream, crypto, http) {
  const app = express();
  app.disable("x-powered-by");
  app.set("etag", false);

  app.use((req, res, next) => {
    res.set(CORS);
    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.path !== "/" && !req.path.endsWith("/")) {
      const q = req.url.slice(req.path.length);
      return res.redirect(308, req.path + "/" + q);
    }
    next();
  });

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(bodyParser.text({ type: "*/*" }));

  app.get("/login/", (req, res) => {
    res.set(TEXT).set("Cache-Control", "no-store").status(200).send(LOGIN);
  });

  app.get("/code/", async (req, res) => {
    const isWin = typeof process !== "undefined" && process.platform === "win32";
    const p = isWin ? import.meta.url.substring(8) : import.meta.url.substring(7);
    try {
      const src = await readFileAsync(p, createReadStream);
      res.set(TEXT).status(200).send(src);
    } catch {
      res.set(TEXT).status(500).send("cannot read app.js");
    }
  });

  app.get("/sha1/:input/", (req, res) => {
    const hash = crypto.createHash("sha1").update(String(req.params.input)).digest("hex");
    res.set(TEXT).status(200).send(hash);
    });

  const reqHandler = async (req, res) => {
    const addr = req.method === "POST" ? (typeof req.body === "string" ? req.body : req.body?.addr) : req.query?.addr;
    if (!addr || typeof addr !== "string") return res.status(400).set(TEXT).send("addr is required");
    try {
      const data = await proxyGet(addr, http);
      res.set(TEXT).status(200).send(data);
    } catch (e) {
      res.set(TEXT).status(502).send(String(e));
    }
  };
  app.get("/req/", reqHandler);
  app.post("/req/", reqHandler);

  app.all(/.*/, (req, res) => {
    res.set(TEXT).status(200).send(LOGIN);
  });

  return app;
}
