import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Memory {
  id: string;
  title: string;
  subtitle: string;
  emotion: 'warm' | 'cool';
  image: string;
  year: string;
  angle: number;
  distance: number;
  originalText?: string;
  polishedText?: string;
  createdAt?: number;
  description?: string;
}

export type ViewState = 'main' | 'diving' | 'memory' | 'voice';

export const DEFAULT_MEMORIES: Memory[] = [
  {
    id: 'default-1',
    title: '设计初衷',
    subtitle: '',
    emotion: 'warm',
    image: '/memory-childhood.jpg',
    year: '',
    angle: 205,
    distance: 280,
    description: '设计这款应用的初衷是我的灵感常常在晚上睡觉之前迸发，但是因为是入睡前，思绪已经变得有些模糊，都是一些稀碎的想法，也懒得打字，所以就做了这样一个语音记录，AI辅助整理思绪的应用。希望每一位创作者都能有源源不断的灵感。\n\n当然，你也可以把它单纯当做记录心情的工具，把它作为一个记忆的容器也未尝不可！',
  },
  {
    id: 'default-2',
    title: 'The Tower',
    subtitle: 'Moonlit whispers',
    emotion: 'cool',
    image: '/memory-tower.jpg',
    year: '2001',
    angle: 8,
    distance: 280,
  },
  {
    id: 'default-3',
    title: 'Lost Flight',
    subtitle: 'Misty departure',
    emotion: 'warm',
    image: '/memory-lake.jpg',
    year: '2004',
    angle: 150,
    distance: 300,
  },
  {
    id: 'default-4',
    title: 'The Study',
    subtitle: 'Midnight discoveries',
    emotion: 'cool',
    image: '/memory-tower.jpg',
    year: '2007',
    angle: 180,
    distance: 320,
  },
  {
    id: 'default-5',
    title: 'Last Conversation',
    subtitle: 'Words unsaid',
    emotion: 'warm',
    image: '/memory-childhood.jpg',
    year: '2010',
    angle: 25,
    distance: 315,
  },
];

// Preset positions for new user memories (inherited from original default memories)
export const PRESET_POSITIONS = [
  { angle: 8, distance: 280 },
  { angle: 150, distance: 300 },
  { angle: 180, distance: 320 },
  { angle: 25, distance: 315 },
  { angle: 205, distance: 280 },
];

export const STORAGE_KEY = 'pensieve-memories';
export const DELETED_DEFAULTS_KEY = 'pensieve-deleted-defaults';
export const TRASH_KEY = 'pensieve-trash';
export const DEFAULT_OVERRIDES_KEY = 'pensieve-default-overrides';

// ============ Firestore helpers ============

function getUserDocRef(uid: string) {
  if (!db) throw new Error('Firestore 未初始化');
  return doc(db, 'users', uid);
}

interface UserData {
  memories?: Memory[];
  deletedDefaults?: string[];
  trash?: Memory[];
  defaultOverrides?: Record<string, Partial<Memory>>;
}

async function getUserData(uid: string): Promise<UserData | null> {
  if (!db) return null;
  const snap = await getDoc(getUserDocRef(uid));
  return snap.exists() ? (snap.data() as UserData) : null;
}

async function setUserData(uid: string, data: Partial<UserData>): Promise<void> {
  if (!db) return;
  await setDoc(getUserDocRef(uid), data, { merge: true });
}

// ============ LocalStorage helpers ============

function localLoadMemories(): Memory[] {
  try {
    const deletedDefaultsStr = localStorage.getItem(DELETED_DEFAULTS_KEY);
    const deletedDefaults: string[] = deletedDefaultsStr ? JSON.parse(deletedDefaultsStr) : [];
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsedUserMemories = stored ? JSON.parse(stored) as Memory[] : [];
    const activeDefaults = DEFAULT_MEMORIES.filter(m => !deletedDefaults.includes(m.id));
    return [...activeDefaults, ...parsedUserMemories];
  } catch {
    return [...DEFAULT_MEMORIES];
  }
}

function localLoadTrash(): Memory[] {
  try {
    const stored = localStorage.getItem(TRASH_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// ============ Public API ============

function applyDefaultOverrides(defaults: Memory[], overrides: Record<string, Partial<Memory>>): Memory[] {
  return defaults.map(m => {
    const ov = overrides[m.id];
    return ov ? { ...m, ...ov } : m;
  });
}

export async function loadMemories(uid?: string): Promise<Memory[]> {
  if (uid) {
    try {
      const data = await getUserData(uid);
      if (data) {
        const deletedDefaults = data.deletedDefaults || [];
        const userMemories = data.memories || [];
        const overrides = data.defaultOverrides || {};
        const activeDefaults = applyDefaultOverrides(
          DEFAULT_MEMORIES.filter(m => !deletedDefaults.includes(m.id)),
          overrides
        );
        return [...activeDefaults, ...userMemories];
      }
    } catch (err) {
      console.error('[Firestore] loadMemories failed:', err);
    }
  }

  // localStorage path
  try {
    const deletedDefaultsStr = localStorage.getItem(DELETED_DEFAULTS_KEY);
    const deletedDefaults: string[] = deletedDefaultsStr ? JSON.parse(deletedDefaultsStr) : [];
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsedUserMemories = stored ? JSON.parse(stored) as Memory[] : [];
    const overridesStr = localStorage.getItem(DEFAULT_OVERRIDES_KEY);
    const overrides: Record<string, Partial<Memory>> = overridesStr ? JSON.parse(overridesStr) : {};
    const activeDefaults = applyDefaultOverrides(
      DEFAULT_MEMORIES.filter(m => !deletedDefaults.includes(m.id)),
      overrides
    );
    return [...activeDefaults, ...parsedUserMemories];
  } catch {
    return [...DEFAULT_MEMORIES];
  }
}

export async function loadTrashMemories(uid?: string): Promise<Memory[]> {
  if (uid) {
    try {
      const data = await getUserData(uid);
      return data?.trash || [];
    } catch (err) {
      console.error('[Firestore] loadTrashMemories failed:', err);
    }
  }
  return localLoadTrash();
}

export async function saveUserMemory(
  memory: Omit<Memory, 'id' | 'angle' | 'distance' | 'emotion'> & { id: string; emotion: 'warm' | 'cool' },
  uid?: string
): Promise<void> {
  const userMemories = (await loadMemories(uid)).filter(m => m.id.startsWith('user-'));
  const preset = PRESET_POSITIONS[userMemories.length % PRESET_POSITIONS.length];
  const newMem: Memory = {
    ...memory,
    angle: preset.angle,
    distance: preset.distance,
  };

  if (uid) {
    try {
      const data = await getUserData(uid);
      const existing = data?.memories || [];
      await setUserData(uid, { memories: [...existing, newMem] });
      return;
    } catch (err) {
      console.error('[Firestore] saveUserMemory failed:', err);
    }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const existing: Memory[] = stored ? JSON.parse(stored) : [];
    existing.push(newMem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // ignore
  }
}

export async function deleteUserMemory(id: string, uid?: string): Promise<void> {
  if (uid) {
    try {
      const data = await getUserData(uid);
      const memories = data?.memories || [];
      const trash = data?.trash || [];
      const deletedDefaults = data?.deletedDefaults || [];

      if (id.startsWith('default-')) {
        if (!deletedDefaults.includes(id)) {
          const defaultItem = DEFAULT_MEMORIES.find(m => m.id === id);
          await setUserData(uid, {
            deletedDefaults: [...deletedDefaults, id],
            trash: defaultItem ? [...trash, defaultItem] : trash,
          });
        }
      } else {
        const memoryToTrash = memories.find(m => m.id === id);
        await setUserData(uid, {
          memories: memories.filter(m => m.id !== id),
          trash: memoryToTrash ? [...trash, memoryToTrash] : trash,
        });
      }
      return;
    } catch (err) {
      console.error('[Firestore] deleteUserMemory failed:', err);
    }
  }

  try {
    const trashStr = localStorage.getItem(TRASH_KEY);
    const trash: Memory[] = trashStr ? JSON.parse(trashStr) : [];

    if (id.startsWith('default-')) {
      const deletedDefaultsStr = localStorage.getItem(DELETED_DEFAULTS_KEY);
      const deletedDefaults: string[] = deletedDefaultsStr ? JSON.parse(deletedDefaultsStr) : [];
      if (!deletedDefaults.includes(id)) {
        deletedDefaults.push(id);
        localStorage.setItem(DELETED_DEFAULTS_KEY, JSON.stringify(deletedDefaults));
        const defaultItem = DEFAULT_MEMORIES.find(m => m.id === id);
        if (defaultItem) trash.push(defaultItem);
      }
    } else {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const existing: Memory[] = JSON.parse(stored);
        const memoryToTrash = existing.find(m => m.id === id);
        if (memoryToTrash) trash.push(memoryToTrash);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.filter(m => m.id !== id)));
      }
    }

    localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
  } catch {
    // ignore
  }
}

export async function restoreFromTrash(id: string, uid?: string): Promise<void> {
  if (uid) {
    try {
      const data = await getUserData(uid);
      const trash = data?.trash || [];
      const memory = trash.find(m => m.id === id);
      if (!memory) return;

      const newTrash = trash.filter(m => m.id !== id);
      const update: Partial<UserData> = { trash: newTrash };

      if (id.startsWith('default-')) {
        const deletedDefaults = data?.deletedDefaults || [];
        update.deletedDefaults = deletedDefaults.filter(dId => dId !== id);
      } else {
        const memories = data?.memories || [];
        update.memories = [...memories, memory];
      }

      await setUserData(uid, update);
      return;
    } catch (err) {
      console.error('[Firestore] restoreFromTrash failed:', err);
    }
  }

  try {
    const trashStr = localStorage.getItem(TRASH_KEY);
    if (!trashStr) return;
    const trash: Memory[] = JSON.parse(trashStr);
    const memory = trash.find(m => m.id === id);
    if (!memory) return;

    const newTrash = trash.filter(m => m.id !== id);
    localStorage.setItem(TRASH_KEY, JSON.stringify(newTrash));

    if (id.startsWith('default-')) {
      const deletedDefaultsStr = localStorage.getItem(DELETED_DEFAULTS_KEY);
      if (deletedDefaultsStr) {
        const deletedDefaults: string[] = JSON.parse(deletedDefaultsStr);
        localStorage.setItem(DELETED_DEFAULTS_KEY, JSON.stringify(deletedDefaults.filter(dId => dId !== id)));
      }
    } else {
      const stored = localStorage.getItem(STORAGE_KEY);
      const existing: Memory[] = stored ? JSON.parse(stored) : [];
      existing.push(memory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    }
  } catch {
    // ignore
  }
}

export async function permanentDeleteFromTrash(id: string, uid?: string): Promise<void> {
  if (uid) {
    try {
      const data = await getUserData(uid);
      const trash = data?.trash || [];
      await setUserData(uid, { trash: trash.filter(m => m.id !== id) });
      return;
    } catch (err) {
      console.error('[Firestore] permanentDeleteFromTrash failed:', err);
    }
  }

  try {
    const trashStr = localStorage.getItem(TRASH_KEY);
    if (!trashStr) return;
    const trash: Memory[] = JSON.parse(trashStr);
    localStorage.setItem(TRASH_KEY, JSON.stringify(trash.filter(m => m.id !== id)));
  } catch {
    // ignore
  }
}

export async function updateUserMemory(id: string, updates: Partial<Omit<Memory, 'id'>>, uid?: string): Promise<void> {
  if (id.startsWith('default-')) {
    if (uid) {
      try {
        const data = await getUserData(uid);
        const overrides = data?.defaultOverrides || {};
        await setUserData(uid, {
          defaultOverrides: { ...overrides, [id]: { ...overrides[id], ...updates } },
        });
        return;
      } catch (err) {
        console.error('[Firestore] updateUserMemory (default) failed:', err);
      }
    }
    try {
      const stored = localStorage.getItem(DEFAULT_OVERRIDES_KEY);
      const overrides: Record<string, Partial<Memory>> = stored ? JSON.parse(stored) : {};
      overrides[id] = { ...overrides[id], ...updates };
      localStorage.setItem(DEFAULT_OVERRIDES_KEY, JSON.stringify(overrides));
    } catch {
      // ignore
    }
    return;
  }

  if (uid) {
    try {
      const data = await getUserData(uid);
      const memories = data?.memories || [];
      await setUserData(uid, {
        memories: memories.map(m => m.id === id ? { ...m, ...updates } : m),
      });
      return;
    } catch (err) {
      console.error('[Firestore] updateUserMemory failed:', err);
    }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const existing: Memory[] = JSON.parse(stored);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.map(m => m.id === id ? { ...m, ...updates } : m)));
  } catch {
    // ignore
  }
}
