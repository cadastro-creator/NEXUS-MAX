import React, { useState, useEffect } from 'react'
import { collection, onSnapshot, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config.js'
import { useAuth } from '../contexts/AuthContext.jsx'

const PERFIS = [
  'SUPER_ADMIN',
  'GESTOR_CADASTRO',
  'COMPRADOR',
  'FISCAL',
  'GERENTE_COMERCIAL',
  'ALMOXARIFADO',
  'RECEBIMENTO',
  'GARANTIAS',
]

const PERFIL_CORES = {
  SUPER_ADMIN:       'badge-orange',
  GESTOR_CADASTRO:   'badge-blue',
  COMPRADOR:         'badge-green',
  FISCAL:            'badge-amber',
  GERENTE_COMERCIAL: 'badge-blue',
  ALMOXARIFADO:      'badge-gray',
  RECEBIMENTO:       'badge-gray',
  GARANTIAS:         'badge-gray',
}

const USUARIOS_PADRAO = [
  { nome: 'Everton',      email: '', perfil: 'COMPRADOR'         },
  { nome: 'Gustavo',      email: '', perfil: 'COMPRADOR'         },
  { nome: 'Ferrari',      email: '', perfil: 'COMPRADOR'         },
  { nome: 'Daiane',       email: '', perfil: 'FISCAL'            },
  { nome: 'Paulo Favarin',email: '', perfil: 'FISCAL'            },
  { nome: 'Ruan',         email: '', perfil: 'ALMOXARIFADO'      },
  { nome: 'Recebimento',  email: '', perfil: 'RECEBIMENTO'       },
  { nome: 'Garantias',    email: '', perfil: 'GARANTIAS'         },
  { nome: 'Guilherme',    email: '', perfil: 'GERENTE_COMERCIAL' },
  { nome: 'Marcio',       email: '', perfil: 'GERENTE_COMERCIAL' },
]

export default function Usuarios() {
  const { perfil: perfilAtual } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [usuarioEdicao, setUsuarioEdicao] = useState(null)
  const [busca, setBusca] = useState('')

  const isAdmin = perfilAtual?.perfil === 'SUPER_ADMIN'

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'usuarios'), snap => {
      setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const filtrados = usuarios.filter(u =>
    u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    u.email?.toLowerCase().includes(busca.toLowerCase()) ||
    u.perfil?.toLowerCase().includes(busca.toLowerCase())
  )

  async function toggleAtivo(u) {
    await updateDoc(doc(db, 'usuarios', u.id), {
      ativo: !u.ativo,
      atualizadoEm: serverTimestamp(),
    })
  }

  function abrirNovo() {
    setUsuarioEdicao(null)
    setModalAberto(true)
  }

  function abrirEdicao(u) {
    setUsuarioEdicao(u)
    setModalAberto(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1000 }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.5 }}>
            Usuários
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
            {usuarios.filter(u => u.ativo).length} ativos · {usuarios.filter(u => !u.ativo).length} inativos
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={abrirNovo}>
            + Novo Usuário
          </button>
        )}
      </div>

      {/* BUSCA */}
      <input
        className="input"
        placeholder="Buscar por nome, email ou perfil..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        style={{ maxWidth: 360 }}
      />

      {/* TABELA */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
            Carregando...
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)' }}>
              Nenhum usuário encontrado
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Usuário', 'Email', 'Perfil', 'Status', 'Ações'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: 11, fontWeight: 700,
                    color: 'var(--text3)',
                    textTransform: 'uppercase',
                    letterSpacing: .5,
                    background: 'var(--surface)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(u => (
                <tr key={u.id} style={{
                  borderBottom: '1px solid var(--border)',
                  opacity: u.ativo ? 1 : 0.5,
                }}>
                  {/* USUÁRIO */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34,
                        borderRadius: '50%',
                        background: u.ativo ? 'var(--acc-dim)' : 'var(--surface2)',
                        border: `1px solid ${u.ativo ? 'rgba(249,115,22,.25)' : 'var(--border2)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700,
                        color: u.ativo ? 'var(--accent)' : 'var(--text3)',
                        flexShrink: 0,
                      }}>
                        {(u.nome || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                          {u.nome}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
                          UID: {u.id.slice(0, 12)}...
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* EMAIL */}
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text2)' }}>
                    {u.email || <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>não definido</span>}
                  </td>

                  {/* PERFIL */}
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${PERFIL_CORES[u.perfil] || 'badge-gray'}`}>
                      {u.perfil}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${u.ativo ? 'badge-green' : 'badge-red'}`}>
                      {u.ativo ? '● Ativo' : '○ Inativo'}
                    </span>
                  </td>

                  {/* AÇÕES */}
                  <td style={{ padding: '12px 16px' }}>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: 11, padding: '5px 10px' }}
                          onClick={() => abrirEdicao(u)}
                        >
                          Editar
                        </button>
                        <button
                          className={`btn ${u.ativo ? 'btn-danger' : 'btn-success'}`}
                          style={{ fontSize: 11, padding: '5px 10px' }}
                          onClick={() => toggleAtivo(u)}
                        >
                          {u.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* AVISO UID */}
      <div style={{
        background: 'var(--acc-dim)',
        border: '1px solid rgba(249,115,22,.2)',
        borderRadius: 'var(--radius)',
        padding: '14px 18px',
        fontSize: 12,
        color: 'var(--text2)',
        lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--accent)' }}>ℹ️ Como cadastrar novos usuários:</strong><br />
        O usuário precisa fazer login pelo menos uma vez para gerar o UID do Firebase.
        Após o primeiro login, o sistema exibirá uma mensagem de "Acesso não autorizado" —
        então você cadastra o documento no Firestore com o UID correto.
      </div>

      {/* MODAL */}
      {modalAberto && (
        <ModalUsuario
          usuario={usuarioEdicao}
          onClose={() => setModalAberto(false)}
        />
      )}
    </div>
  )
}

// ─── MODAL USUÁRIO ────────────────────────────────────────────────────────────
function ModalUsuario({ usuario, onClose }) {
  const [form, setForm] = useState({
    uid:    usuario?.id    || '',
    nome:   usuario?.nome  || '',
    email:  usuario?.email || '',
    perfil: usuario?.perfil|| 'COMPRADOR',
    ativo:  usuario?.ativo !== undefined ? usuario.ativo : true,
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }))
  const isEdicao = !!usuario

  async function salvar() {
    if (!form.uid.trim() && !isEdicao) return setErro('UID é obrigatório.')
    if (!form.nome.trim()) return setErro('Nome é obrigatório.')
    if (!form.email.trim()) return setErro('Email é obrigatório.')

    setSalvando(true)
    setErro('')
    try {
      const uid = isEdicao ? usuario.id : form.uid.trim()
      await setDoc(doc(db, 'usuarios', uid), {
        nome:         form.nome.trim(),
        email:        form.email.trim().toLowerCase(),
        perfil:       form.perfil,
        ativo:        form.ativo,
        atualizadoEm: serverTimestamp(),
        ...(!isEdicao && { criadoEm: serverTimestamp() }),
      }, { merge: true })
      onClose()
    } catch (e) {
      setErro('Erro ao salvar: ' + e.message)
    }
    setSalvando(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border2)',
        borderRadius: 'var(--radius)',
        width: '100%', maxWidth: 460,
      }} onClick={e => e.stopPropagation()}>

        {/* HEADER */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            {isEdicao ? `Editar — ${usuario.nome}` : 'Novo Usuário'}
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: 'var(--text3)', cursor: 'pointer', fontSize: 20,
          }}>×</button>
        </div>

        {/* FORM */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* UID — só na criação */}
          {!isEdicao && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', display: 'block', marginBottom: 6 }}>
                UID do Firebase Auth *
              </label>
              <input
                className="input"
                placeholder="Cole o UID do Authentication aqui"
                value={form.uid}
                onChange={e => set('uid', e.target.value)}
                style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}
              />
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                Firebase Console → Authentication → Usuários → copiar UID
              </div>
            </div>
          )}

          {/* NOME */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
              Nome *
            </label>
            <input
              className="input"
              placeholder="Ex: Everton"
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
            />
          </div>

          {/* EMAIL */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
              Email corporativo *
            </label>
            <input
              className="input"
              type="email"
              placeholder="Ex: everton@contattos.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
          </div>

          {/* PERFIL */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
              Perfil *
            </label>
            <select
              className="input"
              value={form.perfil}
              onChange={e => set('perfil', e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {PERFIS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* ATIVO */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface2)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                Usuário ativo
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                Usuários inativos não conseguem fazer login
              </div>
            </div>
            <div
              onClick={() => set('ativo', !form.ativo)}
              style={{
                width: 44, height: 24,
                borderRadius: 12,
                background: form.ativo ? 'var(--accent)' : 'var(--surface3)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background .2s',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute',
                top: 3, left: form.ativo ? 23 : 3,
                width: 18, height: 18,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left .2s',
              }} />
            </div>
          </div>

          {/* ERRO */}
          {erro && (
            <div style={{
              background: 'var(--red-dim)',
              color: 'var(--red)',
              border: '1px solid rgba(242,92,110,.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: 12,
            }}>
              {erro}
            </div>
          )}

          {/* BOTÕES */}
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button
              className="btn btn-primary"
              onClick={salvar}
              disabled={salvando}
              style={{ flex: 1, justifyContent: 'center', padding: 12 }}
            >
              {salvando ? 'Salvando...' : isEdicao ? '💾 Salvar Alterações' : '➕ Cadastrar Usuário'}
            </button>
            <button className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}