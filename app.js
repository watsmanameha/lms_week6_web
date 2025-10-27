export default function initApp(express, bodyParser, createReadStream, crypto, http) {
    if (typeof express !== 'function') throw new TypeError('express must be a function');
    if (!bodyParser || typeof bodyParser.json !== 'function') throw new TypeError('bodyParser is required');
    if (typeof createReadStream !== 'function') throw new TypeError('createReadStream must be a function');
    if (!crypto || typeof crypto.createHash !== 'function') throw new TypeError('crypto is required');
    if (!http || typeof http.get !== 'function') throw new TypeError('http is required');

    const LOGIN = 'c23defe5-07d3-4de0-b01a-32c82d7fcfc1';

    const app = express();
    app.disable('x-powered-by');

    app.use((req, res, next) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS,DELETE');
        if (req.method === 'OPTIONS') return res.status(204).end();
        if (req.path !== '/' && !req.path.endsWith('/')) {
            const q = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
            return res.redirect(308, req.path + '/' + q);
        }
        next();
    });

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.text({ type: '*/*' }));

    app.get('/login/', (req, res) => {
        res.type('text/plain; charset=utf-8').send(LOGIN);
    });

    app.get('/code/', (req, res) => {
        const p = import.meta.url.substring(7);
        res.type('text/plain; charset=utf-8');
        const s = createReadStream(p);
        s.on('error', () => res.status(500).send('cannot read app.js'));
        s.pipe(res);
    });

    app.get('/sha1/:input/', (req, res) => {
        const hash = crypto.createHash('sha1').update(String(req.params.input)).digest('hex');
        res.type('text/plain; charset=utf-8').send(hash);
    });

    const reqHandler = (req, res) => {
        const addr = req.method === 'POST'
            ? (typeof req.body === 'string' ? req.body : req.body && req.body.addr)
            : req.query.addr;
        if (!addr || typeof addr !== 'string') return res.status(400).type('text/plain; charset=utf-8').send('addr is required');
        const upstream = http.get(addr, up => {
            res.status(up.statusCode || 200).type('text/plain; charset=utf-8');
            up.on('error', () => res.status(502).type('text/plain; charset=utf-8').send('upstream error'));
            up.pipe(res);
        });
        upstream.on('error', () => res.status(502).type('text/plain; charset=utf-8').send('bad addr or upstream unreachable'));
    };
    app.get('/req/', reqHandler);
    app.post('/req/', reqHandler);

    app.all(/.*/, (req, res) => {
        res.type('text/plain; charset=utf-8').send(LOGIN);
    });

    return app;
}

export { initApp as createApp };
