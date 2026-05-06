import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCuentaStore = create(
  persist(
    (set, get) => ({
      cuentas: [],
      cuentaActivaId: null,

      setCuentas: (cuentas) => {
        const activa = get().cuentaActivaId
        const sigueExistiendo = cuentas.some(c => c.id === activa)
        set({
          cuentas,
          cuentaActivaId: sigueExistiendo ? activa : (cuentas[0]?.id ?? null),
        })
      },

      setCuentaActiva: (id) => set({ cuentaActivaId: id }),

      getCuentaActiva: () => {
        const { cuentas, cuentaActivaId } = get()
        return cuentas.find(c => c.id === cuentaActivaId) ?? null
      },
    }),
    { name: 'adsai-cuenta' }
  )
)
