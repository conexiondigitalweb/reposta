import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAppStore = create((set) => ({
  user: null,
  profile: null,
  sessionLoaded: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  // Carga sesión inicial y suscribe a cambios de auth
  initSession: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null

    let profile = null
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      profile = data
    }

    set({ user, profile, sessionLoaded: true })

    // Escuchar cambios de sesión (login, logout, token refresh)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      let profile = null
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        profile = data
      }
      set({ user, profile })
    })
  },

  currentGeneration: null,
  setCurrentGeneration: (generation) => set({ currentGeneration: generation }),

  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),
}))
