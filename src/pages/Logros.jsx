import { useMemo } from 'react'
import { Award, Flame, Medal, Target, TrendingUp, Trophy, Zap } from 'lucide-react'
import { useAppCatalog, useAppSession, useAppWorkoutLogs } from '../context/AppContext'
import { getWorkoutLogDate } from '../utils/routineSchema'
import { getTodayISO, parseISODate } from '../utils/date'

const VOLUME_MILESTONES = [
    { kg: 500, nombre: 'Primer empuje', desc: 'Acumulaste 500 kg de volumen total' },
    { kg: 1500, nombre: 'Peso de un auto', desc: 'Llegaste a 1.500 kg acumulados' },
    { kg: 3000, nombre: 'Peso de un hipopotamo', desc: 'Superaste los 3.000 kg' },
    { kg: 6000, nombre: 'Peso de un elefante', desc: 'Superaste los 6.000 kg' },
    { kg: 10000, nombre: 'Peso de un colectivo', desc: 'Llegaste a 10.000 kg de volumen' },
    { kg: 20000, nombre: 'Peso de un camion', desc: 'Llegaste a 20.000 kg de volumen' },
    { kg: 50000, nombre: 'Peso de una grua', desc: 'Llegaste a 50.000 kg de volumen' },
    { kg: 100000, nombre: 'Peso de un cohete', desc: 'Llegaste a 100.000 kg de volumen' },
]

const STREAK_MILESTONES = [
    { dias: 3, nombre: '3 dias seguidos', desc: 'Entrenaste 3 dias consecutivos' },
    { dias: 7, nombre: 'Semana completa', desc: 'Entrenaste 7 dias seguidos' },
    { dias: 14, nombre: 'Dos semanas', desc: 'Entrenaste 14 dias seguidos' },
    { dias: 30, nombre: 'Un mes', desc: 'Entrenaste 30 dias seguidos' },
    { dias: 60, nombre: 'Dos meses', desc: 'Entrenaste 60 dias seguidos' },
    { dias: 100, nombre: 'Centenario', desc: 'Entrenaste 100 dias seguidos' },
]

const WORKOUT_MILESTONES = [
    { count: 1, nombre: 'Primer entrenamiento', desc: 'Completaste tu primera sesion' },
    { count: 10, nombre: 'Doble digito', desc: 'Completaste 10 sesiones' },
    { count: 25, nombre: 'Comprometido', desc: 'Completaste 25 sesiones' },
    { count: 50, nombre: 'Medio centenar', desc: 'Completaste 50 sesiones' },
    { count: 100, nombre: 'Centurion', desc: 'Completaste 100 sesiones' },
    { count: 250, nombre: 'Veterano', desc: 'Completaste 250 sesiones' },
]

const PR_THRESHOLDS = [
    { count: 1, nombre: 'Primer PR', desc: 'Lograste tu primer record personal' },
    { count: 5, nombre: '5 PRs', desc: 'Lograste 5 records personales' },
    { count: 10, nombre: '10 PRs', desc: 'Lograste 10 records personales' },
    { count: 25, nombre: '25 PRs', desc: 'Lograste 25 records personales' },
]

function parseWeight(value) {
    const parsed = Number.parseFloat(String(value || '').replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : 0
}

function parseReps(value) {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : 0
}

function diffInDays(fromISO, toISO) {
    return Math.round((parseISODate(toISO) - parseISODate(fromISO)) / 86400000)
}

function computeStreaks(sortedDates) {
    if (sortedDates.length === 0) return { current: 0, best: 0 }

    let best = 1
    let running = 1

    for (let index = 1; index < sortedDates.length; index += 1) {
        if (diffInDays(sortedDates[index - 1], sortedDates[index]) === 1) {
            running += 1
        } else {
            running = 1
        }
        best = Math.max(best, running)
    }

    let ending = 1
    for (let index = sortedDates.length - 1; index > 0; index -= 1) {
        if (diffInDays(sortedDates[index - 1], sortedDates[index]) === 1) {
            ending += 1
        } else {
            break
        }
    }

    const today = getTodayISO()
    const lastDate = sortedDates[sortedDates.length - 1]
    const gapFromToday = diffInDays(lastDate, today)
    const current = gapFromToday <= 1 ? ending : 0

    return { current, best }
}

export default function Logros() {
    const { currentAlumnoId } = useAppSession()
    const { getAlumnoWorkoutLogs } = useAppWorkoutLogs()
    const { exercises } = useAppCatalog()
    const exerciseMap = useMemo(() => Object.fromEntries(exercises.map(exercise => [exercise.id, exercise])), [exercises])
    const rawWorkoutLogs = getAlumnoWorkoutLogs(currentAlumnoId)
    const workoutLogs = useMemo(() => rawWorkoutLogs || {}, [rawWorkoutLogs])
    const completedLogs = useMemo(() => Object.values(workoutLogs).filter(entry => entry.completed && getWorkoutLogDate(entry)), [workoutLogs])

    const stats = useMemo(() => {
        const sortedLogs = [...completedLogs].sort((a, b) => {
            const aKey = `${getWorkoutLogDate(a)}:${a.completedAt || ''}:${a.exerciseId || ''}:${a.setIndex || 0}`
            const bKey = `${getWorkoutLogDate(b)}:${b.completedAt || ''}:${b.exerciseId || ''}:${b.setIndex || 0}`
            return aKey.localeCompare(bKey)
        })

        const sessionDates = [...new Set(sortedLogs.map(getWorkoutLogDate).filter(Boolean))].sort()
        const streaks = computeStreaks(sessionDates)
        const byExerciseCount = new Map()
        const bestWeightByExercise = new Map()
        const prEvents = []

        let totalVolumen = 0
        let totalReps = 0

        sortedLogs.forEach(log => {
            const reps = parseReps(log.actualReps)
            const weight = parseWeight(log.actualWeightKg)
            totalReps += reps
            totalVolumen += weight > 0 && reps > 0 ? weight * reps : 0

            if (log.exerciseId) {
                byExerciseCount.set(log.exerciseId, (byExerciseCount.get(log.exerciseId) || 0) + 1)
            }

            if (weight > 0 && log.exerciseId) {
                const currentBest = bestWeightByExercise.get(log.exerciseId) || 0
                if (weight > currentBest) {
                    bestWeightByExercise.set(log.exerciseId, weight)
                    prEvents.push({
                        ejercicio: exerciseMap[log.exerciseId]?.nombre || log.targetLabel || 'Ejercicio',
                        peso: weight,
                        fecha: getWorkoutLogDate(log),
                    })
                }
            }
        })

        const favoriteEntry = [...byExerciseCount.entries()].sort((a, b) => b[1] - a[1])[0]

        return {
            totalVolumen: Math.round(totalVolumen),
            rachaActual: streaks.current,
            rachaMejor: streaks.best,
            totalWorkouts: sessionDates.length,
            totalSets: completedLogs.length,
            totalReps,
            totalPRs: prEvents.length,
            diasEntrenados: sessionDates.length,
            ejercicioFav: favoriteEntry ? exerciseMap[favoriteEntry[0]]?.nombre || 'Sin definir' : 'Sin definir',
            prs: prEvents.slice(-4).reverse(),
        }
    }, [completedLogs, exerciseMap])

    const volumeUnlocked = VOLUME_MILESTONES.filter(m => stats.totalVolumen >= m.kg)
    const volumeNext = VOLUME_MILESTONES.find(m => stats.totalVolumen < m.kg)
    const streakUnlocked = STREAK_MILESTONES.filter(m => stats.rachaMejor >= m.dias)
    const workoutUnlocked = WORKOUT_MILESTONES.filter(m => stats.totalWorkouts >= m.count)
    const prUnlocked = PR_THRESHOLDS.filter(m => stats.totalPRs >= m.count)

    const totalBadges = volumeUnlocked.length + streakUnlocked.length + workoutUnlocked.length + prUnlocked.length
    const totalPossible = VOLUME_MILESTONES.length + STREAK_MILESTONES.length + WORKOUT_MILESTONES.length + PR_THRESHOLDS.length

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h2>Mis <span className="gradient-text">Logros</span></h2>
                    <p className="page-subtitle">{totalBadges}/{totalPossible} badges desbloqueados con datos reales</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(0,212,170,0.08))' }}>
                <div style={{ padding: '24px 24px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Volumen total levantado</div>
                    <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {stats.totalVolumen.toLocaleString()} kg
                    </div>
                    {volumeNext ? (
                        <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                                Proximo hito: {volumeNext.nombre} ({volumeNext.kg.toLocaleString()} kg)
                            </div>
                            <div style={{ background: 'var(--bg-input)', borderRadius: 20, height: 10, overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 20, background: 'var(--gradient-primary)', width: `${Math.min((stats.totalVolumen / volumeNext.kg) * 100, 100)}%`, transition: 'width 1s ease' }} />
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                {((stats.totalVolumen / volumeNext.kg) * 100).toFixed(0)}% - Faltan {(volumeNext.kg - stats.totalVolumen).toLocaleString()} kg
                            </div>
                        </div>
                    ) : (
                        <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Ya alcanzaste el hito mas alto cargado en la app.</div>
                    )}
                </div>

                <div className="responsive-grid-4" style={{ padding: '0 24px 20px' }}>
                    <QuickStat icon={<Flame size={16} />} label="Racha actual" value={stats.rachaActual} color="#ff6b6b" />
                    <QuickStat icon={<Target size={16} />} label="Workouts" value={stats.totalWorkouts} color="#6c63ff" />
                    <QuickStat icon={<Zap size={16} />} label="Sets" value={stats.totalSets.toLocaleString()} color="#ffa726" />
                    <QuickStat icon={<TrendingUp size={16} />} label="PRs" value={stats.totalPRs} color="#00d4aa" />
                </div>
            </div>

            {stats.totalSets === 0 && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="empty-state">
                        <Trophy />
                        <h3>Todavia no hay logros desbloqueados</h3>
                        <p>Los logros se activan cuando completas series en Mi Rutina. Ahora esta pantalla ya usa esos datos reales.</p>
                    </div>
                </div>
            )}

            {volumeUnlocked.length > 0 && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header"><span className="card-title"><Award size={18} /> Comparaciones de volumen</span></div>
                    <div style={{ padding: '0 24px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <p style={{ lineHeight: 1.8 }}>Con <strong>{stats.totalVolumen.toLocaleString()} kg</strong> acumulados, ya desbloqueaste:</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                            {volumeUnlocked.map(m => (
                                <div key={m.kg} style={{ padding: '8px 14px', background: 'rgba(108,99,255,0.1)', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', border: '1px solid rgba(108,99,255,0.2)' }}>
                                    {m.nombre}
                                </div>
                            ))}
                        </div>
                        <p style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {stats.totalReps.toLocaleString()} repeticiones | {stats.totalSets.toLocaleString()} sets | {stats.diasEntrenados} dias con entrenamiento
                        </p>
                    </div>
                </div>
            )}

            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header"><span className="card-title"><Medal size={18} /> Records personales recientes</span></div>
                <div style={{ padding: '0 24px 20px' }}>
                    {stats.prs.length > 0 ? stats.prs.map((pr, index) => (
                        <div key={`${pr.ejercicio}-${pr.fecha}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: index < stats.prs.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #ffd700, #ffaa00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, color: '#1a1a2e' }}>
                                {index + 1}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{pr.ejercicio}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pr.fecha.split('-').reverse().join('/')}</div>
                            </div>
                            <div style={{ fontWeight: 900, fontSize: '1.1rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {pr.peso} kg
                            </div>
                        </div>
                    )) : (
                        <div className="empty-state" style={{ padding: 0 }}>
                            <TrendingUp />
                            <h3>Sin records personales todavia</h3>
                            <p>Los PRs aparecen cuando registras pesos reales y superas tu mejor marca anterior.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <span className="card-title"><Trophy size={18} /> Todas las badges</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{totalBadges}/{totalPossible}</span>
                </div>
                <div style={{ padding: '0 24px 20px' }}>
                    <BadgeSection title="Volumen" color="rgba(108,99,255,0.1)" borderColor="rgba(108,99,255,0.3)" items={VOLUME_MILESTONES} isUnlocked={item => stats.totalVolumen >= item.kg} metaLabel={item => `${item.kg.toLocaleString()} kg`} />
                    <BadgeSection title="Consistencia" color="rgba(255,107,107,0.1)" borderColor="rgba(255,107,107,0.3)" items={STREAK_MILESTONES} isUnlocked={item => stats.rachaMejor >= item.dias} metaLabel={item => `${item.dias} dias`} />
                    <BadgeSection title="Entrenamientos" color="rgba(0,212,170,0.1)" borderColor="rgba(0,212,170,0.3)" items={WORKOUT_MILESTONES} isUnlocked={item => stats.totalWorkouts >= item.count} metaLabel={item => `${item.count} sesiones`} />
                    <BadgeSection title="Records personales" color="rgba(255,170,0,0.1)" borderColor="rgba(255,170,0,0.3)" items={PR_THRESHOLDS} isUnlocked={item => stats.totalPRs >= item.count} metaLabel={item => `${item.count} PRs`} noMargin />
                </div>
            </div>
        </div>
    )
}

function QuickStat({ icon, label, value, color }) {
    return (
        <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ color, marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{icon}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{value}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{label}</div>
        </div>
    )
}

function BadgeSection({ title, color, borderColor, items, isUnlocked, metaLabel, noMargin = false }) {
    return (
        <div style={{ marginBottom: noMargin ? 0 : 20 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                {items.map(item => {
                    const unlocked = isUnlocked(item)
                    return (
                        <div key={`${title}-${item.nombre}`} style={{ padding: 12, borderRadius: 'var(--radius-md)', textAlign: 'center', background: unlocked ? color : 'var(--bg-input)', border: unlocked ? `1px solid ${borderColor}` : '1px solid transparent', opacity: unlocked ? 1 : 0.35, transition: 'all 0.3s ease' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>{item.nombre}</div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>{metaLabel(item)}</div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

