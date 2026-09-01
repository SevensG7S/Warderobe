import React, { useEffect } from 'react';
import { useWardrobeStore } from '../store/useWardrobeStore';
import { getTelegramUser } from '../lib/telegram';

export const ProfileScreen: React.FC = () => {
  const { items, looks, fetchLooks } = useWardrobeStore();
  const user = getTelegramUser();

  useEffect(() => {
    fetchLooks();
  }, [fetchLooks]);

  return (
    <div className="screen-content">
      <div className="profile-hero">
        <div
          className="avatar"
          style={
            user?.photo_url
              ? { backgroundImage: `url(${user.photo_url})`, backgroundSize: 'cover' }
              : undefined
          }
        />
        <div>
          <div style={{ fontWeight: 700, fontSize: '16px' }}>
            {user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Пользователь TMA'}
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>
            {user?.username ? `@${user.username}` : 'Гардероб готов'}
          </div>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="n">{items.length}</div>
          <div className="l">Вещей в базе</div>
        </div>
        <div className="stat-card">
          <div className="n">{looks.length}</div>
          <div className="l">Образов</div>
        </div>
      </div>

      <div className="sec-label">Сохраненные образы</div>
      {looks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)', fontSize: '13px' }}>
          У вас пока нет сохранённых образов
        </div>
      ) : (
        <div className="grid">
          {looks.map((look) => (
            <div key={look.id} className="look-thumb">
              {look.previewUrl ? (
                <img src={look.previewUrl} alt={look.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '24px' }}>✨</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};