import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Dumbbell, X, Plus, Search } from 'lucide-react'
import { useAppCatalog, useAppRutinas, useAppSession, useAppWorkoutLogs } from '../context/AppContext'
import NumberStepper from '../components/NumberStepper'
import {
    buildWorkoutSetKey,
    formatExerciseGoal,
    formatRest,
    formatTargetWeight,
    getSuggestedActualReps,
    getWorkoutLogDate,
    ROUTINE_GOAL_MODES,
} from '../utils/routineSchema'
import { getExerciseFrameAvailability, getExerciseImage, hasExerciseFrame } from '../data/exercises'
import { getLongDateLabel, getTodayISO, shiftISODate } from '../utils/date'

const fallbackThumbStyle = size => ({
    width: size,
    height: size,
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-input)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
})

const EMPTY_LOG = Object.freeze({})

const motionBadgeStyle = {
    position: 'absolute',
    bottom: 2,
    right: 2,
    background: 'rgba(108, 99, 255, 0.9)',
    borderRadius: 4,
    padding: '1px 4px',
    fontSize: '0.55rem',
    color: '#fff',
    lineHeight: 1,
    fontWeight: 700,
}

function sanitizeWeight(value) {
    return String(value ?? '').replace(',', '.').replace(/[^0-9.]/g, '')
}

const ExerciseThumb = memo(function ExerciseThumb({ imageId, size = 48, autoPlay = false, showMotionBadge = false }) {
    const [showFrame1, setShowFrame1] = useState(false)
    const [hasBaseError, setHasBaseError] = useState(false)
    const [hasAltFrame, setHasAltFrame] = useState(() => Boolean(getExerciseFrameAvailability(imageId, 1)))
    const [shouldLoadAltFrame, setShouldLoadAltFrame] = useState(autoPlay)
    const [hasAltLoaded, setHasAltLoaded] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const intervalRef = useRef(null)

    const stopAnim = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        setShowFrame1(false)
    }

    useEffect(() => () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }, [])

    useEffect(() => {
        stopAnim()
        setHasBaseError(false)
        setHasAltLoaded(false)
        setIsHovering(false)
        setShouldLoadAltFrame(autoPlay)

        if (!imageId) {
            setHasAltFrame(false)
            return undefined
        }

        const cachedAvailability = getExerciseFrameAvailability(imageId, 1)
        if (cachedAvailability !== null) {
            setHasAltFrame(cachedAvailability)
            return undefined
        }

        let cancelled = false
        hasExerciseFrame(imageId, 1).then(result => {
            if (!cancelled) setHasAltFrame(result)
        })

        return () => {
            cancelled = true
        }
    }, [autoPlay, imageId])

    const canAnimate = Boolean(imageId) && hasAltFrame && !hasBaseError
    const shouldAnimate = canAnimate && hasAltLoaded && (autoPlay || isHovering)

    useEffect(() => {
        if (!shouldAnimate) {
            stopAnim()
            return undefined
        }

        intervalRef.current = setInterval(() => setShowFrame1(frame => !frame), 1200)
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [shouldAnimate])

    if (!imageId || hasBaseError) {
        return <div style={fallbackThumbStyle(size)}><Dumbbell size={size * 0.45} style={{ color: 'var(--text-muted)', opacity: 0.4 }} /></div>
    }

    return (
        <div
            style={{ width: size, height: size, position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, background: '#0a0a1a' }}
            onMouseEnter={!autoPlay && canAnimate ? () => { setIsHovering(true); setShouldLoadAltFrame(true) } : undefined}
            onMouseLeave={!autoPlay && canAnimate ? () => setIsHovering(false) : undefined}
        >
            <img
                src={getExerciseImage(imageId, 0)}
                alt=""
                loading="lazy"
                decoding="async"
                fetchpriority={autoPlay ? 'high' : 'low'}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: showFrame1 && hasAltLoaded ? 0 : 1, transition: hasAltFrame ? 'opacity 0.6s ease-in-out' : 'none' }}
                onError={() => setHasBaseError(true)}
            />
            {canAnimate && shouldLoadAltFrame && (
                <img
                    src={getExerciseImage(imageId, 1)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    fetchpriority={autoPlay ? 'high' : 'low'}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: showFrame1 && hasAltLoaded ? 1 : 0, transition: 'opacity 0.6s ease-in-out' }}
                    onLoad={() => setHasAltLoaded(true)}
                    onError={() => { stopAnim(); setHasAltFrame(false); setHasAltLoaded(false) }}
                />
            )}
            {showMotionBadge && canAnimate && <div style={motionBadgeStyle}>2x</div>}
        </div>
    )
})

function ExerciseDetailModal({ exercise, onClose }) {
    if (!exercise) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 520 }} onClick={event => event.stopPropagation()}>
                <div className="modal-header">
                    <h3>{exercise.nombre}</h3>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, background: '#0a0a1a', borderRadius: 'var(--radius-lg)', overflow: 'hidden', padding: 12 }}>
                        <ExerciseThumb imageId={exercise.imageId} size={280} autoPlay showMotionBadge />
                    </div>
                    <div style={{ marginBottom: 10 }}>
                        <span className="badge badge-purple" style={{ marginRight: 8 }}>{exercise.grupo}</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{exercise.descripcion}</p>
                </div>
            </div>
        </div>
    )
}

function AddExtraExerciseModal({ exercises, onClose, onAdd }) {
    const [search, setSearch] = useState('')
    const [selectedGroup, setSelectedGroup] = useState('Todos')
    const groups = ['Todos', ...Array.from(new Set(exercises.map(e => e.grupo)))]
    const filtered = exercises.filter(e => {
        const matchSearch = e.nombre.toLowerCase().includes(search.toLowerCase())
        const matchGroup = selectedGroup === 'Todos' || e.grupo === selectedGroup
        return matchSearch && matchGroup
    }).slice(0, 30)

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ height: '85vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2>Agregar Ejercicio Extra</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div style={{ padding: '0 20px', marginBottom: 12, flexShrink: 0 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', background: 'var(--bg-input)',
                        borderRadius: 10, padding: '8px 12px'
                    }}>
                        <Search size={16} style={{ color: 'var(--text-muted)', marginRight: 8 }} />
                        <input
                            style={{
                                background: 'transparent', border: 'none', color: 'var(--text-primary)',
                                width: '100%', fontSize: '0.95rem', outline: 'none'
                            }}
                            placeholder="Buscar en el catalogo..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 20px 8px', flexShrink: 0, marginBottom: 8 }} className="hide-scrollbar">
                    {groups.map(cat => (
                        <button key={cat} type="button" className={`chip ${selectedGroup === cat ? 'active' : ''}`} onClick={() => setSelectedGroup(cat)}>{cat}</button>
                    ))}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filtered.map(ex => (
                        <div key={ex.id} className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }} onClick={() => onAdd(ex)}>
                            <ExerciseThumb imageId={ex.imageId} size={48} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{ex.nombre}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ex.grupo}</div>
                            </div>
                            <button className="btn btn-ghost btn-icon" style={{ color: 'var(--accent-primary)' }}><Plus size={20} /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

const WorkoutSetCard = memo(function WorkoutSetCard({
    rutinaId,
    dayIndex,
    exerciseIndex,
    setIndex,
    item,
    logKey,
    logEntry,
    onUpdate,
}) {
    const numericGoal = item.goalMode === ROUTINE_GOAL_MODES.EXACT || item.goalMode === ROUTINE_GOAL_MODES.RANGE
    const suggestedReps = Number.parseInt(logEntry.actualReps || getSuggestedActualReps(item) || '1', 10) || 1

    const basePatch = useMemo(() => ({
        rutinaId,
        dayIndex,
        exerciseIndex,
        setIndex,
        exerciseId: item.ejercicioId,
        targetLabel: formatExerciseGoal(item),
        targetWeightKg: item.targetWeightKg || '',
    }), [dayIndex, exerciseIndex, item, rutinaId, setIndex])

    const toggleCompleted = useCallback(() => {
        onUpdate(logKey, {
            ...basePatch,
            completed: !logEntry.completed,
            actualReps: logEntry.actualReps || getSuggestedActualReps(item) || '',
        })
    }, [basePatch, item, logEntry.actualReps, logEntry.completed, logKey, onUpdate])

    const updateReps = useCallback(value => {
        onUpdate(logKey, {
            ...basePatch,
            actualReps: String(value),
            completed: true,
        })
    }, [basePatch, logKey, onUpdate])

    const updateCustomResult = useCallback(event => {
        const value = event.target.value
        onUpdate(logKey, {
            ...basePatch,
            actualReps: value,
            completed: Boolean(value.trim()),
        })
    }, [basePatch, logKey, onUpdate])

    const updateWeight = useCallback(event => {
        onUpdate(logKey, {
            ...basePatch,
            actualWeightKg: sanitizeWeight(event.target.value),
        })
    }, [basePatch, logKey, onUpdate])

    const toggleSkipped = useCallback(() => {
        onUpdate(logKey, {
            ...basePatch,
            skipped: !logEntry.skipped,
            completed: false, // un-complete when skipping
        })
    }, [basePatch, logEntry.skipped, logKey, onUpdate])

    if (logEntry.skipped) {
        return (
            <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>Serie {setIndex + 1} omitida</div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={toggleSkipped}>
                    Restaurar
                </button>
            </div>
        )
    }

    return (
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--bg-input)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Serie {setIndex + 1}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', color: 'var(--text-muted)' }} onClick={toggleSkipped}>
                        Omitir
                    </button>
                    <button type="button" className={`btn btn-sm ${logEntry.completed ? 'btn-secondary' : 'btn-primary'}`} style={{ padding: '4px 12px' }} onClick={toggleCompleted}>
                        {logEntry.completed ? <><CheckCircle size={14} style={{ marginRight: 4 }} /> Lista</> : 'Marcar lista'}
                    </button>
                </div>
            </div>

            <div className="responsive-grid-2" style={{ gap: 12, maxWidth: 440 }}>
                {numericGoal ? (
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Reps hechas</label>
                        <NumberStepper value={suggestedReps} onChange={updateReps} min={1} max={100} size="sm" />
                    </div>
                ) : (
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Resultado real</label>
                        <input className="input-field" value={logEntry.actualReps || ''} onChange={updateCustomResult} placeholder="Ej: 12/lado o 40s" />
                    </div>
                )}
                <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Peso usado (kg)</label>
                    <input className="input-field" type="text" inputMode="decimal" value={logEntry.actualWeightKg || ''} onChange={updateWeight} placeholder={item.targetWeightKg || 'Opcional'} />
                </div>
            </div>
        </div>
    )
}, (prev, next) => (
    prev.logEntry === next.logEntry
    && prev.item === next.item
    && prev.logKey === next.logKey
    && prev.rutinaId === next.rutinaId
    && prev.dayIndex === next.dayIndex
    && prev.exerciseIndex === next.exerciseIndex
    && prev.setIndex === next.setIndex
    && prev.onUpdate === next.onUpdate
))

export default function MiRutina() {
    const { currentAlumnoId } = useAppSession()
    const { exercises } = useAppCatalog()
    const { getAlumnoRutinas } = useAppRutinas()
    const { getAlumnoWorkoutLogs, updateWorkoutSetLog, hydrateWorkoutLogsForAlumno } = useAppWorkoutLogs()

    const [selectedDate, setSelectedDate] = useState(getTodayISO())
    const rutinas = useMemo(() => getAlumnoRutinas(currentAlumnoId), [currentAlumnoId, getAlumnoRutinas])
    const workoutLogs = useMemo(() => getAlumnoWorkoutLogs(currentAlumnoId) || {}, [currentAlumnoId, getAlumnoWorkoutLogs])
    const sessionLogs = useMemo(() => Object.fromEntries(
        Object.entries(workoutLogs).filter(([, entry]) => getWorkoutLogDate(entry) === selectedDate),
    ), [selectedDate, workoutLogs])
    const [expandedRutina, setExpandedRutina] = useState(rutinas[0]?.id || null)
    const [detailExercise, setDetailExercise] = useState(null)
    const [showExtraModal, setShowExtraModal] = useState(false)
    const exerciseMap = useMemo(() => Object.fromEntries(exercises.map(exercise => [exercise.id, exercise])), [exercises])

    const extraExercisesMapped = useMemo(() => {
        const extraLogs = Object.entries(sessionLogs)
            .filter(([key]) => key.includes(`:extra:0:`))
            .map(([, entry]) => entry)

        const grouped = {}
        extraLogs.forEach(entry => {
            if (!grouped[entry.exerciseIndex]) {
                grouped[entry.exerciseIndex] = {
                    ejercicioId: entry.exerciseId,
                    exerciseIndex: entry.exerciseIndex,
                    sets: []
                }
            }
            grouped[entry.exerciseIndex].sets.push({
                ...entry,
                logKey: `${entry.sessionDate}:${entry.rutinaId}:${entry.dayIndex}:${entry.exerciseIndex}:${entry.setIndex}`
            })
        })

        return Object.values(grouped).map(group => {
            group.sets.sort((a, b) => a.setIndex - b.setIndex)
            return group
        }).sort((a, b) => a.exerciseIndex - b.exerciseIndex)
    }, [sessionLogs])

    const handleAddExtraExercise = useCallback((exercise) => {
        const newExerciseIndex = extraExercisesMapped.length > 0
            ? Math.max(...extraExercisesMapped.map(e => e.exerciseIndex)) + 1
            : 0

        const logKey = buildWorkoutSetKey({ rutinaId: 'extra', dayIndex: 0, exerciseIndex: newExerciseIndex, setIndex: 0, sessionDate: selectedDate })

        updateWorkoutSetLog(currentAlumnoId, logKey, {
            rutinaId: 'extra',
            dayIndex: 0,
            exerciseIndex: newExerciseIndex,
            setIndex: 0,
            exerciseId: exercise.id,
            targetLabel: '-',
            targetWeightKg: '',
            completed: false,
            actualReps: '',
            actualWeightKg: '',
            sessionDate: selectedDate
        })

        setShowExtraModal(false)
    }, [currentAlumnoId, extraExercisesMapped.length, selectedDate, updateWorkoutSetLog])

    const addExtraSet = useCallback((ejercicioId, exerciseIndex) => {
        const extraTask = extraExercisesMapped.find(e => e.exerciseIndex === exerciseIndex)
        const nextSetIndex = extraTask ? extraTask.sets.length : 0

        const logKey = buildWorkoutSetKey({ rutinaId: 'extra', dayIndex: 0, exerciseIndex, setIndex: nextSetIndex, sessionDate: selectedDate })

        updateWorkoutSetLog(currentAlumnoId, logKey, {
            rutinaId: 'extra',
            dayIndex: 0,
            exerciseIndex,
            setIndex: nextSetIndex,
            exerciseId: ejercicioId,
            targetLabel: '-',
            targetWeightKg: '',
            completed: false,
            actualReps: '',
            actualWeightKg: '',
            sessionDate: selectedDate
        })
    }, [currentAlumnoId, extraExercisesMapped, selectedDate, updateWorkoutSetLog])

    useEffect(() => {
        hydrateWorkoutLogsForAlumno(currentAlumnoId, selectedDate)
    }, [currentAlumnoId, hydrateWorkoutLogsForAlumno, selectedDate, rutinas])

    useEffect(() => {
        setExpandedRutina(currentExpanded => (
            rutinas.some(rutina => rutina.id === currentExpanded)
                ? currentExpanded
                : rutinas[0]?.id || null
        ))
    }, [rutinas])

    const updateSetLog = useCallback((logKey, patch) => {
        updateWorkoutSetLog(currentAlumnoId, logKey, { ...patch, sessionDate: selectedDate })
    }, [currentAlumnoId, selectedDate, updateWorkoutSetLog])

    const routineProgressById = useMemo(() => Object.fromEntries(rutinas.map(rutina => {
        let totalSetsValidos = 0
        let completedSets = 0

        rutina.dias.forEach((dia, dayIndex) => {
            dia.ejercicios.forEach((item, exerciseIndex) => {
                for (let setIndex = 0; setIndex < item.series; setIndex += 1) {
                    const logKey = buildWorkoutSetKey({ rutinaId: rutina.id, dayIndex, exerciseIndex, setIndex, sessionDate: selectedDate })
                    const log = sessionLogs[logKey]

                    if (!log?.skipped) {
                        totalSetsValidos += 1
                        if (log?.completed) completedSets += 1
                    }
                }
            })
        })

        return [rutina.id, { totalSets: totalSetsValidos, completedSets }]
    })), [rutinas, selectedDate, sessionLogs])

    if (rutinas.length === 0) {
        return (
            <div className="page-container">
                <div className="page-header"><div><h2>Mi <span className="gradient-text">Rutina</span></h2></div></div>
                <div className="empty-state">
                    <Dumbbell />
                    <h3>No tenes rutinas asignadas</h3>
                    <p>Tu entrenador te asignara una rutina personalizada pronto.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h2>Mi <span className="gradient-text">Rutina</span></h2>
                    <p className="page-subtitle">El profe define objetivo y peso sugerido. Vos registras el resultado real por sesion.</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDate(getTodayISO())}>Hoy</button>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CalendarDays size={18} style={{ color: 'var(--accent-primary)' }} />
                        <div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sesion a registrar</div>
                            <div style={{ fontWeight: 700 }}>{getLongDateLabel(selectedDate)}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => setSelectedDate(currentDate => shiftISODate(currentDate, -1))}><ChevronLeft size={18} /></button>
                        <button className="btn btn-ghost btn-icon" onClick={() => setSelectedDate(currentDate => shiftISODate(currentDate, 1))}><ChevronRight size={18} /></button>
                    </div>
                </div>
            </div>

            {rutinas.map(rutina => {
                const isExpanded = expandedRutina === rutina.id
                const progress = routineProgressById[rutina.id] || { completedSets: 0, totalSets: 0 }

                return (
                    <div key={rutina.id} className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: 20, cursor: 'pointer' }} onClick={() => setExpandedRutina(isExpanded ? null : rutina.id)}>
                            <div className="flex-between">
                                <div>
                                    <span className="badge badge-purple" style={{ marginBottom: 8 }}>{rutina.tipo}</span>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 4 }}>{rutina.nombre}</h3>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>{rutina.descripcion}</p>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{progress.completedSets} / {progress.totalSets} series completas el {selectedDate.split('-').reverse().join('/')}</div>
                                </div>
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>

                        {isExpanded && (
                            <div style={{ borderTop: '1px solid var(--border-color)' }}>
                                {rutina.dias.map((dia, dayIndex) => (
                                    <div key={`${rutina.id}-${dayIndex}`} className="routine-day" style={{ margin: 0, borderRadius: 0, border: 'none', borderBottom: dayIndex < rutina.dias.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                        <div className="routine-day-header">
                                            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Dumbbell size={16} style={{ color: 'var(--accent-primary)' }} />{dia.dia}</h4>
                                        </div>

                                        {dia.ejercicios.map((item, exerciseIndex) => {
                                            const exercise = exerciseMap[item.ejercicioId]
                                            const targetWeight = formatTargetWeight(item)

                                            return (
                                                <div key={`${rutina.id}-${dayIndex}-${exerciseIndex}`} className="routine-exercise-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                                                        <div onClick={() => exercise && setDetailExercise(exercise)} style={{ cursor: exercise ? 'pointer' : 'default' }} title="Ver demostracion">
                                                            <ExerciseThumb imageId={exercise?.imageId} size={52} showMotionBadge />
                                                        </div>
                                                        <div className="routine-exercise-details" style={{ minWidth: 0, flex: 1 }}>
                                                            <h5 style={{ cursor: 'pointer' }} onClick={() => exercise && setDetailExercise(exercise)}>{exercise?.nombre}</h5>
                                                            <p>{exercise?.grupo}</p>
                                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                                                                <span className="set-badge">{formatExerciseGoal(item)}</span>
                                                                {targetWeight && <span className="set-badge">Objetivo {targetWeight}</span>}
                                                                <span className="set-badge">Descanso {formatRest(item)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                                                        {Array.from({ length: item.series }, (_, setIndex) => {
                                                            const logKey = buildWorkoutSetKey({ rutinaId: rutina.id, dayIndex, exerciseIndex, setIndex, sessionDate: selectedDate })
                                                            return (
                                                                <WorkoutSetCard
                                                                    key={logKey}
                                                                    rutinaId={rutina.id}
                                                                    dayIndex={dayIndex}
                                                                    exerciseIndex={exerciseIndex}
                                                                    setIndex={setIndex}
                                                                    item={item}
                                                                    logKey={logKey}
                                                                    logEntry={sessionLogs[logKey] || EMPTY_LOG}
                                                                    onUpdate={updateSetLog}
                                                                />
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}

            {extraExercisesMapped.length > 0 && (
                <div className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden', border: '1px dashed var(--accent-primary)' }}>
                    <div style={{ padding: 20 }}>
                        <div className="badge badge-primary" style={{ marginBottom: 8 }}>Añadidos en Sesion</div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 4 }}>Ejercicios Libres</h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>Series añadidas fuera del plan original</p>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)' }}>
                        <div className="routine-day" style={{ margin: 0, borderRadius: 0, border: 'none' }}>
                            {extraExercisesMapped.map((extraItem) => {
                                const exercise = exerciseMap[extraItem.ejercicioId]
                                return (
                                    <div key={extraItem.exerciseIndex} className="routine-exercise-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                                            <div onClick={() => exercise && setDetailExercise(exercise)} style={{ cursor: exercise ? 'pointer' : 'default' }} title="Ver demostracion">
                                                <ExerciseThumb imageId={exercise?.imageId} size={52} showMotionBadge />
                                            </div>
                                            <div className="routine-exercise-details" style={{ minWidth: 0, flex: 1 }}>
                                                <h5 style={{ cursor: 'pointer' }} onClick={() => exercise && setDetailExercise(exercise)}>{exercise?.nombre}</h5>
                                                <p>{exercise?.grupo}</p>
                                            </div>
                                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-primary)' }} onClick={() => addExtraSet(extraItem.ejercicioId, extraItem.exerciseIndex)}>
                                                + Serie
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                                            {extraItem.sets.map((logEntry) => (
                                                <WorkoutSetCard
                                                    key={logEntry.logKey}
                                                    rutinaId="extra"
                                                    dayIndex={0}
                                                    exerciseIndex={extraItem.exerciseIndex}
                                                    setIndex={logEntry.setIndex}
                                                    item={{ goalMode: ROUTINE_GOAL_MODES.CUSTOM, targetCustom: 'Libre', targetWeightKg: '', restSeconds: 60, ejercicioId: extraItem.ejercicioId }}
                                                    logKey={logEntry.logKey}
                                                    logEntry={logEntry}
                                                    onUpdate={updateSetLog}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            <button className="btn btn-secondary" style={{ width: '100%', padding: '16px', borderRadius: 12, display: 'flex', justifyContent: 'center', gap: 8 }} onClick={() => setShowExtraModal(true)}>
                <Plus size={18} /> Añadir Ejercicio Libre a la Sesion
            </button>

            {detailExercise && <ExerciseDetailModal exercise={detailExercise} onClose={() => setDetailExercise(null)} />}
            {showExtraModal && (
                <AddExtraExerciseModal
                    exercises={exercises}
                    onClose={() => setShowExtraModal(false)}
                    onAdd={handleAddExtraExercise}
                />
            )}
        </div>
    )
}
