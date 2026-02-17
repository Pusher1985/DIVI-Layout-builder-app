import type { CanvasItem } from '../types';

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const asSection = (item: CanvasItem): Record<string, unknown> => {
  const raw = deepClone(item.rawJson) as Record<string, unknown>;
  return {
    ...raw,
    label: item.label
  };
};

const asModule = (item: CanvasItem): Record<string, unknown> => {
  const raw = deepClone(item.rawJson) as Record<string, unknown>;
  return {
    ...raw,
    label: item.label
  };
};

export const createDefaultSectionFromModule = (moduleRaw: unknown): Record<string, unknown> => ({
  kind: 'section',
  label: 'Auto Section',
  section_type: 'regular',
  rows: [
    {
      type: 'row',
      modules: [deepClone(moduleRaw)]
    }
  ]
});

export const buildPrimaryLayoutExport = (items: CanvasItem[]): Record<string, unknown> => {
  const sections: Record<string, unknown>[] = [];

  for (const item of items) {
    if (item.type === 'section') {
      sections.push(asSection(item));
      continue;
    }

    const moduleJson = asModule(item);
    if (sections.length === 0) {
      sections.push(createDefaultSectionFromModule(moduleJson));
      continue;
    }

    const lastSection = sections[sections.length - 1] as Record<string, unknown>;
    const rows = (lastSection.rows as unknown[]) ?? [];
    if (rows.length === 0) {
      lastSection.rows = [{ type: 'row', modules: [moduleJson] }];
      continue;
    }

    const firstRow = rows[0] as Record<string, unknown>;
    const modules = Array.isArray(firstRow.modules) ? firstRow.modules : [];
    firstRow.modules = [...modules, moduleJson];
  }

  return {
    meta: {
      format: 'divi-layout-builder/v1',
      exportedAt: new Date().toISOString()
    },
    layout: sections
  };
};

export const buildSectionsOnlyExport = (items: CanvasItem[]): unknown[] => {
  return buildPrimaryLayoutExport(items).layout as unknown[];
};
