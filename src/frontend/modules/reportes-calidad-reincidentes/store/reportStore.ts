import { create } from 'zustand';
import { ReportData, TipoError } from '@reincidentes/types';

interface ReportState {
  data: ReportData | null;
  tipoActivo: TipoError;
  setData: (data: ReportData) => void;
  setTipoActivo: (tipo: TipoError) => void;
  reset: () => void;
}

export const useReportStore = create<ReportState>((set) => ({
  data: null,
  tipoActivo: 'all',
  setData: (data) => set({ data }),
  setTipoActivo: (tipo) => set({ tipoActivo: tipo }),
  reset: () => set({ data: null, tipoActivo: 'all' }),
}));
