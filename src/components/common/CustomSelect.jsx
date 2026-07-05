import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * 古风自定义下拉选择器
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = '请选择...',
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // 点击外部关闭下拉框
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (disabled) return;
    onChange(val);
    setIsOpen(false);
  };

  // 统一选项格式为 { value, label }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left text-sm ${disabled ? 'opacity-65 cursor-not-allowed' : ''} ${className}`}
    >
      {/* 触发按钮 */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-[#FAF7ED] border border-[#d4cbb3] rounded-xl
                   text-ink flex items-center justify-between transition-all duration-200
                   hover:border-divine-gold-400 focus:outline-none focus:ring-4 focus:ring-divine-gold-500/10"
      >
        <span className={selectedOption ? 'text-ink font-medium' : 'text-ink-subtle'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-ink-subtle transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 下拉菜单 */}
      {isOpen && !disabled && (
        <div
          className="absolute z-50 left-0 w-full mt-1.5 bg-[#FCFAF2] border-2 border-[#d4cbb3] rounded-xl
                     shadow-lg max-h-60 overflow-y-auto animate-fade-in"
          style={{ backgroundImage: 'linear-gradient(180deg, #fffef9 0%, #FAF7ED 100%)' }}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-4 py-2.5 text-xs text-ink-subtle text-center">暂无选项</div>
          ) : (
            <div className="py-1">
              {normalizedOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150
                               flex items-center justify-between
                               ${isSelected
                                 ? 'bg-divine-gold-500/10 text-divine-gold-700 font-semibold'
                                 : 'text-ink-secondary hover:bg-paper-muted hover:text-ink'
                               }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <span className="text-divine-gold-600 text-xs font-bold">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
