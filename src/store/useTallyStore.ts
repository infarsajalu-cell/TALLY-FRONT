import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';

export interface Tally {
  _id: string;
  name: string;
  count: number;
  createdAt: string;
}

interface TallyStore {
  tallies: Tally[];
  loading: boolean;
  fetchTallies: (search?: string, sort?: string) => Promise<void>;
  createTally: (name: string) => Promise<void>;
  updateTally: (id: string, updates: Partial<Tally>) => Promise<void>;
  deleteTally: (id: string) => Promise<void>;
}

export const useTallyStore = create<TallyStore>((set, get) => ({
  tallies: [],
  loading: false,

  fetchTallies: async (search = '', sort = 'latest') => {
    set({ loading: true });
    try {
      const { data } = await api.get<Tally[]>(`/?search=${search}&sort=${sort}`);
      set({ tallies: data });
    } catch (error) {
      toast.error('Failed to load tallies');
    } finally {
      set({ loading: false });
    }
  },

  createTally: async (name: string) => {
    try {
      const { data } = await api.post<Tally>('/', { name });
      set((state) => ({ tallies: [data, ...state.tallies] }));
      toast.success('Tally created successfully');
    } catch (error) {
      toast.error('Failed to create tally');
    }
  },

  updateTally: async (id: string, updates: Partial<Tally>) => {
    // Optimistic update
    const previousTallies = get().tallies;
    set((state) => ({
      tallies: state.tallies.map((t) => (t._id === id ? { ...t, ...updates } : t)),
    }));

    try {
      await api.put(`/${id}`, updates);
    } catch (error) {
      // Revert on failure
      set({ tallies: previousTallies });
      toast.error('Failed to update tally');
    }
  },

  deleteTally: async (id: string) => {
    const previousTallies = get().tallies;
    set((state) => ({
      tallies: state.tallies.filter((t) => t._id !== id),
    }));

    try {
      await api.delete(`/${id}`);
      toast.success('Tally deleted');
    } catch (error) {
      set({ tallies: previousTallies });
      toast.error('Failed to delete tally');
    }
  },
}));
