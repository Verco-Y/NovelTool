const DB_NAME = 'tiandao_archive_db';
const DB_VERSION = 1;
const STORE_NAME = 'archive_data';
const STORAGE_KEY = 'tiandao_archive'; // 旧 localStorage key，用于迁移

/**
 * 打开 IndexedDB 数据库
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(new Error('IndexedDB 打开失败: ' + event.target.error));
    };
  });
}

/**
 * 从 localStorage 迁移旧数据到 IndexedDB
 * 如果 IndexedDB 中已有数据则不覆盖
 */
async function migrateFromLocalStorage(db) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    // 检查 IndexedDB 是否已有数据
    const existing = await loadFromDB(db);
    if (existing) return false; // 已有数据，不覆盖

    const data = JSON.parse(raw);
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id: STORAGE_KEY, data });
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });

    // 迁移成功后清理 localStorage（保留备份，不删除）
    console.log('✅ 数据已从 localStorage 迁移至 IndexedDB');
    return true;
  } catch (e) {
    console.warn('数据迁移失败，仍使用 localStorage:', e);
    return false;
  }
}

/**
 * 从 IndexedDB 读取数据
 */
async function loadFromDB(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(STORAGE_KEY);

    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.data : null);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * 写入数据到 IndexedDB
 */
async function saveToDB(db, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id: STORAGE_KEY, data });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

let dbInstance = null;

async function getDB() {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB();
  await migrateFromLocalStorage(dbInstance);
  return dbInstance;
}

/**
 * 从 IndexedDB 读取所有档案数据
 * 如果 IndexedDB 不可用，降级到 localStorage
 */
export async function loadArchive() {
  try {
    const db = await getDB();
    const data = await loadFromDB(db);
    if (data) {
      return {
        characters: data.characters || [],
        clans: data.clans || [],
      };
    }
    return null;
  } catch (e) {
    console.warn('IndexedDB 读取失败，尝试 localStorage:', e);
    // 降级到 localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return {
        characters: data.characters || [],
        clans: data.clans || [],
      };
    } catch (err) {
      console.error('读取档案失败:', err);
      return null;
    }
  }
}

/**
 * 将档案数据写入 IndexedDB
 * 同时同步写入 localStorage 作为备份
 */
export async function saveArchive(data) {
  try {
    const db = await getDB();
    await saveToDB(db, data);
    // 同步写入 localStorage 作为双保险
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage 满了不影响 IndexedDB 存储
    }
    return true;
  } catch (e) {
    console.error('保存档案失败:', e);
    // 降级到 localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 导出为 JSON 文件并触发下载
 */
export function exportToJson(data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `archivio_data_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 读取上传的 JSON 文件
 */
export function importFromJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (err) {
        reject(new Error('JSON 解析失败，请检查文件格式'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

/**
 * 清空所有数据（IndexedDB + localStorage）
 */
export async function clearArchive() {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(STORAGE_KEY);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // 忽略错误
  }
  localStorage.removeItem(STORAGE_KEY);
}