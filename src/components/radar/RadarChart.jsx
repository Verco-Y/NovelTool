import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { DIMENSIONS, ratingToNumeric } from '../../constants/dimensions';

const COMPARE_COLORS = ['#2563eb', '#dc2626', '#059669', '#7c3aed'];

function computeZoomMax(dimensions) {
  let maxVal = 0;
  DIMENSIONS.forEach(d => { const v = ratingToNumeric(dimensions?.[d.key] || ''); if (v > maxVal) maxVal = v; });
  return Math.min(10, Math.max(3, Math.ceil(maxVal + 1)));
}

export default function RadarChart({ dimensions, characterName, zoomMode = false, compareCharacters = [] }) {
  const chartRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;
    if (!instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current, null, { backgroundColor: 'transparent' });
    }
    const chart = instanceRef.current;
    const maxVal = zoomMode ? computeZoomMax(dimensions) : 10;

    const indicator = DIMENSIONS.map(d => ({
      name: `${d.icon} ${d.label}`,
      max: maxVal,
    }));

    const getValues = (dims) => DIMENSIONS.map(d => {
      const raw = dims?.[d.key] || '';
      if (raw === '👑 不可观测') return maxVal * 1.25;
      return ratingToNumeric(raw);
    });

    const mainColor = '#b8860b';
    const series = [
      {
        type: 'radar',
        z: 2,
        emphasis: { lineStyle: { width: 5 } },
        data: [{
          value: getValues(dimensions),
          name: characterName || '当前',
          areaStyle: { color: 'rgba(184, 134, 11, 0.5)' },
          lineStyle: { color: mainColor, width: 3.5 },
          itemStyle: { color: '#d4a853', borderColor: mainColor, borderWidth: 3 },
          symbol: 'circle', symbolSize: 5,
        }],
      },
    ];

    if (compareCharacters && compareCharacters.length > 0) {
      compareCharacters.forEach((c, i) => {
        if (!c) return;
        const color = COMPARE_COLORS[i % COMPARE_COLORS.length];
        series.push({
          type: 'radar',
          z: 1,
          emphasis: { lineStyle: { width: 4 } },
          data: [{
            value: getValues(c.eightDimensions),
            name: c.basicInfo?.name || c.name || '对比',
            areaStyle: { color: hexToRgba(color, 0.55) },
            lineStyle: { color, width: 3 },
            itemStyle: { color, borderColor: color, borderWidth: 2.5 },
            symbol: 'circle', symbolSize: 4,
          }],
        });
      });
    }

    // 靶心等级标注 S~F：仅在第一个轴（12点方向·攻伐）上标注
    const grades = ['S', 'A', 'B', 'C', 'D', 'E', 'F'].map(label => ({
      label,
      value: ratingToNumeric(label),
    }));

    const angleOffset = -Math.PI / 2; // 从顶部(12点方向)开始

    const angleStep = (2 * Math.PI) / 8;  // 8个轴均分360°

    // 读取 ECharts 雷达实际布局（像素坐标）
    const getRadarLayout = () => {
      try {
        const cs = chart.getModel().getComponent('radar', 0)?.coordinateSystem;
        if (cs && typeof cs.cx === 'number') {
          return { cx: cs.cx, cy: cs.cy, r: cs.r };
        }
      } catch (_) {}
      const w = chart.getWidth();
      const h = chart.getHeight();
      return { cx: w * 0.5, cy: h * 0.48, r: Math.min(w, h) / 2 * 0.65 };
    };

    // 构建等级文字标注（在八个维度轴的每一根轴线上其对应的环位置标注）
    const buildGraphics = () => {
      const { cx, cy, r } = getRadarLayout();
      const items = [];
      grades.forEach((g) => {
        const posRatio = g.value / maxVal;
        // zoomMode 时跳过超出范围的等级，防止溢出图表
        if (posRatio > 1) return;
        const rPx = posRatio * r;
        for (let i = 0; i < 8; i++) {
          const angle = angleOffset + i * angleStep;
          items.push({
            type: 'text',
            left: cx + rPx * Math.cos(angle),
            top: cy + rPx * Math.sin(angle),
            style: {
              text: g.label,
              fill: '#9a6f0a',
              fontSize: 9,
              fontWeight: 'bold',
              textAlign: 'center',
              textVerticalAlign: 'middle',
              // 加上白色描边以防在雷达阴影区看不清
              stroke: '#fffef9',
              lineWidth: 2,
            },
          });
        }
      });
      return items;
    };

    // 第一步：设置主图表选项
    chart.setOption({
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(20, 18, 30, 0.95)',
        borderColor: '#3a2a4a',
        textStyle: { color: '#f0e6d0', fontSize: 13 },
        formatter: (params) => {
          if (!params || !params.value) return '';
          const name = params.name || '';
          const values = params.value || [];
          let html = `<div style="font-weight:700;margin-bottom:6px;font-size:14px;color:#d4a853">${name}</div>`;
          values.forEach((v, i) => {
            if (v !== undefined && v !== null) {
              const dim = DIMENSIONS[i];
              const label = dim ? `${dim.icon} ${dim.label}` : `维度${i+1}`;
              const display = Number.isInteger(v) ? v : v.toFixed(1);
              html += `<div style="display:flex;justify-content:space-between;gap:20px;font-size:12px"><span>${label}</span><span style="font-weight:600">${display}</span></div>`;
            }
          });
          return html;
        },
      },
      legend: {
        show: true, bottom: 0,
        textStyle: { color: '#374151', fontSize: 12, fontWeight: 600 },
        itemWidth: 14, itemHeight: 10,
        data: [characterName || '当前', ...compareCharacters.map(c => c?.basicInfo?.name || c?.name || '').filter(Boolean)],
        formatter: (name) => name.length > 8 ? name.slice(0, 8) + '...' : name,
      },
      radar: {
        indicator,
        shape: 'circle',
        center: ['50%', '48%'],
        radius: '65%',
        axisName: {
          color: '#1f2937', fontSize: 12, fontWeight: 600,
          formatter: (value) => {
            const parts = value.split(' ');
            return parts.length > 1 ? parts.slice(1).join(' ') : value;
          },
        },
        axisLine: { lineStyle: { color: '#b8a99a' } },
        splitLine: { lineStyle: { color: '#e0d8cd' } },
        splitArea: {
          show: true,
          areaStyle: {
            color: [
              'rgba(184,134,11,0.06)',
              'rgba(184,134,11,0.02)',
              'rgba(184,134,11,0.06)',
              'rgba(184,134,11,0.02)',
              'rgba(184,134,11,0.06)',
              'rgba(184,134,11,0.02)',
              'rgba(184,134,11,0.06)',
            ],
          },
        },
        splitNumber: 7,
        axisLabel: { show: false },
      },
      series,
    }, true);

    // 第二步：布局完成后精准设置标注
    chart.setOption({ graphic: buildGraphics() });

    const h = () => {
      chart.resize();
      chart.setOption({ graphic: buildGraphics() });
    };
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [dimensions, characterName, zoomMode, compareCharacters]);

  useEffect(() => () => { if (instanceRef.current) { instanceRef.current.dispose(); instanceRef.current = null; } }, []);

  return <div ref={chartRef} className="w-full h-[480px] md:h-[560px]" />;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}