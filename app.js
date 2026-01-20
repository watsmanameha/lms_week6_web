export default function (express, bodyParser, createReadStream, crypto, http, mongoose, pug, httpProxy, puppeteer, PNG) {
  const app = express();

  const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,OPTIONS,DELETE",
    "Access-Control-Allow-Headers": "*",
  };

  const TEXT_PLAIN_HEADER = {
    "Content-Type": "text/plain; charset=utf-8",
  };

  const SYSTEM_LOGIN = "edzhulaj";

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.use((req, res, next) => {
    res.set(CORS_HEADERS);
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  // Main page - translator
  app.get("/", async (req, res) => {
    const word = req.query.word;

    if (!word) {
      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${SYSTEM_LOGIN}</title>
</head>
<body>
<input type="text" id="inp">
<h1 id="out"></h1>
<script>
const inp = document.getElementById('inp');
const out = document.getElementById('out');
inp.oninput = async function() {
  const w = this.value.trim();
  if (!w) { out.textContent = ''; return; }
  out.textContent = await (await fetch('/?word=' + encodeURIComponent(w))).text();
};
</script>
</body>
</html>`;
      res.set({ "Content-Type": "text/html; charset=utf-8" }).send(html);
      return;
    }

    // Use MyMemory free translation API
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=ru|en`;
      const response = await fetch(url);
      const data = await response.json();
      const translation = data.responseData?.translatedText || '';
      res.set(TEXT_PLAIN_HEADER).send(translation);
    } catch (error) {
      res.status(500).send('Error: ' + error.message);
    }
  });

  app.all("/login/", (_req, res) => {
    res.set(TEXT_PLAIN_HEADER).send(SYSTEM_LOGIN);
  });

  app.use((_req, res) => {
    res.set(TEXT_PLAIN_HEADER).send(SYSTEM_LOGIN);
  });

  return app;
}
