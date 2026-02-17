import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CanvasItem } from '../lib/types';

interface Props {
  items: CanvasItem[];
  onRename: (canvasId: string, label: string) => void;
  onDelete: (canvasId: string) => void;
  onDuplicate: (canvasId: string) => void;
}

export const reorderCanvasItems = (items: CanvasItem[], activeId: string, overId: string) => {
  const oldIndex = items.findIndex((item) => item.canvasId === activeId);
  const newIndex = items.findIndex((item) => item.canvasId === overId);
  return arrayMove(items, oldIndex, newIndex);
};

const SortableCanvasItem = ({
  item,
  onRename,
  onDelete,
  onDuplicate
}: {
  item: CanvasItem;
  onRename: Props['onRename'];
  onDelete: Props['onDelete'];
  onDuplicate: Props['onDuplicate'];
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.canvasId,
    data: { kind: 'canvas-item', item }
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="rounded-lg border bg-white p-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold uppercase">
            {item.type}
          </span>
          <button className="cursor-grab text-xs text-slate-500" {...attributes} {...listeners}>
            Drag
          </button>
        </div>
        <div className="space-x-2">
          <button className="text-xs text-blue-600" onClick={() => onDuplicate(item.canvasId)}>
            Duplicate
          </button>
          <button className="text-xs text-red-600" onClick={() => onDelete(item.canvasId)}>
            Delete
          </button>
        </div>
      </div>
      <input
        className="w-full rounded border px-2 py-1 text-sm"
        value={item.label}
        onChange={(e) => onRename(item.canvasId, e.target.value)}
      />
    </div>
  );
};

export const Canvas = ({ items, onRename, onDelete, onDuplicate }: Props) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-dropzone' });

  return (
    <main className="flex-1 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Canvas</h2>
        <p className="text-sm text-slate-500">Drop sections/modules and reorder</p>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[70vh] rounded-xl border-2 border-dashed p-4 ${
          isOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'
        }`}
      >
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">Drag from the library to start your layout.</p>
        ) : (
          <SortableContext items={items.map((item) => item.canvasId)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item) => (
                <SortableCanvasItem
                  key={item.canvasId}
                  item={item}
                  onRename={onRename}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </main>
  );
};
