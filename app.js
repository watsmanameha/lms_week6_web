export default function (express, bodyParser, createReadStream, crypto, http, mongoose) {
  const app = express();

  const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,OPTIONS,DELETE",
    "Access-Control-Allow-Headers": "*",
  };

  const TEXT_PLAIN_HEADER = {
    "Content-Type": "text/plain; charset=utf-8",
  };

  const SYSTEM_LOGIN = "c23defe5-07d3-4de0-b01a-32c82d7fcfc1";

  const userSchema = new mongoose.Schema({
    login: String,
    password: String
  });

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.use((req, res, next) => {
    res.set(CORS_HEADERS);
    if (req.method === "OPTIONS") return res.sendStatus(204);
    const path = req.path;
    if (!path.endsWith("/") && !path.includes(".")) {
      const query = req.url.slice(path.length);
      return res.redirect(301, path + "/" + query);
    }
    next();
  });

  app.all("/login/", (_req, res) => {
    res.set(TEXT_PLAIN_HEADER).send(SYSTEM_LOGIN);
  });

  app.all("/code/", (req, res) => {
    const filePath = import.meta.url.substring(7);
    res.set(TEXT_PLAIN_HEADER);
    const stream = createReadStream(filePath);
    stream.on("error", () => res.status(500).end());
    stream.pipe(res);
  });

  app.all("/sha1/:input/", (req, res) => {
    const hash = crypto.createHash("sha1").update(String(req.params.input)).digest("hex");
    res.set(TEXT_PLAIN_HEADER).send(hash);
  });

  function fetchUrl(addr, cb) {
    try {
      http.get(addr, (response) => cb(null, response)).on("error", cb);
    } catch (err) {
      cb(err);
    }
  }

  app.get("/req/", (req, res) => {
    const addr = req.query.addr;
    if (!addr) return res.status(400).send("addr param required");
    fetchUrl(addr, (err, response) => {
      if (err) return res.status(500).send(String(err));
      res.set(TEXT_PLAIN_HEADER);
      response.on("error", () => res.status(500).end());
      response.pipe(res);
    });
  });

  app.post("/req/", (req, res) => {
    const addr = req.body.addr;
    if (!addr) return res.status(400).send("addr param required");
    fetchUrl(addr, (err, response) => {
      if (err) return res.status(500).send(String(err));
      res.set(TEXT_PLAIN_HEADER);
      response.on("error", () => res.status(500).end());
      response.pipe(res);
    });
  });

  app.post("/insert/", async (req, res) => {
    try {
      const { login, password, URL } = req.body;

      if (!login || !password || !URL) {
        return res.status(400).send("login, password and URL parameters required");
      }

      const connection = await mongoose.createConnection(URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

      const User = connection.model('User', userSchema, 'users');

      const user = new User({ login, password });
      await user.save();

      res.set(TEXT_PLAIN_HEADER).send("User inserted successfully");

      await connection.close();
    } catch (err) {
      res.status(500).send(String(err));
    }
  });

  app.use((_req, res) => {
    res.set(TEXT_PLAIN_HEADER).send(SYSTEM_LOGIN);
  });

  return app;
}