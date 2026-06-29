import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider
} from 'firebase/auth'
import {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, getDocs,
  serverTimestamp
} from 'firebase/firestore'
import { auth, db } from '../firebase/config.js'

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null)
  const [perfil, setPerfil]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [erro, setErro]             = useState('')
  // 'loading' | 'unauthenticated' | 'unauthorized' | 'authenticated'
  const [authStatus, setAuthStatus] = useState('loading')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null); setPerfil(null); setErro('')
        setAuthStatus('unauthenticated'); setLoading(false)
        return
      }

      try {
        // Verifica documento do usuário (até 3x)
        let snap = null
        for (let i = 0; i < 3; i++) {
          snap = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
          if (snap.exists()) break
          await new Promise(r => setTimeout(r, 800))
        }

        if (snap && snap.exists()) {
          const data = snap.data()
          if (!data.ativo) {
            setErro('Usuário desativado. Contate o administrador.')
            await signOut(auth)
            setUser(null); setPerfil(null)
            setAuthStatus('unauthorized')
          } else {
            setErro(''); setUser(firebaseUser); setPerfil(data)
            setAuthStatus('authenticated')
            updateDoc(doc(db, 'usuarios', firebaseUser.uid), {
              ultimoAcesso: serverTimestamp()
            }).catch(() => {})
          }
        } else {
          // Sem documento — sem convite válido usado
          setErro('Acesso não autorizado. Contate o administrador.')
          setUser(firebaseUser)
          setPerfil(null)
          setAuthStatus('unauthorized')
        }
      } catch (e) {
        setErro('Erro ao carregar perfil: ' + e.message)
        setAuthStatus('unauthorized')
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

  // Login via convite — chamado pela página /convite/:id após o login Google
  async function loginComConvite(conviteId) {
    setErro('')
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const result = await signInWithPopup(auth, provider)
      const firebaseUser = result.user

      // Verifica se já tem conta (segundo login com mesmo link)
      const userSnap = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
      if (userSnap.exists() && userSnap.data().ativo) {
        setPerfil(userSnap.data()); setUser(firebaseUser)
        setAuthStatus('authenticated')
        return { ok: true }
      }

      // Busca o convite pelo ID
      const conviteSnap = await getDoc(doc(db, 'convites', conviteId))
      if (!conviteSnap.exists()) {
        await signOut(auth)
        return { ok: false, erro: 'Convite não encontrado.' }
      }

      const convite = conviteSnap.data()
      if (convite.usado) {
        await signOut(auth)
        return { ok: false, erro: 'Este link de convite já foi utilizado.' }
      }

      // Cria o usuário
      const novoUsuario = {
        nome:         convite.nome,
        email:        firebaseUser.email.toLowerCase(),
        perfil:       convite.perfil,
        ativo:        true,
        criadoEm:     serverTimestamp(),
        atualizadoEm: serverTimestamp(),
        conviteId:    conviteId,
      }
      await setDoc(doc(db, 'usuarios', firebaseUser.uid), novoUsuario)

      // Marca convite como usado
      await updateDoc(doc(db, 'convites', conviteId), {
        usado: true, usadoPor: firebaseUser.uid, usadoEm: serverTimestamp(),
        emailUsado: firebaseUser.email.toLowerCase(),
      })

      setPerfil(novoUsuario); setUser(firebaseUser)
      setAuthStatus('authenticated')
      return { ok: true }
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        return { ok: false, erro: 'Erro ao fazer login: ' + e.message }
      }
      return { ok: false, erro: '' }
    }
  }

  async function logout() {
    await signOut(auth)
    setUser(null); setPerfil(null); setErro('')
    setAuthStatus('unauthenticated')
  }

  return (
    <AuthContext.Provider value={{
      user, perfil, loading, loginGoogle, loginComConvite, logout, erro, authStatus
    }}>
      {children}
    </AuthContext.Provider>
  )
}