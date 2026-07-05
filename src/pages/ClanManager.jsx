import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Search, Crown, Users, Shield, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';
import { pinyinSearch } from '../utils/pinyinSearch';
import ConfirmDialog from '../components/common/ConfirmDialog';
import CustomSelect from '../components/common/CustomSelect';

const CLAN_TYPES = [
  { key: 'family', label: '家族', icon: '🏠' },
  { key: 'sect', label: '宗门', icon: '⛩️' },
  { key: 'gang', label: '帮派', icon: '🏴' },
  { key: 'alliance', label: '联盟', icon: '🤝' },
];

const FAMILY_ROLES = ['族长', '长老', '嫡系', '旁系', '外门', '家仆', '客卿'];
const SECT_ROLES = ['掌门', '副掌门', '长老', '真传弟子', '内门弟子', '外门弟子', '杂役弟子', '客卿'];

function getRolesForType(type) {
  if (type === 'family') return FAMILY_ROLES;
  if (type === 'sect') return SECT_ROLES;
  return ['首领', '副首领', '核心成员', '普通成员', '外围'];
}

export default function ClanManager() {
  const navigate = useNavigate();
  const { characters, clans, addClan, updateClan, deleteClan, addClanMember, removeClanMember, updateClanMember } = useArchive();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('family');
  const [newDesc, setNewDesc] = useState('');
  const [expandedClanId, setExpandedClanId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // 添加成员弹窗
  const [addMemberClanId, setAddMemberClanId] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [memberFamilyRole, setMemberFamilyRole] = useState('');

  // 编辑模式
  const [editingClan, setEditingClan] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    addClan({ name: newName.trim(), type: newType, description: newDesc.trim() });
    setNewName('');
    setNewType('family');
    setNewDesc('');
    setCreateOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteClan(deleteTarget);
      setDeleteTarget(null);
      if (expandedClanId === deleteTarget) setExpandedClanId(null);
    }
  };

  const handleStartEdit = (clan) => {
    setEditingClan(clan.id);
    setEditName(clan.name);
    setEditDesc(clan.description || '');
  };

  const handleSaveEdit = (clanId) => {
    updateClan(clanId, { name: editName.trim(), description: editDesc.trim() });
    setEditingClan(null);
  };

  const getCharName = (id) => characters.find(c => c.id === id)?.basicInfo?.name || '未知';

  // 可添加的成员候选（排除已在该家族中的角色）
  const getCandidates = (clanId) => {
    const clan = clans.find(c => c.id === clanId);
    if (!clan) return [];
    const memberIds = new Set(clan.members.map(m => m.characterId));
    const pool = characters
      .filter(c => !memberIds.has(c.id))
      .map(c => ({ id: c.id, name: c.basicInfo?.name || '未命名' }));
    return pinyinSearch(memberSearch, pool);
  };

  const handleAddMember = (characterId) => {
    if (!addMemberClanId) return;
    addClanMember(addMemberClanId, characterId, memberRole, memberFamilyRole);
    setMemberSearch('');
    setMemberRole('');
    setMemberFamilyRole('');
    setAddMemberClanId(null);
  };

  const toggleExpand = (id) => {
    setExpandedClanId(expandedClanId === id ? null : id);
  };

  const getTypeInfo = (type) => CLAN_TYPES.find(t => t.key === type) || CLAN_TYPES[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-divine-gold-600" />
            门派与家族
          </h2>
          <p className="text-ink-subtle text-sm mt-1">
            {clans.length === 0 ? '尚未建立宗门或家族' : `共 ${clans.length} 个势力`}
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          开宗立派
        </button>
      </div>

      {/* Clan Cards */}
      {clans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-ink-subtle">
          <span className="text-5xl mb-4">⛩️</span>
          <p className="text-base font-medium">天下尚无一宗一族</p>
          <p className="text-sm mt-1">点"开宗立派"建立第一个势力</p>
          <button onClick={() => setCreateOpen(true)} className="btn-primary mt-6 flex items-center gap-2">
            <Plus className="w-4 h-4" />开宗立派
          </button>
        </div>
      )}

      <div className="space-y-4">
        {clans.map(clan => {
          const typeInfo = getTypeInfo(clan.type);
          const isExpanded = expandedClanId === clan.id;
          const isEditing = editingClan === clan.id;
          const leader = clan.leaderId ? characters.find(c => c.id === clan.leaderId) : null;

          return (
            <div key={clan.id} className="card overflow-hidden">
              {/* Clan Header */}
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-paper-muted/50 transition-colors"
                onClick={() => toggleExpand(clan.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">{typeInfo.icon}</span>
                  <div className="min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <input
                          type="text" value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="input py-1 text-sm w-40"
                          autoFocus
                        />
                        <button onClick={() => handleSaveEdit(clan.id)} className="btn-primary text-xs py-1 px-3">存</button>
                        <button onClick={() => setEditingClan(null)} className="btn-ghost text-xs py-1 px-2">消</button>
                      </div>
                    ) : (
                      <h3 className="text-lg font-bold text-ink truncate">{clan.name || '未命名'}</h3>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-divine-gold-500/10 text-divine-gold-700 font-medium">{typeInfo.label}</span>
                      <span className="text-xs text-ink-subtle">
                        <Users className="w-3 h-3 inline mr-0.5" />{clan.members.length} 人
                      </span>
                      {leader && (
                        <span className="text-xs text-divine-gold-600 flex items-center gap-0.5">
                          <Crown className="w-3 h-3" />{leader.basicInfo?.name || '未知'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); handleStartEdit(clan); }}
                    className="btn-ghost p-1.5 text-ink-subtle hover:text-divine-gold-600"
                    title="编辑"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteTarget(clan.id); }}
                    className="btn-ghost p-1.5 text-ink-subtle hover:text-cinnabar-600"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-ink-subtle" /> : <ChevronDown className="w-5 h-5 text-ink-subtle" />}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-paper-border p-5 space-y-4">
                  {/* Description */}
                  {isEditing ? (
                    <div>
                      <label className="text-xs text-ink-subtle block mb-1">势力简介</label>
                      <textarea
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        className="textarea text-sm"
                        rows={2}
                        placeholder="描述这个势力的背景..."
                      />
                    </div>
                  ) : clan.description ? (
                    <p className="text-sm text-ink-secondary">{clan.description}</p>
                  ) : null}

                  {/* Members */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-ink">成员名录</h4>
                      <button
                        onClick={() => { setAddMemberClanId(clan.id); setMemberSearch(''); setMemberRole(''); setMemberFamilyRole(''); }}
                        className="btn-primary text-xs py-1.5 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />收录
                      </button>
                    </div>

                    {clan.members.length === 0 ? (
                      <p className="text-ink-subtle text-sm text-center py-4">尚无门人弟子</p>
                    ) : (
                      <div className="space-y-2">
                        {clan.members.map(member => {
                          const char = characters.find(c => c.id === member.characterId);
                          const isLeader = clan.leaderId === member.characterId;
                          return (
                            <div key={member.characterId} className="flex items-center justify-between px-4 py-2.5 bg-paper-muted rounded-xl group">
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Avatar */}
                                {char?.basicInfo?.avatar ? (
                                  <img src={char.basicInfo.avatar} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-paper-border" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-semibold">
                                    {char?.basicInfo?.name?.charAt(0) || '?'}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <span
                                    className="text-sm font-medium text-ink cursor-pointer hover:text-divine-gold-600 hover:underline truncate block"
                                    onClick={() => navigate(`/character/${member.characterId}`)}
                                  >
                                    {isLeader && <Crown className="w-3 h-3 inline mr-1 text-divine-gold-600" />}
                                    {char?.basicInfo?.name || '未知'}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {member.role && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-divine-gold-500/10 text-divine-gold-700">{member.role}</span>
                                    )}
                                    {member.familyRole && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700">{member.familyRole}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!isLeader && (
                                  <button
                                    onClick={() => updateClan(clan.id, { leaderId: member.characterId })}
                                    className="text-ink-subtle hover:text-divine-gold-600 p-1"
                                    title="设为首领"
                                  >
                                    <Crown className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => removeClanMember(clan.id, member.characterId)}
                                  className="text-ink-subtle hover:text-cinnabar-600 p-1"
                                  title="移除"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <div className="relative card p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-divine-gold-600" />开宗立派
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-ink-subtle block mb-1">势力名称</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="input" placeholder="如：蓝家、青云宗" autoFocus />
              </div>
              <div>
                <label className="text-xs text-ink-subtle block mb-1">类型</label>
                <div className="flex gap-2">
                  {CLAN_TYPES.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setNewType(t.key)}
                      className={`pill ${newType === t.key ? 'pill-active' : 'pill-inactive'}`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-ink-subtle block mb-1">简介（可选）</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="textarea text-sm" rows={2} placeholder="描述这个势力的背景..." />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setCreateOpen(false)} className="btn-ghost flex-1">取消</button>
              <button onClick={handleCreate} disabled={!newName.trim()} className="btn-primary flex-1 disabled:opacity-50">创建</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {addMemberClanId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setAddMemberClanId(null)} />
          <div className="relative card p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-ink mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-divine-gold-600" />收录成员
            </h3>
            <p className="text-xs text-ink-subtle mb-3">搜索人物名称或拼音首字母</p>

            <div className="space-y-3 mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
                <input type="text" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="input pl-10 py-2 text-sm" placeholder="搜索人物..." autoFocus />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-ink-subtle block mb-0.5">职位/身份</label>
                  <CustomSelect
                    value={memberRole}
                    onChange={val => setMemberRole(val)}
                    options={getRolesForType(clans.find(c => c.id === addMemberClanId)?.type)}
                    placeholder="选择职位..."
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-ink-subtle block mb-0.5">家族称谓</label>
                  <input type="text" value={memberFamilyRole} onChange={e => setMemberFamilyRole(e.target.value)} className="input py-1.5 text-xs" placeholder="如：兄、弟、父" />
                </div>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1">
              {getCandidates(addMemberClanId).map(c => (
                <button
                  key={c.id}
                  onClick={() => handleAddMember(c.id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-ink hover:bg-divine-gold-50 hover:text-divine-gold-700 transition-colors flex items-center justify-between"
                >
                  <span>{c.name}</span>
                  <span className="text-[10px] text-ink-subtle">收录</span>
                </button>
              ))}
              {memberSearch && getCandidates(addMemberClanId).length === 0 && (
                <p className="text-xs text-ink-subtle text-center py-3">未寻得匹配之人</p>
              )}
              {!memberSearch && getCandidates(addMemberClanId).length === 0 && (
                <p className="text-xs text-ink-subtle text-center py-3">所有角色均已收录</p>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={() => setAddMemberClanId(null)} className="btn-ghost flex-1">完成</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="覆灭势力"
        message={`确定要覆灭「${clans.find(c => c.id === deleteTarget)?.name || ''}」吗？此操作不可逆转。`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
}
