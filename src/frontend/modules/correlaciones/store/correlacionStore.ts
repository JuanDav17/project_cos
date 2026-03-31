import { create } from 'zustand';
import { CorrelacionData } from '@correlaciones/types';

interface CorrelacionState {
  data: CorrelacionData | null;
  setData: (data: CorrelacionData) => void;
  reset: () => void;
}

export const useCorrelacionStore = create<CorrelacionState>((set) => ({
  data: null,
  setData: (data) => set({ data }),
  reset: () => set({ data: null }),
}));
