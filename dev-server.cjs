// Local preview server. Only application assets are served, never repository
// configuration, credentials, source documents, or arbitrary filesystem paths.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const port = Number(process.env.QUICKBOX_PORT || 5174);
const mediaRoot = process.env.QUICKBOX_MEDIA_ROOT && fs.realpathSync(process.env.QUICKBOX_MEDIA_ROOT);
const files = new Set(['index.html', 'app.js', 'styles.css', 'document-model.js', 'export-runtime.js', 'checks/output/review-export.html']);
const mime = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif', '.webp':'image/webp', '.avif':'image/avif', '.svg':'image/svg+xml'};
function within(base, target) {
  const relative = path.relative(base, target);
  return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
}
http.createServer((req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let base = root, target;
    if (pathname.startsWith('/@fs/') && mediaRoot) {
      base = mediaRoot;
      target = path.resolve(pathname.slice(5));
    } else {
      const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
      if (!files.has(relative) && !/^(?:media|palettes)\//.test(relative)) throw new Error('Not an application asset');
      base = relative.startsWith('media/') ? path.join(root, 'media') : relative.startsWith('palettes/') ? path.join(root, 'palettes') : root;
      target = path.resolve(root, relative);
    }
    if (!within(base, target)) throw new Error('Outside asset directory');
    target = fs.realpathSync(target);
    if (!within(fs.realpathSync(base), target) || !fs.statSync(target).isFile()) throw new Error('Outside asset directory');
    const type = mime[path.extname(target).toLowerCase()];
    if (!type) throw new Error('Unsupported asset');
    res.writeHead(200, {'Content-Type':type + (type.startsWith('text/') || type === 'application/json' ? '; charset=utf-8' : ''), 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'});
    if (req.method === 'HEAD') res.end(); else fs.createReadStream(target).pipe(res);
  } catch {
    res.writeHead(404, {'Content-Type':'text/plain'}); res.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`QuickBox: http://127.0.0.1:${port}\nExternal media: ${mediaRoot || 'disabled (using project media/)'}`));
