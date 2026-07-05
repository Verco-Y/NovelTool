/*  */import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

/**
 * 根据境界返回节点颜色
 * 凡人→灰白、练气→淡青、筑基→土黄、御空→天蓝、结丹→紫、元婴→赤红、法相→金、化神→白金渐变
 */
function getRealmColor(realm) {
  if (!realm) return '#9ca3af'; // 未知 - 灰
  const r = realm.toLowerCase();
  if (r.includes('凡人')) return '#d1d5db';
  if (r.includes('练气')) return '#7dd3fc';
  if (r.includes('筑基')) return '#d4a853';
  if (r.includes('御空')) return '#60a5fa';
  if (r.includes('结丹')) return '#a78bfa';
  if (r.includes('元婴')) return '#f87171';
  if (r.includes('法相')) return '#fbbf24';
  if (r.includes('化神')) return '#d4a853'; // 白金/金色
  return '#9ca3af';
}

/**
 * ECharts 因果羁绊关系网络图
 * 力导向布局，支持点击节点跳转详情
 * 节点按境界染色
 */
export default function RelationGraph({ characters, onNodeClick }) {
  const chartRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !characters || characters.length === 0) return;

    if (!instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current, null, {
        backgroundColor: 'transparent',
      });
    }

    const chart = instanceRef.current;

    // 构建节点数据
    const nodes = characters.map(c => {
      const realmColor = getRealmColor(c.basicInfo?.realm);
      return {
        id: c.id,
        name: c.basicInfo?.name || '未命名',
        symbolSize: 40,
        itemStyle: {
          color: realmColor,
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: realmColor,
        },
        label: {
          show: true,
          color: '#e5e7eb',
          fontSize: 13,
          fontWeight: 'bold',
          formatter: (p) => p.name.length > 4 ? p.name.slice(0, 4) + '...' : p.name,
        },
        // 自定义数据
        characterId: c.id,
      };
    });

    // 构建边数据（去重）
    const edgeSet = new Set();
    const edges = [];
    characters.forEach(c => {
      if (c.relationships) {
        c.relationships.forEach(rel => {
          const key = [c.id, rel.targetId].sort().join('_');
          if (!edgeSet.has(key) && nodes.some(n => n.id === rel.targetId)) {
            edgeSet.add(key);
            edges.push({
              source: c.id,
              target: rel.targetId,
              label: {
                show: true,
                formatter: rel.type || '羁绊',
                fontSize: 11,
                color: '#9ca3af',
              },
              lineStyle: {
                color: '#4b5563',
                curveness: 0.3,
                width: 1.5,
              },
            });
          }
        });
      }
    });

    const option = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(26, 21, 37, 0.95)',
        borderColor: '#2a2340',
        textStyle: { color: '#e5e7eb', fontSize: 13 },
        formatter: (p) => {
          if (p.dataType === 'node') {
            const char = characters.find(c => c.id === p.data.characterId);
            const realm = char?.basicInfo?.realm || '未知';
            const sub = char?.basicInfo?.subStage || '';
            return `<b>${p.name}</b><br/><span style="color:#9ca3af">${realm}${sub ? ' · ' + sub : ''}</span><br/><span style="color:#d4a853">点击查看详情</span>`;
          }
          return p.name;
        },
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          force: {
            repulsion: 500,
            gravity: 0.1,
            edgeLength: [150, 300],
            layoutAnimation: true,
          },
          roam: true,
          draggable: true,
          focusNodeAdjacency: true,
          data: nodes,
          edges,
          lineStyle: {
            opacity: 0.7,
          },
          emphasis: {
            focus: 'adjacency',
            itemStyle: {
              borderWidth: 3,
              shadowBlur: 20,
            },
            lineStyle: {
              width: 3,
            },
          },
        },
      ],
    };

    chart.setOption(option, true);

    // 点击节点事件
    const handleClick = (params) => {
      if (params.dataType === 'node' && params.data?.characterId && onNodeClick) {
        onNodeClick(params.data.characterId);
      }
    };
    chart.on('click', handleClick);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.off('click', handleClick);
    };
  }, [characters, onNodeClick]);

  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        instanceRef.current.dispose();
        instanceRef.current = null;
      }
    };
  }, []);

  if (!characters || characters.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center text-gray-500">
        暂无人物数据，请先创建人物并添加因果羁绊
      </div>
    );
  }

  // 检查是否有关系数据
  const hasRelations = characters.some(c =>
    c.relationships && c.relationships.length > 0
  );
  if (!hasRelations) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center text-gray-500 gap-2">
        <span className="text-4xl">🕸️</span>
        <span>暂无因果羁绊数据</span>
        <span className="text-xs">请在人物详情页中为角色添加因果羁绊</span>
      </div>
    );
  }

  return (
    <div
      ref={chartRef}
      className="w-full h-[500px] md:h-[600px]"
    />
  );
}