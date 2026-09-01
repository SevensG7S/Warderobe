import { Category, Item } from '../types';
import { CategoryIcon } from '../data/categories';

export function ItemCard({
  cat,
  item,
  onDelete,
  onClick
}: {
  cat: Category;
  item: Item;
  onDelete?: () => void;
  onClick?: () => void;
}) {
  return (
    <div className="item-card" onClick={onClick}>
      {onDelete && (
        <button
          className="del"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          ×
        </button>
      )}
      <div className="icon-circle" style={{ background: '#f4f4f4' }}>
        {item.image ? <img src={item.image} alt={item.name} /> : <CategoryIcon cat={cat} />}
      </div>
      <span className="name">{item.name}</span>
    </div>
  );
}
