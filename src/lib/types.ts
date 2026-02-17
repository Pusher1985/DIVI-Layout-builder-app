export type LibraryItemType = 'section' | 'module';

export interface LibraryItem {
  id: string;
  type: LibraryItemType;
  label: string;
  tags: string[];
  packId: string;
  rawJson: unknown;
  previewText: string;
  fileName: string;
  packName: string;
}

export interface PackManifestEntry {
  id: string;
  path: string;
}

export interface PackMetadata {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

export interface CanvasItem {
  canvasId: string;
  sourceItemId: string;
  type: LibraryItemType;
  label: string;
  rawJson: unknown;
  packId: string;
}
