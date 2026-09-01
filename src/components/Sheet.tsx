import { ReactNode } from 'react';

export function Sheet({
  open,
  onClose,
  children
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <div className={`overlay${open ? ' show' : ''}`} onClick={onClose} />
      <div className={`sheet${open ? ' show' : ''}`}>
        <div className="grabber" />
        <div className="sheet-inner">{open && children}</div>
      </div>
    </>
  );
}
