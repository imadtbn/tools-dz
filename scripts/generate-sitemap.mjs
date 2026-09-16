import { readFile, writeFile } from 'node:fs/promises';

const base = 'https://imadtbn.github.io/tools-dz/';
const tools = JSON.parse(await readFile('data/tools.json', 'utf8'));
const staticPages = [
  ['', '1.0'],
  ['pages/tools.html', '0.9'],
  ['pages/categories.html', '0.8'],
  ['pages/procedures.html', '0.9'],
  ['pages/about.html', '0.5'],
  ['pages/contact.html', '0.4'],
  ['pages/privacy.html', '0.3'],
  ['pages/terms.html', '0.3'],
  ['pages/disclaimer.html', '0.3']
];
const entries = [
  ...staticPages,
  ...tools.filter(tool => tool.status === 'active').map(tool => [tool.url.replace(/^\//, ''), tool.featured ? '0.9' : '0.8'])
];
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(([path, priority]) => `  <url>\n    <loc>${base}${path}</loc>\n    <priority>${priority}</priority>\n  </url>`).join('\n')}
</urlset>\n`;
await writeFile('sitemap.xml', xml);
console.log(`Generated sitemap with ${entries.length} URLs.`);
