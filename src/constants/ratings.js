/**
 * 天道八维评级色谱映射表
 * 根据输入的评级字符串，返回网游品阶视觉效果
 */
export function getRatingStyle(rating) {
  if (!rating) {
    return {
      bg: 'bg-gray-700',
      text: 'text-gray-300',
      border: 'border-gray-600',
      hasCrown: false,
    };
  }

  // 👑 不可观测 - 透明底色，加粗，皇冠图标
  if (rating.includes('不可观测')) {
    return {
      bg: 'bg-transparent',
      text: 'text-yellow-300 font-bold',
      border: 'border-yellow-500/50',
      hasCrown: true,
      crown: '👑',
    };
  }

  // SSS+ / SSS / SSS- - 烈焰金红
  if (rating.startsWith('SSS')) {
    return {
      bg: 'bg-gradient-to-r from-red-700 to-red-500',
      text: 'text-yellow-300 font-bold',
      border: 'border-red-400',
      hasCrown: false,
    };
  }

  // SS+ / SS / SS- - 炽热橙色
  if (rating.startsWith('SS')) {
    return {
      bg: 'bg-gradient-to-r from-orange-600 to-orange-400',
      text: 'text-white font-bold',
      border: 'border-orange-300',
      hasCrown: false,
    };
  }

  // S+ / S / S- - 尊贵深紫
  if (rating.startsWith('S')) {
    return {
      bg: 'bg-purple-700',
      text: 'text-white font-semibold',
      border: 'border-purple-500',
      hasCrown: false,
    };
  }

  // A / B - 深邃蓝色
  if (rating.startsWith('A') || rating.startsWith('B')) {
    return {
      bg: 'bg-blue-700',
      text: 'text-white',
      border: 'border-blue-500',
      hasCrown: false,
    };
  }

  // C / D - 生机绿色
  if (rating.startsWith('C') || rating.startsWith('D')) {
    return {
      bg: 'bg-green-600',
      text: 'text-white',
      border: 'border-green-400',
      hasCrown: false,
    };
  }

  // E / F- - 暗淡灰色
  if (rating.startsWith('E') || rating.startsWith('F')) {
    return {
      bg: 'bg-gray-600',
      text: 'text-gray-300',
      border: 'border-gray-500',
      hasCrown: false,
    };
  }

  // 默认
  return {
    bg: 'bg-gray-700',
    text: 'text-gray-300',
    border: 'border-gray-600',
    hasCrown: false,
  };
}

/**
 * 获取评级对应的节点颜色（用于关系网络图）
 */
export function getRatingNodeColor(rating) {
  if (!rating) return '#6b7280';
  if (rating.includes('不可观测')) return '#fbbf24';
  if (rating.startsWith('SSS')) return '#ef4444';
  if (rating.startsWith('SS')) return '#f97316';
  if (rating.startsWith('S')) return '#a855f7';
  if (rating.startsWith('A') || rating.startsWith('B')) return '#3b82f6';
  if (rating.startsWith('C') || rating.startsWith('D')) return '#22c55e';
  return '#6b7280';
}

/**
 * 从八维中取最高评级，用于节点颜色
 */
export function getHighestRating(dimensions) {
  if (!dimensions) return null;
  const order = ['👑 不可观测', 'SSS+', 'SSS', 'SSS-', 'SS+', 'SS', 'SS-', 'S+', 'S', 'S-', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E+', 'E', 'E-', 'F+', 'F', 'F-'];
  const values = Object.values(dimensions).filter(Boolean);
  if (values.length === 0) return null;
  for (const r of order) {
    if (values.includes(r)) return r;
  }
  return null;
}