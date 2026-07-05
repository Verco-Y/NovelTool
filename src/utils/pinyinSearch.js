import { pinyin } from 'pinyin-pro';

/**
 * 获取字符串的拼音首字母（用于快速搜索）
 * 例如："柳如烟" → "lry"
 */
export function getPinyinInitials(str) {
  if (!str) return '';
  try {
    const py = pinyin(str, { toneType: 'none', type: 'array' });
    return py.map(p => p.charAt(0)).join('').toLowerCase();
  } catch {
    // 降级：直接取汉字首字母拼音
    return str.charAt(0).toLowerCase();
  }
}

/**
 * 拼音模糊搜索
 * @param {string} query - 用户输入的搜索词
 * @param {Array} items - 候选列表，每项需包含 name 属性
 * @returns {Array} 匹配的项
 */
export function pinyinSearch(query, items) {
  if (!query || !query.trim()) return items;
  const q = query.trim().toLowerCase();

  return items.filter(item => {
    const name = item.name || '';
    const nameLower = name.toLowerCase();

    // 1. 直接中文名包含匹配
    if (nameLower.includes(q)) return true;

    // 2. 拼音首字母匹配（如 "lry" → "柳如烟"）
    const initials = getPinyinInitials(name);
    if (initials.includes(q)) return true;

    // 3. 全拼匹配（如 "liu" → "柳"）
    try {
      const fullPinyin = pinyin(name, { toneType: 'none', type: 'string' }).toLowerCase();
      if (fullPinyin.includes(q)) return true;
    } catch {
      // 忽略拼音错误
    }

    return false;
  });
}