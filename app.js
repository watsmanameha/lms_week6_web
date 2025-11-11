export default function (express, bodyParser, createReadStream, crypto, http, mongoose, pug, httpProxy) {
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

  app.post("/render/", (req, res) => {
    const addr = req.query.addr;
    const data = req.body;

    if (!addr) {
      return res.status(400).send("addr query parameter required");
    }

    fetchUrl(addr, (err, response) => {
      if (err) return res.status(500).send(String(err));

      let templateStr = "";
      response.on("data", (chunk) => {
        templateStr += chunk;
      });

      response.on("end", () => {
        try {
          const compiledFunction = pug.compile(templateStr);
          const html = compiledFunction(data);
          res.send(html);
        } catch (error) {
          res.status(500).send(String(error));
        }
      });

      response.on("error", (error) => {
        res.status(500).send(String(error));
      });
    });
  });

  const wordpressUrl = process.env.WORDPRESS_URL || "http://localhost:8080";

  // Check if using WordPress.com public API
  const isWordPressCom = wordpressUrl.includes('public-api.wordpress.com');

  if (isWordPressCom) {
    // For WordPress.com, extract the base URL and site slug
    // Format: https://public-api.wordpress.com/wp/v2/sites/SITE_NAME
    const match = wordpressUrl.match(/https:\/\/public-api\.wordpress\.com\/wp\/v2\/sites\/([^\/]+)/);
    if (match) {
      const siteName = match[1];
      const realPostId = process.env.WORDPRESS_POST_ID || "3";

      app.use("/wordpress", httpProxy({
        target: "https://public-api.wordpress.com",
        changeOrigin: true,
        pathRewrite: (path) => {
          // Transform /wordpress/wp-json/wp/v2/posts/1
          // to /wp/v2/sites/SITE_NAME/posts/REAL_POST_ID
          let newPath = path
            .replace(/^\/wordpress\/wp-json/, '')
            .replace(/^\/wordpress/, '');

          // If requesting post with ID 1, redirect to actual post ID
          newPath = newPath.replace(/\/posts\/1(\/|$)/, `/posts/${realPostId}$1`);

          return `/wp/v2/sites/${siteName}${newPath}`;
        },
        onError: (err, _req, res) => {
          res.status(500).send(`Proxy error: ${err.message}`);
        }
      }));
    }
  } else {
    // For self-hosted WordPress
    app.use("/wordpress", httpProxy({
      target: wordpressUrl,
      changeOrigin: true,
      pathRewrite: {
        "^/wordpress": ""
      },
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader("X-Forwarded-Prefix", "/wordpress");
      },
      onError: (err, _req, res) => {
        res.status(500).send(`Proxy error: ${err.message}`);
      }
    }));
  }

  app.use((_req, res) => {
    res.set(TEXT_PLAIN_HEADER).send(SYSTEM_LOGIN);
  });

  return app;
}