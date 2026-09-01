import { CATEGORY_ORDER, CATS, CategoryIcon } from '../../data/categories';
import { Look } from '../../types';
import { useWardrobe } from '../../context/WardrobeContext';

export function LookDetailSheet({
  look,
  onEdit,
  onDeleted
}: {
  look: Look;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const { findItem, deleteLook, removeItemFromLook } = useWardrobe();

  return (
    <>
      <h3>{look.name}</h3>
      <div className="look-canvas">
        {CATEGORY_ORDER.map((cat) => {
          const ids = look.items[cat] || [];
          return (
            <div className="look-canvas-section" key={cat}>
              <div className="look-canvas-title">{CATS[cat].label}</div>
              {ids.length === 0 ? (
                <div className="big-cloth-card empty" onClick={onEdit}>
                  <span>+ Нажми, чтобы добавить вещь</span>
                </div>
              ) : (
                ids.map((id) => {
                  const it = findItem(cat, id);
                  if (!it) return null;
                  return (
                    <div className="big-cloth-card" key={id}>
                      <button
                        className="remove-from-look"
                        title="Убрать из лука"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItemFromLook(look.id, cat, id);
                        }}
                      >
                        ×
                      </button>
                      <div className="big-cloth-img">
                        {it.image ? <img src={it.image} /> : <CategoryIcon cat={cat} />}
                      </div>
                      <div className="big-cloth-footer">
                        <b>{it.name}</b>
                        <span>{CATS[cat].short}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
      <button className="edit-btn" onClick={onEdit}>✏️ Редактировать лук / добавить вещи</button>
      <button
        className="danger-btn"
        onClick={() => {
          deleteLook(look.id);
          onDeleted();
        }}
      >
        Удалить лук целиком
      </button>
    </>
  );
}
