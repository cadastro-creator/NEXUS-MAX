import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider
} from 'firebase/auth'
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
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          let snap = null
          for (let i = 0; i < 3; i++) {
            const ref = doc(db, 'usuarios', firebaseUser.uid)
            snap = await getDoc(ref)
            if (snap.exists()) break
            await new Promise(r => setTimeout(r, 800))
          }

          if (snap && snap.exists()) {
            const data = snap.data()
            if (!data.ativo) {
              setErro('Usuário desativado. Contate o administrador.')
              await signOut(auth)
              setUser(null)
              setPerfil(null)
            } else {
              setErro('')
              setPerfil(data)
              setUser(firebaseUser)
            }
          } else {
            setErro('Acesso não autorizado. Contate o administrador.')
            await signOut(auth)
            setUser(null)
            setPerfil(null)
          }
        } catch (e) {
          setErro('Erro ao carregar perfil: ' + e.message)
        }
      } else {
        setUser(null)
        setPerfil(null)
        setErro('')
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function loginGoogle() {
    setErro('')
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      await signInWithPopup(auth, provider)
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setErro('Erro ao fazer login: ' + e.message)
      }
    }
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