(function(){
  // Telegram WebApp initialization
  const tg = window.Telegram?.WebApp;

  // Theme integration
  function initTelegramTheme() {
    // Detect dark scheme from Telegram or system preferences
    const isDark = tg?.colorScheme === 'dark' || (!tg && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
      document.documentElement.classList.add('light-theme');
    }

    if (!tg?.themeParams) return;

    const { bg_color, secondary_bg_color, hint_color, text_color, link_color, button_color, button_text_color } = tg.themeParams;

    // Apply theme to CSS variables
    if (bg_color) document.documentElement.style.setProperty('--tg-bg-color', bg_color);
    if (secondary_bg_color) document.documentElement.style.setProperty('--tg-secondary-bg-color', secondary_bg_color);
    if (text_color) document.documentElement.style.setProperty('--tg-text-color', text_color);
    if (hint_color) document.documentElement.style.setProperty('--tg-hint-color', hint_color);
    if (link_color) document.documentElement.style.setProperty('--tg-link-color', link_color);
    if (button_color) document.documentElement.style.setProperty('--tg-button-color', button_color);
    if (button_text_color) document.documentElement.style.setProperty('--tg-button-text-color', button_text_color);
  }

  // Listen for theme changes
  if (tg) {
    tg.onEvent('themeChanged', initTelegramTheme);
  }

  // Initialize theme on load
  initTelegramTheme();

  // Viewport height adjustment for Telegram WebApp
  function updateViewportHeight() {
    if (tg) {
      document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewHeight}px`);
    }
  }

  if (tg) {
    tg.onEvent('viewportChanged', updateViewportHeight);
    updateViewportHeight();
    // Expand to full height
    tg.expand();
  }

  const CATS = {
    headwear: {label:'1. Головной убор', short:'Убор', color:'violet', soft:'var(--violet-soft)', main:'var(--violet)'},
    tops:     {label:'2.  Верх',          short:'Верх', color:'pink',   soft:'var(--pink-soft)',   main:'var(--pink)'},
    bottoms:  {label:'3. Низ',           short:'Низ',  color:'teal',   soft:'var(--teal-soft)',   main:'var(--teal)'},
    shoes:    {label:'4. Обувь',         short:'Обувь',color:'amber',  soft:'var(--amber-soft)',  main:'var(--amber)'}
  };

  function shapePath(cat){
    const shapes = {
      headwear: `<path d="M15 58c0-20 16-34 35-34s35 14 35 34" fill="none" stroke="M" stroke-width="7" stroke-linecap="round"/><path d="M15 58h70v6c0 3-2 5-5 5H20c-3 0-5-2-5-5v-6z" fill="M" /><path d="M85 58l14-3c3-1 5 1 5 4s-2 5-5 5l-14 1" fill="M"/>`,
      tops: `<path d="M35 18l15-6 15 6 18 12-9 12-9-5v49H30V37l-9 5-9-12z" fill="M"/>`,
      bottoms: `<path d="M32 15h36l3 70h-15l-4-40-4 40H33z" fill="M"/>`,
      shoes: `<path d="M12 62c0-10 8-16 18-18l30-6c8-2 14 2 20 8l14 8c4 2 6 5 6 8 0 3-2 5-6 5H16c-3 0-4-2-4-5z" fill="M"/>`
    };
    return shapes[cat];
  }
  function icon(cat){
    return `<svg viewBox="0 0 100 100">${shapePath(cat).split('M').join(CATS[cat].main==='var(--violet)'?'#6C4CFF':CATS[cat].main==='var(--pink)'?'#FF5D8F':CATS[cat].main==='var(--teal)'?'#0FBF9F':'#FFA43D')}</svg>`;
  }

  /* ---------- TELEGRAM STORAGE ---------- */
  const LS_KEY = 'wardrobe_state';

  async function saveStateToLS(data) {
    try {
      if (window.Telegram?.WebApp?.CloudStorage) {
        await window.Telegram.WebApp.CloudStorage.setItem(LS_KEY, JSON.stringify(data));
      } else {
        // Fallback to localStorage if CloudStorage not available
        localStorage.setItem(LS_KEY, JSON.stringify(data));
      }
    } catch(e) {
      console.error('Ошибка сохранения состояния:', e);
      // Final fallback to localStorage
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(data));
      } catch(e2) {
        console.error('Ошибка сохранения в localStorage:', e2);
      }
    }
  }

  async function loadStateFromLS() {
    try {
      if (window.Telegram?.WebApp?.CloudStorage) {
        const data = await window.Telegram.WebApp.CloudStorage.getItem(LS_KEY);
        return data ? JSON.parse(data) : null;
      } else {
        // Fallback to localStorage if CloudStorage not available
        const data = localStorage.getItem(LS_KEY);
        return data ? JSON.parse(data) : null;
      }
    } catch(e) {
      console.error('Ошибка чтения состояния:', e);
      // Fallback to localStorage
      try {
        const data = localStorage.getItem(LS_KEY);
        return data ? JSON.parse(data) : null;
      } catch(e2) {
        console.error('Ошибка чтения из localStorage:', e2);
        return null;
      }
    }
  }

  /* ---------- АВТОМАТИЧЕСКОЕ УДАЛЕНИЕ ФОНА (УЛУЧШЕННАЯ ТОЧНОСТЬ) ---------- */
  function removeBackgroundAuto(file, maxWidth = 600) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxWidth || h > maxWidth) {
            if (w > h) {
              h = Math.round((h * maxWidth) / w);
              w = maxWidth;
            } else {
              w = Math.round((w * maxWidth) / h);
              h = maxWidth;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          // Замеряем цвет фона по краям
          const corners = [0, (w - 1) * 4, ((h - 1) * w) * 4, ((h - 1) * w + (w - 1)) * 4];
          let bgR = 0, bgG = 0, bgB = 0;
          corners.forEach(idx => {
            bgR += data[idx];
            bgG += data[idx + 1];
            bgB += data[idx + 2];
          });
          bgR /= 4; bgG /= 4; bgB /= 4;

          // Уменьшенный порог во избежание съедания ткани светлых оттенков
          const tolerance = 18;
          const visited = new Uint8Array(w * h);
          const queue = [];

          for (let x = 0; x < w; x++) {
            queue.push(x, 0);
            queue.push(x, h - 1);
          }
          for (let y = 0; y < h; y++) {
            queue.push(0, y);
            queue.push(w - 1, y);
          }

          function colorDist(r1, g1, b1, r2, g2, b2) {
            return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
          }

          let head = 0;
          while (head < queue.length) {
            const px = queue[head++];
            const py = queue[head++];
            const pIdx = py * w + px;

            if (visited[pIdx]) continue;
            visited[pIdx] = 1;

            const dIdx = pIdx * 4;
            const r = data[dIdx];
            const g = data[dIdx + 1];
            const b = data[dIdx + 2];

            const dist = colorDist(r, g, b, bgR, bgG, bgB);

            if (dist <= tolerance) {
              data[dIdx + 3] = 0; // Полная прозрачность

              if (px > 0 && !visited[pIdx - 1]) queue.push(px - 1, py);
              if (px < w - 1 && !visited[pIdx + 1]) queue.push(px + 1, py);
              if (py > 0 && !visited[pIdx - w]) queue.push(px, py - 1);
              if (py < h - 1 && !visited[pIdx + w]) queue.push(px, py + 1);
            } else if (dist <= tolerance + 8) {
              // Мягкое сглаживание пограничных пикселей (anti-aliasing)
              const alphaRatio = (dist - tolerance) / 8;
              data[dIdx + 3] = Math.round(data[dIdx + 3] * alphaRatio);
            }
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function seed(){
    return {
      wardrobe: { headwear:[], tops:[], bottoms:[], shoes:[] },
      looks: []
    };
  }

  let state = seed();
  let tempPhoto = null;
  let lookSelection = {headwear:[], tops:[], bottoms:[], shoes:[]};
  let editingLookId = null;
  let currentFilter = 'all';

  async function save(){
    await saveStateToLS(state);
  }

  async function load(){
    const saved = await loadStateFromLS();
    if(saved) {
      state = saved;
    }
    renderAll();
  }

  function uid(){ return Math.random().toString(36).slice(2,9); }
  function allItemsFlat(){
    const out = [];
    Object.keys(state.wardrobe).forEach(cat=> state.wardrobe[cat].forEach(it=> out.push({...it, cat})));
    return out;
  }
  function findItem(cat,id){ return state.wardrobe[cat].find(i=>i.id===id); }
  function wordVeshi(n){ const m=n%10, m2=n%100; if(m2>=11&&m2<=14) return 'вещей'; if(m===1) return 'вещь'; if(m>=2&&m<=4) return 'вещи'; return 'вещей'; }
  function wordLuki(n){ const m=n%10, m2=n%100; if(m2>=11&&m2<=14) return 'луков'; if(m===1) return 'лук'; if(m>=2&&m<=4) return 'лука'; return 'луков'; }

  function renderHeader(){
    const h = new Date().getHours();
    const g = h<6 ? 'ночи' : h<12 ? 'утро' : h<18 ? 'день' : 'вечер';
    document.getElementById('greeting').innerHTML = g==='ночи'
      ? `Доброй <span class="grad-word">ночи</span>`
      : `${g==='утро'?'Доброе':'Добрый'} <span class="grad-word">${g}</span>`;
    const d = new Date();
    const days=['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
    const months=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    document.getElementById('dateLine').textContent = `${days[d.getDay()][0].toUpperCase()+days[d.getDay()].slice(1)}, ${d.getDate()} ${months[d.getMonth()]}`;

    const total = allItemsFlat().length;
    document.getElementById('itemCount').textContent = `${total} ${wordVeshi(total)}`;
    document.getElementById('lookCount').textContent = `${state.looks.length} ${wordLuki(state.looks.length)}`;
    document.getElementById('bentoItemsCount').textContent = `${total} предметов`;
    document.getElementById('bentoLooksCount').textContent = `${state.looks.length} образов`;
    document.getElementById('pStat1').textContent = total;
    document.getElementById('pStat2').textContent = state.looks.length;
  }

  function itemCardHTML(cat,item){
    const visual = item.image ? `<img src="${item.image}">` : icon(cat);
    return `<div class="item-card" data-cat="${cat}" data-id="${item.id}">
      <span class="del" data-del="${cat}:${item.id}">×</span>
      <div class="icon-circle">${visual}</div>
      <span class="name">${item.name}</span>
    </div>`;
  }

  function renderRecentStrip(){
    const flat = allItemsFlat();
    const recent = flat.slice(-8).reverse();
    const el = document.getElementById('recentStrip');
    if(recent.length===0){ el.innerHTML = `<div class="empty-hint" style="width:100%;">Добавь первую вещь — она появится здесь</div>`; return; }
    el.innerHTML = recent.map(it=>itemCardHTML(it.cat,it)).join('');
  }

  function renderItemsGrid(){
    const grid = document.getElementById('itemsGrid');
    let flat = allItemsFlat();
    if(currentFilter!=='all'){ flat = flat.filter(i=>i.cat===currentFilter); }
    if(flat.length===0){ grid.innerHTML = `<div class="empty-hint" style="grid-column:1/-1;">В этой категории пока пусто</div>`; return; }
    grid.innerHTML = flat.map(it=>itemCardHTML(it.cat,it)).join('');
  }

  function collageSlotHTML(cat, id){
    if(!cat || !id) return `<div class="slot empty"></div>`;
    const it = findItem(cat,id);
    if(!it) return `<div class="slot empty"></div>`;
    return `<div class="slot">${it.image ? `<img src="${it.image}" style="object-fit:contain;padding:4px;">` : icon(cat)}</div>`;
  }

  function lookCardHTML(look){
    const allSelected = [];
    ['headwear','tops','bottoms','shoes'].forEach(c => {
      if(look.items[c]) look.items[c].forEach(id => allSelected.push({cat:c, id}));
    });

    const slots = [];
    for(let i=0; i<4; i++) {
      if(i < allSelected.length) slots.push(collageSlotHTML(allSelected[i].cat, allSelected[i].id));
      else slots.push(collageSlotHTML(null, null));
    }

    return `<div class="look-card glass-card" data-look="${look.id}">
      <div class="look-collage">${slots.join('')}</div>
      <div class="look-info">
        <p class="name">${look.name}</p>
        <p class="meta">${allSelected.length} вещей · ${look.dateLabel}</p>
      </div>
      <svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>`;
  }

  function renderLooksGrid(targetId, limit){
    const el = document.getElementById(targetId);
    let list = state.looks.slice().reverse();
    if(limit) list = list.slice(0,limit);
    if(list.length===0){
      el.innerHTML = `<div class="empty-hint">Пока нет ни одного лука. Нажми «Папка», чтобы собрать первый образ.</div>`;
      return;
    }
    el.innerHTML = list.map(lookCardHTML).join('');
  }

  function renderAll(){
    renderHeader();
    renderRecentStrip();
    renderItemsGrid();
    renderLooksGrid('looksGrid', null);
    renderLooksGrid('recentLooks', 2);
  }

  const overlay = document.getElementById('overlay');
  const sheet = document.getElementById('sheet');
  const sheetInner = document.getElementById('sheetInner');
  function openSheet(html){ sheetInner.innerHTML = html; overlay.classList.add('show'); sheet.classList.add('show'); }
  function closeSheet(){ overlay.classList.remove('show'); sheet.classList.remove('show'); tempPhoto=null; editingLookId=null; }
  overlay.addEventListener('click', closeSheet);

  function addItemSheetHTML(defaultCat){
    const chips = Object.keys(CATS).map(c=>`<button class="chip ${c===defaultCat?'active':''}" data-catchip="${c}">${CATS[c].label.replace(/\d\.\s/,'')}</button>`).join('');
    return `
      <h3>Новая вещь</h3>
      <div class="field-label">Категория</div>
      <div class="chip-row" id="catChips">${chips}</div>
      <div class="field-label">Фото (фон удалится автоматически)</div>
      <label class="upload-box" id="uploadBox">
        <span id="uploadPreview">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 17l4.5-5.5a2 2 0 0 1 3 0L16 17M14 12l1.5-1.8a2 2 0 0 1 3 0L21 13" stroke="#A79E8C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="5" width="18" height="14" rx="2" stroke="#A79E8C" stroke-width="1.5"/></svg>
        </span>
        <span class="hint">Загрузить фото вещи</span>
        <input type="file" accept="image/*" id="photoInput">
      </label>
      <div class="field-label">Название</div>
      <input class="text-input" id="itemNameInput" placeholder="Например, «Бомбер оверсайз»">
      <button class="primary-btn" id="saveItemBtn">Добавить в гардероб</button>
    `;
  }

  function openAddItem(defaultCat){
    openSheet(addItemSheetHTML(defaultCat));
    let currentCat = defaultCat;
    document.getElementById('catChips').addEventListener('click', e=>{
      const b = e.target.closest('[data-catchip]'); if(!b) return;
      currentCat = b.dataset.catchip;
      document.querySelectorAll('#catChips .chip').forEach(c=>c.classList.remove('active'));
      b.classList.add('active');
    });
    document.getElementById('photoInput').addEventListener('change', async (e)=>{
      const f = e.target.files[0]; if(!f) return;
      document.getElementById('uploadPreview').innerHTML = `<span style="font-size:11px;color:var(--ink-soft);">Обработка...</span>`;
      tempPhoto = await removeBackgroundAuto(f);
      document.getElementById('uploadPreview').innerHTML = `<img src="${tempPhoto}" style="background:var(--card-empty-bg);padding:4px;border-radius:12px;">`;
    });
    document.getElementById('saveItemBtn').addEventListener('click', ()=>{
      const name = document.getElementById('itemNameInput').value.trim() || 'Новая вещь';
      state.wardrobe[currentCat].push({id:uid(), name, image:tempPhoto});
      save(); renderAll(); closeSheet();
    });
  }

  function pickGroupHTML(cat){
    const items = state.wardrobe[cat];
    if(items.length===0) return '';
    const isTop = cat === 'tops';
    const hint = isTop ? ' <span style="text-transform:none;opacity:.6;font-size:9px;">(можно несколько)</span>' : '';
    return `<div class="pick-group">
      <div class="pick-group-title">${CATS[cat].label.replace(/\d\.\s/,'')}${hint}</div>
      <div class="pick-strip" data-pickcat="${cat}">
        ${items.map(it=>`<div class="pick-item ${lookSelection[cat].includes(it.id)?'selected':''}" data-pickid="${it.id}">
          <div class="icon-circle">${it.image ? `<img src="${it.image}">` : icon(cat)}</div>
          <span class="n">${it.name}</span>
        </div>`).join('')}
      </div>
    </div>`;
  }

  function lookSheetHTML(prefillName, isEdit = false){
    const hasAny = allItemsFlat().length>0;
    if(!hasAny){
      return `<h3>${isEdit ? 'Редактирование лука' : 'Новая папка лука'}</h3><div class="empty-hint">Сначала добавь хотя бы одну вещь в гардероб.</div>`;
    }
    return `
      <h3>${isEdit ? 'Редактировать лук' : 'Новая папка лука'}</h3>
      <div class="field-label">Название</div>
      <input class="text-input" id="lookNameInput" value="${prefillName||''}" placeholder="Например, «Прогулка в парке»">
      <div class="field-label" style="margin-top:18px;">Выбери или замени вещи</div>
      <div class="pick-groups">${Object.keys(CATS).map(pickGroupHTML).join('')}</div>
      <button class="primary-btn" id="saveLookBtn">${isEdit ? 'Сохранить изменения' : 'Сохранить в «Мои луки»'}</button>
      ${!isEdit ? `<button class="secondary-btn" id="shuffleBtn">Перемешать случайно</button>` : ''}
    `;
  }
  function randomName(){
    const a=['Городской','Лёгкий','Дождливый','Утренний','Вечерний','Смелый','Спокойный','Уютный'];
    const b=['выход','маршрут','вайб','стиль','образ','настрой'];
    return `${a[Math.floor(Math.random()*a.length)]} ${b[Math.floor(Math.random()*b.length)]}`;
  }
  function rollRandom(){
    Object.keys(CATS).forEach(cat=>{
      const items = state.wardrobe[cat];
      if (items.length) {
        lookSelection[cat] = [items[Math.floor(Math.random()*items.length)].id];
      } else {
        lookSelection[cat] = [];
      }
    });
  }

  function openLookSheet(random, editLook = null){
    editingLookId = editLook ? editLook.id : null;
    if(editLook){
      lookSelection = {
        headwear: [...(editLook.items.headwear || [])],
        tops: [...(editLook.items.tops || [])],
        bottoms: [...(editLook.items.bottoms || [])],
        shoes: [...(editLook.items.shoes || [])]
      };
      openSheet(lookSheetHTML(editLook.name, true));
    } else {
      if(random){ rollRandom(); } else { lookSelection = {headwear:[],tops:[],bottoms:[],shoes:[]}; }
      openSheet(lookSheetHTML(random ? randomName() : '', false));
    }
    if(allItemsFlat().length>0) bindLookSheet();
  }

  function bindLookSheet(){
    sheetInner.addEventListener('click', function(e){
      const pick = e.target.closest('[data-pickid]');
      if(pick){
        const cat = pick.closest('[data-pickcat]').dataset.pickcat;
        const id = pick.dataset.pickid;
        const isTop = cat === 'tops';

        if(isTop) {
          if(lookSelection[cat].includes(id)) {
            lookSelection[cat] = lookSelection[cat].filter(i => i !== id);
          } else {
            lookSelection[cat].push(id);
          }
        } else {
          if(lookSelection[cat].includes(id)) {
            lookSelection[cat] = [];
          } else {
            lookSelection[cat] = [id];
          }
        }

        sheetInner.querySelector('.pick-groups').innerHTML = Object.keys(CATS).map(pickGroupHTML).join('');
      }
    });

    const shuffleBtn = document.getElementById('shuffleBtn');
    if(shuffleBtn) {
      shuffleBtn.addEventListener('click', ()=>{
        rollRandom();
        document.getElementById('lookNameInput').value = randomName();
        sheetInner.querySelector('.pick-groups').innerHTML = Object.keys(CATS).map(pickGroupHTML).join('');
      });
    }

    document.getElementById('saveLookBtn').addEventListener('click', ()=>{
      const name = document.getElementById('lookNameInput').value.trim() || randomName();
      const itemsCopy = {
        headwear: [...lookSelection.headwear],
        tops: [...lookSelection.tops],
        bottoms: [...lookSelection.bottoms],
        shoes: [...lookSelection.shoes]
      };

      if(editingLookId) {
        const look = state.looks.find(l => l.id === editingLookId);
        if(look) {
          look.name = name;
          look.items = itemsCopy;
        }
        save();
        renderAll();
        openLookDetail(editingLookId);
      } else {
        const d = new Date();
        const dateLabel = `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}`;
        state.looks.push({id:uid(), name, items:itemsCopy, dateLabel});
        save();
        renderAll();
        closeSheet();
      }
    });
  }

  function lookDetailHTML(look){
    const order = ['headwear','tops','bottoms','shoes'];

    const listHTML = order.map(cat => {
      const ids = look.items[cat] || [];

      if(ids.length === 0) {
        return `
          <div class="look-canvas-section">
            <div class="look-canvas-title">${CATS[cat].label}</div>
            <div class="big-cloth-card empty" data-editlookbtn="${look.id}">
              <span>+ Нажми, чтобы добавить вещь</span>
            </div>
          </div>`;
      }

      return `
        <div class="look-canvas-section">
          <div class="look-canvas-title">${CATS[cat].label}</div>
          ${ids.map(id => {
            const it = findItem(cat, id);
            if(!it) return '';
            return `
              <div class="big-cloth-card">
                <span class="remove-from-look" data-removestuff="${look.id}:${cat}:${id}" title="Убрать из лука">×</span>
                <div class="big-cloth-img">
                  ${it.image ? `<img src="${it.image}">` : icon(cat)}
                </div>
                <div class="big-cloth-footer">
                  <b>${it.name}</b>
                  <span>${CATS[cat].short}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>`;
    }).join('');

    return `
      <h3>${look.name}</h3>
      <div class="look-canvas">
        ${listHTML}
      </div>
      <button class="edit-btn" data-editlookbtn="${look.id}">✏️ Редактировать лук / добавить вещи</button>
      <button class="danger-btn" data-deletelook="${look.id}">Удалить лук целиком</button>
    `;
  }

  function openLookDetail(id){
    const look = state.looks.find(l=>l.id===id);
    if(!look) return;
    openSheet(lookDetailHTML(look));

    sheetInner.querySelector('[data-deletelook]').addEventListener('click', ()=>{
      state.looks = state.looks.filter(l=>l.id!==id);
      save(); renderAll(); closeSheet();
    });

    sheetInner.querySelectorAll('[data-editlookbtn]').forEach(btn => {
      btn.addEventListener('click', ()=>{
        openLookSheet(false, look);
      });
    });

    sheetInner.querySelectorAll('[data-removestuff]').forEach(btn => {
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const [lookId, cat, itemId] = btn.dataset.removestuff.split(':');
        const targetLook = state.looks.find(l => l.id === lookId);
        if(targetLook && targetLook.items[cat]) {
          targetLook.items[cat] = targetLook.items[cat].filter(i => i !== itemId);
          save();
          renderAll();
          openLookDetail(lookId);
        }
      });
    });
  }

  function goto(tab){
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    document.getElementById('screen'+tab[0].toUpperCase()+tab.slice(1)).classList.add('active');
    document.querySelectorAll('.tab[data-tab]').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  }
  document.querySelectorAll('.tab[data-tab]').forEach(btn=> btn.addEventListener('click', ()=>goto(btn.dataset.tab)));
  document.querySelectorAll('[data-goto]').forEach(el=> el.addEventListener('click', ()=>goto(el.dataset.goto)));

  document.getElementById('homeAddBtn').addEventListener('click', ()=> openAddItem('headwear'));
  document.getElementById('itemsAddBtn').addEventListener('click', ()=> openAddItem(currentFilter==='all'?'headwear':currentFilter));
  document.getElementById('looksAddBtn').addEventListener('click', ()=> openLookSheet(false));
  document.getElementById('rollBtnLooks').addEventListener('click', ()=> openLookSheet(true));

  document.getElementById('filterRow').addEventListener('click', e=>{
    const b = e.target.closest('[data-filter]'); if(!b) return;
    currentFilter = b.dataset.filter;
    document.querySelectorAll('#filterRow .filter-chip').forEach(c=>c.classList.remove('active'));
    b.classList.add('active');
    renderItemsGrid();
  });

  document.body.addEventListener('click', e=>{
    const del = e.target.closest('[data-del]');
    if(del){
      const [cat,id] = del.dataset.del.split(':');
      state.wardrobe[cat] = state.wardrobe[cat].filter(i=>i.id!==id);
      state.looks.forEach(look => {
        if (look.items[cat]) {
          look.items[cat] = look.items[cat].filter(idInLook => idInLook !== id);
        }
      });
      save(); renderAll();
      return;
    }
    const lookCard = e.target.closest('[data-look]');
    if(lookCard){ openLookDetail(lookCard.dataset.look); return; }
  });

  // === BACKUP FUNCTIONALITY ===
  function exportState() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wardrobe_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importState(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        // Basic validation
        if (imported && typeof imported === 'object' &&
            imported.wardrobe && imported.looks &&
            Array.isArray(imported.wardrobe.headwear) &&
            Array.isArray(imported.wardrobe.tops) &&
            Array.isArray(imported.wardrobe.bottoms) &&
            Array.isArray(imported.wardrobe.shoes) &&
            Array.isArray(imported.looks)) {
          state = imported;
          save();
          renderAll();
          alert('Резервная копия успешно импортирована.');
        } else {
          throw new Error('Неверный формат файла резервной копии.');
        }
      } catch (err) {
        console.error(err);
        alert('Ошибка импорта: ' + err.message);
      }
    };
    reader.onerror = () => alert('Не удалось прочитать файл.');
    reader.readAsText(file);
  }

  // Initialize backup UI listeners after DOM loads
  document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('exportBackupBtn');
    const importBtn = document.getElementById('importBackupBtn');
    const fileInput = document.getElementById('backupFileInput');
    if (exportBtn) exportBtn.addEventListener('click', exportState);
    if (importBtn) importBtn.addEventListener('click', () => fileInput.click());
    if (fileInput) fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) importState(file);
    });
  });

  load();
})();