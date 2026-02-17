import { useDraggable } from '@dnd-kit/core';
import type { LibraryItem, LibraryItemType, PackMetadata } from '../lib/types';

interface Props {
  packs: PackMetadata[];
  items: LibraryItem[];
  selectedPack: string;
  onPackChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  activeTab: LibraryItemType;
  onTabChange: (value: LibraryItemType) => void;
}

const DraggableCard = ({ item }: { item: LibraryItem }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${item.id}`,
    data: { kind: 'library-item', item }
  });

  return (
    <button
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined
      }}
      className={`w-full rounded-lg border bg-white p-3 text-left shadow-sm transition ${
        isDragging ? 'opacity-40' : 'hover:border-blue-400'
      }`}
      {...listeners}
      {...attributes}
    >
      <p className="font-semibold">{item.label}</p>
      <p className="text-xs text-slate-500">{item.packName}</p>
      <p className="mt-1 text-xs text-slate-600">{item.previewText}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {item.tags.map((tag) => (
          <span key={tag} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            #{tag}
          </span>
        ))}
      </div>
    </button>
  );
};

export const LibrarySidebar = ({
  packs,
  items,
  selectedPack,
  onPackChange,
  search,
  onSearchChange,
  activeTab,
  onTabChange
}: Props) => {
  return (
    <aside className="flex h-full w-96 flex-col border-r bg-slate-50">
      <div className="space-y-3 border-b p-4">
        <h1 className="text-lg font-bold">Divi Layout Builder</h1>
        <select
          className="w-full rounded border p-2 text-sm"
          value={selectedPack}
          onChange={(e) => onPackChange(e.target.value)}
        >
          <option value="all">All Packs</option>
          {packs.map((pack) => (
            <option key={pack.id} value={pack.id}>
              {pack.name}
            </option>
          ))}
        </select>
        <input
          className="w-full rounded border p-2 text-sm"
          placeholder="Search sections/modules"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <div className="flex gap-2">
          {(['section', 'module'] as LibraryItemType[]).map((type) => (
            <button
              key={type}
              className={`rounded px-3 py-1 text-sm ${
                activeTab === type ? 'bg-blue-600 text-white' : 'bg-white border'
              }`}
              onClick={() => onTabChange(type)}
            >
              {type === 'section' ? 'Sections' : 'Modules'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-auto p-4">
        {items.map((item) => (
          <DraggableCard key={item.id} item={item} />
        ))}
      </div>
    </aside>
  );
};
