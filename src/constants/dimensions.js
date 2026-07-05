export const DIMENSIONS = [
  { key: 'attack', label: '攻伐/杀伐', icon: '⚔️' },
  { key: 'divine', label: '神识/烛照', icon: '👁️' },
  { key: 'tenacity', label: '不拔/坚韧', icon: '⛰️' },
  { key: 'talent', label: '悟性/资骨', icon: '🪷' },
  { key: 'scheme', label: '城府/弈局', icon: '🧭' },
  { key: 'govern', label: '经纬/治世', icon: '📜' },
  { key: 'charm', label: '风仪/人缘', icon: '🌸' },
  { key: 'looks', label: '皮相/仙姿', icon: '✨' },
];

// 除 👑 以外的 27 个普通评级，按降序排列用于数值映射
const NORMAL_RATINGS = [
  'SSS+', 'SSS', 'SSS-',
  'SS+', 'SS', 'SS-',
  'S+', 'S', 'S-',
  'A+', 'A', 'A-',
  'B+', 'B', 'B-',
  'C+', 'C', 'C-',
  'D+', 'D', 'D-',
  'E+', 'E', 'E-',
  'F+', 'F', 'F-',
];

export const ALL_RATINGS = ['👑 不可观测', ...NORMAL_RATINGS];

// 建立评级→数值索引的快速查找表
const RATING_TO_NUMERIC = {};
NORMAL_RATINGS.forEach((r, i) => {
  // SSS+(i=0)→10, F-(i=26)→1，线性等比分布
  RATING_TO_NUMERIC[r] = 10.0 - (9.0 / 26) * i;
});

/**
 * 评级转数值：SSS+=10, F-=1, 共27级均匀分布在1~10
 * 👑 不可观测 特殊处理，调用方自行溢出
 */
export function ratingToNumeric(rating) {
  if (!rating) return 1.0;
  if (rating === '👑 不可观测') return 10; // 在雷达图中会被溢出
  const val = RATING_TO_NUMERIC[rating];
  return val !== undefined ? val : 1.0;
}