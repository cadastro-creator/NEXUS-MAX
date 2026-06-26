import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, GoogleAuthProvider } from 'firebase/auth'
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
    // Verifica resultado do redirect ao carregar a página
    getRedirectResult(auth).catch(() => {})

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const ref = doc(db, 'usuarios', firebaseUser.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const data = snap.data()
          if (!data.ativo) {
            await signOut(auth)
            setErro('Usuário desativado. Contate o administrador.')
            setUser(null)
            setPerfil(null)
            setLoading(false)
            return
          }
          setPerfil(data)
          setUser(firebaseUser)
        } else {
          setErro('Acesso não autorizado. Contate o administrador.')
          await signOut(auth)
          setUser(null)
          setPerfil(null)
        }
      } else {
        setUser(null)
        setPerfil(null)
      }
      setLoading(false)
    })
    return unsub
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