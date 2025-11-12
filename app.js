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

  // Check if using WordPress.com
  const isWordPressCom = wordpressUrl.includes('wordpress.com');

  if (isWordPressCom) {
    // For WordPress.com sites, we need special handling
    // Extract site name from URL like https://edzhulaj.wordpress.com
    const siteMatch = wordpressUrl.match(/https?:\/\/([^.]+)\.wordpress\.com/);
    if (siteMatch) {
      const siteName = siteMatch[1];
      const wpcomSiteUrl = `https://${siteName}.wordpress.com`;
      const realPostId = process.env.WORDPRESS_POST_ID || "7";

      app.use("/wordpress", httpProxy({
        target: wpcomSiteUrl,
        changeOrigin: true,
        pathRewrite: (path) => {
          // Map post ID 1 to actual post ID
          if (path.includes('/posts/1')) {
            const newPath = path.replace(/\/posts\/1(\/|$|\?)/, `/posts/${realPostId}$1`);
            console.log(`[WordPress.com Proxy] Mapping ID: ${path} -> ${newPath}`);
            return newPath.replace(/^\/wordpress/, '');
          }
          return path.replace(/^\/wordpress/, '');
        },
        onProxyReq: (_proxyReq, req) => {
          console.log(`[WordPress.com Proxy] ${req.method} ${req.path}`);
        },
        onProxyRes: (proxyRes, req) => {
          console.log(`[WordPress.com Proxy Response] ${req.path} -> Status: ${proxyRes.statusCode}`);
        },
        onError: (err, req, res) => {
          console.error(`[WordPress.com Proxy Error] ${req.path}: ${err.message}`);
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