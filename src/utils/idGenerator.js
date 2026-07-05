/**
 * 生成唯一 ID
 * @returns {string} 格式如: char_7a3b2f1c
 */
export function generateId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `char_${timestamp}_${random}`;
}