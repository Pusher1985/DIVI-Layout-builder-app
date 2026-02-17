export type DiviJsonType = 'layout' | 'section' | 'module' | 'unknown';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeArray = (input: unknown): unknown[] => {
  if (Array.isArray(input)) return input;
  if (isObject(input) && Array.isArray(input.items)) return input.items;
  return [];
};

const hasModuleShape = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  return (
    typeof value.module_type === 'string' ||
    typeof value.type === 'string' ||
    typeof value.shortcode === 'string' ||
    value.kind === 'module'
  );
};

const hasSectionShape = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  const moduleCandidates = normalizeArray(
    value.modules ?? value.children ?? value.items ?? value.content
  );

  return (
    typeof value.section_type === 'string' ||
    value.kind === 'section' ||
    Array.isArray(value.rows) ||
    moduleCandidates.some(hasModuleShape)
  );
};

export const detectDiviJsonType = (input: unknown): DiviJsonType => {
  if (Array.isArray(input)) {
    if (input.every(hasSectionShape)) return 'layout';
    if (input.length === 1 && hasSectionShape(input[0])) return 'section';
    if (input.every(hasModuleShape)) return 'module';
  }

  if (!isObject(input)) return 'unknown';

  if (Array.isArray(input.layout) || Array.isArray(input.sections) || Array.isArray(input.data)) {
    return 'layout';
  }

  if (hasSectionShape(input)) return 'section';
  if (hasModuleShape(input)) return 'module';

  return 'unknown';
};

const collectModulesFromSection = (section: unknown): unknown[] => {
  if (!isObject(section)) return [];

  const fromRows = normalizeArray(section.rows).flatMap((row) => {
    if (!isObject(row)) return [];
    return normalizeArray(row.modules ?? row.children ?? row.content);
  });

  const direct = normalizeArray(section.modules ?? section.children ?? section.items ?? section.content);
  return [...fromRows, ...direct].filter(hasModuleShape);
};

export const extractSections = (input: unknown): unknown[] => {
  const type = detectDiviJsonType(input);

  if (type === 'section') {
    return Array.isArray(input) ? input.filter(hasSectionShape) : [input];
  }

  if (type === 'layout' && isObject(input)) {
    const layoutSections = normalizeArray(input.layout ?? input.sections ?? input.data);
    return layoutSections.filter(hasSectionShape);
  }

  if (type === 'layout' && Array.isArray(input)) {
    return input.filter(hasSectionShape);
  }

  return [];
};

export const extractModules = (input: unknown): unknown[] => {
  const type = detectDiviJsonType(input);

  if (type === 'module') {
    return Array.isArray(input) ? input.filter(hasModuleShape) : [input];
  }

  if (type === 'section') {
    const sections = Array.isArray(input) ? input : [input];
    return sections.flatMap(collectModulesFromSection);
  }

  if (type === 'layout') {
    return extractSections(input).flatMap(collectModulesFromSection);
  }

  return [];
};
