import { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Copy, GripVertical, CheckSquare, Square, Settings, X } from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';
import { getRealmLabels, isSubStageLate } from '../constants/realms';
import EightDimensionsGrid from '../components/common/EightDimensionsGrid';
import { generateId } from '../utils/idGenerator';



export default function Dashboard() {
  const navigate = useNavigate();
  const { characters, addCharacter, updateCharacter, deleteCharacter, updateCharacters } = useArchive();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [realmFilter, setRealmFilter] = useState('');
  const [sectFilter, setSectFilter] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchSectOpen, setBatchSectOpen] = useState(false);
  const [batchSectValue, setBatchSectValue] = useState('');
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleCreate = () => {
    const newId = generateId();
    addCharacter({ id: newId });
    navigate(`/character/${newId}`);
  };

  const handleCopy = (e, char) => {
    e.stopPropagation();
    const copy = {
      ...char,
      id: undefined,
      basicInfo: { ...char.basicInfo },
      eightDimensions: { ...char.eightDimensions },
      background: { mortalOrigin: '', immortalFortune: '', hiddenMask: '', coreMotivation: '', destinyPath: '' },
      relationships: [],
    };
    addCharacter(copy);
    setCopiedId(char.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const sects = useMemo(() => {
    const set = new Set();
    characters.forEach(c => { if (c.basicInfo?.sect) set.add(c.basicInfo.sect); });
    return [...set].sort();
  }, [characters]);

  const filtered = characters.filter(c => {
    const name = c.basicInfo?.name || '';
    const sect = c.basicInfo?.sect || '';
    const realm = c.basicInfo?.realm || '';
    const matchSearch = !searchTerm || name.includes(searchTerm) || sect.includes(searchTerm) || realm.includes(searchTerm);
    const matchRealm = !realmFilter || realm === realmFilter;
    const matchSect = !sectFilter || sect === sectFilter;
    return matchSearch && matchRealm && matchSect;
  });

  const getInitial = (name) => !name ? '?' : name.charAt(0);
  const getAvatarColor = (name) => {
    const colors = ['from-amber-400 to-orange-500', 'from-rose-400 to-pink-500', 'from-indigo-400 to-blue-500',
      'from-emerald-400 to-teal-500', 'from-purple-400 to-violet-500', 'from-cyan-400 to-sky-500'];
    if (!name) return colors[0];
    let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  };

  const realmDisplay = (char) => {
    const r = char.basicInfo?.realm || '';
    const ss = char.basicInfo?.subStage || '';
    if (!r) return <span className="text-xs text-ink-subtle">未定境界</span>;
    const isLate = isSubStageLate(ss);
    return (
      <span className={`text-xs ${isLate ? 'text-divine-gold-600 font-semibold' : 'text-ink-secondary'}`}>
        {r}{ss ? ` · ${ss}` : ''}
      </span>
    );
  };

  // Drag & Drop
  const handleDragStart = useCallback((e, id) => {
    if (batchMode) return;
    dragItem.current = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    e.currentTarget.style.opacity = '0.5';
  }, [batchMode]);

  const handleDragOver = useCallback((e, id) => {
    e.preventDefault();
    dragOverItem.current = id;
  }, []);

  const handleDragEnd = useCallback((e) => {
    e.currentTarget.style.opacity = '1';
    const dragId = dragItem.current;
    const dragOverId = dragOverItem.current;
    if (dragId === null || dragOverId === null || dragId === dragOverId) return;

    const dragIndex = characters.findIndex(c => c.id === dragId);
    const dragOverIndex = characters.findIndex(c => c.id === dragOverId);
    if (dragIndex === -1 || dragOverIndex === -1) return;

    const newChars = [...characters];
    const [moved] = newChars.splice(dragIndex, 1);
    newChars.splice(dragOverIndex, 0, moved);

    updateCharacters(newChars);

    dragItem.current = null;
    dragOverItem.current = null;
  }, [characters, updateCharacters]);

  // Batch operations
  const toggleSelect = (id) => {
    setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    setSelectedIds([]);
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`确定要删除选中的 ${selectedIds.length} 位求道者吗？此操作不可恢复。`)) return;
    selectedIds.forEach(id => deleteCharacter(id));
    setSelectedIds([]);
    setBatchMode(false);
  };

  const handleBatchSect = () => {
    if (!batchSectValue.trim()) return;
    selectedIds.forEach(id => {
      const char = characters.find(c => c.id === id);
      if (char) {
        updateCharacter(id, { basicInfo: { ...char.basicInfo, sect: batchSectValue.trim() } });
      }
    });
    setBatchSectValue('');
    setBatchSectOpen(false);
    setSelectedIds([]);
    setBatchMode(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink tracking-tight">大荒群贤画册</h2>
          <p className="text-ink-subtle text-sm mt-1">
            {characters.length === 0 ? '尚无求道者，录第一位角色' : `册中录有 ${characters.length} 位道者`}
          </p>
        </div>
        <div className="flex gap-2">
          {characters.length > 0 && (
            <button onClick={toggleBatchMode} className={`btn-ghost flex items-center gap-2 text-sm ${batchMode ? 'text-divine-gold-600 bg-divine-gold-500/5' : ''}`}>
              <Settings className="w-4 h-4" />
              {batchMode ? '退出统御' : '统御管理'}
            </button>
          )}
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            点录新秀
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      {characters.length > 0 && (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
            <input
              type="text" placeholder="搜索姓名、境界或宗门..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-ink-subtle mr-1">境界：</span>
              <button onClick={() => setRealmFilter('')} className={`pill text-xs ${!realmFilter ? 'pill-active' : 'pill-inactive'}`}>全部</button>
              {getRealmLabels().map(r => (
                <button key={r} onClick={() => setRealmFilter(r === realmFilter ? '' : r)} className={`pill text-xs ${realmFilter === r ? 'pill-active' : 'pill-inactive'}`}>{r}</button>
              ))}
            </div>
          </div>
          {sects.length > 1 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-ink-subtle mr-1">宗门：</span>
              <button onClick={() => setSectFilter('')} className={`pill text-xs ${!sectFilter ? 'pill-active' : 'pill-inactive'}`}>全部</button>
              {sects.map(s => (
                <button key={s} onClick={() => setSectFilter(s === sectFilter ? '' : s)} className={`pill text-xs ${sectFilter === s ? 'pill-active' : 'pill-inactive'}`}>{s}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Batch action bar */}
      {batchMode && selectedIds.length > 0 && (
        <div className="sticky top-0 z-20 flex items-center gap-3 p-3 bg-paper-muted/95 backdrop-blur-sm rounded-xl border border-paper-border shadow-sm">
          <span className="text-sm text-ink font-medium">已选 {selectedIds.length} 位</span>
          <button onClick={handleBatchDelete} className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1">
            <X className="w-3 h-3" />尽数除名
          </button>
          <button onClick={() => setBatchSectOpen(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
            <Settings className="w-3 h-3" />统定宗门
          </button>
        </div>
      )}

      {/* Batch sect modal */}
      {batchSectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setBatchSectOpen(false)} />
          <div className="relative card p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-ink mb-4">批量设定宗门</h3>
            <p className="text-sm text-ink-subtle mb-3">将为选中的 {selectedIds.length} 位求道者设定宗门</p>
            <input type="text" value={batchSectValue} onChange={e => setBatchSectValue(e.target.value)} className="input mb-4" placeholder="宗门名称" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setBatchSectOpen(false)} className="btn-ghost flex-1">取消</button>
              <button onClick={handleBatchSect} disabled={!batchSectValue.trim()} className="btn-primary flex-1 disabled:opacity-50">确认设定</button>
            </div>
          </div>
        </div>
      )}

      {/* Empty */}
      {characters.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-ink-subtle">
          <span className="text-5xl mb-4">📜</span>
          <p className="text-base font-medium">大荒尚无求道者</p>
          <p className="text-sm mt-1">点"点录新秀"录入第一位角色</p>
          <button onClick={handleCreate} className="btn-primary mt-6 flex items-center gap-2">
            <Plus className="w-4 h-4" />录入第一位求道者
          </button>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((char, index) => (
          <div key={char.id}
            onClick={() => { if (!batchMode) navigate(`/character/${char.id}`); }}
            draggable={!batchMode}
            onDragStart={(e) => handleDragStart(e, char.id)}
            onDragOver={(e) => handleDragOver(e, char.id)}
            onDragEnd={handleDragEnd}
            className={`card-interactive p-5 group relative ${isSubStageLate(char.basicInfo?.subStage) ? 'ring-1 ring-divine-gold-400/30 shadow-divine-gold-500/5' : ''} ${batchMode ? 'cursor-default' : ''}`}>
            {/* Batch checkbox */}
            {batchMode && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleSelect(char.id); }}
                className="absolute top-3 left-3 z-10 p-1 rounded-lg text-ink-subtle hover:text-divine-gold-600 transition-colors"
              >
                {selectedIds.includes(char.id) ? (
                  <CheckSquare className="w-5 h-5 text-divine-gold-600" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Drag handle */}
            {!batchMode && (
              <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-ink-subtle" />
              </div>
            )}

            {/* Copy button */}
            {!batchMode && (
              <button
                onClick={(e) => handleCopy(e, char)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-ink-subtle hover:text-divine-gold-600
                           hover:bg-paper-muted opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                title="复制人物"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Avatar + Info */}
            <div className="flex items-center gap-3 mb-4">
              {char.basicInfo?.avatar ? (
                <img src={char.basicInfo.avatar} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-paper-border" />
              ) : (
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarColor(char.basicInfo?.name)}
                  flex items-center justify-center text-white font-semibold text-base flex-shrink-0`}>
                  {getInitial(char.basicInfo?.name)}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-ink truncate text-sm">
                  {char.basicInfo?.name || '未命名'}
                </h3>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {realmDisplay(char)}
                  {char.basicInfo?.sect && (
                    <span className="text-xs text-ink-subtle truncate">{char.basicInfo.sect}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Eight Dimensions */}
            <div className="border-t border-paper-border pt-3">
              <EightDimensionsGrid dimensions={char.eightDimensions} compact />
            </div>
          </div>
        ))}
      </div>

      {characters.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16 text-ink-subtle text-sm">未寻得此人</div>
      )}
    </div>
  );
}