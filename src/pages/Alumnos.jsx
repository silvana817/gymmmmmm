import { useDeferredValue, useMemo, useState } from 'react'
import { Edit3, Mail, Phone, Plus, Search, Target, Trash2, User, X } from 'lucide-react'
import { useAppAlumnos } from '../context/AppContext'
import { getTodayISO } from '../utils/date'

export default function Alumnos() {
    const { alumnos, addAlumno, updateAlumno, deleteAlumno } = useAppAlumnos()
    const [search, setSearch] = useState('')
    const [filterPlan, setFilterPlan] = useState('Todos')
    const [showModal, setShowModal] = useState(false)
    const [editingAlumno, setEditingAlumno] = useState(null)
    const deferredSearch = useDeferredValue(search.trim().toLowerCase())

    const filtered = useMemo(() => alumnos.filter(alumno => {
        const matchSearch = !deferredSearch || alumno.nombre.toLowerCase().includes(deferredSearch) || alumno.email.toLowerCase().includes(deferredSearch)
        const matchPlan = filterPlan === 'Todos' || alumno.plan === filterPlan
        return matchSearch && matchPlan
    }), [alumnos, deferredSearch, filterPlan])

    const handleSave = data => {
        if (editingAlumno) {
            updateAlumno(editingAlumno.id, data)
        } else {
            addAlumno(data)
        }
        setShowModal(false)
        setEditingAlumno(null)
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h2>Gestion de <span className="gradient-text">Alumnos</span></h2>
                    <p className="page-subtitle">{alumnos.length} alumnos registrados</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingAlumno(null); setShowModal(true) }}><Plus size={18} /> Nuevo Alumno</button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <div className="search-input" style={{ flex: 1, minWidth: 0 }}>
                    <Search />
                    <input className="input-field" placeholder="Buscar por nombre o email..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['Todos', 'Musculacion', 'Full', 'Funcional'].map(plan => <button key={plan} className={`chip ${filterPlan === plan ? 'active' : ''}`} onClick={() => setFilterPlan(plan)}>{plan}</button>)}
                </div>
            </div>

            <div className="table-container desktop-only">
                <table className="data-table">
                    <thead><tr><th>Alumno</th><th>Plan</th><th>Inicio</th><th>Objetivo</th><th>Estado</th><th>Acciones</th></tr></thead>
                    <tbody>
                        {filtered.map(alumno => (
                            <tr key={alumno.id}>
                                <td><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div className="user-avatar" style={{ width: 36, height: 36, fontSize: '0.75rem' }}>{alumno.avatar}</div><div><div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{alumno.nombre}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{alumno.email}</div></div></div></td>
                                <td><span className="badge badge-purple">{alumno.plan}</span></td>
                                <td>{new Date(`${alumno.fechaInicio}T12:00:00`).toLocaleDateString('es-AR')}</td>
                                <td>{alumno.objetivo}</td>
                                <td><span className={`badge ${alumno.estado === 'activo' ? 'badge-success' : 'badge-danger'}`}>{alumno.estado === 'activo' ? 'Activo' : 'Vencido'}</span></td>
                                <td><div style={{ display: 'flex', gap: 6 }}><button className="btn btn-ghost btn-sm" onClick={() => { setEditingAlumno(alumno); setShowModal(true) }}><Edit3 size={15} /></button><button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-danger)' }} onClick={() => deleteAlumno(alumno.id)}><Trash2 size={15} /></button></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mobile-only">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filtered.map(alumno => (
                        <div key={alumno.id} className="card" style={{ padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                <div className="user-avatar" style={{ width: 42, height: 42, fontSize: '0.8rem' }}>{alumno.avatar}</div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{alumno.nombre}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alumno.email}</div>
                                </div>
                                <span className={`badge ${alumno.estado === 'activo' ? 'badge-success' : 'badge-danger'}`}>{alumno.estado === 'activo' ? 'Activo' : 'Vencido'}</span>
                            </div>
                            <div className="responsive-grid-2" style={{ marginBottom: 14 }}>
                                <InfoItem label="Plan" value={<span className="badge badge-purple">{alumno.plan}</span>} />
                                <InfoItem label="Inicio" value={new Date(`${alumno.fechaInicio}T12:00:00`).toLocaleDateString('es-AR')} />
                                <InfoItem label="Objetivo" value={alumno.objetivo} />
                                <InfoItem label="Telefono" value={alumno.telefono || '-'} />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setEditingAlumno(alumno); setShowModal(true) }}><Edit3 size={15} /> Editar</button>
                                <button className="btn btn-ghost" style={{ color: 'var(--accent-danger)' }} onClick={() => deleteAlumno(alumno.id)}><Trash2 size={15} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showModal && <AlumnoModal alumno={editingAlumno} onSave={handleSave} onClose={() => { setShowModal(false); setEditingAlumno(null) }} />}
        </div>
    )
}

function InfoItem({ label, value }) {
    return (
        <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--bg-input)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
        </div>
    )
}

function AlumnoModal({ alumno, onSave, onClose }) {
    const [form, setForm] = useState({
        nombre: alumno?.nombre || '',
        email: alumno?.email || '',
        telefono: alumno?.telefono || '',
        plan: alumno?.plan || 'Musculacion',
        fechaInicio: alumno?.fechaInicio || getTodayISO(),
        estado: alumno?.estado || 'activo',
        peso: alumno?.peso || '',
        altura: alumno?.altura || '',
        edad: alumno?.edad || '',
        objetivo: alumno?.objetivo || 'Hipertrofia',
    })

    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', width: '90%' }}>
                <div className="modal-header">
                    <h3>{alumno ? 'Editar Alumno' : 'Nuevo Alumno'}</h3>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <div className="input-group"><label><User size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Nombre Completo</label><input className="input-field" value={form.nombre} onChange={e => update('nombre', e.target.value)} placeholder="Nombre y Apellido" /></div>
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div className="input-group"><label><Mail size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Email</label><input className="input-field" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="email@ejemplo.com" /></div>
                        <div className="input-group"><label><Phone size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Telefono</label><input className="input-field" value={form.telefono} onChange={e => update('telefono', e.target.value)} placeholder="11-XXXX-XXXX" /></div>
                    </div>
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div className="input-group"><label>Plan</label><select className="input-field" value={form.plan} onChange={e => update('plan', e.target.value)}><option>Musculacion</option><option>Full</option><option>Funcional</option></select></div>
                        <div className="input-group"><label>Fecha de Inicio</label><input className="input-field" type="date" value={form.fechaInicio} onChange={e => update('fechaInicio', e.target.value)} /></div>
                    </div>
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px' }}>
                        <div className="input-group"><label>Peso (kg)</label><input className="input-field" type="number" value={form.peso} onChange={e => update('peso', e.target.value)} /></div>
                        <div className="input-group"><label>Altura (cm)</label><input className="input-field" type="number" value={form.altura} onChange={e => update('altura', e.target.value)} /></div>
                        <div className="input-group"><label>Edad</label><input className="input-field" type="number" value={form.edad} onChange={e => update('edad', e.target.value)} /></div>
                    </div>
                    <div className="input-group"><label><Target size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Objetivo</label><select className="input-field" value={form.objetivo} onChange={e => update('objetivo', e.target.value)}><option>Hipertrofia</option><option>Tonificacion</option><option>Fuerza</option><option>Bajar de peso</option><option>Resistencia</option><option>Salud general</option></select></div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.nombre.trim()}>{alumno ? 'Guardar Cambios' : 'Crear Alumno'}</button>
                </div>
            </div>
        </div>
    )
}
