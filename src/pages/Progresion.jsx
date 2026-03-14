import { useEffect, useMemo, useState } from 'react'
import { Calculator, ChevronDown, ChevronUp, Dumbbell, Info, Target, TrendingUp, Zap } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAppCatalog, useAppRutinas, useAppSession, useAppWorkoutLogs } from '../context/AppContext'
import { getWorkoutLogDate } from '../utils/routineSchema'

const RPE_TABLE = [
    { rpe: 10, rir: 0, desc: 'Fallo muscular. No podes hacer ni una rep mas.', pct: 100 },
    { rpe: 9.5, rir: 0.5, desc: 'Podrias haber hecho media rep mas.', pct: 98 },
    { rpe: 9, rir: 1, desc: 'Podrias haber hecho 1 rep mas.', pct: 96 },
    { rpe: 8.5, rir: 1.5, desc: 'Podrias haber hecho 1 o 2 reps mas.', pct: 94 },
    { rpe: 8, rir: 2, desc: 'Podrias haber hecho 2 reps mas.', pct: 92 },
    { rpe: 7.5, rir: 2.5, desc: 'Podrias haber hecho 2 o 3 reps mas.', pct: 89 },
    { rpe: 7, rir: 3, desc: 'Podrias haber hecho 3 reps mas.', pct: 86 },
    { rpe: 6.5, rir: 3.5, desc: 'Podrias haber hecho 3 o 4 reps mas.', pct: 83 },
    { rpe: 6, rir: 4, desc: 'Podrias haber hecho 4 reps mas.', pct: 80 },
]

const RPE_PCT = Object.fromEntries(RPE_TABLE.map(entry => [entry.rpe, entry.pct]))

function calcE1RM(weight, reps, rpe) {
    const rpePct = RPE_PCT[rpe] || 100
    return Math.round(weight * (1 + reps / 30) * (100 / rpePct))
}

function calcWeightForRepsRPE(e1rm, targetReps, targetRpe) {
    const rpePct = RPE_PCT[targetRpe] || 100
    return Math.round((e1rm / (1 + targetReps / 30)) * (rpePct / 100))
}

function parseWeight(value) {
    const parsed = Number.parseFloat(String(value || '').replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : 0
}

function parseReps(value) {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : 0
}

export default function Progresion() {
    const { exercises } = useAppCatalog()
    const { getAlumnoRutinas } = useAppRutinas()
    const { currentAlumnoId } = useAppSession()
    const { getAlumnoWorkoutLogs } = useAppWorkoutLogs()
    const rawWorkoutLogs = getAlumnoWorkoutLogs(currentAlumnoId)
    const workoutLogs = useMemo(() => rawWorkoutLogs || {}, [rawWorkoutLogs])
    const [calcWeight, setCalcWeight] = useState(80)
    const [calcReps, setCalcReps] = useState(5)
    const [calcRPE, setCalcRPE] = useState(8)
    const [showRPETable, setShowRPETable] = useState(false)
    const [selectedExercise, setSelectedExercise] = useState('ex1')

    const e1RM = calcE1RM(calcWeight, calcReps, calcRPE)
    const exerciseMap = useMemo(() => Object.fromEntries(exercises.map(exercise => [exercise.id, exercise])), [exercises])
    const rutinas = useMemo(() => getAlumnoRutinas(currentAlumnoId), [currentAlumnoId, getAlumnoRutinas])
    const completedLogs = useMemo(() => Object.values(workoutLogs).filter(entry => entry.completed && getWorkoutLogDate(entry)), [workoutLogs])

    const availableExercises = useMemo(() => {
        const ids = new Set()
        completedLogs.forEach(log => {
            if (log.exerciseId) ids.add(log.exerciseId)
        })
        rutinas.forEach(rutina => {
            rutina.dias.forEach(dia => {
                dia.ejercicios.forEach(item => {
                    if (item.ejercicioId) ids.add(item.ejercicioId)
                })
            })
        })

        if (ids.size > 0) {
            return [...ids].map(id => exerciseMap[id]).filter(Boolean)
        }

        return exercises.slice(0, 15)
    }, [completedLogs, exerciseMap, exercises, rutinas])

    useEffect(() => {
        if (availableExercises.some(exercise => exercise.id === selectedExercise)) return
        setSelectedExercise(availableExercises[0]?.id || 'ex1')
    }, [availableExercises, selectedExercise])

    const exerciseLogs = useMemo(() => completedLogs.filter(log => log.exerciseId === selectedExercise), [completedLogs, selectedExercise])

    const progressionData = useMemo(() => {
        const grouped = new Map()

        exerciseLogs.forEach(log => {
            const date = getWorkoutLogDate(log)
            if (!date) return

            const weight = parseWeight(log.actualWeightKg)
            const reps = parseReps(log.actualReps)
            const current = grouped.get(date) || { fecha: date, label: date.slice(5).replace('-', '/'), peso: 0, reps: 0, volumen: 0, sets: 0 }

            current.peso = Math.max(current.peso, weight)
            current.reps += reps
            current.volumen += weight > 0 && reps > 0 ? weight * reps : reps
            current.sets += 1

            grouped.set(date, current)
        })

        return [...grouped.values()].sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-6)
    }, [exerciseLogs])

    const hasWeightData = progressionData.some(item => item.peso > 0)
    const chartKey = hasWeightData ? 'peso' : 'reps'
    const chartLabel = hasWeightData ? 'Peso (kg)' : 'Reps totales'

    const summary = useMemo(() => {
        const sessionDates = [...new Set(completedLogs.map(getWorkoutLogDate).filter(Boolean))].sort()
        const lastSession = sessionDates[sessionDates.length - 1] || ''
        return {
            totalSesiones: sessionDates.length,
            totalSets: completedLogs.length,
            ejerciciosRegistrados: new Set(completedLogs.map(log => log.exerciseId).filter(Boolean)).size,
            lastSession,
        }
    }, [completedLogs])

    const suggestions = useMemo(() => [1, 3, 5, 8, 10, 12, 15].map(reps => ({
        reps,
        weights: [7, 8, 9, 10].map(rpe => ({ rpe, weight: calcWeightForRepsRPE(e1RM, reps, rpe) })),
    })), [e1RM])

    const topMetric = useMemo(() => {
        if (progressionData.length === 0) return 'Sin registros aun'
        if (hasWeightData) {
            return `${Math.max(...progressionData.map(item => item.peso))} kg`
        }
        return `${Math.max(...progressionData.map(item => item.reps))} reps`
    }, [hasWeightData, progressionData])

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h2>Mi <span className="gradient-text">Progresion</span></h2>
                    <p className="page-subtitle">Tus graficos salen de series realmente registradas, no de datos inventados.</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                    <span className="card-title"><Target size={18} /> Resumen real de entrenamiento</span>
                </div>
                <div style={{ padding: '0 24px 20px' }}>
                    <div className="responsive-grid-4">
                        <MetricCard label="Sesiones" value={summary.totalSesiones} color="var(--accent-primary)" />
                        <MetricCard label="Sets completos" value={summary.totalSets} color="var(--accent-secondary)" />
                        <MetricCard label="Ejercicios con datos" value={summary.ejerciciosRegistrados} color="var(--accent-warning)" />
                        <MetricCard label="Ultima sesion" value={summary.lastSession ? summary.lastSession.split('-').reverse().join('/') : '-'} color="var(--accent-tertiary)" />
                    </div>
                    {summary.totalSets === 0 && (
                        <div className="empty-state" style={{ marginTop: 16 }}>
                            <Dumbbell />
                            <h3>Sin historial todavia</h3>
                            <p>Completa una serie en Mi Rutina y esta pantalla empieza a mostrar progreso real.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                    <span className="card-title"><Calculator size={18} /> Calculadora RPE a 1RM</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowRPETable(!showRPETable)}>
                        <Info size={14} /> Que es RPE? {showRPETable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
                {showRPETable && (
                    <div style={{ padding: '0 24px 16px' }}>
                        <div style={{ padding: 16, background: 'rgba(108,99,255,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(108,99,255,0.15)', fontSize: '0.8rem' }}>
                            <p style={{ marginBottom: 12, color: 'var(--text-secondary)' }}><strong>RPE</strong> mide que tan cerca del fallo muscular quedaste en un set. <strong>RIR</strong> indica cuantas reps mas podias hacer.</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 6 }}>
                                {RPE_TABLE.map(row => (
                                    <div key={row.rpe} style={{ padding: '8px 10px', background: 'var(--bg-input)', borderRadius: 6, fontSize: '0.75rem' }}>
                                        <div style={{ fontWeight: 700, marginBottom: 2 }}>RPE {row.rpe} ({row.rir} RIR)</div>
                                        <div style={{ color: 'var(--text-muted)' }}>{row.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <div style={{ padding: '0 24px 20px' }}>
                    <div className="form-row" style={{ marginBottom: 16 }}>
                        <div className="input-group"><label>Peso (kg)</label><input className="input-field" type="number" inputMode="decimal" value={calcWeight} onChange={e => setCalcWeight(Number(e.target.value) || 0)} /></div>
                        <div className="input-group"><label>Repeticiones</label><input className="input-field" type="number" inputMode="numeric" value={calcReps} onChange={e => setCalcReps(Number(e.target.value) || 1)} min={1} max={30} /></div>
                        <div className="input-group"><label>RPE</label><select className="input-field" value={calcRPE} onChange={e => setCalcRPE(Number(e.target.value))}>{RPE_TABLE.map(row => <option key={row.rpe} value={row.rpe}>RPE {row.rpe} ({row.rir} RIR)</option>)}</select></div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 20, background: 'rgba(108,99,255,0.08)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(108,99,255,0.2)', marginBottom: 20 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>1RM estimado</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{e1RM} kg</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Basado en {calcWeight} kg x {calcReps} reps @ RPE {calcRPE}</div>
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}><Zap size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Pesos sugeridos por reps y RPE</div>
                    <div className="desktop-only" style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ fontSize: '0.78rem' }}>
                            <thead><tr><th>Reps</th>{[7, 8, 9, 10].map(rpe => <th key={rpe}>RPE {rpe}</th>)}</tr></thead>
                            <tbody>
                                {suggestions.map(row => (
                                    <tr key={row.reps}>
                                        <td style={{ fontWeight: 700 }}>{row.reps}</td>
                                        {row.weights.map(weight => <td key={weight.rpe} style={{ color: weight.rpe === calcRPE ? 'var(--accent-primary)' : 'var(--text-primary)', fontWeight: weight.rpe === calcRPE ? 800 : 400 }}>{weight.weight} kg</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mobile-only">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {suggestions.map(row => <SuggestionCard key={row.reps} row={row} calcRPE={calcRPE} />)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <span className="card-title"><TrendingUp size={18} /> Historial real por ejercicio</span>
                </div>
                <div style={{ padding: '0 24px 8px' }}>
                    <select className="input-field" value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)} style={{ marginBottom: 16, maxWidth: 320 }}>
                        {availableExercises.map(exercise => <option key={exercise.id} value={exercise.id}>{exercise.nombre}</option>)}
                    </select>
                </div>

                {progressionData.length > 0 ? (
                    <>
                        <div style={{ padding: '0 12px 24px' }}>
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={progressionData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b6b82', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b6b82', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} formatter={value => [value, chartLabel]} />
                                    <Line type="monotone" dataKey={chartKey} stroke="#6c63ff" strokeWidth={3} dot={{ r: 5, fill: '#6c63ff' }} name={chartLabel} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ padding: '0 24px 20px' }}>
                            <div className="responsive-grid-3">
                                <MetricCard label="Mejor marca" value={topMetric} color="var(--accent-primary)" />
                                <MetricCard label="Volumen total" value={`${Math.round(progressionData.reduce((sum, item) => sum + item.volumen, 0))}`} color="var(--accent-secondary)" />
                                <MetricCard label="Sesiones en grafico" value={progressionData.length} color="var(--accent-warning)" />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="empty-state" style={{ padding: '0 24px 24px' }}>
                        <TrendingUp />
                        <h3>Sin progresion todavia para este ejercicio</h3>
                        <p>Cuando registres series completas de {exerciseMap[selectedExercise]?.nombre || 'este ejercicio'}, aca vas a ver el historial real.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function SuggestionCard({ row, calcRPE }) {
    return (
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--bg-input)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontWeight: 700 }}>{row.reps} reps</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pesos sugeridos</div>
            </div>
            <div className="responsive-grid-2">
                {row.weights.map(weight => (
                    <div key={weight.rpe} style={{ padding: 10, borderRadius: 10, background: weight.rpe === calcRPE ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.03)', border: weight.rpe === calcRPE ? '1px solid rgba(108,99,255,0.35)' : '1px solid transparent' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 3 }}>RPE {weight.rpe}</div>
                        <div style={{ fontWeight: 800, color: weight.rpe === calcRPE ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{weight.weight} kg</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function MetricCard({ label, value, color }) {
    return (
        <div style={{ padding: 14, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{value}</div>
        </div>
    )
}
