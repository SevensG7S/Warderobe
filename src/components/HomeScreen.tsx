import React from 'react';
import { useWardrobeStore } from '../store/useWardrobeStore';
import { haptic } from '../lib/telegram';
import type { ClothingItem } from '../types';

const WEEKDAYS = ['ВОСКРЕСЕНЬЕ', 'ПОНЕДЕЛЬНИК', 'ВТОРНИК', 'СРЕДА', 'ЧЕТВЕРГ', 'ПЯТНИЦА', 'СУББОТА'];
const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function getGreeting(hour: number): string {
  if (hour < 5) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

interface HomeScreenProps {
  onNavigateToAdd: () => void;
  onNavigateToCloset: () => void;
  onNavigateToLooks: () => void;
  onOpenLook: (lookId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToAdd,
  onNavigateToCloset,
  onNavigateToLooks,
  onOpenLook,
}) => {
  const items = useWardrobeStore((s) => s.items);
  const looks = useWardrobeStore((s) => s.looks);
  const removeItem = useWardrobeStore((s) => s.removeItem);

  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const [greetingWord, ...rest] = greeting.split(' ');
  const dateStr = `${WEEKDAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;

  const recent = items.slice(0, 6);
  const recentLooks = looks.slice(0, 4);

  const handleDeleteItem = (e: React.MouseEvent, item: ClothingItem) => {
    e.stopPropagation();
    haptic('medium');
    removeItem(item.id);
  };

  return (
    <div className="screen-content home-screen">
      <div className="home-date">{dateStr}</div>
      <h1 className="home-greeting display">
        {greetingWord} <span className="home-greeting-accent">{rest.join(' ')}</span>
      </h1>
      <div className="home-summary">
        {items.length} {items.length === 1 ? 'вещь' : 'вещи'} · {looks.length} {looks.length === 1 ? 'лук' : 'луков'}
      </div>

      <button
        className="home-add-card"
        onClick={() => {
          haptic('light');
          onNavigateToAdd();
        }}
      >
        <span className="home-add-icon">+</span>
        <span className="home-add-text">
          <span className="home-add-title">Добавить вещь</span>
          <span className="home-add-sub">Новое фото в гардероб</span>
        </span>
      </button>

      <div className="home-stat-row">
        <button
          className="home-stat-card"
          onClick={() => {
            haptic('light');
            onNavigateToCloset();
          }}
        >
          <span className="home-stat-icon lav">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 4l3 2 3-2 3 2 3-2v16H6V4z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="home-stat-title">Все вещи</span>
          <span className="home-stat-count">{items.length} ПРЕДМЕТОВ</span>
        </button>
        <button
          className="home-stat-card"
          onClick={() => {
            haptic('light');
            onNavigateToLooks();
          }}
        >
          <span className="home-stat-icon terra">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3l2.4 5 5.6.6-4.2 3.8 1.2 5.4L12 15l-4.9 2.8 1.2-5.4L4 8.6l5.6-.6L12 3z" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="home-stat-title">Мои луки</span>
          <span className="home-stat-count">{looks.length} ОБРАЗОВ</span>
        </button>
      </div>

      {recent.length > 0 && (
        <>
          <div className="home-sec-header">
            <span className="home-sec-title">Недавно добавлено</span>
            <button className="home-sec-link" onClick={() => { haptic('light'); onNavigateToCloset(); }}>
              все вещи →
            </button>
          </div>
          <div className="home-recent-row">
            {recent.map((item) => (
              <div key={item.id} className="home-recent-item" onClick={() => { haptic('light'); onNavigateToCloset(); }}>
                <button className="home-recent-x" onClick={(e) => handleDeleteItem(e, item)}>
                  ×
                </button>
                <div className="home-recent-thumb checker-bg">
                  <img src={item.imageUrl} alt={item.name} />
                </div>
                <div className="home-recent-name">{item.name}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="home-sec-header">
        <span className="home-sec-title">Твои луки</span>
        <button className="home-sec-link" onClick={() => { haptic('light'); onNavigateToLooks(); }}>
          смотреть все →
        </button>
      </div>

      {recentLooks.length === 0 ? (
        <div className="empty-state" style={{ padding: '30px 20px' }}>
          <div className="icon-box">✨</div>
          <h3>Пока нет луков</h3>
          <p>Соберите первый образ на вкладке «Луки»</p>
        </div>
      ) : (
        recentLooks.map((look, idx) => {
          const lookItems = look.layers
            .map((l) => items.find((i) => i.id === l.itemId))
            .filter(Boolean) as ClothingItem[];
          return (
            <button
              key={look.id}
              className="home-look-card"
              onClick={() => {
                haptic('light');
                onOpenLook(look.id);
              }}
            >
              <div className="home-look-grid">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="home-look-cell checker-bg">
                    {lookItems[i] && <img src={lookItems[i].imageUrl} alt="" />}
                  </div>
                ))}
              </div>
              <div className="home-look-info">
                <div className="home-look-num">{idx + 1}</div>
                <div className="home-look-meta">
                  {lookItems.length} {lookItems.length === 1 ? 'вещь' : 'вещей'} ·{' '}
                  {new Date(look.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                </div>
              </div>
              <span className="home-look-chevron">›</span>
            </button>
          );
        })
      )}
    </div>
  );
};
