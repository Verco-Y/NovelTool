import { useState, useRef } from 'react';
import { Archive, Download, FileJson, Upload, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';
import { exportToJson, importFromJson } from '../utils/storage';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function BackupCenter() {
  const { characters, clans, importAll, resetAll } = useArchive();
  const fileInputRef = useRef(null);

  const [importMode, setImportMode] = useState('replace');
  const [importData, setImportData] = useState(null);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleExport = () => exportToJson({ characters, clans });

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFileName(file.name); setImportError(''); setImportSuccess('');
    try {
      const data = await importFromJson(file);
      if (!data.characters || !Array.isArray(data.characters)) {
        setImportError('文件格式不正确，缺少 characters 数组'); setImportData(null); return;
      }
      setImportData(data);
    } catch (err) { setImportError(err.message); setImportData(null); }
  };

  const handleImport = () => {
    if (!importData) return;
    if (importMode === 'replace') {
      importAll(importData);
    } else {
      const existingIds = new Set(characters.map(c => c.id));
      const newChars = importData.characters.filter(c => !existingIds.has(c.id));
      const existingClanIds = new Set(clans.map(c => c.id));
      const newClans = (importData.clans || []).filter(c => !existingClanIds.has(c.id));
      importAll({ characters: [...characters, ...newChars], clans: [...clans, ...newClans] });
    }
    setImportSuccess(importMode === 'replace' ? `已完全替换，共导入 ${importData.characters?.length || 0} 位人物` : `合并成功`);
    setImportData(null); setImportFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetAll = () => { resetAll(); setResetConfirmOpen(false); };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
          <Archive className="w-6 h-6 text-divine-gold-600" />天道备份
        </h2>
        <p className="text-ink-subtle text-sm mt-1">全站数据导入导出与灾备管理</p>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink mb-3">📊 当前档案馆统计</h3>
        <div className="grid grid-cols-2 gap-4">
          {[{ label: '求道者', value: characters.length, color: 'text-divine-gold-600' },
            { label: '门派/家族', value: clans.length, color: 'text-purple-600' }].map(item => (
            <div key={item.label} className="text-center">
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-ink-subtle mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-green-50"><Download className="w-6 h-6 text-green-600" /></div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-ink mb-1">导出档案馆数据</h3>
            <p className="text-sm text-ink-secondary mb-4">将所有人物、门派家族等数据打包为 JSON 文件下载</p>
            <button onClick={handleExport} className="btn-primary flex items-center gap-2"><FileJson className="w-4 h-4" />导出 archivio_data.json</button>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-blue-50"><Upload className="w-6 h-6 text-blue-600" /></div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-ink mb-1">导入档案馆数据</h3>
            <p className="text-sm text-ink-secondary mb-4">上传之前导出的 JSON 文件，恢复人物与势力数据</p>
            <div className="flex gap-4 mb-4">
              {[{ value: 'replace', label: '完全替换' }, { value: 'merge', label: '合并导入' }].map(m => (
                <label key={m.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="importMode" value={m.value} checked={importMode === m.value}
                    onChange={() => setImportMode(m.value)} className="accent-divine-gold-500" />
                  <span className="text-sm text-ink-secondary">{m.label}</span>
                </label>
              ))}
            </div>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect}
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium
                file:bg-divine-gold-500 file:text-white hover:file:bg-divine-gold-600 cursor-pointer text-ink-secondary" />
            {importFileName && <p className="text-xs text-ink-subtle mt-2">已选择: {importFileName}</p>}
            {importData && (
              <div className="mt-4 p-3 bg-paper-muted rounded-xl border border-paper-border">
                <p className="text-sm text-ink">文件包含 <span className="text-divine-gold-600 font-bold">{importData.characters?.length || 0}</span> 位人物，<span className="text-purple-600 font-bold">{importData.clans?.length || 0}</span> 个势力</p>
                <button onClick={handleImport} className="btn-primary mt-3 text-sm">确认导入</button>
              </div>
            )}
            {importError && (
              <div className="mt-3 p-3 bg-cinnabar-600/5 border border-cinnabar-600/20 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-cinnabar-600" /><p className="text-sm text-cinnabar-700">{importError}</p>
              </div>
            )}
            {importSuccess && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-700">{importSuccess}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card border-cinnabar-600/20 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-cinnabar-600/5"><Trash2 className="w-6 h-6 text-cinnabar-600" /></div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-ink mb-1">清空全部数据</h3>
            <p className="text-sm text-ink-secondary mb-4">此操作将永久删除所有求道者和门派家族数据，无法恢复</p>
            <button onClick={() => setResetConfirmOpen(true)} className="btn-danger flex items-center gap-2"><RefreshCw className="w-4 h-4" />清空大荒</button>
          </div>
        </div>
      </div>

      <ConfirmDialog open={resetConfirmOpen} title="清空全部数据"
        message={`确定要删除所有 ${characters.length} 位求道者和 ${clans.length} 个门派家族吗？建议先导出备份。此操作不可恢复。`}
        onConfirm={handleResetAll} onCancel={() => setResetConfirmOpen(false)} danger />
    </div>
  );
}