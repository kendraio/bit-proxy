const app =  require('express')();
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const url = require('url');

const BIT_API_KEY = process.env.BIT_API_KEY;

app.use(cors());

app.use('/', createProxyMiddleware({
  target: 'https://partnerapi.artists.bandsintown.com',
  changeOrigin: true,
  onProxyReq(proxyReq) {
    const parsed = url.parse(proxyReq.path, true);
    parsed.query['x-api-key'] = BIT_API_KEY;
    proxyReq.path = url.format({pathname: parsed.pathname, query: parsed.query});
  },
  onError(err, req, res) {
    res.writeHead(500, {
      'Content-Type': 'text/plain',
    });
    res.end('Something went wrong: ' + err.message);
  },
  selfHandleResponse: true,
  onProxyRes(proxyRes, req, res) {
    return new Promise((resolve) => {
      const body = [];
      proxyRes.on('data', (chunk) => {
        body.push(chunk);
      });
      proxyRes.on('end', () => {
        const data = Buffer.concat(body).toString().replace(BIT_API_KEY, '');
        res.writeHead(proxyRes.statusCode, {
          'content-type': 'application/json'
        });
        res.end(data);
        resolve();
      });
    })
  },
}));

app.listen(process.env.PORT || 3000);
