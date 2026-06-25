import { create } from 'zustand'

export const useAppStore = create((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  currentGeneration: null,
  setCurrentGeneration: (generation) => set({ currentGeneration: generation }),

  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),
}))
