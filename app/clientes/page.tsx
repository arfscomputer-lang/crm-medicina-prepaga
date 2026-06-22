'use client'

import { useEffect, useState, useMemo } from 'react'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import Icon from '@/components/ui/Icon'
import { Avatar, Badge, Modal, SortHeader, Empty } from '@/components/ui/Components'
import { useAuth } from '@/lib/auth-context'
import { supabase, Client, formatDate, exportToCsv } from '@/lib/supabase'

type Sort = { key: string; dir: 'asc' | 'desc' }
type ClientForm = {
  first_name: string; last_name: string; cedula: string
  phone: string; email: string; facebook_username: string
  status: string; preferred_channel: string
}

const ESTADO_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent' }> = {
  activo:      { label: 'Activo',      variant: 'success' },
  cotizado:    { label: 'Cotizado',    variant: 'accent'  },
  prospecto:   { label: 'Prospecto',   variant: 'warning' },
  contactado:  { label: 'Contactado',  variant: 'info'    },
  negociacion: { label: 'Negociación', variant: 'info'    },
  vencido:     { label: 'Vencido',     variant: 'error'   },
  cancelado:   { label: 'Cancelado',   variant: 'neutral' },
  inactivo:    { label: 'Inactivo',    variant: 'neutral' },
}

const EMPTY_FORM: ClientForm = {
  first_name: '', last_name: '', cedula: '', phone: '',
  email: '', facebook_username: '', status: 'prospecto', preferred_channel: 'whatsapp',
}

export default function ClientesPage() {
  const { user, permissions } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [sort, setSort] = useState<Sort>({ key: 'full_name', dir: 'asc' })
  const [selected, setSelected] = useState(new Set<string>())
  const [detalle, setDetalle] = useState<Client | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [form, setForm] = useState<ClientForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function handleExport() {
    const date = new Date().toISOString().slice(0, 10)
    exportToCsv(`clientes_${date}.csv`, filtered.map(c => ({
      'Nombre':          c.full_name ?? `${c.first_name} ${c.last_name}`,
      'Cédula':          c.cedula ?? '',
      'Teléfono':        c.phone,
      'Email':           c.email ?? '',
      'Canal preferido': c.preferred_channel,
      'Estado':          c.status,
      'Último contacto': c.last_contact_at ? formatDate(c.last_contact_at) : '',
      'Registrado':      c.created_at ? formatDate(c.created_at) : '',
    })))
  }

  useEffect(() => { loadClients() }, [])

  async function loadClients() {
    try {
      const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
      if (data) setClients(data)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let list = clients.slice()
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(c =>
        c.full_name?.toLowerCase().includes(s) ||
        c.cedula?.includes(s) || c.phone?.includes(s) || c.email?.toLowerCase().includes(s)
      )
    }
    if (estadoFilter !== 'todos') list = list.filter(c => c.status === estadoFilter)
    list.sort((a: any, b: any) => {
      const A = a[sort.key] ?? '', B = b[sort.key] ?? ''
      return sort.dir === 'asc' ? String(A).localeCompare(String(B)) : String(B).localeCompare(String(A))
    })
    return list
  }, [clients, search, estadoFilter, sort])

  const allSel = selected.size > 0 && selected.size === filtered.length
  const toggleAll = () => setSelected(allSel ? new Set() : new Set(filtered.map(c => c.id)))
  const toggleSelect = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const onSort = (key: string) => setSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))

  function openEdit(client: Client) {
    setEditingClient(client)
    setForm({
      first_name: client.first_name, last_name: client.last_name, cedula: client.cedula || '',
      phone: client.phone, email: client.email || '', facebook_username: client.facebook_username || '',
      status: client.status, preferred_channel: client.preferred_channel,
    })
    setShowModal(true)
    setDetalle(null)
  }

  function openNew() {
    setEditingClient(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingClient(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      if (editingClient) {
        await supabase.from('clients').update({
          first_name: form.first_name.trim(), last_name: form.last_name.trim(),
          cedula: form.cedula.trim() || null, phone: form.phone.trim(),
          email: form.email.trim() || null, facebook_username: form.facebook_username.trim() || null,
          status: form.status, preferred_channel: form.preferred_channel,
        }).eq('id', editingClient.id)
      } else {
        await supabase.from('clients').insert({
          org_id: user.org_id, agent_id: user.id,
          first_name: form.first_name.trim(), last_name: form.last_name.trim(),
          cedula: form.cedula.trim() || null, phone: form.phone.trim(),
          email: form.email.trim() || null, facebook_username: form.facebook_username.trim() || null,
          status: form.status, preferred_channel: form.preferred_channel,
        })
      }
      await loadClients()
      closeModal()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editingClient || !confirm(`¿Eliminar a ${editingClient.full_name}? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    try {
      await supabase.from('clients').delete().eq('id', editingClient.id)
      await loadClients()
      closeModal()
    } finally {
      setDeleting(false)
    }
  }

  const f = (k: keyof ClientForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <AppShell>
      <Topbar
        title="Clientes"
        right={
          <>
            {permissions?.can_export_data && (
              <button className="btn" onClick={handleExport}><Icon name="Download" size={13} className="ic" />Exportar CSV</button>
            )}
            <button className="btn btn-primary" onClick={openNew}><Icon name="Plus" size={13} className="ic" />Nuevo cliente</button>
          </>
        }
      />

      <div className="scroll-area">
        <div className="page">

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div>
              <div className="title-xl" style={{ marginBottom: 4 }}>Clientes</div>
              <div className="fg-3" style={{ fontSize: 13 }}>
                {filtered.length} de {clients.length} clientes · {filtered.filter(c => c.status === 'activo').length} activos
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="tbl-wrap">
            <div className="tbl-toolbar">
              <div className="left">
                <div className="input-with-icon" style={{ width: 280 }}>
                  <Icon name="Search" size={13} className="ic" />
                  <input
                    className="input"
                    placeholder="Buscar por nombre, CI, teléfono..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="dvd-v" />
                <select className="select" style={{ width: 140 }} value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}>
                  <option value="todos">Estado: todos</option>
                  {Object.entries(ESTADO_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="right">
                {selected.size > 0 ? (
                  <>
                    <span className="fg-3" style={{ fontSize: 12 }}>{selected.size} seleccionados</span>
                    <button className="btn btn-sm"><Icon name="Mail" size={12} className="ic" />Email</button>
                  </>
                ) : null}
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '40px 16px' }}>
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 12px', borderBottom: '1px solid var(--border-soft)' }}>
                    <div className="skel" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="skel" style={{ width: '40%', height: 11 }} />
                      <div className="skel" style={{ width: '25%', height: 10 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <Empty
                icon="Users"
                title="No hay clientes que coincidan"
                sub="Ajustá los filtros o creá un nuevo cliente."
                action={<button className="btn btn-primary" onClick={openNew}><Icon name="Plus" size={13} className="ic" />Nuevo cliente</button>}
              />
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="col-checkbox">
                      <input type="checkbox" className="chk" checked={allSel} onChange={toggleAll} />
                    </th>
                    <SortHeader active={sort.key === 'full_name'} dir={sort.dir} onClick={() => onSort('full_name')}>Cliente</SortHeader>
                    <th>CI</th>
                    <th>Teléfono</th>
                    <th>Canal</th>
                    <th>Estado</th>
                    <SortHeader active={sort.key === 'last_contact_at'} dir={sort.dir} onClick={() => onSort('last_contact_at')}>Último contacto</SortHeader>
                    <th className="col-actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(client => {
                    const estado = ESTADO_MAP[client.status] || { label: client.status, variant: 'neutral' as const }
                    return (
                      <tr
                        key={client.id}
                        className={selected.has(client.id) ? 'selected' : ''}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setDetalle(client)}
                      >
                        <td className="col-checkbox" onClick={e => { e.stopPropagation(); toggleSelect(client.id) }}>
                          <input type="checkbox" className="chk" checked={selected.has(client.id)} onChange={() => {}} />
                        </td>
                        <td>
                          <div className="hstack">
                            <Avatar name={client.full_name || '?'} size="sm" />
                            <div>
                              <div style={{ fontWeight: 500, color: 'var(--fg)' }}>{client.full_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="muted">{client.cedula || '—'}</td>
                        <td>{client.phone}</td>
                        <td className="muted" style={{ textTransform: 'capitalize' }}>{client.preferred_channel}</td>
                        <td>
                          <Badge variant={estado.variant} dot>{estado.label}</Badge>
                        </td>
                        <td className="muted">{client.last_contact_at ? formatDate(client.last_contact_at) : '—'}</td>
                        <td className="col-actions" onClick={e => e.stopPropagation()}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(client)} data-tip="Editar">
                            <Icon name="Edit" size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {!loading && filtered.length > 0 && (
              <div className="tbl-foot">
                <span>{filtered.length} clientes</span>
                <span>{clients.filter(c => c.status === 'activo').length} activos · {clients.filter(c => c.status === 'prospecto').length} prospectos</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {detalle && (
        <div className="scrim" onClick={() => setDetalle(null)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-hd">
              <div>
                <div className="ttl" style={{ fontSize: 14, fontWeight: 500 }}>{detalle.full_name}</div>
                <div className="sub" style={{ fontSize: 12, color: 'var(--fg-3)' }}>{detalle.email || detalle.phone}</div>
              </div>
              <div className="hstack">
                <button className="btn btn-sm" onClick={() => openEdit(detalle)}><Icon name="Edit" size={12} className="ic" />Editar</button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDetalle(null)}><Icon name="X" size={14} /></button>
              </div>
            </div>
            <div className="panel-body" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <Avatar name={detalle.full_name || '?'} size="lg" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{detalle.full_name}</div>
                  <span style={{ marginTop: 4, display: 'inline-block' }}>
                    <Badge variant={(ESTADO_MAP[detalle.status] || { variant: 'neutral' }).variant} dot>
                      {ESTADO_MAP[detalle.status]?.label || detalle.status}
                    </Badge>
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: 'Phone', label: 'Teléfono', value: detalle.phone },
                  { icon: 'Mail',  label: 'Email',    value: detalle.email || '—' },
                  { icon: 'FileText', label: 'Cédula', value: detalle.cedula || '—' },
                  { icon: 'MessageCircle', label: 'Canal preferido', value: detalle.preferred_channel },
                  { icon: 'Calendar', label: 'Registrado', value: detalle.created_at ? formatDate(detalle.created_at) : '—' },
                  { icon: 'Clock', label: 'Último contacto', value: detalle.last_contact_at ? formatDate(detalle.last_contact_at) : '—' },
                ].map(row => (
                  <div key={row.icon} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-3)', border: '1px solid var(--border-soft)', display: 'grid', placeItems: 'center', color: 'var(--fg-2)' }}>
                      <Icon name={row.icon} size={13} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{row.label}</div>
                      <div style={{ fontSize: 13 }}>{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New/Edit modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingClient ? 'Editar cliente' : 'Nuevo cliente'}
        subtitle={editingClient ? editingClient.full_name : 'Completá los datos del nuevo cliente'}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', width: '100%' }}>
            {editingClient && (
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting || saving}>
                {deleting ? 'Eliminando...' : <><Icon name="Trash" size={13} className="ic" />Eliminar</>}
              </button>
            )}
            <div className="hstack" style={{ marginLeft: 'auto' }}>
              <button className="btn" onClick={closeModal} disabled={saving || deleting}>Cancelar</button>
              <button className="btn btn-primary" onClick={e => handleSave(e as any)} disabled={saving || deleting}>
                {saving ? 'Guardando...' : editingClient ? 'Actualizar' : 'Guardar cliente'}
              </button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label className="label">Nombre</label>
              <input className="input" value={form.first_name} onChange={f('first_name')} />
            </div>
            <div>
              <label className="label">Apellido</label>
              <input className="input" value={form.last_name} onChange={f('last_name')} />
            </div>
            <div>
              <label className="label">Cédula de identidad</label>
              <input className="input" value={form.cedula} onChange={f('cedula')} />
            </div>
            <div>
              <label className="label">Teléfono *</label>
              <input className="input" type="tel" required value={form.phone} onChange={f('phone')} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={f('email')} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="label">Facebook / Messenger</label>
            <input className="input" value={form.facebook_username} onChange={f('facebook_username')} placeholder="@usuario" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Estado</label>
              <select className="select" value={form.status} onChange={f('status')}>
                {Object.entries(ESTADO_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Canal preferido</label>
              <select className="select" value={form.preferred_channel} onChange={f('preferred_channel')}>
                <option value="whatsapp">WhatsApp</option>
                <option value="messenger">Messenger</option>
                <option value="telefono">Teléfono</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}
