export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function wordVeshi(n: number): string {
  const m = n % 10, m2 = n % 100;
  if (m2 >= 11 && m2 <= 14) return 'вещей';
  if (m === 1) return 'вещь';
  if (m >= 2 && m <= 4) return 'вещи';
  return 'вещей';
}

export function wordLuki(n: number): string {
  const m = n % 10, m2 = n % 100;
  if (m2 >= 11 && m2 <= 14) return 'луков';
  if (m === 1) return 'лук';
  if (m >= 2 && m <= 4) return 'лука';
  return 'луков';
}

const RANDOM_NAME_A = ['Городской', 'Лёгкий', 'Дождливый', 'Утренний', 'Вечерний', 'Смелый', 'Спокойный', 'Уютный'];
const RANDOM_NAME_B = ['выход', 'маршрут', 'вайб', 'стиль', 'образ', 'настрой'];

export function randomLookName(): string {
  const a = RANDOM_NAME_A[Math.floor(Math.random() * RANDOM_NAME_A.length)];
  const b = RANDOM_NAME_B[Math.floor(Math.random() * RANDOM_NAME_B.length)];
  return `${a} ${b}`;
}

export function todayLabel(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function greeting(): { text: string; word: string } {
  const h = new Date().getHours();
  const g = h < 6 ? 'ночи' : h < 12 ? 'утро' : h < 18 ? 'день' : 'вечер';
  if (g === 'ночи') return { text: 'Доброй', word: 'ночи' };
  return { text: g === 'утро' ? 'Доброе' : 'Добрый', word: g };
}

export function dateLine(): string {
  const d = new Date();
  const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const day = days[d.getDay()];
  return `${day[0].toUpperCase() + day.slice(1)}, ${d.getDate()} ${months[d.getMonth()]}`;
}
