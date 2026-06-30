import React, { useState, useEffect } from 'react'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config.js'

const TIPO_LABEL = {
  SKU_NOVO:           'SKU Novo',
  VPE:                'VPE',
  USO_CONSUMO:        'Uso e Consumo',
  CORRECAO_CADASTRO:  'Correção de Cadastro',
  AJUSTE_ESTOQUE:     'Ajuste de Estoque',
}

const STATUS_LABEL = {
  AGUARDANDO:   'Aguardando',
  EM_ANALISE:   'Em Análise',
  DEVOLVIDA:    'Devolvida',
  EM_CORRECAO:  'Em Correção',
  APROVADA:     'Aprovada',
  REPROVADA:    'Reprovada',
}

const STATUS_COR = {
  AGUARDANDO:   '#f5a623',
  EM_ANALISE:   '#4f8ef7',
  DEVOLVIDA:    '#f5a623',
  EM_CORRECAO:  '#a78bfa',
  APROVADA:     '#34c97e',
  REPROVADA:    '#f25c6e',
}

const TIPO_CORES = ['#f97316', '#4f8ef7', '#34c97e', '#a78bfa', '#f25c6e']

export default function Painel() {
  const [carregando, setCarregando] = useState(true)
  const [solicitacoes, setSolicitacoes] = useState([])
  const [periodo, setPeriodo] = useState(30) // dias

  useEffect(() => {
    async function carregar() {
      try {
        const snap = await getDocs(query(collection(db, 'solicitacoes'), orderBy('criadoEm', 'desc')))
        setSolicitacoes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) {
        console.error(e)
      }
      setCarregando(false)
    }
    carregar()
  }, [])

  if (carregando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text3)' }}>
        Carregando painel...
      </div>
    )
  }

  const agora = Date.now()
  const limite = agora - periodo * 24 * 60 * 60 * 1000
  const dentroDoPeriodo = solicitacoes.filter(s => s.criadoEm && s.criadoEm.toDate().getTime() >= limite)

  // ── KPIs gerais ──────────────────────────────────────────────
  const total       = solicitacoes.length
  const aguardando  = solicitacoes.filter(s => s.status === 'AGUARDANDO').length
  const emAnalise   = solicitacoes.filter(s => s.status === 'EM_ANALISE').length
  const aprovadas   = solicitacoes.filter(s => s.status === 'APROVADA').length
  const devolvidas  = solicitacoes.filter(s => s.status === 'DEVOLVIDA').length
  const reprovadas  = solicitacoes.filter(s => s.status === 'REPROVADA').length

  // ── Tempo médio de aprovação (criadoEm → ação APROVAR no histórico) ──
  const temposAprovacao = solicitacoes
    .filter(s => s.status === 'APROVADA' && s.criadoEm && s.historico?.length)
    .map(s => {
      const aprovacao = s.historico.find(h => h.acao === 'APROVAR')
      if (!aprovacao) return null
      const inicio = s.criadoEm.toDate().getTime()
      const fim = new Date(aprovacao.data).getTime()
      return (fim - inicio) / (1000 * 60 * 60 * 24) // dias
    })
    .filter(t => t !== null && t >= 0)

  const tempoMedioDias = temposAprovacao.length > 0
    ? (temposAprovacao.reduce((a, b) => a + b, 0) / temposAprovacao.length)
    : null

  // ── Por tipo ──────────────────────────────────────────────────
  const porTipo = {}
  solicitacoes.forEach(s => { porTipo[s.tipo] = (porTipo[s.tipo] || 0) + 1 })
  const tiposOrdenados = Object.entries(porTipo).sort((a, b) => b[1] - a[1])

  // ── Por status ────────────────────────────────────────────────
  const porStatus = {}
  solicitacoes.forEach(s => { porStatus[s.status] = (porStatus[s.status] || 0) + 1 })

  // ── Ranking de solicitantes ──────────────────────────────────
  const porSolicitante = {}
  solicitacoes.forEach(s => {
    const nome = s.solicitante || 'Desconhecido'
    porSolicitante[nome] = (porSolicitante[nome] || 0) + 1
  })
  const rankingSolicitantes = Object.entries(porSolicitante)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  // ── Série temporal (últimos N dias, agrupado por dia) ─────────
  const dias = []
  for (let i = periodo - 1; i >= 0; i--) {
    const d = new Date(agora - i * 24 * 60 * 60 * 1000)
    dias.push({ data: d, chave: d.toISOString().slice(0, 10), total: 0 })
  }
  const mapaDias = {}
  dias.forEach(d => { mapaDias[d.chave] = d })
  dentroDoPeriodo.forEach(s => {
    const chave = s.criadoEm.toDate().toISOString().slice(0, 10)
    if (mapaDias[chave]) mapaDias[chave].total++
  })
  const maxDia = Math.max(1, ...dias.map(d => d.total))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100 }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.5 }}>
            Painel NEXUS
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
            Visão geral da Central de Cadastros
          </p>
        </div>

        {/* Seletor de período */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setPeriodo(d)}
              className={periodo === d ? 'btn btn-primary' : 'btn btn-ghost'}
              style={{ fontSize: 12, padding: '6px 14px' }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* ── CARDS DE KPI ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        <KpiCard label="Total na fila" valor={total} icone="📋" cor="var(--text)" />
        <KpiCard label="Aguardando" valor={aguardando} icone="⏳" cor={STATUS_COR.AGUARDANDO} />
        <KpiCard label="Em Análise" valor={emAnalise} icone="🔍" cor={STATUS_COR.EM_ANALISE} />
        <KpiCard label="Aprovadas" valor={aprovadas} icone="✅" cor={STATUS_COR.APROVADA} />
        <KpiCard
          label="Tempo médio aprovação"
          valor={tempoMedioDias !== null ? `${tempoMedioDias.toFixed(1)}d` : '—'}
          icone="⏱️"
          cor="var(--blue)"
        />
      </div>

      {/* ── GRID PRINCIPAL ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>

        {/* SÉRIE TEMPORAL */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Solicitações criadas
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16 }}>
            Últimos {periodo} dias
          </div>
          <GraficoBarrasTempo dias={dias} maxDia={maxDia} />
        </div>

        {/* POR STATUS */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
            Distribuição por status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(STATUS_LABEL).map(([key, label]) => {
              const qtd = porStatus[key] || 0
              const pct = total > 0 ? (qtd / total) * 100 : 0
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text2)' }}>{label}</span>
                    <span style={{ color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{qtd}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: STATUS_COR[key], borderRadius: 3,
                      transition: 'width .3s',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── GRID SECUNDÁRIO ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* POR TIPO — donut */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
            Solicitações por tipo
          </div>
          {total === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <DonutChart dados={tiposOrdenados} total={total} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {tiposOrdenados.map(([tipo, qtd], i) => (
                  <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: TIPO_CORES[i % TIPO_CORES.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1 }}>{TIPO_LABEL[tipo] || tipo}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{qtd}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RANKING SOLICITANTES */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
            Top solicitantes
          </div>
          {rankingSolicitantes.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rankingSolicitantes.map(([nome, qtd], i) => {
                const maxQtd = rankingSolicitantes[0][1]
                const pct = (qtd / maxQtd) * 100
                return (
                  <div key={nome} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: i === 0 ? 'var(--acc-dim)' : 'var(--surface2)',
                      border: `1px solid ${i === 0 ? 'rgba(249,115,22,.3)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: i === 0 ? 'var(--accent)' : 'var(--text3)',
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text2)', width: 90, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {nome}
                    </span>
                    <div style={{ flex: 1, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', width: 20, textAlign: 'right' }}>
                      {qtd}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RESUMO DEVOLVIDAS/REPROVADAS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--radius-sm)',
            background: 'rgba(245,166,35,.12)', border: '1px solid rgba(245,166,35,.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
          }}>↩️</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{devolvidas}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Devolvidas</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--radius-sm)',
            background: 'rgba(242,92,110,.12)', border: '1px solid rgba(242,92,110,.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
          }}>✕</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{reprovadas}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Reprovadas</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--radius-sm)',
            background: 'rgba(52,201,126,.12)', border: '1px solid rgba(52,201,126,.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
          }}>📈</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
              {total > 0 ? `${((aprovadas / total) * 100).toFixed(0)}%` : '—'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Taxa de aprovação</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── COMPONENTES AUXILIARES ──────────────────────────────────────────────────

function KpiCard({ label, valor, icone, cor }) {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div style={{ fontSize: 18, marginBottom: 8 }}>{icone}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: cor, letterSpacing: -0.5, marginBottom: 2 }}>
        {valor}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{label}</div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: 12 }}>
      Sem dados suficientes ainda.
    </div>
  )
}

function GraficoBarrasTempo({ dias, maxDia }) {
  const largura = 700
  const altura = 160
  const barraGap = 2
  const larguraBarra = Math.max(2, (largura / dias.length) - barraGap)

  return (
    <svg viewBox={`0 0 ${largura} ${altura + 24}`} style={{ width: '100%', height: 'auto' }}>
      {dias.map((d, i) => {
        const h = (d.total / maxDia) * altura
        const x = i * (larguraBarra + barraGap)
        const y = altura - h
        return (
          <g key={d.chave}>
            <rect
              x={x} y={y} width={larguraBarra} height={Math.max(h, d.total > 0 ? 2 : 0)}
              fill={d.total > 0 ? 'var(--accent)' : 'var(--surface2)'}
              rx={1.5}
            >
              <title>{`${d.data.toLocaleDateString('pt-BR')}: ${d.total} solicitação(ões)`}</title>
            </rect>
          </g>
        )
      })}
      <line x1={0} y1={altura} x2={largura} y2={altura} stroke="var(--border)" strokeWidth={1} />
    </svg>
  )
}

function DonutChart({ dados, total }) {
  const tamanho = 120
  const raio = 50
  const espessura = 18
  const centro = tamanho / 2
  const circunferencia = 2 * Math.PI * raio

  let acumulado = 0

  return (
    <svg viewBox={`0 0 ${tamanho} ${tamanho}`} style={{ width: 120, height: 120, flexShrink: 0 }}>
      <circle cx={centro} cy={centro} r={raio} fill="none" stroke="var(--surface2)" strokeWidth={espessura} />
      {dados.map(([tipo, qtd], i) => {
        const fracao = qtd / total
        const offset = circunferencia * (1 - acumulado)
        const tamanhoArco = circunferencia * fracao
        acumulado += fracao
        return (
          <circle
            key={tipo}
            cx={centro} cy={centro} r={raio}
            fill="none"
            stroke={TIPO_CORES[i % TIPO_CORES.length]}
            strokeWidth={espessura}
            strokeDasharray={`${tamanhoArco} ${circunferencia - tamanhoArco}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${centro} ${centro})`}
            strokeLinecap="butt"
          />
        )
      })}
      <text x={centro} y={centro - 4} textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text)">
        {total}
      </text>
      <text x={centro} y={centro + 12} textAnchor="middle" fontSize="9" fill="var(--text3)">
        total
      </text>
    </svg>
  )
}