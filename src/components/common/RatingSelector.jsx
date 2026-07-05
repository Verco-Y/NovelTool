import { useState } from 'react';
import { DIMENSIONS } from '../../constants/dimensions';

const MAIN_RATINGS = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', '👑'];

/**
 * 单个评级胶囊选择器（分段胶囊 + 浮层微调）
 */
function SinglePillSelector({ value, onChange, label, icon }) {
  const [showMod, setShowMod] = useState(false);

  const hasUnobservable = value === '👑 不可观测';
  const activeMain = hasUnobservable ? '👑' : (value?.match(/^([A-Z]+)/)?.[1] || '');

  const handleMainClick = (main) => {
    if (main === '👑') {
      onChange('👑 不可观测');
      setShowMod(false);
      return;
    }
    // 如果点击已选中的主级且不在浮层状态，打开浮层
    if (main === activeMain && !hasUnobservable) {
      setShowMod(!showMod);
    } else {
      onChange(main);
      setShowMod(true);
    }
  };

  const handleModClick = (mod) => {
    const base = activeMain;
    const newVal = base + mod;
    onChange(newVal);
    setShowMod(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-ink-subtle flex items-center gap-1">
        <span>{icon}</span>
        <span>{label}</span>
      </label>

      <div className="flex flex-col gap-1.5">
        {/* 主级胶囊行 */}
        <div className="flex flex-wrap gap-1">
          {MAIN_RATINGS.map(main => (
            <button
              key={main}
              onClick={() => handleMainClick(main)}
              className={`pill ${activeMain === main ? 'pill-active' : 'pill-inactive'}`}
            >
              {main}
            </button>
          ))}
        </div>

        {/* 浮层微调（仅非👑选中时显示） */}
        {showMod && activeMain && activeMain !== '👑' && (
          <div className="flex gap-1 animate-[fadeIn_0.15s_ease-out]">
            <button
              onClick={() => handleModClick('+')}
              className={`pill ${value?.endsWith('+') ? 'pill-active' : 'pill-inactive'}`}
            >
              {activeMain}+
            </button>
            <button
              onClick={() => handleModClick('')}
              className={`pill ${!value?.endsWith('+') && !value?.endsWith('-') ? 'pill-active' : 'pill-inactive'}`}
            >
              {activeMain}
            </button>
            <button
              onClick={() => handleModClick('-')}
              className={`pill ${value?.endsWith('-') ? 'pill-active' : 'pill-inactive'}`}
            >
              {activeMain}-
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 八维命盘完整选择器网格
 */
export function EightDimensionsSelector({ dimensions, onChange }) {
  const handleChange = (key) => (value) => {
    onChange({ ...dimensions, [key]: value });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {DIMENSIONS.map(dim => (
        <SinglePillSelector
          key={dim.key}
          label={dim.label}
          icon={dim.icon}
          value={dimensions[dim.key] || ''}
          onChange={handleChange(dim.key)}
        />
      ))}
    </div>
  );
}

export default SinglePillSelector;