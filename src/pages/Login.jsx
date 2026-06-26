import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Login() {
  const { loginGoogle, user, erro: erroAuth } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => { if (user) navigate('/') }, [user])
  useEffect(() => { if (erroAuth) setErro(erroAuth) }, [erroAuth])

  async function handleLogin() {
    setErro('')
    setLoading(true)
    try {
      await loginGoogle()
    } catch {
      setErro('Erro ao iniciar login. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      fontFamily: 'DM Sans, sans-serif',
    }}>

      {/* PAINEL ESQUERDO — MARCA */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 80px',
        borderRight: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* GLOW DE FUNDO */}
        <div style={{
          position: 'absolute',
          top: '30%', left: '-10%',
          width: 500, height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* LOGO */}
        <div style={{ marginBottom: 60 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text3)',
            letterSpacing: 4,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            CONTATTOS
          </div>
          <div style={{
            fontSize: 48,
            fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: -2,
            lineHeight: 1,
            marginBottom: 8,
          }}>
            S.C.A.R
            <span style={{
              color: 'var(--accent)',
              marginLeft: 12,
            }}>MAX</span>
          </div>
          <div style={{
            fontSize: 13,
            color: 'var(--text3)',
            fontFamily: 'DM Mono, monospace',
            letterSpacing: 1,
          }}>
            v1.0 — Sistema de Controle e Acompanhamento de Registros
          </div>
        </div>

        {/* FEATURES */}
        {[
          { icon: '📋', titulo: 'Central de Cadastros',    desc: 'Fila inteligente com aprovação, devolução e histórico completo' },
          { icon: '📊', titulo: 'Painel S.C.A.R',          desc: 'Dashboard em tempo real com curva ABC, KPIs e alertas' },
          { icon: '🔔', titulo: 'Notificações Automáticas', desc: 'Comprador, fiscal e gerente notificados em uma única ação' },
          { icon: '⚙️', titulo: '100% Configurável',        desc: 'Campos, perfis e permissões ajustáveis sem código' },
        ].map((f, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
            marginBottom: 24,
          }}>
            <div style={{
              width: 36, height: 36,
              background: 'var(--acc-dim)',
              border: '1px solid rgba(249,115,22,.2)',
              borderRadius: 'var(--radius-xs)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}>
              {f.icon}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                {f.titulo}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
                {f.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PAINEL DIREITO — LOGIN */}
      <div style={{
        width: 420,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        background: 'var(--surface)',
        flexShrink: 0,
      }}>

        <div style={{ width: '100%', maxWidth: 320 }}>

          {/* HEADER */}
          <div style={{ marginBottom: 40 }}>
            <div style={{
              width: 48, height: 48,
              background: 'var(--acc-dim)',
              border: '1px solid rgba(249,115,22,.25)',
              borderRadius: 'var(--radius)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
              marginBottom: 20,
            }}>
              🔐
            </div>
            <div style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: 6,
              letterSpacing: -.5,
            }}>
              Bem-vindo de volta
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.5 }}>
              Acesse com sua conta Google corporativa para continuar.
            </div>
          </div>

          {/* BOTÃO */}
          <button
            className="btn btn-primary"
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '14px 18px',
              fontSize: 14,
              borderRadius: 'var(--radius)',
              marginBottom: 16,
              fontWeight: 700,
              letterSpacing: .3,
            }}
          >
            {loading
              ? <><Spinner /> Redirecionando...</>
              : <><GoogleIcon /> Entrar com Google</>
            }
          </button>

          {/* ERRO */}
          {erro && (
            <div style={{
              background: 'var(--red-dim)',
              color: 'var(--red)',
              border: '1px solid rgba(242,92,110,.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: 12,
              textAlign: 'center',
              marginBottom: 16,
              lineHeight: 1.5,
            }}>
              {erro}
            </div>
          )}

          {/* DIVIDER */}
          <div style={{
            width: '100%', height: 1,
            background: 'var(--border)',
            margin: '24px 0',
          }} />

          {/* FOOTER */}
          <div style={{
            fontSize: 11,
            color: 'var(--text3)',
            textAlign: 'center',
            lineHeight: 1.6,
          }}>
            Acesso restrito a usuários autorizados.<br />
            Em caso de problemas, contate o administrador do sistema.
          </div>
        </div>

        {/* COPYRIGHT */}
        <div style={{
          position: 'absolute',
          bottom: 24,
          fontSize: 10,
          color: 'var(--text3)',
          fontFamily: 'DM Mono, monospace',
          letterSpacing: .5,
        }}>
          CONTATTOS © {new Date().getFullYear()} — S.C.A.R MAX
        </div>
      </div>
    </div>
  )
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