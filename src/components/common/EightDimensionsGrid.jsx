import { DIMENSIONS } from '../../constants/dimensions';
import RatingBadge from './RatingBadge';

/**
 * 八维标签平铺组件
 * 用于人物卡片底部展示八维评级
 */
export default function EightDimensionsGrid({ dimensions, compact = true }) {
  if (!dimensions) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? '' : 'gap-1.5'}`}>
      {DIMENSIONS.map(dim => {
        const rating = dimensions[dim.key];
        if (!rating) return null;
        const name = dim.label.split('/')[0];
        return (
          <div
            key={dim.key}
            className={`inline-flex items-center gap-1 bg-paper-muted border border-paper-border rounded-lg ${
              compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
            }`}
          >
            <span className="text-ink-secondary font-medium">
              {dim.icon} {name}
            </span>
            <RatingBadge
              rating={rating}
              size={compact ? 'xs' : 'sm'}
            />
          </div>
        );
      })}
      {DIMENSIONS.every(d => !dimensions[d.key]) && (
        <span className="text-xs text-gray-500">未设置八维</span>
      )}
    </div>
  );
}