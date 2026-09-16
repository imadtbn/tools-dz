import { readFile, access } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import path from 'node:path';

const errors = [];
const tools = JSON.parse(await readFile('data/tools.json', 'utf8'));
const categories = JSON.parse(await readFile('data/categories.json', 'utf8'));
const procedures = JSON.parse(await readFile('data/procedures/procedures.json', 'utf8'));
const categoryIds = new Set(categories.map(item => item.id));
const toolIds = new Set();
const required = ['id', 'slug', 'name', 'description', 'category', 'url', 'keywords', 'version', 'updatedAt', 'status', 'offlineReady', 'requiresNetwork', 'relatedTools', 'dataSources'];

for (const tool of tools) {
  for (const field of required) if (!(field in tool)) errors.push(`${tool.id || 'unknown'}: missing ${field}`);
  if (toolIds.has(tool.id)) errors.push(`Duplicate tool id: ${tool.id}`);
  toolIds.add(tool.id);
  if (!categoryIds.has(tool.category)) errors.push(`${tool.id}: unknown category ${tool.category}`);
  try { await access(tool.url.replace(/^\//, '')); } catch { errors.push(`${tool.id}: missing page ${tool.url}`); }
}

for (const tool of tools) {
  for (const id of tool.relatedTools) if (!toolIds.has(id)) errors.push(`${tool.id}: unknown related tool ${id}`);
}

for (const procedure of procedures) {
  if (!procedure.sourceUrl.startsWith('https://')) errors.push(`${procedure.id}: source must use HTTPS`);
  for (const id of procedure.relatedTools) if (!toolIds.has(id)) errors.push(`${procedure.id}: unknown related tool ${id}`);
}

const sitemap = await readFile('sitemap.xml', 'utf8');
for (const tool of tools.filter(tool => tool.status === 'active')) {
  if (!sitemap.includes(tool.url)) errors.push(`${tool.id}: missing from sitemap`);
}

for await (const filename of glob('**/*.html', { exclude: ['node_modules/**'] })) {
  const html = await readFile(filename, 'utf8');
  if (!/<html[^>]+lang="ar"[^>]+dir="rtl"/.test(html)) errors.push(`${filename}: missing Arabic RTL root`);
  if (!/<link rel="canonical"/.test(html) && !['404.html', 'offline.html'].includes(filename)) errors.push(`${filename}: missing canonical URL`);
  const refs = [...html.matchAll(/(?:href|src)="([^"#]+)"/g)].map(match => match[1]);
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(ref) || ref.includes('${')) continue;
    const clean = ref.split('?')[0];
    const target = clean.startsWith('/tools-dz/')
      ? clean.replace(/^\/tools-dz\//, '')
      : clean.startsWith('/') ? clean.replace(/^\//, '') : path.normalize(path.join(path.dirname(filename), clean));
    try { await access(target); } catch { errors.push(`${filename}: broken local reference ${ref}`); }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Validated ${tools.length} tools, ${categories.length} categories, ${procedures.length} procedures and all HTML references.`);
