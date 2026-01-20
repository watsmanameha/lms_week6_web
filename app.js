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

    // If no word parameter, return HTML page
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

    // Translate word using Puppeteer and Google Translate
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      });

      const page = await browser.newPage();

      // Go to Google Translate
      const url = 'https://translate.google.com/?sl=ru&tl=en&text=' + encodeURIComponent(word) + '&op=translate';
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

      // Wait for translation
      await page.waitForSelector('span[lang="en"]', { timeout: 10000 });
      await new Promise(r => setTimeout(r, 1000));

      // Get translation - look for the first child span with only the translation
      const translation = await page.evaluate(() => {
        const spans = document.querySelectorAll('span[lang="en"] span');
        for (const span of spans) {
          const text = span.textContent?.trim();
          if (text && /^[A-Za-z]+$/.test(text)) {
            return text;
          }
        }
        // Fallback: extract first word from lang="en" span
        const langSpans = document.querySelectorAll('span[lang="en"]');
        for (const span of langSpans) {
          const text = span.textContent?.trim();
          if (text) {
            const match = text.match(/^([A-Za-z]+)/);
            if (match) return match[1];
          }
        }
        return '';
      });

      res.set(TEXT_PLAIN_HEADER).send(translation || '');
    } catch (error) {
      res.status(500).send('Error: ' + error.message);
    } finally {
      if (browser) await browser.close();
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
