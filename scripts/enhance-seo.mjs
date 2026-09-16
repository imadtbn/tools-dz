import { readFile, writeFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';

const site = 'https://imadtbn.github.io/tools-dz/';
let count = 0;

for await (const filename of glob('{index.html,pages/*.html,tools/*.html}')) {
  let html = await readFile(filename, 'utf8');
  const relative = filename === 'index.html' ? '' : filename;
  const url = site + relative;
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1]?.trim()
    || `${title} ضمن منصة Tools DZ للأدوات الرقمية المجانية الموجهة للمستخدم الجزائري.`;
  if (!title) continue;
  if (!/<meta name="description"/.test(html)) html = html.replace('</title>', `</title>\n    <meta name="description" content="${description}">`);

  if (/<meta property="og:title"/.test(html)) {
    html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  } else {
    html = html.replace('<head>', `<head>\n    <meta property="og:title" content="${title}">`);
  }
  if (/<meta property="og:description"/.test(html)) {
    html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
  } else {
    html = html.replace('<head>', `<head>\n    <meta property="og:description" content="${description}">`);
  }
  if (!/<meta property="og:url"/.test(html)) html = html.replace('</title>', `</title>\n    <meta property="og:url" content="${url}">`);
  if (!/<link rel="canonical"/.test(html)) html = html.replace('</title>', `</title>\n    <link rel="canonical" href="${url}">`);
  if (!/<meta name="twitter:card"/.test(html)) html = html.replace('</title>', '</title>\n    <meta name="twitter:card" content="summary">');
  await writeFile(filename, html);
  count += 1;
}
console.log(`Updated SEO metadata in ${count} HTML files.`);
