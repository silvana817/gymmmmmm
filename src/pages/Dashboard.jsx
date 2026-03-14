import { useMemo } from 'react'
import { AlertTriangle, CheckCircle, Clock, CreditCard, Dumbbell, TrendingUp, Users } from 'lucide-react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAppAlumnos, useAppNutrition, useAppPagos, useAppRutinas, useAppSession } from '../context/AppContext'
import { getMonthKey, getMonthKeyFromISO, getMonthLabel, getTodayISO } from '../utils/date'

function buildMonthlyRevenueData(pagos, todayISO) {
    const today = new Date(`${todayISO}T12:00:00`)

    return Array.from({ length: 6 }, (_, index) => {
        const date = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1, 12, 0, 0, 0)
        const monthKey = getMonthKey(date)
        const ingresos = pagos
            .filter(pago => pago.estado === 'pagado' && getMonthKeyFromISO(pago.fecha) === monthKey)
            .reduce((sum, pago) => sum + pago.monto, 0)

        return {
            mes: getMonthLabel(date).slice(0, 3),
            ingresos,
        }
    })
}

export default function Dashboard() {
    const { role } = useAppSession()

    if (role === 'alumno') {
        return <AlumnoDashboard />
    }

    const { alumnos } = useAppAlumnos()
    const { pagos } = useAppPagos()
    const { rutinas } = useAppRutinas()
    const { trainerProfile } = useAppSession()

    const todayISO = getTodayISO()
    const todayMonthLabel = getMonthLabel(todayISO)
    const pagosDelMes = pagos.filter(pago => getMonthKeyFromISO(pago.fecha) === getMonthKeyFromISO(todayISO))
    const activos = alumnos.filter(alumno => alumno.estado === 'activo').length
    const vencidos = alumnos.filter(alumno => alumno.estado === 'vencido').length
    const ingresos = pagosDelMes.filter(pago => pago.estado === 'pagado').reduce((sum, pago) => sum + pago.monto, 0)
    const pendientes = pagosDelMes.filter(pago => pago.estado === 'pendiente' || pago.estado === 'vencido').length
    const rutinasAsignadas = rutinas.filter(rutina => rutina.asignaciones.length > 0).length
    const chartData = useMemo(() => buildMonthlyRevenueData(pagos, todayISO), [pagos, todayISO])
    const greetingName = trainerProfile.name.split(' ')[0] || trainerProfile.name

    const planData = [
        { name: 'Musculacion', value: alumnos.filter(alumno => alumno.plan === 'Musculacion').length, color: '#6c63ff' },
        { name: 'Full', value: alumnos.filter(alumno => alumno.plan === 'Full').length, color: '#00d4aa' },
        { name: 'Funcional', value: alumnos.filter(alumno => alumno.plan === 'Funcional').length, color: '#ff6b9d' },
    ]

    return (
        <div className="page-container">
            <div className="page-header"><div><h2>Bienvenido, <span className="gradient-text">{greetingName}</span></h2><p className="page-subtitle">Resumen actualizado del gimnasio</p></div></div>
            <div className="stats-grid">
                <StatCard color="purple" icon={<Users size={24} />} title="Alumnos Activos" value={activos} detail={`${alumnos.length} registrados`} detailClass="positive" detailIcon={<TrendingUp size={14} />} />
                <StatCard color="green" icon={<CreditCard size={24} />} title={`Ingresos ${todayMonthLabel}`} value={`$${ingresos.toLocaleString()}`} detail={`${pagosDelMes.filter(pago => pago.estado === 'pagado').length} pagos acreditados`} detailClass="positive" detailIcon={<TrendingUp size={14} />} />
                <StatCard color="pink" icon={<Dumbbell size={24} />} title="Rutinas Activas" value={rutinas.length} detail={`${rutinasAsignadas} asignadas`} detailClass="positive" detailIcon={<CheckCircle size={14} />} />
                <StatCard color="gold" icon={<AlertTriangle size={24} />} title="Pagos Pendientes" value={pendientes} detail={pendientes > 0 ? 'Requieren atencion' : 'Sin deuda del mes'} detailClass={pendientes > 0 ? 'negative' : 'positive'} detailIcon={<Clock size={14} />} />
            </div>
            <div className="grid-2">
                <div className="card">
                    <div className="card-header"><span className="card-title"><TrendingUp size={18} /> Ingresos Mensuales</span></div>
                    <ResponsiveContainer width="100%" height={260}><BarChart data={chartData}><XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#6b6b82', fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b6b82', fontSize: 12 }} tickFormatter={value => `$${value / 1000}k`} /><Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} formatter={value => [`$${value.toLocaleString()}`, 'Ingresos']} /><Bar dataKey="ingresos" fill="url(#colorGrad)" radius={[6, 6, 0, 0]} /><defs><linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6c63ff" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient></defs></BarChart></ResponsiveContainer>
                </div>
                <div className="card">
                    <div className="card-header"><span className="card-title"><Users size={18} /> Distribucion por Plan</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                        <ResponsiveContainer width={200} height={200}><PieChart><Pie data={planData} cx="50%" cy="50%" outerRadius={80} innerRadius={50} dataKey="value" strokeWidth={0}>{planData.map(entry => <Cell key={entry.name} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer>
                        <div style={{ width: '100%', maxWidth: 280 }}>{planData.map(item => <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} /><span style={{ fontSize: '0.85rem', color: '#a0a0b8' }}>{item.name}</span><span style={{ fontWeight: 700, marginLeft: 'auto' }}>{item.value}</span></div>)}</div>
                    </div>
                    <div className="divider" />
                    <div className="card-header" style={{ marginBottom: 12 }}><span className="card-title" style={{ fontSize: '0.85rem' }}>Alumnos con pago vencido</span></div>
                    {vencidos > 0 ? alumnos.filter(alumno => alumno.estado === 'vencido').map(alumno => <div key={alumno.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}><div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>{alumno.avatar}</div><span style={{ fontSize: '0.85rem', flex: 1 }}>{alumno.nombre}</span><span className="badge badge-danger">Vencido</span></div>) : <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No hay pagos vencidos en este momento.</div>}
                </div>
            </div>
        </div>
    )
}

function StatCard({ color, icon, title, value, detail, detailClass, detailIcon }) {
    return <div className={`stat-card ${color}`}><div className={`stat-icon ${color}`}>{icon}</div><div className="stat-info"><h3>{title}</h3><div className="stat-value">{value}</div><div className={`stat-change ${detailClass}`}>{detailIcon} {detail}</div></div></div>
}

function AlumnoDashboard() {
    const { currentAlumnoId, currentAlumno } = useAppSession()
    const { getAlumnoRutinas } = useAppRutinas()
    const { getAlumnoNutricion } = useAppNutrition()
    const rutinas = getAlumnoRutinas(currentAlumnoId)
    const nutri = getAlumnoNutricion(currentAlumnoId)
    const todayISO = getTodayISO()
    const hoy = nutri.registros.find(registro => registro.fecha === todayISO)
    const totalCal = hoy ? hoy.comidas.reduce((sum, meal) => sum + meal.items.reduce((itemSum, item) => itemSum + item.calorias, 0), 0) : 0
    const totalProt = hoy ? hoy.comidas.reduce((sum, meal) => sum + meal.items.reduce((itemSum, item) => itemSum + item.proteinas, 0), 0) : 0
    const studentName = currentAlumno?.nombre ? currentAlumno.nombre.split(' ')[0] : 'Alumno'

    return (
        <div className="page-container">
            <div className="page-header"><div><h2>Hola, <span className="gradient-text">{studentName}</span></h2><p className="page-subtitle">Tu resumen del dia</p></div></div>
            <div className="stats-grid">
                <StatCard color="purple" icon={<Dumbbell size={24} />} title="Rutinas Asignadas" value={rutinas.length} detail={rutinas.length > 0 ? 'Disponibles para hoy' : 'Sin asignaciones'} detailClass="positive" detailIcon={null} />
                <StatCard color="green" icon={<TrendingUp size={24} />} title="Calorias Hoy" value={totalCal} detail={`/ ${nutri.metaDiaria.calorias} meta`} detailClass="positive" detailIcon={null} />
                <StatCard color="pink" icon={<CheckCircle size={24} />} title="Proteinas Hoy" value={`${Math.round(totalProt)}g`} detail={`/ ${nutri.metaDiaria.proteinas}g meta`} detailClass="positive" detailIcon={null} />
            </div>
            {rutinas.length > 0 && <div className="card" style={{ marginBottom: 20 }}><div className="card-header"><span className="card-title"><Dumbbell size={18} /> Mis Rutinas</span></div>{rutinas.map(rutina => <div key={rutina.id} style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', marginBottom: 8 }}><div style={{ fontWeight: 700, marginBottom: 4 }}>{rutina.nombre}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rutina.descripcion}</div><span className="badge badge-purple" style={{ marginTop: 8 }}>{rutina.tipo}</span></div>)}</div>}
        </div>
    )
}
