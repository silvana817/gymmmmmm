import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle, Clock, DollarSign, Filter, Plus, X } from 'lucide-react'
import { useAppAlumnos, useAppPagos } from '../context/AppContext'
import { getMonthKey, getMonthKeyFromISO, getMonthLabel, getMonthOptions, getTodayISO } from '../utils/date'

export default function Pagos() {
    const { pagos, addPago, updatePago } = useAppPagos()
    const { alumnos } = useAppAlumnos()
    const [showModal, setShowModal] = useState(false)
    const [filterEstado, setFilterEstado] = useState('Todos')

    const alumnoMap = useMemo(() => Object.fromEntries(alumnos.map(alumno => [alumno.id, alumno])), [alumnos])
    const currentMonthKey = getMonthKey(new Date())
    const currentMonthLabel = getMonthLabel(new Date())

    const filteredPagos = useMemo(() => {
        const byStatus = filterEstado === 'Todos' ? pagos : pagos.filter(pago => pago.estado === filterEstado.toLowerCase())
        return [...byStatus].sort((left, right) => right.fecha.localeCompare(left.fecha))
    }, [filterEstado, pagos])

    const totalMes = useMemo(() => pagos.filter(pago => pago.estado === 'pagado' && getMonthKeyFromISO(pago.fecha) === currentMonthKey).reduce((sum, pago) => sum + pago.monto, 0), [currentMonthKey, pagos])
    const pendientes = useMemo(() => pagos.filter(pago => pago.estado === 'pendiente').length, [pagos])
    const vencidos = useMemo(() => pagos.filter(pago => pago.estado === 'vencido').length, [pagos])

    const marcarPagado = id => updatePago(id, { estado: 'pagado', fecha: getTodayISO() })
    const handleSave = data => {
        addPago(data)
        setShowModal(false)
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h2>Control de <span className="gradient-text">Pagos</span></h2>
                    <p className="page-subtitle">Gestion de cobros mensuales</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> Registrar Pago</button>
            </div>

            <div className="stats-grid">
                <div className="stat-card green"><div className="stat-icon green"><DollarSign size={24} /></div><div className="stat-info"><h3>Recaudado {currentMonthLabel}</h3><div className="stat-value">${totalMes.toLocaleString()}</div></div></div>
                <div className="stat-card gold"><div className="stat-icon gold"><Clock size={24} /></div><div className="stat-info"><h3>Pendientes</h3><div className="stat-value">{pendientes}</div></div></div>
                <div className="stat-card pink"><div className="stat-icon pink"><AlertTriangle size={24} /></div><div className="stat-info"><h3>Vencidos</h3><div className="stat-value">{vencidos}</div></div></div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                <Filter size={16} style={{ color: 'var(--text-muted)', alignSelf: 'center' }} />
                {['Todos', 'Pagado', 'Pendiente', 'Vencido'].map(estado => <button key={estado} className={`chip ${filterEstado === estado ? 'active' : ''}`} onClick={() => setFilterEstado(estado)}>{estado}</button>)}
            </div>

            <div className="table-container desktop-only">
                <table className="data-table">
                    <thead>
                        <tr><th>Alumno</th><th>Mes</th><th>Monto</th><th>Metodo</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>
                        {filteredPagos.map(pago => {
                            const alumno = alumnoMap[pago.alumnoId]
                            return (
                                <tr key={pago.id}>
                                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>{alumno?.avatar || '??'}</div><span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{alumno?.nombre || 'Desconocido'}</span></div></td>
                                    <td>{pago.mes}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>${pago.monto.toLocaleString()}</td>
                                    <td>{pago.metodo}</td>
                                    <td>{new Date(`${pago.fecha}T12:00:00`).toLocaleDateString('es-AR')}</td>
                                    <td><span className={`badge ${pago.estado === 'pagado' ? 'badge-success' : pago.estado === 'pendiente' ? 'badge-warning' : 'badge-danger'}`}>{pago.estado === 'pagado' ? <><CheckCircle size={12} /> Pagado</> : pago.estado === 'pendiente' ? <><Clock size={12} /> Pendiente</> : <><AlertTriangle size={12} /> Vencido</>}</span></td>
                                    <td>{pago.estado !== 'pagado' && <button className="btn btn-success btn-sm" onClick={() => marcarPagado(pago.id)}><CheckCircle size={14} /> Marcar Pagado</button>}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mobile-only">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredPagos.map(pago => {
                        const alumno = alumnoMap[pago.alumnoId]
                        return (
                            <div key={pago.id} className="card" style={{ padding: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                    <div className="user-avatar" style={{ width: 40, height: 40, fontSize: '0.78rem' }}>{alumno?.avatar || '??'}</div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontWeight: 700 }}>{alumno?.nombre || 'Desconocido'}</div>
                                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{pago.mes}</div>
                                    </div>
                                    <span className={`badge ${pago.estado === 'pagado' ? 'badge-success' : pago.estado === 'pendiente' ? 'badge-warning' : 'badge-danger'}`}>{pago.estado}</span>
                                </div>
                                <div className="responsive-grid-2" style={{ marginBottom: 14 }}>
                                    <PaymentInfo label="Monto" value={`$${pago.monto.toLocaleString()}`} accent="var(--accent-secondary)" />
                                    <PaymentInfo label="Metodo" value={pago.metodo} />
                                    <PaymentInfo label="Fecha" value={new Date(`${pago.fecha}T12:00:00`).toLocaleDateString('es-AR')} />
                                    <PaymentInfo label="Mes" value={pago.mes} />
                                </div>
                                {pago.estado !== 'pagado' && <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }} onClick={() => marcarPagado(pago.id)}><CheckCircle size={14} /> Marcar Pagado</button>}
                            </div>
                        )
                    })}
                </div>
            </div>

            {showModal && <PagoModal alumnos={alumnos} onSave={handleSave} onClose={() => setShowModal(false)} />}
        </div>
    )
}

function PaymentInfo({ label, value, accent }) {
    return (
        <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--bg-input)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: accent || 'var(--text-primary)' }}>{value}</div>
        </div>
    )
}

function PagoModal({ alumnos, onSave, onClose }) {
    const monthOptions = useMemo(() => getMonthOptions(), [])
    const [form, setForm] = useState({
        alumnoId: alumnos[0]?.id || '',
        monto: '',
        mes: getMonthLabel(new Date()),
        metodo: 'Efectivo',
        estado: 'pagado',
        fecha: getTodayISO(),
    })

    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Registrar Pago</h3>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <div className="input-group"><label>Alumno</label><select className="input-field" value={form.alumnoId} onChange={e => update('alumnoId', e.target.value)}>{alumnos.map(alumno => <option key={alumno.id} value={alumno.id}>{alumno.nombre}</option>)}</select></div>
                    <div className="form-row">
                        <div className="input-group"><label>Monto</label><input className="input-field" type="number" value={form.monto} onChange={e => update('monto', Number(e.target.value) || '')} placeholder="15000" /></div>
                        <div className="input-group"><label>Mes</label><select className="input-field" value={form.mes} onChange={e => update('mes', e.target.value)}>{monthOptions.map(month => <option key={month}>{month}</option>)}</select></div>
                    </div>
                    <div className="form-row">
                        <div className="input-group"><label>Metodo de Pago</label><select className="input-field" value={form.metodo} onChange={e => update('metodo', e.target.value)}><option>Efectivo</option><option>Transferencia</option><option>MercadoPago</option><option>Debito</option></select></div>
                        <div className="input-group"><label>Fecha</label><input className="input-field" type="date" value={form.fecha} onChange={e => update('fecha', e.target.value)} /></div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" onClick={() => onSave({ ...form, monto: Number(form.monto) || 0 })} disabled={!form.monto}>Registrar</button>
                </div>
            </div>
        </div>
    )
}
