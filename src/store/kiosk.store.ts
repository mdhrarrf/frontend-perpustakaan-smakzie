import { create } from 'zustand'

interface KioskState {
  stationId: string
  isIdle:    boolean
  idleTimer: ReturnType<typeof setTimeout> | null

  setStationId: (id: string) => void
  setIdle: (idle: boolean) => void
  resetIdleTimer: (callback: () => void, timeoutMs?: number) => void
  clearIdleTimer: () => void
}

export const useKioskStore = create<KioskState>((set, get) => ({
  stationId: 'KIOSK-01',
  isIdle:    false,
  idleTimer: null,

  setStationId: (id) => set({ stationId: id }),
  setIdle:      (idle) => set({ isIdle: idle }),

  resetIdleTimer: (callback, timeoutMs = 60000) => {
    const { idleTimer } = get()
    if (idleTimer) clearTimeout(idleTimer)
    const timer = setTimeout(() => {
      set({ isIdle: true })
      callback()
    }, timeoutMs)
    set({ idleTimer: timer, isIdle: false })
  },

  clearIdleTimer: () => {
    const { idleTimer } = get()
    if (idleTimer) clearTimeout(idleTimer)
    set({ idleTimer: null })
  },
}))
