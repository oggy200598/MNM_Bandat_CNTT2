const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', '..', 'data', 'collections.json');

function ensureStore() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(
      STORE_PATH,
      JSON.stringify({ wishlist: {}, compare: {}, savedSearches: {}, nextSavedSearchId: 1 }, null, 2),
      'utf8'
    );
  }
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
}

function saveStore(store) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function getBucket(store, name, key) {
  store[name] ||= {};
  store[name][key] ||= [];
  return store[name][key];
}

function list(storeName, key) {
  const store = ensureStore();
  return [...getBucket(store, storeName, key)];
}

function setList(storeName, key, items) {
  const store = ensureStore();
  store[storeName] ||= {};
  store[storeName][key] = [...items];
  saveStore(store);
  return [...store[storeName][key]];
}

function upsertSavedSearch(key, payload) {
  const store = ensureStore();
  store.savedSearches ||= {};
  const id = String(store.nextSavedSearchId++);
  const current = store.savedSearches[key] || [];
  const next = [
    {
      id,
      name: String(payload.name || payload.title || 'Bộ lọc đã lưu').trim(),
      filters: payload.filters || {},
      created_at: new Date().toISOString(),
    },
    ...current,
  ];
  store.savedSearches[key] = next;
  saveStore(store);
  return next[0];
}

function deleteSavedSearch(key, id) {
  const store = ensureStore();
  const current = store.savedSearches?.[key] || [];
  const next = current.filter((item) => String(item.id) !== String(id));
  if (!store.savedSearches) store.savedSearches = {};
  store.savedSearches[key] = next;
  saveStore(store);
  return current.length !== next.length;
}

module.exports = {
  list,
  setList,
  upsertSavedSearch,
  deleteSavedSearch,
};
