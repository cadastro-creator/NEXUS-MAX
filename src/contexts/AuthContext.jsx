import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut, GoogleAuthProvider } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config.js'

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [perfil, setPerfil]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro]       = useState('')

  useEffect(() => {
    let mounted = true

    async function init() {
      // Primeiro processa o redirect se houver
      try {
        await getRedirectResult(auth)
      } catch (e) {
        console.error('Redirect error:', e)
      }

      // Depois escuta mudanças de auth
      const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!mounted) return

        if (firebaseUser) {
          try {
            // Tenta buscar até 3 vezes com delay (Firestore pode demorar)
            let snap = null
            for (let i = 0; i < 3; i++) {
              const ref = doc(db, 'usuarios', firebaseUser.uid)
              snap = await getDoc(ref)
              if (snap.exists()) break
              await new Promise(r => setTimeout(r, 1000))
            }

            if (snap && snap.exists()) {
              const data = snap.data()
              if (!data.ativo) {
                if (mounted) {
                  setErro('Usuário desativado. Contate o administrador.')
                  await signOut(auth)
                  setUser(null)
                  setPerfil(null)
                }
              } else {
                if (mounted) {
                  setErro('')
                  setPerfil(data)
                  setUser(firebaseUser)
                }
              }
            } else {
              if (mounted) {
                setErro('Acesso não autorizado. Contate o administrador.\nUID: ' + firebaseUser.uid)
                await signOut(auth)
                setUser(null)
                setPerfil(null)
              }
            }
          } catch (e) {
            console.error('Erro Firestore:', e)
            if (mounted) {
              setErro('Erro ao carregar perfil: ' + e.message)
            }
          }
        } else {
          if (mounted) {
            setUser(null)
            setPerfil(null)
          }
        }
        if (mounted) setLoading(false)
      })

      return unsub
    }

    let unsubscribe = null
    init().then(unsub => { unsubscribe = unsub })

    return () => {
      mounted = false
      if (unsubscribe) unsubscribe()
    }
  }, [])

  async function loginGoogle() {
    const provider = new GoogleAuthProvider()
    await signInWithRedirect(auth, provider)
  }

  async function logout() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, perfil, loading, loginGoogle, logout, erro }}>
      {children}
    </AuthContext.Provider>
  )
}