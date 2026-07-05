import { getRatingStyle } from '../../constants/ratings';

export default function RatingBadge({ rating, size = 'sm' }) {
  const style = getRatingStyle(rating);

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] rounded',
    sm: 'px-2 py-0.5 text-xs rounded-md',
    md: 'px-3 py-1 text-sm rounded-lg',
    lg: 'px-4 py-1.5 text-base rounded-lg',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-0.5 font-medium whitespace-nowrap border
        ${style.bg} ${style.text} ${style.border} ${sizeClasses[size] || sizeClasses.sm}
        ${style.hasCrown ? '' : 'shadow-sm'}
      `}
      title={rating}
    >
      {style.hasCrown && <span className="text-sm">{style.crown}</span>}
      {rating}
    </span>
  );
}