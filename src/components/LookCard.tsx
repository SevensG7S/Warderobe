import { CATEGORY_ORDER, CategoryIcon } from '../data/categories';
import { Category, Look } from '../types';
import { useWardrobe } from '../context/WardrobeContext';

function CollageSlot({ cat, id }: { cat: Category | null; id: string | null }) {
  const { findItem } = useWardrobe();
  const item = cat && id ? findItem(cat, id) : undefined;
  if (!cat || !id || !item) {
    return <div className="slot" style={{ background: 'rgba(21,19,31,.04)' }} />;
  }
  return (
    <div className="slot" style={{ background: '#f4f4f4' }}>
      {item.image ? (
        <img src={item.image} style={{ objectFit: 'contain', padding: 4 }} />
      ) : (
        <CategoryIcon cat={cat} />
      )}
    </div>
  );
}

export function LookCard({ look, onClick }: { look: Look; onClick: () => void }) {
  const selected: { cat: Category; id: string }[] = [];
  CATEGORY_ORDER.forEach((c) => {
    (look.items[c] || []).forEach((id) => selected.push({ cat: c, id }));
  });
  const slots = Array.from({ length: 4 }, (_, i) => selected[i] ?? null);

  return (
    <div className="look-card glass-card" onClick={onClick}>
      <div className="look-collage">
        {slots.map((s, i) => (
          <CollageSlot key={i} cat={s?.cat ?? null} id={s?.id ?? null} />
        ))}
      </div>
      <div className="look-info">
        <p className="name">{look.name}</p>
        <p className="meta">{selected.length} вещей · {look.dateLabel}</p>
      </div>
      <svg className="chev" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M9 6l6 6-6 6" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
