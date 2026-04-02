
const REPO = "owner/repo";
const FILE = "data.json";

function saveToGithub(){
  let token = localStorage.getItem("gh_token");
  if(!token){
    token = prompt("GitHub token");
    localStorage.setItem("gh_token", token);
  }

  fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`,{
    method:"PUT",
    headers:{Authorization:"token "+token},
    body:JSON.stringify({
      message:"update data",
      content:btoa(unescape(encodeURIComponent(JSON.stringify(state.data,null,2))))
    })
  }).then(()=>alert("Сохранено"));
}

const APP_PASSWORD = '1234';
const AUTH_KEY = 'private-buylist-auth';
const STORAGE_KEY = 'private-buylist-data-v1';

const MARKETPLACES = ['Ozon', 'Wildberries', 'Яндекс Маркет', 'AliExpress', 'Avito', 'Другое'];
const STATUSES = [
  { value: 'planned', label: 'Купить' },
  { value: 'deferred', label: 'Отложено' },
  { value: 'bought', label: 'Куплено' },
];

const $ = (id) => document.getElementById(id);
const byQuery = (q) => document.querySelector(q);
const formatCurrency = (value) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(Number(value) || 0);
const uid = () => Math.random().toString(36).slice(2, 10);
const escapeHtml = (value = '') => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

function createSeedData() {
  const suspension = uid();
  const rear = uid();
  const front = uid();
  const engine = uid();
  const oils = uid();

  return {
    categories: [
      {
        id: suspension,
        name: 'Подвеска',
        subcategories: [
          { id: rear, name: 'Задняя подвеска' },
          { id: front, name: 'Передняя подвеска' },
        ],
      },
      {
        id: engine,
        name: 'Двигатель',
        subcategories: [
          { id: oils, name: 'Масла и жидкости' },
        ],
      },
    ],
    items: [
      {
        id: uid(),
        title: 'Амортизатор задний SS20',
        marketplace: 'Ozon',
        url: 'https://www.ozon.ru/',
        image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=80',
        price: 3200,
        qty: 2,
        categoryId: suspension,
        subcategoryId: rear,
        status: 'planned',
        favorite: true,
        bought: false,
        note: 'Сравнить с Trialli и Fenox',
        createdAt: new Date().toISOString(),
      },
      {
        id: uid(),
        title: 'Шаровая опора',
        marketplace: 'Wildberries',
        url: 'https://www.wildberries.ru/',
        image: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=900&q=80',
        price: 890,
        qty: 2,
        categoryId: suspension,
        subcategoryId: front,
        status: 'deferred',
        favorite: false,
        bought: false,
        note: 'Уточнить артикул перед заказом',
        createdAt: new Date().toISOString(),
      },
      {
        id: uid(),
        title: 'Масло 5W-40',
        marketplace: 'Яндекс Маркет',
        url: 'https://market.yandex.ru/',
        image: 'https://images.unsplash.com/photo-1613214149922-f1809c99b414?auto=format&fit=crop&w=900&q=80',
        price: 2550,
        qty: 1,
        categoryId: engine,
        subcategoryId: oils,
        status: 'planned',
        favorite: false,
        bought: false,
        note: 'К следующей замене вместе с фильтром',
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedData();
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.categories) || !Array.isArray(data.items)) return createSeedData();
    return data;
  } catch {
    return createSeedData();
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

const state = {
  currentList: 'Main',

  data: { lists: { Main: loadData() } },
  filters: {
    search: '',
    marketplace: 'all',
    status: 'all',
    category: 'all',
    favoriteOnly: false,
    boughtOnly: false,
  },
  editingId: null,
};

function init() {
  fillSelect($('marketplaceFilter'), [{ value: 'all', label: 'Все' }, ...MARKETPLACES.map(x => ({ value: x, label: x }))]);
  fillSelect($('statusFilter'), [{ value: 'all', label: 'Все' }, ...STATUSES]);
  fillSelect($('itemMarketplace'), MARKETPLACES.map(x => ({ value: x, label: x })));
  fillSelect($('itemStatus'), STATUSES);

  bindEvents();
  updateCategoryRelatedSelects();
  refreshAuth();
  render();
}

function fillSelect(select, options) {
  select.innerHTML = options.map(opt => `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`).join('');
}

function bindEvents() {
  $('loginForm').addEventListener('submit', handleLogin);
  $('logoutBtn').addEventListener('click', handleLogout);

  $('searchInput').addEventListener('input', (e) => { state.filters.search = e.target.value.trim(); render(); });
  $('marketplaceFilter').addEventListener('change', (e) => { state.filters.marketplace = e.target.value; render(); });
  $('statusFilter').addEventListener('change', (e) => { state.filters.status = e.target.value; render(); });
  $('categoryFilter').addEventListener('change', (e) => { state.filters.category = e.target.value; render(); });
  $('favoriteOnly').addEventListener('change', (e) => { state.filters.favoriteOnly = e.target.checked; render(); });
  $('boughtOnly').addEventListener('change', (e) => { state.filters.boughtOnly = e.target.checked; render(); });

  $('addCategoryBtn').addEventListener('click', addCategory);
  $('addSubcategoryBtn').addEventListener('click', addSubcategory);

  $('openItemModalBtn').addEventListener('click', () => openItemModal());
  $('saveItemBtn').addEventListener('click', saveItemFromModal);
  $('itemCategory').addEventListener('change', syncModalSubcategories);

  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', closeItemModal);
  });

  $('categorySections').addEventListener('click', handleListActions);
}

function handleLogin(e) {
  e.preventDefault();
  const value = $('passwordInput').value;
  if (value === APP_PASSWORD) {
    localStorage.setItem(AUTH_KEY, 'ok');
    $('authError').textContent = '';
    refreshAuth();
  } else {
    $('authError').textContent = 'Неверный пароль';
  }
}

function handleLogout() {
  localStorage.removeItem(AUTH_KEY);
  refreshAuth();
}

function refreshAuth() {
  const isAuth = localStorage.getItem(AUTH_KEY) === 'ok';
  $('authScreen').classList.toggle('hidden', isAuth);
  $('appScreen').classList.toggle('hidden', !isAuth);
}

function updateCategoryRelatedSelects() {
  fillSelect(
    $('categoryFilter'),
    [{ value: 'all', label: 'Все' }, ...state.data.lists[state.currentList].categories.map(cat => ({ value: cat.id, label: cat.name }))]
  );
  fillSelect(
    $('subCategoryParentSelect'),
    state.data.lists[state.currentList].categories.map(cat => ({ value: cat.id, label: cat.name }))
  );
  fillSelect(
    $('itemCategory'),
    state.data.lists[state.currentList].categories.map(cat => ({ value: cat.id, label: cat.name }))
  );

  if (state.data.lists[state.currentList].categories.length) {
    if (!$('subCategoryParentSelect').value) $('subCategoryParentSelect').value = state.data.lists[state.currentList].categories[0].id;
    if (!$('itemCategory').value) $('itemCategory').value = state.data.lists[state.currentList].categories[0].id;
  }

  syncModalSubcategories();
}

function syncModalSubcategories() {
  const categoryId = $('itemCategory').value;
  const category = state.data.lists[state.currentList].categories.find(x => x.id === categoryId);
  const subs = category?.subcategories || [];
  fillSelect($('itemSubcategory'), subs.map(sub => ({ value: sub.id, label: sub.name })));
}

function addCategory() {
  const input = $('newCategoryName');
  const name = input.value.trim();
  if (!name) return;
  state.data.lists[state.currentList].categories.push({ id: uid(), name, subcategories: [] });
  input.value = '';
  saveData();
  updateCategoryRelatedSelects();
  render();
}

function addSubcategory() {
  const parentId = $('subCategoryParentSelect').value;
  const name = $('newSubcategoryName').value.trim();
  if (!parentId || !name) return;
  const category = state.data.lists[state.currentList].categories.find(x => x.id === parentId);
  if (!category) return;
  category.subcategories.push({ id: uid(), name });
  $('newSubcategoryName').value = '';
  saveData();
  updateCategoryRelatedSelects();
  render();
}

function openItemModal(item = null) {
  state.editingId = item?.id || null;
  $('itemModalTitle').textContent = item ? 'Редактировать товар' : 'Новый товар';

  if (item) {
    $('itemTitle').value = item.title || '';
    $('itemMarketplace').value = item.marketplace || MARKETPLACES[0];
    $('itemStatus').value = item.status || 'planned';
    $('itemUrl').value = item.url || '';
    $('itemImage').value = item.image || '';
    $('itemPrice').value = item.price || '';
    $('itemQty').value = item.qty || 1;
    $('itemCategory').value = item.categoryId || state.data.lists[state.currentList].categories[0]?.id || '';
    syncModalSubcategories();
    $('itemSubcategory').value = item.subcategoryId || '';
    $('itemNote').value = item.note || '';
    $('itemFavorite').checked = !!item.favorite;
  } else {
    $('itemTitle').value = '';
    $('itemMarketplace').value = MARKETPLACES[0];
    $('itemStatus').value = 'planned';
    $('itemUrl').value = '';
    $('itemImage').value = '';
    $('itemPrice').value = '';
    $('itemQty').value = 1;
    $('itemCategory').value = state.data.lists[state.currentList].categories[0]?.id || '';
    syncModalSubcategories();
    $('itemNote').value = '';
    $('itemFavorite').checked = false;
  }

  $('itemModal').classList.remove('hidden');
}

function closeItemModal() {
  $('itemModal').classList.add('hidden');
}

function saveItemFromModal() {
  const title = $('itemTitle').value.trim();
  const categoryId = $('itemCategory').value;
  const subcategoryId = $('itemSubcategory').value;
  if (!title || !categoryId || !subcategoryId) {
    alert('Заполни название, категорию и подкатегорию.');
    return;
  }

  const prepared = {
    id: state.editingId || uid(),
    title,
    marketplace: $('itemMarketplace').value,
    status: $('itemStatus').value,
    url: $('itemUrl').value.trim(),
    image: $('itemImage').value.trim(),
    price: Number($('itemPrice').value) || 0,
    qty: Math.max(1, Number($('itemQty').value) || 1),
    categoryId,
    subcategoryId,
    note: $('itemNote').value.trim(),
    favorite: $('itemFavorite').checked,
    bought: $('itemStatus').value === 'bought',
    createdAt: new Date().toISOString(),
  };

  if (state.editingId) {
    const old = state.data.lists[state.currentList].items.find(i => i.id === state.editingId);
    prepared.createdAt = old?.createdAt || prepared.createdAt;
    state.data.lists[state.currentList].items = state.data.lists[state.currentList].items.map(item => item.id === state.editingId ? prepared : item);
  } else {
    state.data.lists[state.currentList].items.unshift(prepared);
  }

  saveData();
  render();
  closeItemModal();
}

function handleListActions(e) {
  const actionEl = e.target.closest('[data-action]');
  if (!actionEl) return;
  const action = actionEl.dataset.action;
  const id = actionEl.dataset.id;
  const item = state.data.lists[state.currentList].items.find(x => x.id === id);
  if (!item) return;

  if (action === 'toggle-bought') {
    item.bought = !item.bought;
    item.status = item.bought ? 'bought' : 'planned';
  }
  if (action === 'toggle-favorite') {
    item.favorite = !item.favorite;
  }
  if (action === 'edit') {
    openItemModal(item);
    return;
  }
  if (action === 'delete') {
    if (!confirm('Удалить этот товар?')) return;
    state.data.lists[state.currentList].items = state.data.lists[state.currentList].items.filter(x => x.id !== id);
  }

  saveData();
  render();
}

function getFilteredItems() {
  return state.data.lists[state.currentList].items.filter(item => {
    const text = [item.title, item.note, item.marketplace].join(' ').toLowerCase();
    const matchesSearch = !state.filters.search || text.includes(state.filters.search.toLowerCase());
    const matchesMarketplace = state.filters.marketplace === 'all' || item.marketplace === state.filters.marketplace;
    const matchesStatus = state.filters.status === 'all' || item.status === state.filters.status;
    const matchesCategory = state.filters.category === 'all' || item.categoryId === state.filters.category;
    const matchesFavorite = !state.filters.favoriteOnly || item.favorite;
    const matchesBought = !state.filters.boughtOnly || item.bought;
    return matchesSearch && matchesMarketplace && matchesStatus && matchesCategory && matchesFavorite && matchesBought;
  });
}

function render() {
  updateCategoryRelatedSelects();
  renderStats();
  renderSections();
}

function renderStats() {
  const active = state.data.lists[state.currentList].items.filter(item => !item.bought);
  const activeSum = active.reduce((sum, item) => sum + item.price * item.qty, 0);
  const boughtSum = state.data.lists[state.currentList].items.filter(item => item.bought).reduce((sum, item) => sum + item.price * item.qty, 0);
  const favorites = state.data.lists[state.currentList].items.filter(item => item.favorite).length;

  $('statActiveCount').textContent = String(active.length);
  $('statActiveSum').textContent = formatCurrency(activeSum);
  $('statBoughtSum').textContent = formatCurrency(boughtSum);
  $('statFavoriteCount').textContent = String(favorites);
}

function renderSections() {
  const filteredItems = getFilteredItems();
  $('resultsInfo').textContent = `Показано товаров: ${filteredItems.length}`;

  const sectionsHtml = state.data.lists[state.currentList].categories.map(category => {
    const categoryItems = filteredItems.filter(item => item.categoryId === category.id);
    if (!categoryItems.length) return '';

    const categoryTotal = categoryItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const subHtml = category.subcategories.map(sub => {
      const subItems = categoryItems.filter(item => item.subcategoryId === sub.id);
      if (!subItems.length) return '';
      const subTotal = subItems.reduce((sum, item) => sum + item.price * item.qty, 0);

      return `
        <div class="subcategory-block">
          <div class="subcategory-header">
            <div class="subcategory-title">${escapeHtml(sub.name)}</div>
            <div class="sum-pill">${formatCurrency(subTotal)}</div>
          </div>
          <div class="items-list">
            ${subItems.map(renderItemCard).join('')}
          </div>
        </div>
      `;
    }).join('');

    return `
      <section class="category-block">
        <div class="category-header">
          <div class="category-title">${escapeHtml(category.name)}</div>
          <div class="sum-pill">${formatCurrency(categoryTotal)}</div>
        </div>
        ${subHtml}
      </section>
    `;
  }).join('');

  $('categorySections').innerHTML = sectionsHtml;
  $('emptyState').classList.toggle('hidden', !!filteredItems.length);
}

function renderItemCard(item) {
  const category = state.data.lists[state.currentList].categories.find(x => x.id === item.categoryId);
  const sub = category?.subcategories.find(x => x.id === item.subcategoryId);
  const total = item.price * item.qty;
  const statusLabel = STATUSES.find(x => x.value === item.status)?.label || 'Купить';

  return `
    <article class="item-card">
      <div class="item-image">
        ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">` : `<div class="item-image-placeholder">📦</div>`}
        <div class="item-badges">
          <div class="badge">${escapeHtml(item.marketplace)}</div>
          ${item.favorite ? `<div class="badge favorite">Избранное</div>` : ''}
          <div class="badge">${escapeHtml(statusLabel)}</div>
        </div>
      </div>
      <div class="item-body">
        <div class="item-top">
          <div>
            <h3 class="item-title">${escapeHtml(item.title)}</h3>
            <div class="item-meta">${escapeHtml(category?.name || '')} → ${escapeHtml(sub?.name || '')}</div>
            ${item.note ? `<div class="item-note">${escapeHtml(item.note)}</div>` : ''}
          </div>
          <div class="item-pricebox">
            <div class="minor">Цена × ${item.qty} шт.</div>
            <div class="single">${formatCurrency(item.price)}</div>
            <div class="total">${formatCurrency(total)}</div>
          </div>
        </div>
        <div class="item-actions">
          ${item.url ? `<a class="link-btn" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Открыть ссылку</a>` : ''}
          <button class="action-btn" data-action="toggle-bought" data-id="${item.id}">${item.bought ? 'Вернуть в список' : 'Отметить купленным'}</button>
          <button class="action-btn" data-action="toggle-favorite" data-id="${item.id}">${item.favorite ? 'Убрать из избранного' : 'В избранное'}</button>
          <button class="action-btn" data-action="edit" data-id="${item.id}">Редактировать</button>
          <button class="danger-btn" data-action="delete" data-id="${item.id}">Удалить</button>
        </div>
      </div>
    </article>
  `;
}

init();
