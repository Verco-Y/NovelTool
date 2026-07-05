import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, X, Save, Copy, Upload, FileText, Zap, ZoomIn, ZoomOut, Check, Heart, Search, Shield } from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';
import RadarChart from '../components/radar/RadarChart';
import { EightDimensionsSelector } from '../components/common/RatingSelector';
import EightDimensionsGrid from '../components/common/EightDimensionsGrid';
import CustomSelect from '../components/common/CustomSelect';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { getRealmLabels, LIANQI_LAYERS, NORMAL_SUB_STAGES, isSubStageLate } from '../constants/realms';
import { ALL_RATINGS, DIMENSIONS, ratingToNumeric } from '../constants/dimensions';
import { pinyinSearch } from '../utils/pinyinSearch';
import * as echarts from 'echarts';

const ZODIACS = ['🐭 子鼠', '🐮 丑牛', '🐯 寅虎', '🐰 卯兔', '🐲 辰龙', '🐍 巳蛇', '🐴 午马', '🐑 未羊', '🐵 申猴', '🐔 酉鸡', '🐶 戌狗', '🐷 亥猪'];

function ComparisonBarChart({ chartRef, mainChar, compareChars }) {
  useEffect(() => {
    if (!chartRef.current || compareChars.length === 0) return;
    let chart = chartRef.current._echart;
    if (!chart) { chart = echarts.init(chartRef.current, null, { backgroundColor: 'transparent' }); chartRef.current._echart = chart; }
    const names = [mainChar.name || '当前', ...compareChars.map(c => c.name || '')];
    const xData = DIMENSIONS.map(d => `${d.icon} ${d.label}`);
    const seriesData = [mainChar, ...compareChars].map((char, i) => ({ name: names[i], type: 'bar', data: DIMENSIONS.map(d => { const raw = char.eightDimensions?.[d.key] || ''; if (raw === '👑 不可观测') return 11; return ratingToNumeric(raw); }), itemStyle: { color: i === 0 ? '#b8860b' : ['#3b82f6','#ef4444','#10b981','#8b5cf6'][i-1] || '#6b7280', borderRadius: [4,4,0,0] }, barGap: '20%', emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } } }));
    chart.setOption({ tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: 'rgba(20,18,30,0.95)', borderColor: '#3a2a4a', textStyle: { color: '#f0e6d0', fontSize: 13 }, formatter: (p) => { let h = `<div style="font-weight:700;margin-bottom:6px;color:#d4a853">${p[0]?.axisValue||''}</div>`; p.forEach(v => { h += `<div style="display:flex;justify-content:space-between;gap:20px;font-size:12px"><span style="color:${v.color}">● ${v.seriesName}</span><span style="font-weight:600">${v.value%1===0?v.value:v.value.toFixed(1)}</span></div>`; }); return h; } }, legend: { data: names, bottom: 0, textStyle: { color: '#374151', fontSize: 12, fontWeight: 600 }, itemWidth: 14, itemHeight: 10 }, grid: { left: '3%', right: '4%', bottom: '15%', top: '5%', containLabel: true }, xAxis: { type: 'category', data: xData, axisLabel: { color: '#374151', fontSize: 11, fontWeight: 600 }, axisTick: { alignWithLabel: true } }, yAxis: { type: 'value', max: 10, min: 0, interval: 1, axisLabel: { color: '#6b7280', fontSize: 11 }, splitLine: { lineStyle: { color: '#e5e7eb' } } }, series: seriesData }, true);
    const h = () => chart.resize(); window.addEventListener('resize', h); return () => { window.removeEventListener('resize', h); };
  }, [mainChar, compareChars]);
  useEffect(() => () => { if (chartRef.current?._echart) { chartRef.current._echart.dispose(); chartRef.current._echart = null; } }, []);
  if (compareChars.length === 0) return null;
  return <div ref={(el) => { if (el) chartRef.current = el; }} className="w-full h-[350px] mt-4" />;
}

export default function CharacterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { characters, updateCharacter, deleteCharacter, addCharacter, clans } = useArchive();
  const fileRef = useRef(null);
  const barChartRef = useRef(null);

  const [activeTab, setActiveTab] = useState('dimensions');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [zoomMode, setZoomMode] = useState(false);
  const [batchRating, setBatchRating] = useState('');
  const autoSaveTimerRef = useRef(null);
  const latestDataRef = useRef({ basicInfo: {}, eightDimensions: {}, background: {} });

  const char = characters.find(c => c.id === id);

  const [basicInfo, setBasicInfo] = useState({});
  const [eightDimensions, setEightDimensions] = useState({});
  const [background, setBackground] = useState({});

  const [compareOpen, setCompareOpen] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState(null);

  // 伴侣系统
  const [spouseModalOpen, setSpouseModalOpen] = useState(false);
  const [spouseSearch, setSpouseSearch] = useState('');
  const [spouseMode, setSpouseMode] = useState('spouse');
  const [spouseError, setSpouseError] = useState('');

  useEffect(() => {
    if (char) {
      const bi = { ...char.basicInfo };
      setBasicInfo(bi);
      setEightDimensions({ ...char.eightDimensions });
      setBackground({ ...char.background });
      latestDataRef.current = { basicInfo: bi, eightDimensions: { ...char.eightDimensions }, background: { ...char.background } };
    }
  }, [char?.id]);

  useEffect(() => { latestDataRef.current = { basicInfo, eightDimensions, background }; }, [basicInfo, eightDimensions, background]);

  const doAutoSave = useCallback(() => {
    if (!char) return;
    updateCharacter(char.id, { basicInfo, eightDimensions, background });
    setAutoSaved(true); setTimeout(() => setAutoSaved(false), 2000);
  }, [basicInfo, eightDimensions, background, char, updateCharacter]);

  useEffect(() => {
    if (!char) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(doAutoSave, 2000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [basicInfo, eightDimensions, background]);

  useEffect(() => {
    const h = () => { const { basicInfo: bi, eightDimensions: ed, background: bg } = latestDataRef.current; if (char) updateCharacter(char.id, { basicInfo: bi, eightDimensions: ed, background: bg }); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [char, updateCharacter]);

  useEffect(() => { return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); }; }, []);

  if (!char) return (
    <div className="flex flex-col items-center justify-center py-24 text-ink-subtle">
      <span className="text-4xl mb-4">🔍</span>
      <p>此人已渡劫飞升，或已被除名</p>
      <button onClick={() => navigate('/')} className="btn-ghost mt-4">返回画册</button>
    </div>
  );

  const handleSave = () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); updateCharacter(char.id, { basicInfo, eightDimensions, background }); setSaved(true); setAutoSaved(false); setTimeout(() => setSaved(false), 2000); };
  const handleDelete = () => { deleteCharacter(char.id); navigate('/'); };
  const handleCopy = () => addCharacter({ ...char, id: undefined, basicInfo: { ...basicInfo }, eightDimensions: { ...eightDimensions }, background: { mortalOrigin: '', immortalFortune: '', hiddenMask: '', coreMotivation: '', destinyPath: '' } });
  const handleAvatarUpload = (e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 2*1024*1024) { alert('图片不能超过 2MB'); return; } if (!file.type.startsWith('image/')) { alert('请选择图片文件'); return; } const r = new FileReader(); r.onload = ev => setBasicInfo(p => ({ ...p, avatar: ev.target.result })); r.readAsDataURL(file); e.target.value = ''; };
  const handleBatchSet = () => { if (!batchRating) return; const d = {}; Object.keys(eightDimensions).forEach(k => d[k] = batchRating); setEightDimensions(d); setBatchRating(''); };
  const toggleCompareChar = (cid) => setCompareIds(p => p.includes(cid) ? p.filter(x => x !== cid) : (p.length < 3 ? [...p, cid] : p));
  const getInitial = (n) => !n ? '?' : n.charAt(0);
  const isLianqi = basicInfo.realm === '🧘 练气境';
  const currentSubStages = isLianqi ? LIANQI_LAYERS : NORMAL_SUB_STAGES;
  const myGender = basicInfo.gender || '';

  // 称谓
  const isMale = myGender === '♂';
  const spouseLabel = isMale ? '正室' : '夫君';
  const concubineLabel = isMale ? '妾室' : '面首';

  // 双向同步工具
  const syncOpposite = (targetId, field, value) => {
    const t = characters.find(c => c.id === targetId);
    if (!t) return;
    const newBi = { ...t.basicInfo, [field]: value };
    updateCharacter(targetId, { basicInfo: newBi });
  };

  const getSpouseCandidates = () => {
    const pool = characters.filter(c => {
      if (c.id === char.id) return false;
      const tg = c.basicInfo?.gender || '';
      if (!myGender || !tg) return false;
      return myGender !== tg;
    }).map(c => ({ id: c.id, name: c.basicInfo?.name || '未命名' }));
    return pinyinSearch(spouseSearch, pool);
  };

  const handleSetSpouse = (targetId) => {
    const target = characters.find(c => c.id === targetId);
    if (!target) return;
    const targetSpouse = target.basicInfo?.spouse;
    if (targetSpouse && targetSpouse.id !== char.id) {
      setSpouseError(`此人已为${isMale ? '他人之夫' : '他人之妻'}，不可为${spouseLabel}`);
      return;
    }
    if (basicInfo.spouse?.id && basicInfo.spouse.id !== targetId) {
      syncOpposite(basicInfo.spouse.id, 'spouse', null);
    }
    setBasicInfo(p => ({ ...p, spouse: { id: target.id, name: target.basicInfo?.name || '' } }));
    syncOpposite(target.id, 'spouse', { id: char.id, name: basicInfo.name || '' });
    setSpouseModalOpen(false);
    setSpouseSearch('');
    setSpouseError('');
  };

  const handleAddConcubine = (targetId) => {
    const target = characters.find(c => c.id === targetId);
    if (!target) return;
    if ((basicInfo.concubines || []).some(x => x.id === targetId)) {
      setSpouseModalOpen(false); setSpouseSearch(''); setSpouseError(''); return;
    }
    const targetConcs = target.basicInfo?.concubines || [];
    setBasicInfo(p => ({ ...p, concubines: [...(p.concubines || []), { id: target.id, name: target.basicInfo?.name || '' }] }));
    if (!targetConcs.some(x => x.id === char.id)) {
      syncOpposite(target.id, 'concubines', [...targetConcs, { id: char.id, name: basicInfo.name || '' }]);
    }
    setSpouseModalOpen(false);
    setSpouseSearch('');
    setSpouseError('');
  };

  const handleRemoveConcubine = (targetId) => {
    setBasicInfo(p => ({ ...p, concubines: (p.concubines || []).filter(x => x.id !== targetId) }));
    const t = characters.find(c => c.id === targetId);
    if (t) {
      const tcs = (t.basicInfo?.concubines || []).filter(x => x.id !== char.id);
      syncOpposite(targetId, 'concubines', tcs);
    }
  };

  const handleRemoveSpouse = () => {
    if (basicInfo.spouse?.id) {
      syncOpposite(basicInfo.spouse.id, 'spouse', null);
    }
    setBasicInfo(p => ({ ...p, spouse: null }));
  };

  const getTargetName = (tid) => characters.find(c => c.id === tid)?.basicInfo?.name || '未知人物';

  const compareCharsData = compareIds.map(cid => { const c = characters.find(x => x.id === cid); return c ? { name: c.basicInfo?.name || '未命名', eightDimensions: c.eightDimensions } : null; }).filter(Boolean);
  const mainCharData = { name: basicInfo.name || '当前', eightDimensions };

  // 该角色所属的家族/宗门
  const myClans = clans.filter(clan => clan.members.some(m => m.characterId === id));

  const parseDoc = () => { const t = importText; if (!t.trim()) return; const result = { name: '', age: '', realm: '', zodiac: '', dimensions: {}, sect: '', position: '' }; const tm = t.match(/角色属性面板[：:]\s*(.+?)[（(](\d+)[岁]?[，,]\s*(.+?)[）)]/); if (tm) { result.name = tm[1].trim(); result.age = tm[2].trim(); result.realm = tm[3].trim(); } if (!result.name) { const nm = t.match(/姓名[：:]\s*(.+?)(?:\n|$)/); if (nm) result.name = nm[1].trim(); } const zm = t.match(/生肖[：:]\s*.+?([子丑寅卯辰巳午未申酉戌亥][鼠牛虎兔龙蛇马羊猴鸡狗猪])/); if (zm) result.zodiac = zm[1]; const sm = t.match(/宗门[：:]\s*(.+?)(?:\n|$)/); if (sm) result.sect = sm[1].trim(); const pm = t.match(/(?:身份|地位|职位)[：:]\s*(.+?)(?:\n|$)/); if (pm) result.position = pm[1].trim(); if (!result.realm) { const rm = t.match(/(?:境界|修为|大境界)[：:]\s*(.+?)(?:\n|$)/); if (rm) result.realm = rm[1].trim(); } const dm = { '斗战':'attack','攻伐':'attack','杀伐':'attack','attack':'attack','神魂':'divine','神识':'divine','烛照':'divine','divine':'divine','道心':'tenacity','不拔':'tenacity','坚韧':'tenacity','tenacity':'tenacity','天资':'talent','悟性':'talent','资骨':'talent','talent':'talent','心计':'scheme','城府':'scheme','弈局':'scheme','scheme':'scheme','庶务':'govern','经纬':'govern','治世':'govern','govern':'govern','声名':'charm','风仪':'charm','人缘':'charm','charm':'charm','形相':'looks','皮相':'looks','仙姿':'looks','looks':'looks' }; const rp = /(SSS[+\-]?|SS[+\-]?|S[+\-]?|[A-F][+\-]?|👑\s*不可观测)/gi; Object.entries(dm).forEach(([cn, key]) => { const re = new RegExp(`${cn}[^A-Za-z0-9]*(${rp.source})`, 'i'); const m = t.match(re); if (m && !result.dimensions[key]) { result.dimensions[key] = m[1].toUpperCase().replace(/\s*不可观测/, ' 不可观测'); } }); const rw = t.match(/练气[境]?|筑基[境]?|御空[境]?|结丹[境]?|元婴[境]?|法相[境]?|化神[境]?/g) || []; if ([...new Set(rw)].length >= 2) result.realm = ''; setImportPreview(result); };
  const applyImport = () => { if (!importPreview) return; const p = importPreview; const bi = { ...basicInfo }; if (p.name) bi.name = p.name; if (p.zodiac) bi.zodiac = p.zodiac; if (p.realm) bi.realm = p.realm; if (p.sect) bi.sect = p.sect; if (p.position) bi.position = p.position; setBasicInfo(bi); if (Object.keys(p.dimensions).length > 0) setEightDimensions(pv => ({ ...pv, ...p.dimensions })); setImportOpen(false); setImportText(''); setImportPreview(null); };

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></button>
          <div><h2 className="text-xl font-bold text-ink">{basicInfo.name || '未命名求道者'}</h2>
          <p className="text-xs text-ink-subtle">
            {basicInfo.realm || '未定境界'}
            {basicInfo.subStage ? ` · ${basicInfo.subStage}` : ''}
            {basicInfo.perfection ? ' · 圆满' : ''}
            {basicInfo.sect ? ` | ${basicInfo.sect}` : ''}
          </p></div>
        </div>
        <div className="flex items-center gap-2">
          {autoSaved && <span className="text-xs text-divine-gold-600 flex items-center gap-1"><Check className="w-3 h-3" />已自动录册</span>}
          <button onClick={() => setImportOpen(true)} className="btn-ghost flex items-center gap-1 text-sm"><FileText className="w-4 h-4" />天降文书</button>
          <button onClick={handleCopy} className="btn-ghost flex items-center gap-1 text-sm"><Copy className="w-4 h-4" />拓印</button>
          <button onClick={handleSave} className="btn-primary flex items-center gap-1 text-sm"><Save className="w-4 h-4" />{saved ? '已录册 ✓' : '录册'}</button>
          <button onClick={() => setDeleteOpen(true)} className="btn-danger flex items-center gap-1 text-sm"><Trash2 className="w-4 h-4" />除名</button>
        </div>
      </div>

      {/* Avatar + Basic Info */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex-shrink-0">
            <div className="relative group cursor-pointer w-20 h-20" onClick={() => fileRef.current?.click()}>
              {basicInfo.avatar ? <img src={basicInfo.avatar} alt="" className="w-20 h-20 rounded-full object-cover ring-2 ring-paper-border" /> : <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-2xl">{getInitial(basicInfo.name)}</div>}
              <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Upload className="w-5 h-5 text-white" /></div>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
            <p className="text-[10px] text-ink-subtle mt-1.5 text-center">点击上传</p>
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div><label className="text-[11px] text-ink-subtle mb-0.5 block">姓名</label><input type="text" value={basicInfo.name||''} onChange={e=>setBasicInfo(p=>({...p,name:e.target.value}))} className="input py-2 text-sm" placeholder="道号/姓名" /></div>
            <div>
              <label className="text-[11px] text-ink-subtle mb-0.5 block">生肖</label>
              <CustomSelect
                value={basicInfo.zodiac||''}
                onChange={val=>setBasicInfo(p=>({...p,zodiac:val}))}
                options={ZODIACS}
                placeholder="选择生肖"
              />
            </div>
            <div><label className="text-[11px] text-ink-subtle mb-0.5 block">修成年岁</label><input type="number" min="0" value={basicInfo.cultivationStartAge||''} onChange={e=>setBasicInfo(p=>({...p,cultivationStartAge:e.target.value}))} className="input py-2 text-sm" placeholder="如7" /></div>
            <div>
              <label className="text-[11px] text-ink-subtle mb-0.5 block">大境界</label>
              <CustomSelect
                value={basicInfo.realm||''}
                onChange={val=>setBasicInfo(p=>({...p,realm:val,subStage:'',perfection:false}))}
                options={getRealmLabels()}
                placeholder="择一境"
              />
            </div>
            <div>
              <label className="text-[11px] text-ink-subtle mb-0.5 block">小阶段</label>
              <div className="flex items-center gap-2">
                <CustomSelect
                  value={basicInfo.subStage||''}
                  onChange={val=>setBasicInfo(p=>({...p,subStage:val}))}
                  options={currentSubStages}
                  placeholder={isLianqi ? '择一层' : '择一段'}
                  disabled={!basicInfo.realm}
                  className="flex-1"
                />
                <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap"><input type="checkbox" checked={basicInfo.perfection||false} onChange={e=>setBasicInfo(p=>({...p,perfection:e.target.checked}))} className="accent-divine-gold-500 w-4 h-4" /><span className="text-xs text-ink-subtle">圆满</span></label>
              </div>
            </div>
            <div><label className="text-[11px] text-ink-subtle mb-0.5 block">性别</label>
              <div className="flex gap-2">
                <button onClick={()=>setBasicInfo(p=>({...p,gender:'♂'}))} className={`flex-1 py-2 text-sm rounded-xl border transition-colors ${basicInfo.gender==='♂'?'bg-blue-50 border-blue-300 text-blue-700 font-medium':'border-paper-border text-ink-subtle hover:border-blue-200'}`}>♂ 男</button>
                <button onClick={()=>setBasicInfo(p=>({...p,gender:'♀'}))} className={`flex-1 py-2 text-sm rounded-xl border transition-colors ${basicInfo.gender==='♀'?'bg-pink-50 border-pink-300 text-pink-700 font-medium':'border-paper-border text-ink-subtle hover:border-pink-200'}`}>♀ 女</button>
              </div>
            </div>
            <div><label className="text-[11px] text-ink-subtle mb-0.5 block">宗门</label><input type="text" value={basicInfo.sect||''} onChange={e=>setBasicInfo(p=>({...p,sect:e.target.value}))} className="input py-2 text-sm" placeholder="宗门" /></div>
            <div><label className="text-[11px] text-ink-subtle mb-0.5 block">身份/地位/职位</label><input type="text" value={basicInfo.position||''} onChange={e=>setBasicInfo(p=>({...p,position:e.target.value}))} className="input py-2 text-sm" placeholder="如：真传弟子、长老、散修" /></div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[11px] text-ink-subtle mb-0.5 block">灵宠</label>
              <div className="flex gap-2">
                <input type="text" value={basicInfo.pet?.name||''} onChange={e=>setBasicInfo(p=>({...p,pet:{...p.pet,name:e.target.value}}))} className="input py-2 text-sm flex-1" placeholder="灵兽之名" />
                <input type="text" value={basicInfo.pet?.species||''} onChange={e=>setBasicInfo(p=>({...p,pet:{...p.pet,species:e.target.value}}))} className="input py-2 text-sm flex-1" placeholder="如：九尾狐" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 姻缘卡片 */}
      {myGender && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2"><Heart className="w-4 h-4 text-rose-500" />姻缘</h3>
            <div className="flex gap-2">
              <button onClick={() => { setSpouseMode('spouse'); setSpouseModalOpen(true); setSpouseSearch(''); setSpouseError(''); }} className="btn-primary text-xs flex items-center gap-1 py-1.5"><Plus className="w-3 h-3" />择{spouseLabel}</button>
              <button onClick={() => { setSpouseMode('concubine'); setSpouseModalOpen(true); setSpouseSearch(''); setSpouseError(''); }} className="btn-ghost text-xs flex items-center gap-1 py-1.5"><Plus className="w-3 h-3" />纳{concubineLabel}</button>
            </div>
          </div>
          <div className="mb-3 pb-3 border-b border-paper-border">
            <span className="text-xs text-ink-subtle">{spouseLabel}：</span>
            {basicInfo.spouse?.id ? (
              <div className="flex items-center justify-between px-4 py-2.5 bg-rose-50 rounded-xl mt-1">
                <span className="text-sm text-rose-700 font-medium cursor-pointer hover:underline" onClick={() => navigate(`/character/${basicInfo.spouse.id}`)}>♥ {getTargetName(basicInfo.spouse.id)}</span>
                <button onClick={handleRemoveSpouse} className="text-ink-subtle hover:text-cinnabar-600"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <p className="text-ink-subtle text-xs mt-1">未定</p>
            )}
          </div>
          <div>
            <span className="text-xs text-ink-subtle">{concubineLabel}：</span>
            {(basicInfo.concubines || []).length === 0 ? (
              <p className="text-ink-subtle text-xs mt-1">无</p>
            ) : (
              <div className="space-y-1.5 mt-1 flex flex-wrap gap-2">
                {(basicInfo.concubines || []).map(cb => (
                  <span key={cb.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-paper-muted rounded-full text-xs">
                    <span className="text-divine-gold-600 cursor-pointer hover:underline" onClick={() => navigate(`/character/${cb.id}`)}>{getTargetName(cb.id)}</span>
                    <button onClick={() => handleRemoveConcubine(cb.id)} className="text-ink-subtle hover:text-cinnabar-600"><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 所属势力 */}
      {myClans.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-3"><Shield className="w-4 h-4 text-divine-gold-600" />所属势力</h3>
          <div className="flex flex-wrap gap-2">
            {myClans.map(clan => {
              const member = clan.members.find(m => m.characterId === id);
              return (
                <div key={clan.id} className="inline-flex items-center gap-2 px-3 py-2 bg-paper-muted rounded-xl text-sm cursor-pointer hover:bg-divine-gold-50 transition-colors" onClick={() => navigate('/clans')}>
                  <span className="text-base">{clan.type === 'family' ? '🏠' : clan.type === 'sect' ? '⛩️' : clan.type === 'gang' ? '🏴' : '🤝'}</span>
                  <div>
                    <span className="font-medium text-ink">{clan.name}</span>
                    {(member?.role || member?.familyRole) && (
                      <span className="text-xs text-ink-subtle ml-1.5">
                        {[member.role, member.familyRole].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Radar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button onClick={()=>setZoomMode(!zoomMode)} className={`btn-ghost text-xs flex items-center gap-1 py-1.5 ${zoomMode?'text-divine-gold-600 bg-divine-gold-500/5':''}`}>{zoomMode?<ZoomIn className="w-3.5 h-3.5"/>:<ZoomOut className="w-3.5 h-3.5"/>}{zoomMode?'寻幽入微':'纵观全局'}</button>
            <button onClick={()=>{setCompareOpen(!compareOpen); setCompareIds([]);}} className={`btn-ghost text-xs flex items-center gap-1 py-1.5 ${compareOpen?'text-divine-gold-600 bg-divine-gold-500/5':''}`}>+ 对弈</button>
          </div>
        </div>
        <RadarChart dimensions={eightDimensions} characterName={basicInfo.name} zoomMode={zoomMode} compareCharacters={compareOpen ? compareCharsData : []} />
        {compareOpen && (
          <div className="mt-3 pt-3 border-t border-paper-border">
            <p className="text-xs text-ink-subtle mb-2">择对弈之人（至多三人）</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {characters.filter(c=>c.id!==char.id).map(c=>{const sel=compareIds.includes(c.id);return <button key={c.id} onClick={()=>toggleCompareChar(c.id)} className={`pill text-xs ${sel?'pill-active':'pill-inactive'}`}>{c.basicInfo?.name||'未命名'}</button> })}
            </div>
            {compareIds.length > 0 && <ComparisonBarChart chartRef={barChartRef} mainChar={mainCharData} compareChars={compareCharsData} />}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5"><EightDimensionsGrid dimensions={eightDimensions} compact={false} /></div>

      <div className="flex border-b border-paper-border">
        <button onClick={()=>setActiveTab('dimensions')} className={`tab ${activeTab==='dimensions'?'tab-active':'tab-inactive'}`}>天道八维命盘</button>
        <button onClick={()=>setActiveTab('info')} className={`tab ${activeTab==='info'?'tab-active':'tab-inactive'}`}>身世背景设定</button>
      </div>

      {activeTab==='dimensions' && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-paper-border">
            <span className="text-xs text-ink-subtle whitespace-nowrap">一气呵成：</span>
            <CustomSelect
              value={batchRating}
              onChange={setBatchRating}
              options={ALL_RATINGS}
              placeholder="选择等位..."
              className="w-36"
            />
            <button onClick={handleBatchSet} disabled={!batchRating} className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              统一设定
            </button>
          </div>
          <EightDimensionsSelector dimensions={eightDimensions} onChange={setEightDimensions} />
        </div>
      )}

      {activeTab==='info' && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">📖 身世背景</h3>
          {[{key:'mortalOrigin',label:'凡尘出身',rows:3},{key:'immortalFortune',label:'仙缘造化',rows:3},{key:'hiddenMask',label:'隐藏面具',rows:3},{key:'coreMotivation',label:'核心动机',rows:2},{key:'destinyPath',label:'命途走向',rows:2}].map(f=><div key={f.key} className="mb-4 last:mb-0"><label className="text-xs text-ink-subtle block mb-1">{f.label}</label><textarea value={background[f.key]||''} onChange={e=>setBackground(p=>({...p,[f.key]:e.target.value}))} className="textarea" rows={f.rows} placeholder={`描述${f.label}...`} /></div>)}
        </div>
      )}

      {/* Spouse Search Modal */}
      {spouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={()=>setSpouseModalOpen(false)} />
          <div className="relative card p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-ink mb-3 flex items-center gap-2"><Heart className="w-5 h-5 text-rose-500" />{spouseMode === 'spouse' ? `择${spouseLabel}` : `纳${concubineLabel}`}</h3>
            <p className="text-xs text-ink-subtle mb-3">键入姓名或拼音首字母（如"lry"搜"柳如烟"）</p>
            {spouseError && <p className="text-xs text-cinnabar-600 mb-2 bg-cinnabar-600/5 p-2 rounded-lg">{spouseError}</p>}
            <div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" /><input type="text" value={spouseSearch} onChange={e=>{setSpouseSearch(e.target.value); setSpouseError('');}} className="input pl-10 py-2 text-sm" placeholder="搜罗道者..." autoFocus /></div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {getSpouseCandidates().map(c => (
                <button key={c.id} onClick={() => spouseMode === 'spouse' ? handleSetSpouse(c.id) : handleAddConcubine(c.id)} className="w-full text-left px-3 py-2 rounded-lg text-sm text-ink hover:bg-divine-gold-50 hover:text-divine-gold-700 transition-colors flex items-center justify-between"><span>{c.name}</span><span className="text-[10px] text-ink-subtle">择定</span></button>
              ))}
              {spouseSearch && getSpouseCandidates().length === 0 && <p className="text-xs text-ink-subtle text-center py-3">未寻得匹配之人</p>}
              {!spouseSearch && getSpouseCandidates().length === 0 && <p className="text-xs text-ink-subtle text-center py-3">无可选之人（需异性角色且已设定性别）</p>}
            </div>
            <div className="flex gap-3 mt-4"><button onClick={() => setSpouseModalOpen(false)} className="btn-ghost flex-1">取消</button></div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importOpen&&(<div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={()=>setImportOpen(false)} /><div className="relative card p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[80vh] overflow-y-auto"><h3 className="text-lg font-semibold text-ink mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-divine-gold-600" />导入角色属性面板</h3><p className="text-xs text-ink-subtle mb-3">粘贴角色属性面板文本，点击解析自动提取字段</p><textarea value={importText} onChange={e=>setImportText(e.target.value)} className="textarea h-40 mb-3 text-xs" placeholder="粘贴角色属性面板文本..." /><button onClick={parseDoc} disabled={!importText.trim()} className="btn-primary text-sm mb-4 disabled:opacity-50">解析文档</button>{importPreview&&(<div className="bg-paper-muted rounded-xl p-4 border border-paper-border space-y-2"><p className="text-sm font-medium text-ink">解析预览</p>{importPreview.name&&<p className="text-sm">姓名：<b>{importPreview.name}</b></p>}{importPreview.zodiac&&<p className="text-sm">生肖：<b>{importPreview.zodiac}</b></p>}{importPreview.sect&&<p className="text-sm">宗门：<b>{importPreview.sect}</b></p>}{importPreview.position&&<p className="text-sm">身份：<b>{importPreview.position}</b></p>}{importPreview.realm?<p className="text-sm">境界：<b>{importPreview.realm}</b></p>:importPreview.name&&<p className="text-sm text-cinnabar-600">⚠ 检测到多个修为，境界已留空请手动选择</p>}<div className="flex gap-1.5 flex-wrap">{Object.entries(importPreview.dimensions).map(([k,v])=><span key={k} className="pill pill-active text-xs">{k}:{v}</span>)}</div><div className="flex gap-3 mt-3"><button onClick={()=>{setImportOpen(false);setImportText('');setImportPreview(null)}} className="btn-ghost text-sm">取消</button><button onClick={applyImport} className="btn-primary text-sm" disabled={!importPreview.name&&Object.keys(importPreview.dimensions).length===0}>确认导入</button></div></div>)}</div></div>)}

      <ConfirmDialog open={deleteOpen} title="除名求道者" message={`确定要将「${basicInfo.name||'未命名'}」除名吗？此间因果将尽数斩断，不可逆转。`} onConfirm={handleDelete} onCancel={()=>setDeleteOpen(false)} danger />
    </div>
  );
}