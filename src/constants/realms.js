export const REALMS = [
  { key: 'lianqi', label: '🧘 练气境', order: 0 },
  { key: 'zhuji', label: '📿 筑基境', order: 1 },
  { key: 'yuxu', label: '☁️ 御空境', order: 2 },
  { key: 'jiedan', label: '🟡 结丹境', order: 3 },
  { key: 'yuanying', label: '🪷 元婴境', order: 4 },
  { key: 'faxiang', label: '💫 法相境', order: 5 },
  { key: 'huashen', label: '☯️ 化神境', order: 6 },
];

// 练气境专用：1~13层
export const LIANQI_LAYERS = Array.from({ length: 13 }, (_, i) => `第${['一','二','三','四','五','六','七','八','九','十','十一','十二','十三'][i]}层`);

export const NORMAL_SUB_STAGES = ['初期', '中期', '后期'];

export function getRealmLabels() {
  return REALMS.map(r => r.label);
}

/**
 * 判断是否处于"后期"阶段（用于高亮显示）
 * 练气境：第十层~第十三层
 * 其他：后期
 */
export function isSubStageLate(subStage) {
  if (!subStage) return false;
  if (subStage === '后期') return true;
  // 练气境第十层及以上
  const lateLayerIndex = LIANQI_LAYERS.indexOf(subStage);
  return lateLayerIndex >= 9; // 第十层(index 9) ~ 第十三层(index 12)
}