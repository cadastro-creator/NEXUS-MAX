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
    // Processa resultado do redirect primeiro
    getRedirectResult(auth)
      .then(result => {
        if (result?.user) {
          console.log('Redirect result OK:', result.user.uid)
        }
      })
      .catch(e => {
        console.error('Redirect error:', e)
      })

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.uid)

      if (firebaseUser) {
        try {
          const ref = doc(db, 'usuarios', firebaseUser.uid)
          const snap = await getDoc(ref)

          console.log('Firestore snap exists:', snap.exists())
          console.log('Buscando UID:', firebaseUser.uid)

          if (snap.exists()) {
            const data = snap.data()
            console.log('Dados encontrados:', data)

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
            console.error('Documento não encontrado para UID:', firebaseUser.uid)
            setErro('Acesso não autorizado. UID: ' + firebaseUser.uid)
            await signOut(auth)
            setUser(null)
            setPerfil(null)
          }
        } catch (e) {
          console.error('Erro ao buscar perfil:', e)
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