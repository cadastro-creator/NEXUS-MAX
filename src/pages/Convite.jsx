import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { useAuth } from '../contexts/AuthContext.jsx'

const PERFIL_LABEL = {
  SUPER_ADMIN:       'Super Admin',
  GESTOR_CADASTRO:   'Gestor de Cadastro',
  COMPRADOR:         'Comprador',
  FISCAL:            'Fiscal',
  GERENTE_COMERCIAL: 'Gerente Comercial',
  ALMOXARIFADO:      'Almoxarifado',
  RECEBIMENTO:       'Recebimento',
  GARANTIAS:         'Garantias',
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 14, height: 14,
      border: '2px solid rgba(0,0,0,.2)',
      borderTopColor: '#000',
      borderRadius: '50%',
      animation: 'spin .7s linear infinite',
    }} />
  )
}

export default function Convite() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { loginComConvite, criarSenhaComConvite, authStatus } = useAuth()

  const [convite, setConvite] = useState(null)
  // carregando | valido | usado | invalido | entrando | erro | sucesso
  const [status, setStatus]   = useState('carregando')
  const [erro, setErro]       = useState('')

  // Qual método está em uso no momento: null | 'google' | 'email' | 'usuario'
  const [metodo, setMetodo]       = useState(null)
  const [identificador, setIdentificador] = useState('')
  const [senha, setSenha]         = useState('')
  const [senha2, setSenha2]       = useState('')
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    if (authStatus === 'authenticated') navigate('/', { replace: true })
  }, [authStatus])

  useEffect(() => {
    async function verificar() {
      try {
        const snap = await getDoc(doc(db, 'convites', id))
        if (!snap.exists()) { setStatus('invalido'); return }
        const data = snap.data()
        setConvite(data)
        if (data.usado) { setStatus('usado'); return }
        setStatus('valido')
      } catch {
        setStatus('invalido')
      }
    }
    verificar()
  }, [id])

  // Métodos liberados para este convite. Se não definido, libera todos os 3.
  const metodosPermitidos = convite?.metodosPermitidos?.length > 0
    ? convite.metodosPermitidos
    : ['google', 'email', 'usuario']

  async function entrarComGoogle() {
    setProcessando(true)
    setErro('')
    const result = await loginComConvite(id)
    if (result.ok) {
      setStatus('sucesso')
      setTimeout(() => navigate('/', { replace: true }), 1500)
    } else {
      if (result.erro) setErro(result.erro)
      setProcessando(false)
    }
  }

  async function criarComSenha(e) {
    e.preventDefault()
    if (!identificador.trim()) {
      setErro(metodo === 'usuario' ? 'Informe um nome de usuário.' : 'Informe um e-mail.')
      return
    }
    if (senha.length < 6) { setErro('A senha deve ter ao menos 6 caracteres.'); return }
    if (senha !== senha2) { setErro('As senhas não coincidem.'); return }

    setProcessando(true)
    setErro('')
    const result = await criarSenhaComConvite(id, identificador.trim(), senha, metodo)
    setProcessando(false)

    if (result.ok) {
      setStatus('sucesso')
      setTimeout(() => navigate('/', { replace: true }), 1500)
    } else {
      setErro(result.erro)
    }
  }

  function voltar() {
    setMetodo(null)
    setIdentificador('')
    setSenha('')
    setSenha2('')
    setErro('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif', padding: 24,
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border2)',
        borderRadius: 'var(--radius)',
        width: '100%', maxWidth: 420,
        overflow: 'hidden',
      }}>

        {/* TOPO */}
        <div style={{
          background: 'var(--acc-dim)',
          borderBottom: '1px solid rgba(249,115,22,.2)',
          padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', letterSpacing: 3, textTransform: 'uppercase' }}>
            CONTATTOS
          </div>
          <div style={{ width: 1, height: 12, background: 'var(--border2)' }} />
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.3 }}>
            NEXUS <span style={{ color: 'var(--accent)' }}>MAX</span>
          </div>
        </div>

        <div style={{ padding: '32px 28px' }}>

          {/* CARREGANDO */}
          {status === 'carregando' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 36, height: 36,
                border: '3px solid var(--surface3)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin .8s linear infinite',
                margin: '0 auto 16px',
              }} />
              <div style={{ color: 'var(--text3)', fontSize: 13 }}>Verificando convite...</div>
            </div>
          )}

          {/* CONVITE VÁLIDO */}
          {(status === 'valido' || status === 'entrando') && convite && (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: -0.5 }}>
                  Olá, {convite.nome}! 👋
                </div>
                <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>
                  Você foi convidado por <strong style={{ color: 'var(--text2)' }}>{convite.convidadoPor}</strong> para acessar o NEXUS MAX.
                </div>
              </div>

              {/* Card do acesso */}
              <div style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border2)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 18px',
                marginBottom: 24,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>Perfil</span>
                <span className="badge badge-orange">
                  {PERFIL_LABEL[convite.perfil] || convite.perfil}
                </span>
              </div>

              {/* ── ESCOLHA DE MÉTODO ── */}
              {!metodo && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>
                    Como você quer acessar?
                  </div>

                  {metodosPermitidos.includes('google') && (
                    <button
                      className="btn btn-primary"
                      onClick={entrarComGoogle}
                      disabled={processando}
                      style={{ width: '100%', justifyContent: 'center', padding: '13px 18px', fontSize: 14, fontWeight: 700 }}
                    >
                      {processando ? <><Spinner /> Entrando...</> : <><GoogleIcon /> Entrar com Google</>}
                    </button>
                  )}

                  {metodosPermitidos.includes('email') && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => { setMetodo('email'); setErro('') }}
                      style={{ width: '100%', justifyContent: 'center', padding: '12px 18px', fontSize: 13 }}
                    >
                      ✉️ Criar acesso com e-mail e senha
                    </button>
                  )}

                  {metodosPermitidos.includes('usuario') && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => { setMetodo('usuario'); setErro('') }}
                      style={{ width: '100%', justifyContent: 'center', padding: '12px 18px', fontSize: 13 }}
                    >
                      🔑 Criar usuário e senha
                    </button>
                  )}
                </div>
              )}

              {/* ── FORMULÁRIO DE SENHA (email ou usuário) ── */}
              {(metodo === 'email' || metodo === 'usuario') && (
                <form onSubmit={criarComSenha} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 4,
                  }}>
                    <span style={{ fontSize: 16 }}>{metodo === 'email' ? '✉️' : '🔑'}</span>
                    <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>
                      {metodo === 'email' ? 'Criar acesso por e-mail' : 'Criar acesso por usuário'}
                    </span>
                  </div>

                  <input
                    className="input"
                    type={metodo === 'email' ? 'email' : 'text'}
                    placeholder={metodo === 'email' ? 'seu@email.com' : 'Escolha um nome de usuário'}
                    value={identificador}
                    onChange={e => setIdentificador(e.target.value)}
                    autoFocus
                  />
                  <input
                    className="input" type="password" placeholder="Crie uma senha (mín. 6 caracteres)"
                    value={senha} onChange={e => setSenha(e.target.value)}
                  />
                  <input
                    className="input" type="password" placeholder="Confirme a senha"
                    value={senha2} onChange={e => setSenha2(e.target.value)}
                  />

                  {erro && (
                    <div style={{
                      background: 'var(--red-dim)', color: 'var(--red)',
                      border: '1px solid rgba(242,92,110,.3)',
                      borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 12,
                    }}>
                      {erro}
                    </div>
                  )}

                  <button
                    type="submit" className="btn btn-primary" disabled={processando}
                    style={{ width: '100%', justifyContent: 'center', padding: '12px 18px', fontSize: 13, fontWeight: 700 }}
                  >
                    {processando ? 'Criando acesso...' : 'Criar acesso e entrar'}
                  </button>
                  <button
                    type="button" onClick={voltar}
                    style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 12, cursor: 'pointer', padding: 4 }}
                  >
                    ← Voltar para outras opções
                  </button>
                </form>
              )}

              {/* Erro vindo da tentativa com Google */}
              {!metodo && erro && (
                <div style={{
                  background: 'var(--red-dim)', color: 'var(--red)',
                  border: '1px solid rgba(242,92,110,.3)',
                  borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 12, marginTop: 12,
                }}>
                  {erro}
                </div>
              )}

              <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
                Este link é de uso único.
              </div>
            </>
          )}

          {/* SUCESSO */}
          {status === 'sucesso' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                Acesso criado!
              </div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                Redirecionando para o sistema...
              </div>
            </div>
          )}

          {/* JÁ USADO */}
          {status === 'usado' && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                Link já utilizado
              </div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24, lineHeight: 1.6 }}>
                Este convite já foi aceito.<br />
                Se você é a pessoa convidada, acesse normalmente pelo login.
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => navigate('/login')}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Ir para o login
              </button>
            </div>
          )}

          {/* INVÁLIDO */}
          {status === 'invalido' && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                Convite inválido
              </div>
              <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>
                Este link não existe ou foi cancelado.<br />
                Solicite um novo convite ao administrador.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}