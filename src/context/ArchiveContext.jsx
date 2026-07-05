import { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { generateId } from '../utils/idGenerator';
import { loadArchive, saveArchive } from '../utils/storage';

const ArchiveContext = createContext(null);

// 默认空人物模板
export function createEmptyCharacter() {
  return {
    id: '',
    basicInfo: {
      name: '',
      zodiac: '',
      cultivationStartAge: '',
      realm: '',
      subStage: '',
      sect: '',
      position: '',
      avatar: '',
      gender: '',
      spouse: null,
      concubines: [],
      pet: { name: '', species: '' },
    },
    eightDimensions: {
      attack: '',
      divine: '',
      tenacity: '',
      talent: '',
      scheme: '',
      govern: '',
      charm: '',
      looks: '',
    },
    background: {
      mortalOrigin: '',
      immortalFortune: '',
      hiddenMask: '',
      coreMotivation: '',
      destinyPath: '',
    },
    createdAt: '',
    updatedAt: '',
  };
}

// 默认空家族/宗门模板
export function createEmptyClan() {
  return {
    id: '',
    name: '',
    type: 'family', // 'family' | 'sect' | 'gang' | 'alliance'
    description: '',
    leaderId: '',    // 族长/掌门的角色 id
    members: [],     // [{ characterId, role, familyRole }]
    createdAt: '',
    updatedAt: '',
  };
}

// Reducer Actions
const Actions = {
  LOAD: 'LOAD',
  ADD_CHARACTER: 'ADD_CHARACTER',
  UPDATE_CHARACTER: 'UPDATE_CHARACTER',
  UPDATE_CHARACTERS: 'UPDATE_CHARACTERS',
  DELETE_CHARACTER: 'DELETE_CHARACTER',
  IMPORT_ALL: 'IMPORT_ALL',
  RESET_ALL: 'RESET_ALL',
  // 家族/宗门
  ADD_CLAN: 'ADD_CLAN',
  UPDATE_CLAN: 'UPDATE_CLAN',
  DELETE_CLAN: 'DELETE_CLAN',
  ADD_CLAN_MEMBER: 'ADD_CLAN_MEMBER',
  REMOVE_CLAN_MEMBER: 'REMOVE_CLAN_MEMBER',
  UPDATE_CLAN_MEMBER: 'UPDATE_CLAN_MEMBER',
};

function archiveReducer(state, action) {
  switch (action.type) {
    case Actions.LOAD: {
      return { ...state, ...action.payload };
    }

    case Actions.ADD_CHARACTER: {
      const now = new Date().toISOString();
      const newChar = {
        ...createEmptyCharacter(),
        ...action.payload,
        id: action.payload?.id || generateId(),
        createdAt: now,
        updatedAt: now,
      };
      return { ...state, characters: [...state.characters, newChar] };
    }

    case Actions.UPDATE_CHARACTER: {
      const { id, data } = action.payload;
      return {
        ...state,
        characters: state.characters.map(c =>
          c.id === id
            ? { ...c, ...data, updatedAt: new Date().toISOString() }
            : c
        ),
      };
    }

    case Actions.UPDATE_CHARACTERS: {
      return {
        ...state,
        characters: action.payload,
      };
    }

    case Actions.DELETE_CHARACTER: {
      const charId = action.payload;
      return {
        ...state,
        characters: state.characters.filter(c => c.id !== charId),
        // 同时从所有家族中移除该成员
        clans: state.clans.map(clan => ({
          ...clan,
          members: clan.members.filter(m => m.characterId !== charId),
          leaderId: clan.leaderId === charId ? '' : clan.leaderId,
        })),
      };
    }

    // ---- 家族/宗门 ----
    case Actions.ADD_CLAN: {
      const now = new Date().toISOString();
      const newClan = {
        ...createEmptyClan(),
        ...action.payload,
        id: action.payload?.id || generateId(),
        createdAt: now,
        updatedAt: now,
      };
      return { ...state, clans: [...state.clans, newClan] };
    }

    case Actions.UPDATE_CLAN: {
      const { id, data } = action.payload;
      return {
        ...state,
        clans: state.clans.map(c =>
          c.id === id
            ? { ...c, ...data, updatedAt: new Date().toISOString() }
            : c
        ),
      };
    }

    case Actions.DELETE_CLAN: {
      return {
        ...state,
        clans: state.clans.filter(c => c.id !== action.payload),
      };
    }

    case Actions.ADD_CLAN_MEMBER: {
      const { clanId, characterId, role, familyRole } = action.payload;
      return {
        ...state,
        clans: state.clans.map(c => {
          if (c.id !== clanId) return c;
          // 防止重复
          if (c.members.some(m => m.characterId === characterId)) return c;
          return {
            ...c,
            members: [...c.members, { characterId, role: role || '', familyRole: familyRole || '' }],
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    }

    case Actions.REMOVE_CLAN_MEMBER: {
      const { clanId, characterId } = action.payload;
      return {
        ...state,
        clans: state.clans.map(c => {
          if (c.id !== clanId) return c;
          return {
            ...c,
            members: c.members.filter(m => m.characterId !== characterId),
            leaderId: c.leaderId === characterId ? '' : c.leaderId,
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    }

    case Actions.UPDATE_CLAN_MEMBER: {
      const { clanId, characterId, data } = action.payload;
      return {
        ...state,
        clans: state.clans.map(c => {
          if (c.id !== clanId) return c;
          return {
            ...c,
            members: c.members.map(m =>
              m.characterId === characterId ? { ...m, ...data } : m
            ),
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    }

    case Actions.IMPORT_ALL: {
      const incoming = action.payload;
      return {
        characters: incoming.characters || [],
        clans: incoming.clans || [],
      };
    }

    case Actions.RESET_ALL: {
      return {
        characters: [],
        clans: [],
      };
    }

    default:
      return state;
  }
}

const initialState = {
  characters: [],
  clans: [],
};

export function ArchiveProvider({ children }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [state, dispatch] = useReducer(archiveReducer, initialState);

  // 异步加载存档
  useEffect(() => {
    (async () => {
      const saved = await loadArchive();
      if (saved) {
        dispatch({ type: Actions.LOAD, payload: saved });
      }
      setIsLoaded(true);
    })();
  }, []);

  // 每次 state 变化时自动写入 IndexedDB
  useEffect(() => {
    if (isLoaded) {
      saveArchive(state);
    }
  }, [state, isLoaded]);

  // 加载中显示空白
  if (!isLoaded) {
    const noop = () => {};
    return (
      <ArchiveContext.Provider value={{ ...initialState, addCharacter: noop, updateCharacter: noop, updateCharacters: noop, deleteCharacter: noop, addClan: noop, updateClan: noop, deleteClan: noop, addClanMember: noop, removeClanMember: noop, updateClanMember: noop, importAll: noop, resetAll: noop }}>
        {children}
      </ArchiveContext.Provider>
    );
  }

  const actions = {
    addCharacter: (data) => dispatch({ type: Actions.ADD_CHARACTER, payload: data }),
    updateCharacter: (id, data) => dispatch({ type: Actions.UPDATE_CHARACTER, payload: { id, data } }),
    updateCharacters: (characters) => dispatch({ type: Actions.UPDATE_CHARACTERS, payload: characters }),
    deleteCharacter: (id) => dispatch({ type: Actions.DELETE_CHARACTER, payload: id }),
    // 家族/宗门
    addClan: (data) => dispatch({ type: Actions.ADD_CLAN, payload: data }),
    updateClan: (id, data) => dispatch({ type: Actions.UPDATE_CLAN, payload: { id, data } }),
    deleteClan: (id) => dispatch({ type: Actions.DELETE_CLAN, payload: id }),
    addClanMember: (clanId, characterId, role, familyRole) =>
      dispatch({ type: Actions.ADD_CLAN_MEMBER, payload: { clanId, characterId, role, familyRole } }),
    removeClanMember: (clanId, characterId) =>
      dispatch({ type: Actions.REMOVE_CLAN_MEMBER, payload: { clanId, characterId } }),
    updateClanMember: (clanId, characterId, data) =>
      dispatch({ type: Actions.UPDATE_CLAN_MEMBER, payload: { clanId, characterId, data } }),
    importAll: (data) => dispatch({ type: Actions.IMPORT_ALL, payload: data }),
    resetAll: () => dispatch({ type: Actions.RESET_ALL }),
  };

  return (
    <ArchiveContext.Provider value={{ ...state, ...actions }}>
      {children}
    </ArchiveContext.Provider>
  );
}

export function useArchive() {
  const context = useContext(ArchiveContext);
  if (!context) {
    throw new Error('useArchive 必须在 ArchiveProvider 内部使用');
  }
  return context;
}