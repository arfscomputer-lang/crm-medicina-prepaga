'use client'

import { useEffect, useState, useMemo } from 'react'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import Icon from '@/components/ui/Icon'
import { Badge, Empty } from '@/components/ui/Components'
import { useAuth } from '@/lib/auth-context'
import { supabase, exportToCsv, formatDate } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type AuditRow = {
  id: number
  entity_type: string
  entity_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  changed_fields: string[] | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  created_at: string
  users: { full_name: string; email: string } | null
}

const ENTITY_LABELS: Record<string, string> = {
  clients:      'Clientes',
  client_plans: 'Planes',
  payments:     'Pagos',
  users:        'Usuarios',
}

const ACTION_CONFIG = {
  INSERT: { label: 'Creación',    variant: 'success'  as const },
  UPDATE: { label: 'Modificación', variant: 'accent'  as const },
  DELETE: { label: 'Eliminación', variant: 'error'    as const },
}

const PAGE_SIZE = 50

export default function AuditoriaPage() {
  const { permissions } = useAuth()
  const router = useRouter()
  const [rows, setRows] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [detail, setDetail] = useState<AuditRow | null>(null)

  // Filters
  const [entityFilter, setEntityFilter] = useState('todos')
  const [actionFilter, setActionFilter] = useState('todos')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    if (permissions && !permissions.can_view_audit_log) router.replace('/')
  }, [permissions, router])

  useEffect(() => {
    setRows([])
    setOffset(0)
    load(0, true)
  }, [entityFilter, actionFilter, dateFrom, dateTo])

  async function load(off: number, reset = false) {
    setLoading(true)
    try {
      let q = supabase
        .from('audit_log')
        .select('id, entity_type, entity_id, action, changed_fields, old_data, new_data, created_at, users(full_name, email)')
        .order('created_at', { ascending: false })
        .range(off, off + PAGE_SIZE - 1)

      if (entityFilter !== 'todos') q = q.eq('entity_type', entityFilter)
      if (actionFilter !== 'todos') q = q.eq('action', actionFilter)
      if (dateFrom) q = q.gte('created_at', dateFrom)
      if (dateTo)   q = q.lte('created_at', dateTo + 'T23:59:59')

      const { data } = await q
      if (data) {
        setRows(prev => reset ? (data as unknown as AuditRow[]) : [...prev, ...(data as unknown as AuditRow[])])
        setHasMore(data.length === PAGE_SIZE)
        setOffset(off + data.length)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleExport() {
    exportToCsv(`auditoria_${new Date().toISOString().slice(0, 10)}.csv`, rows.map(r => ({
      'Fecha/Hora':   r.created_at ? new Date(r.created_at).toLocaleString('es-PY') : '',
      'Entidad':      ENTITY_LABELS[r.entity_type] ?? r.entity_type,
      'Acción':       ACTION_CONFIG[r.action]?.label ?? r.action,
      'ID Registro':  r.entity_id,
      'Campos':       (r.changed_fields ?? []).join(', '),
      'Usuario':      r.users?.full_name ?? r.users?.email ?? '—',
    })))
  }

  // Render a clean diff for the detail panel
  function renderDiff(row: AuditRow) {
    if (row.action === 'INSERT') {
      return <JsonBlock data={row.new_data} label="Datos creados" color="var(--success)" />
    }
    if (row.action === 'DELETE') {
      return <JsonBlock data={row.old_data} label="Datos eliminados" color="var(--error)" />
    }
    // UPDATE — show only changed fields side by side
    const fields = row.changed_fields ?? Object.keys(row.new_data ?? {})
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fields.map(f => (
          <div key={f} style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border-soft)' }}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--error)', marginBottom: 3 }}>Antes</div>
                <code style={{ fontSize: 12, color: 'var(--fg-2)', wordBreak: 'break-all' }}>
                  {row.old_data?.[f] == null ? <em style={{ color: 'var(--fg-3)' }}>null</em> : JSON.stringify(row.old_data[f])}
                </code>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--success)', marginBottom: 3 }}>Después</div>
                <code style={{ fontSize: 12, color: 'var(--fg)', wordBreak: 'break-all' }}>
                  {row.new_data?.[f] == null ? <em style={{ color: 'var(--fg-3)' }}>null</em> : JSON.stringify(row.new_data[f])}
                </code>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (permissions && !permissions.can_view_audit_log) return null

  return (
    <AppShell>
      <Topbar
        title="Auditoría"
        right={
          permissions?.can_export_data ? (
            <button className="btn" onClick={handleExport}><Icon name="Download" size={13} className="ic" />Exportar CSV</button>
          ) : undefined
        }
      />

      <div className="scroll-area">
        <div className="page">

          <div style={{ marginBottom: 20 }}>
            <div className="title-xl" style={{ marginBottom: 4 }}>Registro de Auditoría</div>
            <div className="fg-3" style={{ fontSize: 13 }}>
              Historial de cambios en clientes, planes, pagos y usuarios
            </div>
          </div>

          <div className="tbl-wrap">
            {/* Toolbar */}
            <div className="tbl-toolbar">
              <div className="left">
                <select className="select" style={{ width: 150 }} value={entityFilter} onChange={e => setEntityFilter(e.target.value)}>
                  <option value="todos">Entidad: todas</option>
                  {Object.entries(ENTITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <div className="dvd-v" />
                <select className="select" style={{ width: 160 }} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                  <option value="todos">Acción: todas</option>
                  <option value="INSERT">Creación</option>
                  <option value="UPDATE">Modificación</option>
                  <option value="DELETE">Eliminación</option>
                </select>
                <div className="dvd-v" />
                <input
                  type="date"
                  className="input"
                  style={{ width: 140 }}
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                />
                <span className="fg-3" style={{ fontSize: 12 }}>—</span>
                <input
                  type="date"
                  className="input"
                  style={{ width: 140 }}
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                />
              </div>
              <div className="right">
                {(entityFilter !== 'todos' || actionFilter !== 'todos' || dateFrom || dateTo) && (
                  <button className="btn btn-sm btn-ghost" onClick={() => { setEntityFilter('todos'); setActionFilter('todos'); setDateFrom(''); setDateTo('') }}>
                    <Icon name="X" size={12} className="ic" />Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            {loading && rows.length === 0 ? (
              <div style={{ padding: '40px 16px' }}>
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 12px', borderBottom: '1px solid var(--border-soft)' }}>
                    <div className="skel" style={{ width: '10%', height: 20, borderRadius: 999 }} />
                    <div className="skel" style={{ width: '12%', height: 11 }} />
                    <div className="skel" style={{ width: '30%', height: 11 }} />
                    <div className="skel" style={{ width: '20%', height: 11 }} />
                    <div className="skel" style={{ width: '15%', height: 11, marginLeft: 'auto' }} />
                  </div>
                ))}
              </div>
            ) : rows.length === 0 ? (
              <Empty
                icon="ClipboardList"
                title="Sin registros de auditoría"
                sub="Los cambios en clientes, planes y pagos aparecerán aquí."
              />
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Acción</th>
                    <th>Entidad</th>
                    <th>Campos modificados</th>
                    <th>Usuario</th>
                    <th>Fecha y hora</th>
                    <th className="col-actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => {
                    const ac = ACTION_CONFIG[row.action] ?? { label: row.action, variant: 'neutral' as const }
                    return (
                      <tr key={row.id} style={{ cursor: 'pointer' }} onClick={() => setDetail(row)}>
                        <td>
                          <Badge variant={ac.variant} dot>{ac.label}</Badge>
                        </td>
                        <td style={{ fontWeight: 500 }}>
                          {ENTITY_LABELS[row.entity_type] ?? row.entity_type}
                        </td>
                        <td className="muted" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.changed_fields?.length
                            ? row.changed_fields.join(', ')
                            : row.action === 'INSERT' ? 'registro nuevo'
                            : row.action === 'DELETE' ? 'registro eliminado'
                            : '—'}
                        </td>
                        <td className="muted" style={{ fontSize: 12 }}>
                          {row.users?.full_name ?? row.users?.email ?? <em>Sistema</em>}
                        </td>
                        <td className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                          {row.created_at ? new Date(row.created_at).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                        </td>
                        <td className="col-actions" onClick={e => e.stopPropagation()}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDetail(row)} data-tip="Ver detalle">
                            <Icon name="Eye" size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {!loading && rows.length > 0 && (
              <div className="tbl-foot">
                <span>{rows.length} registros cargados</span>
                {hasMore && (
                  <button className="btn btn-sm" onClick={() => load(offset)}>
                    {loading ? 'Cargando...' : 'Cargar más'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {detail && (
        <div className="scrim" onClick={() => setDetail(null)}>
          <div className="panel" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
            <div className="panel-hd">
              <div>
                <div className="ttl" style={{ fontSize: 14, fontWeight: 500 }}>
                  {ACTION_CONFIG[detail.action]?.label} · {ENTITY_LABELS[detail.entity_type] ?? detail.entity_type}
                </div>
                <div className="sub" style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                  {detail.entity_id}
                </div>
              </div>
              <div className="hstack">
                <Badge variant={ACTION_CONFIG[detail.action]?.variant ?? 'neutral'}>
                  {ACTION_CONFIG[detail.action]?.label ?? detail.action}
                </Badge>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDetail(null)}>
                  <Icon name="X" size={14} />
                </button>
              </div>
            </div>

            <div className="panel-body" style={{ padding: 16 }}>
              {/* Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                <div style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '8px 12px', border: '1px solid var(--border-soft)' }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>Usuario</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {detail.users?.full_name ?? detail.users?.email ?? 'Sistema'}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '8px 12px', border: '1px solid var(--border-soft)' }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>Fecha y hora</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {detail.created_at ? new Date(detail.created_at).toLocaleString('es-PY') : '—'}
                  </div>
                </div>
              </div>

              {/* Diff */}
              <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {detail.action === 'UPDATE' ? 'Cambios' : 'Datos'}
              </div>
              <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                {renderDiff(detail)}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

function JsonBlock({ data, label, color }: { data: Record<string, unknown> | null; label: string; color: string }) {
  if (!data) return <div className="muted" style={{ fontSize: 13 }}>Sin datos</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Object.entries(data).map(([k, v]) => (
        <div key={k} style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '8px 12px', border: `1px solid var(--border-soft)` }}>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 3, fontWeight: 600 }}>{k}</div>
          <code style={{ fontSize: 12, color, wordBreak: 'break-all' }}>
            {v == null ? <em style={{ color: 'var(--fg-3)' }}>null</em> : JSON.stringify(v)}
          </code>
        </div>
      ))}
    </div>
  )
}
