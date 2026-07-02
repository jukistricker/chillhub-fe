import { useAppDispatch, useAppSelector } from "@/store";
import { fetchCategories } from "@/store/slices/categorySlice";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
}

export default function CategorySelect({ value, onChange }: Props) {
  const dispatch = useAppDispatch();
  const { items: categories } = useAppSelector(s => s.categories);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    dispatch(fetchCategories({ pageSize: 50 }));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(fetchCategories({ pageSize: 50, search: search || null }));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.top - 4, left: r.left, width: r.width });
    }
  }, [open]);

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);

  const selected = categories.filter(c => value.includes(c.id));
  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
   return (
    <div>
      <label className="block text-sm font-medium mb-2">Categories</label>
      <div
        ref={triggerRef}
        onClick={() => setOpen(o => !o)}
        className="min-h-[42px] p-2 flex flex-wrap gap-2 rounded-md bg-muted border border-border cursor-pointer"
      >
        {selected.length === 0
          ? <span className="text-sm text-muted-foreground self-center">Select categories...</span>
          : selected.map(c => (
              <span key={c.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-sm">
                {c.name}
                <button type="button" onClick={e => { e.stopPropagation(); toggle(c.id); }} className="opacity-60 hover:opacity-100">×</button>
              </span>
            ))
        }
      </div>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div className="fixed z-[9999] bg-background border border-border rounded-md shadow-lg overflow-hidden"
            style={{ top: pos.top, left: pos.left, width: pos.width }}>
            <div className="p-2 border-b border-border">
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..." onClick={e => e.stopPropagation()}
                className="w-full text-sm p-1.5 rounded bg-muted border border-border outline-none" />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0
                ? <p className="text-sm text-muted-foreground text-center py-4">No results</p>
                : filtered.map(c => (
                    <div key={c.id} onClick={() => toggle(c.id)}
                      className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-muted
                        ${value.includes(c.id) ? "text-primary" : ""}`}>
                      {c.name}
                      {value.includes(c.id) && <span className="text-xs">✓</span>}
                    </div>
                  ))
              }
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}