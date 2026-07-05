import { useNavigate } from 'react-router-dom';
import { Network, Info } from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';
import RelationGraph from '../components/network/RelationGraph';

export default function RelationshipMap() {
  const navigate = useNavigate();
  const { characters } = useArchive();

  const totalRelations = characters.reduce((sum, c) => sum + (c.relationships?.length || 0), 0);
  const hasRelations = totalRelations > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
            <Network className="w-6 h-6 text-divine-gold-600" />
            因果羁绊网络
          </h2>
          <p className="text-ink-subtle text-sm mt-1">
            {characters.length === 0 ? '暂无人物数据' : `${characters.length} 位角色 · ${totalRelations} 条羁绊`}
          </p>
        </div>
      </div>

      {hasRelations && (
        <div className="flex items-start gap-2 px-4 py-3 bg-divine-gold-500/5 border border-divine-gold-500/15 rounded-xl">
          <Info className="w-4 h-4 text-divine-gold-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-ink-secondary">
            <p className="font-medium text-ink mb-1">操作提示</p>
            <ul className="space-y-0.5">
              <li>🖱️ <b>拖拽节点</b>调整布局</li>
              <li>🔍 <b>滚轮缩放</b>查看细节</li>
              <li>👆 <b>点击节点</b>跳转至该角色详情页</li>
              <li>✨ 悬停节点会高亮其关联的羁绊线</li>
            </ul>
          </div>
        </div>
      )}

      <div className="card p-4 overflow-hidden">
        <RelationGraph characters={characters} onNodeClick={(id) => navigate(`/character/${id}`)} />
      </div>

      {characters.length > 0 && !hasRelations && (
        <div className="card p-8 text-center">
          <span className="text-4xl mb-3 block">🕸️</span>
          <p className="text-ink-secondary text-sm">尚未结下因果</p>
          <p className="text-ink-subtle text-xs mt-1">请在人物详情页中为角色结下因果</p>
          <button onClick={() => navigate('/')} className="btn-ghost mt-4 text-sm">前往画册</button>
        </div>
      )}

      {characters.length === 0 && (
        <div className="card p-8 text-center">
          <span className="text-4xl mb-3 block">📜</span>
          <p className="text-ink-secondary text-sm">大荒尚无求道者</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4 text-sm">前往画册点录道者</button>
        </div>
      )}
    </div>
  );
}