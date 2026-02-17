import { describe, expect, it } from 'vitest';
import { buildPrimaryLayoutExport } from './exportLayout';
import type { CanvasItem } from '../types';

describe('buildPrimaryLayoutExport', () => {
  it('preserves dropped item order and includes all content', () => {
    const items: CanvasItem[] = [
      {
        canvasId: '1',
        sourceItemId: 'a',
        type: 'section',
        label: 'Section A',
        rawJson: { kind: 'section', label: 'Section A', rows: [] },
        packId: 'pack-1'
      },
      {
        canvasId: '2',
        sourceItemId: 'b',
        type: 'module',
        label: 'Module B',
        rawJson: { kind: 'module', module_type: 'text', label: 'Module B' },
        packId: 'pack-1'
      },
      {
        canvasId: '3',
        sourceItemId: 'c',
        type: 'section',
        label: 'Section C',
        rawJson: { kind: 'section', label: 'Section C', rows: [] },
        packId: 'pack-2'
      }
    ];

    const output = buildPrimaryLayoutExport(items);
    const sections = output.layout as Array<Record<string, unknown>>;

    expect(sections).toHaveLength(2);
    expect(sections[0].label).toBe('Section A');
    expect(sections[1].label).toBe('Section C');

    const firstRow = (sections[0].rows as Array<Record<string, unknown>>)[0];
    expect(firstRow.modules).toHaveLength(1);
    expect((firstRow.modules as Array<Record<string, unknown>>)[0].label).toBe('Module B');
  });
});
