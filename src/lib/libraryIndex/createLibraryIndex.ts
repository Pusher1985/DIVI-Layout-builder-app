import manifest from '../../assets/packs/pack-manifest.json';
import type { LibraryItem, LibraryItemType, PackManifestEntry, PackMetadata } from '../types';

const packMetadataFiles = import.meta.glob('../../assets/packs/*/pack.json', {
  eager: true,
  import: 'default'
}) as Record<string, PackMetadata>;

const sectionFiles = import.meta.glob('../../assets/packs/*/sections/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, unknown>;

const moduleFiles = import.meta.glob('../../assets/packs/*/modules/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, unknown>;

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

const hashString = (value: string): string => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
};

const getPreviewText = (rawJson: unknown): string => {
  if (!rawJson || typeof rawJson !== 'object') return 'No preview available';
  const obj = rawJson as Record<string, unknown>;
  const fields = [obj.content, obj.text, obj.description, obj.label].filter((f) => typeof f === 'string');
  return (fields[0] as string | undefined)?.slice(0, 80) ?? 'No preview available';
};

const createItem = (
  path: string,
  rawJson: unknown,
  type: LibraryItemType,
  packId: string,
  packName: string
): LibraryItem => {
  const fileName = path.split('/').pop()?.replace('.json', '') ?? 'unknown';
  const fingerprint = hashString(stableStringify(rawJson));
  const id = hashString(`${packId}:${fileName}:${fingerprint}`);
  const record = rawJson as Record<string, unknown>;
  const label =
    (typeof record?.label === 'string' && record.label) ||
    (typeof record?.name === 'string' && record.name) ||
    fileName;

  return {
    id,
    type,
    label,
    tags: Array.isArray(record?.tags) ? (record.tags as string[]) : [],
    packId,
    rawJson,
    previewText: getPreviewText(rawJson),
    fileName,
    packName
  };
};

export interface LibraryIndex {
  packs: PackMetadata[];
  items: LibraryItem[];
}

export const createLibraryIndex = (): LibraryIndex => {
  const packs = (manifest.packs as PackManifestEntry[])
    .map((entry) => {
      const metadataPath = `../../assets/packs/${entry.id}/pack.json`;
      return packMetadataFiles[metadataPath];
    })
    .filter(Boolean);

  const items: LibraryItem[] = [];

  for (const [path, value] of Object.entries(sectionFiles)) {
    const packId = path.split('/')[3] ?? 'unknown-pack';
    const packName = packs.find((pack) => pack.id === packId)?.name ?? packId;
    items.push(createItem(path, value, 'section', packId, packName));
  }

  for (const [path, value] of Object.entries(moduleFiles)) {
    const packId = path.split('/')[3] ?? 'unknown-pack';
    const packName = packs.find((pack) => pack.id === packId)?.name ?? packId;
    items.push(createItem(path, value, 'module', packId, packName));
  }

  return { packs, items };
};
