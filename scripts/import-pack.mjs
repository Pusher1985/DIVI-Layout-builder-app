import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value ?? ''];
  })
);

const sourceDir = path.resolve(process.cwd(), args.source || 'incoming-pack');
const packId = args.id || `pack-${crypto.randomUUID().slice(0, 8)}`;
const packName = args.name || packId;
const packDescription = args.description || 'Imported pack';
const packTags = args.tags ? args.tags.split(',').map((s) => s.trim()).filter(Boolean) : ['imported'];

const packsRoot = path.resolve(process.cwd(), 'src/assets/packs');
const targetPackDir = path.join(packsRoot, packId);

const ensureDir = (dir) => fs.mkdir(dir, { recursive: true });

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

const writeJson = async (filePath, payload) => {
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item';

const detectType = (json) => {
  if (json?.kind === 'module' || typeof json?.module_type === 'string') return 'module';
  if (json?.kind === 'section' || Array.isArray(json?.rows)) return 'section';
  return 'unknown';
};

const run = async () => {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const jsonFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json'));

  if (jsonFiles.length === 0) {
    throw new Error(`No JSON files found in ${sourceDir}`);
  }

  await ensureDir(path.join(targetPackDir, 'sections'));
  await ensureDir(path.join(targetPackDir, 'modules'));

  for (const file of jsonFiles) {
    const src = path.join(sourceDir, file.name);
    const json = await readJson(src);
    const type = detectType(json);
    if (type === 'unknown') continue;

    const base = slugify(json.label || json.name || file.name.replace('.json', ''));
    const target = path.join(targetPackDir, type === 'section' ? 'sections' : 'modules', `${base}.json`);
    await writeJson(target, json);
  }

  await writeJson(path.join(targetPackDir, 'pack.json'), {
    id: packId,
    name: packName,
    description: packDescription,
    tags: packTags
  });

  const manifestPath = path.join(packsRoot, 'pack-manifest.json');
  const manifest = await readJson(manifestPath);
  manifest.packs = manifest.packs || [];

  if (!manifest.packs.some((pack) => pack.id === packId)) {
    manifest.packs.push({ id: packId, path: `./${packId}` });
  }

  await writeJson(manifestPath, manifest);
  console.log(`Imported ${jsonFiles.length} files into ${packId}`);
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
