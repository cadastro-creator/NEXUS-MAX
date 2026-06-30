import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider,
  createUserWithEmailAndPassword, signInWithEmailAndPassword
} from 'firebase/auth'
import {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, getDocs,
  serverTimestamp
} from 'firebase/firestore'
import { auth, db } from '../firebase/config.js'

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

// Domínio técnico interno — usado só para usuários sem email real. Nunca exibido.
const DOMINIO_INTERNO = 'scar-max.local'

function usernameParaEmail(username) {
  return username.trim().toLowerCase().replace(/\s+/g, '') + '@' + DOMINIO_INTERNO
}

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

  // ── CONVITE — Google ──────────────────────────────────────────────────────
  async function loginComConvite(conviteId) {
    setErro('')
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const result = await signInWithPopup(auth, provider)
      const firebaseUser = result.user

      const userSnap = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
      if (userSnap.exists() && userSnap.data().ativo) {
        setPerfil(userSnap.data()); setUser(firebaseUser)
        setAuthStatus('authenticated')
        return { ok: true }
      }

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

      const novoUsuario = {
        nome:         convite.nome,
        email:        firebaseUser.email.toLowerCase(),
        perfil:       convite.perfil,
        ativo:        true,
        criadoEm:     serverTimestamp(),
        atualizadoEm: serverTimestamp(),
        conviteId:    conviteId,
        metodoAcesso: 'google',
      }
      await setDoc(doc(db, 'usuarios', firebaseUser.uid), novoUsuario)
      await updateDoc(doc(db, 'convites', conviteId), {
        usado: true, usadoPor: firebaseUser.uid, usadoEm: serverTimestamp(),
        metodoUsado: 'google',
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

  // ── CONVITE — criar senha (email real OU username fictício) ────────────────
  // tipo: 'email' | 'usuario'
  async function criarSenhaComConvite(conviteId, identificador, senha, tipo) {
    setErro('')
    try {
      const conviteSnap = await getDoc(doc(db, 'convites', conviteId))
      if (!conviteSnap.exists()) return { ok: false, erro: 'Convite não encontrado.' }

      const convite = conviteSnap.data()
      if (convite.usado) return { ok: false, erro: 'Este link de convite já foi utilizado.' }

      const emailFirebase = tipo === 'usuario'
        ? usernameParaEmail(identificador)
        : identificador.trim().toLowerCase()

      // Se for username, verifica se já existe alguém com esse nome
      if (tipo === 'usuario') {
        const q = query(collection(db, 'usuarios'), where('username', '==', identificador.trim().toLowerCase()))
        const snap = await getDocs(q)
        if (!snap.empty) return { ok: false, erro: 'Este nome de usuário já está em uso. Escolha outro.' }
      }

      const cred = await createUserWithEmailAndPassword(auth, emailFirebase, senha)
      const firebaseUser = cred.user

      const novoUsuario = {
        nome:         convite.nome,
        perfil:       convite.perfil,
        ativo:        true,
        criadoEm:     serverTimestamp(),
        atualizadoEm: serverTimestamp(),
        conviteId:    conviteId,
        metodoAcesso: tipo,
        ...(tipo === 'email'
          ? { email: emailFirebase }
          : { username: identificador.trim().toLowerCase(), emailInterno: emailFirebase }),
      }
      await setDoc(doc(db, 'usuarios', firebaseUser.uid), novoUsuario)
      await updateDoc(doc(db, 'convites', conviteId), {
        usado: true, usadoPor: firebaseUser.uid, usadoEm: serverTimestamp(),
        metodoUsado: tipo,
      })

      setPerfil(novoUsuario); setUser(firebaseUser)
      setAuthStatus('authenticated')
      return { ok: true }
    } catch (e) {
      let msg = 'Erro ao criar acesso: ' + e.message
      if (e.code === 'auth/email-already-in-use') msg = 'Já existe uma conta com este identificador. Use a tela de login.'
      if (e.code === 'auth/weak-password') msg = 'Senha muito curta. Use ao menos 6 caracteres.'
      if (e.code === 'auth/invalid-email') msg = 'Nome de usuário inválido — use apenas letras e números.'
      return { ok: false, erro: msg }
    }
  }

  // ── LOGIN normal — email OU username ────────────────────────────────────────
  async function loginComSenha(identificador, senha) {
    setErro('')
    try {
      // Se contém "@", trata como email. Senão, é username — converte para email interno.
      const emailFirebase = identificador.includes('@')
        ? identificador.trim().toLowerCase()
        : usernameParaEmail(identificador)

      await signInWithEmailAndPassword(auth, emailFirebase, senha)
      return { ok: true }
    } catch (e) {
      let msg = 'Usuário/e-mail ou senha incorretos.'
      if (e.code === 'auth/too-many-requests') msg = 'Muitas tentativas. Aguarde um momento.'
      setErro(msg)
      return { ok: false, erro: msg }
    }
  }

  async function logout() {
    await signOut(auth)
    setUser(null); setPerfil(null); setErro('')
    setAuthStatus('unauthenticated')
  }

  return (
    <AuthContext.Provider value={{
      user, perfil, loading, loginGoogle, loginComConvite,
      criarSenhaComConvite, loginComSenha, logout, erro, authStatus
    }}>
      {children}
    </AuthContext.Provider>
  )
}