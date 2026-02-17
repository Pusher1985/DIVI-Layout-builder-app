import { describe, expect, it } from 'vitest';
import layoutShape from '../../assets/fixtures/layout-shape.json';
import sectionsArrayShape from '../../assets/fixtures/sections-array-shape.json';
import moduleOnlyShape from '../../assets/fixtures/module-only-shape.json';
import { detectDiviJsonType, extractModules, extractSections } from './diviParser';

describe('detectDiviJsonType', () => {
  it('detects layout wrapper', () => {
    expect(detectDiviJsonType(layoutShape)).toBe('layout');
  });

  it('detects section object/arrays', () => {
    expect(detectDiviJsonType(sectionsArrayShape)).toBe('layout');
    expect(detectDiviJsonType(sectionsArrayShape[0])).toBe('section');
  });

  it('detects module object', () => {
    expect(detectDiviJsonType(moduleOnlyShape)).toBe('module');
  });
});

describe('extractors', () => {
  it('extracts sections from different shapes', () => {
    expect(extractSections(layoutShape)).toHaveLength(1);
    expect(extractSections(sectionsArrayShape)).toHaveLength(1);
    expect(extractSections(moduleOnlyShape)).toHaveLength(0);
  });

  it('extracts modules from different shapes', () => {
    expect(extractModules(layoutShape)).toHaveLength(2);
    expect(extractModules(sectionsArrayShape)).toHaveLength(1);
    expect(extractModules(moduleOnlyShape)).toHaveLength(1);
  });
});
