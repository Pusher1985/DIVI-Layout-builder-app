import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useMemo, useState } from 'react';
import { LibrarySidebar } from './components/LibrarySidebar';
import { Canvas, reorderCanvasItems } from './components/Canvas';
import { buildPrimaryLayoutExport, buildSectionsOnlyExport, createDefaultSectionFromModule } from './lib/export/exportLayout';
import { createLibraryIndex } from './lib/libraryIndex/createLibraryIndex';
import type { CanvasItem, LibraryItemType } from './lib/types';

const library = createLibraryIndex();

const downloadJson = (fileName: string, payload: unknown) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

const generateCanvasId = () => crypto.randomUUID();

function App() {
  const [selectedPack, setSelectedPack] = useState('all');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<LibraryItemType>('section');
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return library.items.filter((item) => {
      if (selectedPack !== 'all' && item.packId !== selectedPack) return false;
      if (item.type !== activeTab) return false;
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        item.packName.toLowerCase().includes(q)
      );
    });
  }, [activeTab, search, selectedPack]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeKind = active.data.current?.kind;
    const overId = String(over.id);

    if (activeKind === 'library-item' && overId === 'canvas-dropzone') {
      const libraryItem = active.data.current?.item;
      if (!libraryItem) return;

      setCanvasItems((current) => {
        if (current.length === 0 && libraryItem.type === 'module') {
          return [
            {
              canvasId: generateCanvasId(),
              sourceItemId: libraryItem.id,
              type: 'section',
              label: `${libraryItem.label} Container`,
              rawJson: createDefaultSectionFromModule(libraryItem.rawJson),
              packId: libraryItem.packId
            }
          ];
        }

        return [
          ...current,
          {
            canvasId: generateCanvasId(),
            sourceItemId: libraryItem.id,
            type: libraryItem.type,
            label: libraryItem.label,
            rawJson: libraryItem.rawJson,
            packId: libraryItem.packId
          }
        ];
      });
      return;
    }

    if (activeKind === 'canvas-item') {
      if (overId === 'canvas-dropzone') return;
      setCanvasItems((current) => reorderCanvasItems(current, String(active.id), overId));
    }
  };

  return (
    <div className="flex h-screen">
      <DndContext onDragEnd={onDragEnd}>
        <LibrarySidebar
          packs={library.packs}
          items={filteredItems}
          selectedPack={selectedPack}
          onPackChange={setSelectedPack}
          search={search}
          onSearchChange={setSearch}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-2 border-b bg-white p-3">
            <button
              className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
              onClick={() => downloadJson('divi-layout.json', buildPrimaryLayoutExport(canvasItems))}
            >
              Export Layout JSON
            </button>
            <button
              className="rounded border px-3 py-2 text-sm"
              onClick={() => downloadJson('divi-sections-only.json', buildSectionsOnlyExport(canvasItems))}
            >
              Export Sections-Only (Fallback)
            </button>
          </div>
          <Canvas
            items={canvasItems}
            onRename={(id, label) =>
              setCanvasItems((current) =>
                current.map((item) => (item.canvasId === id ? { ...item, label } : item))
              )
            }
            onDelete={(id) => setCanvasItems((current) => current.filter((item) => item.canvasId !== id))}
            onDuplicate={(id) =>
              setCanvasItems((current) => {
                const source = current.find((item) => item.canvasId === id);
                if (!source) return current;
                return [...current, { ...source, canvasId: generateCanvasId() }];
              })
            }
          />
        </div>
      </DndContext>
    </div>
  );
}

export default App;
