import { memo, startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useAppAlumnos, useAppCatalog, useAppRutinas } from '../context/AppContext'
import { CheckCircle2, ChevronDown, ChevronUp, Copy, Dumbbell, GripVertical, Image as ImageIcon, Info, Plus, Search, Trash2, UserPlus, X } from 'lucide-react'
import { getExerciseImage } from '../data/exercises'
import NumberStepper from '../components/NumberStepper'
import { createDefaultRoutineExercise, formatExerciseGoal, formatRest, formatTargetWeight, ROUTINE_GOAL_MODES } from '../utils/routineSchema'

const ROW_HEIGHT = 60
const OVERSCAN = 6
const ellipsisText = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

const thumbFallback = size => ({ width: size, height: size, borderRadius: 8, flexShrink: 0, background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' })

function sanitizeWeight(value) {
    return String(value ?? '').replace(',', '.').replace(/[^0-9.]/g, '')
}

const ExThumb = memo(function ExThumb({ imageId, size = 38 }) {
    const [hasError, setHasError] = useState(false)

    useEffect(() => {
        setHasError(false)
    }, [imageId])

    if (!imageId || hasError) {
        return <div style={thumbFallback(size)}><Dumbbell size={size * 0.42} style={{ color: 'var(--text-muted)', opacity: 0.4 }} /></div>
    }

    return <img src={getExerciseImage(imageId, 0)} alt="" loading="lazy" decoding="async" fetchpriority="low" onError={() => setHasError(true)} style={{ width: size, height: size, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
})

const ExerciseRow = memo(function ExerciseRow({ exercise, onAdd, onInfo }) {
    return (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: '1px solid var(--border-color)' }}>
            <ExThumb imageId={exercise.imageId} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{exercise.grupo}</div>
                <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)', ...ellipsisText }}>{exercise.nombre}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => onInfo(exercise)} className="btn btn-ghost btn-sm" style={{ padding: 6, color: 'var(--text-muted)' }} title="Ver/Editar Info"><Info size={16} /></button>
                <button type="button" onClick={() => onAdd(exercise.id)} className="btn btn-ghost btn-sm" style={{ padding: 6, color: 'var(--accent-primary)' }} title="Agregar"><Plus size={18} /></button>
            </div>
        </div>
    )
})

function GoalFields({ item, onChange }) {
    return (
        <>
            <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Objetivo</label>
                <select className="input-field" value={item.goalMode} onChange={event => onChange('goalMode', event.target.value)}>
                    <option value={ROUTINE_GOAL_MODES.EXACT}>Reps fijas</option>
                    <option value={ROUTINE_GOAL_MODES.RANGE}>Rango</option>
                    <option value={ROUTINE_GOAL_MODES.TIME}>Tiempo</option>
                    <option value={ROUTINE_GOAL_MODES.CUSTOM}>Texto libre</option>
                </select>
            </div>
            {item.goalMode === ROUTINE_GOAL_MODES.EXACT && <div className="input-group" style={{ marginBottom: 0 }}><label>Reps</label><NumberStepper value={item.targetReps} onChange={value => onChange('targetReps', value)} min={1} max={100} /></div>}
            {item.goalMode === ROUTINE_GOAL_MODES.RANGE && <div className="input-group" style={{ marginBottom: 0 }}><label>Reps min / max</label><div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><NumberStepper value={item.targetRepsMin} onChange={value => onChange('targetRepsMin', value)} min={1} max={100} /><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>a</span><NumberStepper value={item.targetRepsMax} onChange={value => onChange('targetRepsMax', value)} min={item.targetRepsMin || 1} max={100} /></div></div>}
            {item.goalMode === ROUTINE_GOAL_MODES.TIME && <div className="input-group" style={{ marginBottom: 0 }}><label>Segundos</label><NumberStepper value={item.targetSeconds} onChange={value => onChange('targetSeconds', value)} min={5} max={600} step={5} /></div>}
            {item.goalMode === ROUTINE_GOAL_MODES.CUSTOM && <div className="input-group" style={{ marginBottom: 0 }}><label>Texto libre</label><input className="input-field" value={item.targetCustom} onChange={event => onChange('targetCustom', event.target.value)} placeholder="Ej: 12/lado o 30-45s" /></div>}
        </>
    )
}

const CurrentDayEditor = memo(function CurrentDayEditor({ currentDay, activeDay, exerciseMap, onRenameDay, onRemoveExercise, onUpdateExercise, onInfo }) {
    return (
        <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Dia activo: {currentDay.dia}</div>
                <input className="input-field" value={currentDay.dia} onChange={event => onRenameDay(event.target.value)} style={{ fontSize: '0.78rem', padding: '4px 8px', width: '100%', maxWidth: 180, textAlign: 'right' }} placeholder="Nombre del dia" />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {currentDay.ejercicios.length === 0 ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}><Dumbbell size={28} style={{ opacity: 0.2, marginBottom: 8 }} /><div>Toca un ejercicio de la biblioteca para agregarlo.</div></div> : currentDay.ejercicios.map((item, index) => {
                    const exercise = exerciseMap[item.ejercicioId]
                    const handleChange = (field, value) => onUpdateExercise(activeDay, index, field, value)
                    return <div key={`${item.ejercicioId} -${index} `} className="card" style={{ padding: 14, boxShadow: 'none', border: '1px solid var(--border-color)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}><ExThumb imageId={exercise?.imageId} size={40} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: '0.84rem', ...ellipsisText }}>{exercise?.nombre || 'Ejercicio no encontrado'}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{exercise?.grupo || 'Sin grupo'}</div></div><button type="button" className="btn btn-ghost" style={{ padding: '6px', color: 'var(--accent-danger)' }} onClick={() => onRemoveExercise(activeDay, index)} aria-label="Eliminar ejercicio"><X size={14} /></button></div><div className="responsive-grid-2" style={{ gap: 12, marginBottom: 12 }}><div className="input-group" style={{ marginBottom: 0 }}><label>Series</label><NumberStepper value={item.series} onChange={value => handleChange('series', value)} min={1} max={10} /></div><div className="input-group" style={{ marginBottom: 0 }}><label>Descanso (s)</label><NumberStepper value={item.restSeconds} onChange={value => handleChange('restSeconds', value)} min={0} max={600} step={15} /></div></div><div className="responsive-grid-2" style={{ gap: 12, marginBottom: 12 }}><GoalFields item={item} onChange={handleChange} /></div><div className="input-group" style={{ marginBottom: 0 }}><label>Peso objetivo (opcional)</label><input className="input-field" type="text" inputMode="decimal" value={item.targetWeightKg} onChange={event => handleChange('targetWeightKg', sanitizeWeight(event.target.value))} placeholder="Ej: 60 o 62.5" /></div></div>
                })}
            </div>
        </div>
    )
})

export default function Rutinas() {
    const { rutinas, addRutina, deleteRutina, assignRutina } = useAppRutinas()
    const { alumnos } = useAppAlumnos()
    const { exercises, muscleGroups } = useAppCatalog()
    const [showBuilder, setShowBuilder] = useState(false)
    const [showAssign, setShowAssign] = useState(null)
    const [expandedRutina, setExpandedRutina] = useState(null)

    const exerciseMap = useMemo(() => Object.fromEntries(exercises.map(exercise => [exercise.id, exercise])), [exercises])
    const alumnoMap = useMemo(() => Object.fromEntries(alumnos.map(alumno => [alumno.id, alumno])), [alumnos])
    const routineCards = useMemo(() => rutinas.map(rutina => ({ ...rutina, assigned: rutina.asignaciones.map(id => alumnoMap[id]).filter(Boolean), totalExercises: rutina.dias.reduce((total, dia) => total + dia.ejercicios.length, 0) })), [rutinas, alumnoMap])
    const selectedRutina = useMemo(() => rutinas.find(rutina => rutina.id === showAssign) || null, [rutinas, showAssign])

    const [infoExercise, setInfoExercise] = useState(null)

    return (
        <div className="page-container">
            <div className="page-header"><div><h2>Gestion de <span className="gradient-text">Rutinas</span></h2><p className="page-subtitle">{rutinas.length} rutinas creadas con objetivo y carga opcional por ejercicio.</p></div><button className="btn btn-primary" onClick={() => setShowBuilder(true)}><Plus size={18} /> Crear rutina</button></div>
            <div className="grid-auto">{routineCards.map(rutina => { const isExpanded = expandedRutina === rutina.id; return <div key={rutina.id} className="card" style={{ padding: 0, overflow: 'hidden' }}><div style={{ padding: '18px 20px' }}><div className="flex-between" style={{ marginBottom: 12 }}><span className="badge badge-purple">{rutina.tipo}</span><div style={{ display: 'flex', gap: 4 }}><button className="btn btn-ghost btn-sm" title="Asignar" onClick={() => setShowAssign(rutina.id)}><UserPlus size={15} /></button><button className="btn btn-ghost btn-sm" title="Eliminar" style={{ color: 'var(--accent-danger)' }} onClick={() => deleteRutina(rutina.id)}><Trash2 size={15} /></button></div></div><h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>{rutina.nombre}</h3><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>{rutina.descripcion}</p><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>{rutina.assigned.length === 0 ? <span style={{ fontSize: '0.78rem', color: 'var(--accent-warning)', fontStyle: 'italic' }}>Sin asignar</span> : rutina.assigned.map(alumno => <span key={alumno.id} className="chip" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>{alumno.avatar} {alumno.nombre.split(' ')[0]}</span>)}</div><button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setExpandedRutina(isExpanded ? null : rutina.id)}>{isExpanded ? <><ChevronUp size={14} /> Ocultar</> : <><ChevronDown size={14} /> Ver {rutina.totalExercises} ejercicios</>}</button></div>{isExpanded && <div style={{ borderTop: '1px solid var(--border-color)' }}>{rutina.dias.map((dia, dayIndex) => <div key={`${rutina.id} -${dayIndex} `} style={{ borderBottom: '1px solid var(--border-color)' }}><div style={{ padding: '10px 20px', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-input)' }}>{dia.dia} - <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{dia.ejercicios.length} ejercicios</span></div><div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>{dia.ejercicios.map((item, exerciseIndex) => { const exercise = exerciseMap[item.ejercicioId]; const targetWeight = formatTargetWeight(item); return <div key={`${rutina.id} -${dayIndex} -${exerciseIndex} `} style={{ display: 'flex', gap: 10, padding: 12, borderRadius: 14, background: 'var(--bg-input)', flexWrap: 'wrap' }}><ExThumb imageId={exercise?.imageId} size={40} /><div style={{ flex: 1, minWidth: 180 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{exercise?.nombre}</div><button type="button" onClick={() => setInfoExercise(exercise)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, display: 'flex' }}><Info size={12} /></button></div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>{exercise?.grupo}</div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><span className="set-badge">{item.series} series</span><span className="set-badge">{formatExerciseGoal(item)}</span>{targetWeight && <span className="set-badge">Objetivo {targetWeight}</span>}<span className="set-badge">Descanso {formatRest(item)}</span></div></div></div> })}</div></div>)}</div>}</div> })}</div>
            {showBuilder && <RutinaBuilder exercises={exercises} muscleGroups={muscleGroups} alumnos={alumnos} onSave={rutina => { addRutina(rutina); setShowBuilder(false) }} onClose={() => setShowBuilder(false)} onInfoExercise={setInfoExercise} />}
            {showAssign && selectedRutina && <AssignModal rutina={selectedRutina} alumnos={alumnos} onSave={ids => { assignRutina(showAssign, ids); setShowAssign(null) }} onClose={() => setShowAssign(null)} />}
            {infoExercise && <ExerciseTrainerModal exercise={infoExercise} onClose={() => setInfoExercise(null)} />}
        </div>
    )
}
function RutinaBuilder({ exercises, muscleGroups, alumnos, onSave, onClose, onInfoExercise }) {
    const [nombre, setNombre] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [tipo, setTipo] = useState('Hipertrofia')
    const [dias, setDias] = useState([{ dia: 'Dia 1', ejercicios: [] }])
    const [activeDay, setActiveDay] = useState(0)
    const [asignaciones, setAsignaciones] = useState([])

    const exerciseMap = useMemo(() => Object.fromEntries(exercises.map(exercise => [exercise.id, exercise])), [exercises])
    const searchableExercises = useMemo(() => exercises.map(exercise => ({ ...exercise, searchText: `${exercise.nombre} ${exercise.grupo} `.toLowerCase() })), [exercises])
    const currentDay = dias[activeDay] ?? dias[0] ?? { dia: 'Dia 1', ejercicios: [] }
    const initialMeta = useMemo(() => ({ nombre: '', descripcion: '', tipo: 'Hipertrofia' }), [])
    const [meta, setMeta] = useState(initialMeta)

    const addExercise = useCallback(ejercicioId => {
        setDias(prev => prev.map((dia, index) => index === activeDay ? { ...dia, ejercicios: [...dia.ejercicios, createDefaultRoutineExercise(ejercicioId)] } : dia))
    }, [activeDay])

    const removeExercise = useCallback((dayIndex, exerciseIndex) => {
        setDias(prev => prev.map((dia, index) => index === dayIndex ? { ...dia, ejercicios: dia.ejercicios.filter((_, currentIndex) => currentIndex !== exerciseIndex) } : dia))
    }, [])

    const updateExercise = useCallback((dayIndex, exerciseIndex, field, value) => {
        setDias(prev => prev.map((dia, index) => {
            if (index !== dayIndex) return dia
            return {
                ...dia,
                ejercicios: dia.ejercicios.map((item, currentIndex) => {
                    if (currentIndex !== exerciseIndex) return item
                    const nextItem = { ...item, [field]: value }
                    if (field === 'goalMode') {
                        if (value === ROUTINE_GOAL_MODES.EXACT) nextItem.targetCustom = ''
                        if (value === ROUTINE_GOAL_MODES.RANGE) nextItem.targetCustom = ''
                        if (value === ROUTINE_GOAL_MODES.TIME) nextItem.targetCustom = ''
                    }
                    if (field === 'targetRepsMin' && nextItem.targetRepsMax < value) nextItem.targetRepsMax = value
                    return nextItem
                }),
            }
        }))
    }, [])

    const renameActiveDay = useCallback(value => setDias(prev => prev.map((dia, index) => index === activeDay ? { ...dia, dia: value } : dia)), [activeDay])
    const toggleAlumno = useCallback(alumnoId => setAsignaciones(prev => prev.includes(alumnoId) ? prev.filter(id => id !== alumnoId) : [...prev, alumnoId]), [])

    const addDay = useCallback(() => {
        let nextIndex = 0
        setDias(prev => {
            nextIndex = prev.length
            return [...prev, { dia: `Dia ${prev.length + 1} `, ejercicios: [] }]
        })
        setActiveDay(nextIndex)
    }, [])

    const removeDay = useCallback(dayIndex => {
        setDias(prev => {
            if (prev.length <= 1) return prev
            const next = prev.filter((_, index) => index !== dayIndex)
            setActiveDay(current => current > dayIndex ? current - 1 : Math.min(current, next.length - 1))
            return next
        })
    }, [])

    const handleSave = useCallback(() => {
        onSave({ nombre: meta.nombre.trim(), descripcion: meta.descripcion.trim(), tipo: meta.tipo, dias: dias.map((dia, index) => ({ ...dia, dia: dia.dia.trim() || `Dia ${index + 1} ` })), asignaciones })
    }, [asignaciones, dias, meta, onSave])

    const canSave = useMemo(() => Boolean(meta.nombre.trim()) && dias.some(dia => dia.ejercicios.length > 0), [meta.nombre, dias])

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal routine-builder-modal" onClick={event => event.stopPropagation()}>
                <div className="modal-header" style={{ flexShrink: 0 }}><h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Dumbbell size={20} /> Crear rutina</h3><button className="modal-close" onClick={onClose}><X size={18} /></button></div>
                <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <RoutineBuilderMeta onChange={setMeta} initialMeta={initialMeta} />
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>{dias.map((dia, index) => <div key={`${dia.dia} -${index} `} style={{ display: 'flex', alignItems: 'center', gap: 2 }}><button type="button" className={`chip ${activeDay === index ? 'active' : ''} `} onClick={() => setActiveDay(index)} style={{ fontSize: '0.78rem' }}>{dia.dia} ({dia.ejercicios.length})</button>{dias.length > 1 && <button type="button" className="btn btn-ghost" style={{ padding: '2px 4px', opacity: 0.6 }} onClick={() => removeDay(index)}><X size={11} /></button>}</div>)}<button type="button" className="btn btn-ghost btn-sm" onClick={addDay}><Plus size={14} /> Dia</button></div>
                    <div className="routine-builder-main-grid">
                        <div className="builder-library-col">
                            <ExerciseLibrary exercises={searchableExercises} muscleGroups={muscleGroups} onAdd={addExercise} onInfo={onInfoExercise} />
                        </div>
                        <div className="builder-editor-col">
                            <CurrentDayEditor currentDay={currentDay} activeDay={activeDay} exerciseMap={exerciseMap} onRenameDay={renameActiveDay} onRemoveExercise={removeExercise} onUpdateExercise={updateExercise} onInfo={onInfoExercise} />
                        </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14 }}><div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>Asignar a alumnos <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opcional)</span></div><StudentAssignSection alumnos={alumnos} asignaciones={asignaciones} toggleAlumno={toggleAlumno} /></div>
                </div>
                <div className="modal-footer" style={{ flexShrink: 0 }}><button className="btn btn-secondary" onClick={onClose}>Cancelar</button><button className="btn btn-primary" disabled={!canSave} onClick={handleSave}><CheckCircle2 size={16} /> Crear rutina</button></div>
            </div>
        </div>
    )
}

const RoutineBuilderMeta = memo(function RoutineBuilderMeta({ onChange, initialMeta }) {
    const [nombre, setNombre] = useState(initialMeta.nombre)
    const [descripcion, setDescripcion] = useState(initialMeta.descripcion)
    const [tipo, setTipo] = useState(initialMeta.tipo)

    useEffect(() => {
        onChange({ nombre, descripcion, tipo })
    }, [nombre, descripcion, tipo, onChange])

    return (
        <div className="routine-builder-meta-grid">
            <div className="input-group" style={{ marginBottom: 0 }}><label>Nombre de la rutina</label><input className="input-field" value={nombre} onChange={event => setNombre(event.target.value)} placeholder="Ej: Hipertrofia tren superior" /></div>
            <div className="input-group" style={{ marginBottom: 0 }}><label>Descripcion</label><input className="input-field" value={descripcion} onChange={event => setDescripcion(event.target.value)} placeholder="Breve descripcion" /></div>
            <div className="input-group" style={{ marginBottom: 0 }}><label>Tipo</label><select className="input-field" value={tipo} onChange={event => setTipo(event.target.value)}><option>Hipertrofia</option><option>Fuerza</option><option>Tonificacion</option><option>Funcional</option><option>Personalizada</option></select></div>
        </div>
    )
})

function AssignModal({ rutina, alumnos, onSave, onClose }) {
    const [selected, setSelected] = useState(rutina?.asignaciones || [])
    const [searchAlumno, setSearchAlumno] = useState('')
    const deferredSearch = useDeferredValue(searchAlumno.trim().toLowerCase())
    const selectedSet = useMemo(() => new Set(selected), [selected])

    const toggle = useCallback(alumnoId => setSelected(prev => prev.includes(alumnoId) ? prev.filter(id => id !== alumnoId) : [...prev, alumnoId]), [])
    const filteredAlumnos = useMemo(() => !deferredSearch ? alumnos : alumnos.filter(alumno => alumno.nombre.toLowerCase().includes(deferredSearch)), [alumnos, deferredSearch])

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={event => event.stopPropagation()}>
                <div className="modal-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><UserPlus size={20} /> Asignar rutina</h3><button className="modal-close" onClick={onClose}><X size={18} /></button></div>
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>Selecciona los alumnos que recibiran la rutina "<strong>{rutina?.nombre}</strong>".</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '8px 12px', marginBottom: 16 }}><Search size={16} style={{ color: 'var(--text-muted)' }} /><input value={searchAlumno} onChange={event => setSearchAlumno(event.target.value)} placeholder="Buscar alumno" style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontSize: '0.85rem', color: 'var(--text-primary)' }} /></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{filteredAlumnos.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Sin resultados</div> : filteredAlumnos.map(alumno => { const isSelected = selectedSet.has(alumno.id); return <div key={alumno.id} onClick={() => toggle(alumno.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: isSelected ? 'rgba(10,132,255,0.1)' : 'var(--bg-input)', border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'} `, borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.15s ease' }}><div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'} `, background: isSelected ? 'var(--accent-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{isSelected && <CheckCircle2 size={12} />}</div><div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>{alumno.avatar}</div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{alumno.nombre}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{alumno.plan} - {alumno.objetivo}</div></div></div> })}</div>
                </div>
                <div className="modal-footer"><button className="btn btn-secondary" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={() => onSave(selected)}>Asignar a {selected.length} alumno{selected.length !== 1 ? 's' : ''}</button></div>
            </div>
        </div>
    )
}
const ExerciseLibrary = memo(function ExerciseLibrary({ exercises, muscleGroups, onAdd, onInfo }) {
    const [filterGrupo, setFilterGrupo] = useState('Todos')
    const [searchEx, setSearchEx] = useState('')
    const deferredSearch = useDeferredValue(searchEx.trim().toLowerCase())
    const listRef = useRef(null)
    const [scrollTop, setScrollTop] = useState(0)
    const [viewportHeight, setViewportHeight] = useState(360)

    useEffect(() => {
        const node = listRef.current
        if (!node) return undefined
        const updateHeight = () => setViewportHeight(node.clientHeight || 360)
        updateHeight()
        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', updateHeight)
            return () => window.removeEventListener('resize', updateHeight)
        }
        const observer = new ResizeObserver(updateHeight)
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!listRef.current) return
        listRef.current.scrollTop = 0
        setScrollTop(0)
    }, [deferredSearch, filterGrupo])

    const filteredExercises = useMemo(() => exercises.filter(exercise => (filterGrupo === 'Todos' || exercise.grupo === filterGrupo) && (!deferredSearch || exercise.searchText.includes(deferredSearch))), [deferredSearch, exercises, filterGrupo])
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
    const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT) + (OVERSCAN * 2)
    const endIndex = Math.min(filteredExercises.length, startIndex + visibleCount)
    const visibleExercises = filteredExercises.slice(startIndex, endIndex)

    return (
        <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>Biblioteca de ejercicios <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.7rem' }}>({filteredExercises.length} resultados)</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '6px 10px', marginBottom: 8 }}><Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /><input value={searchEx} onChange={event => setSearchEx(event.target.value)} placeholder="Buscar ejercicio" style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontSize: '0.82rem', color: 'var(--text-primary)' }} />{searchEx && <button type="button" onClick={() => setSearchEx('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}><X size={13} /></button>}</div>
                <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>{muscleGroups.map(grupo => <button key={grupo} type="button" className={`chip ${filterGrupo === grupo ? 'active' : ''} `} style={{ fontSize: '0.65rem', padding: '3px 8px', flexShrink: 0 }} onClick={() => startTransition(() => setFilterGrupo(grupo))}>{grupo}</button>)}</div>
            </div>
            <div ref={listRef} style={{ flex: 1, overflowY: 'auto' }} onScroll={event => setScrollTop(event.currentTarget.scrollTop)}>{filteredExercises.length === 0 ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Sin resultados para "{searchEx}"</div> : <><div style={{ height: startIndex * ROW_HEIGHT }} />{visibleExercises.map(exercise => <ExerciseRow key={exercise.id} exercise={exercise} onAdd={onAdd} onInfo={onInfo} />)}<div style={{ height: Math.max(0, (filteredExercises.length - endIndex) * ROW_HEIGHT) }} /></>}</div>
        </div>
    )
})

const StudentAssignSection = memo(function StudentAssignSection({ alumnos, asignaciones, toggleAlumno }) {
    const [searchQuery, setSearchQuery] = useState('')
    const deferredSearch = useDeferredValue(searchQuery.trim().toLowerCase())
    const selectedSet = useMemo(() => new Set(asignaciones), [asignaciones])
    const filtered = useMemo(() => !deferredSearch ? alumnos : alumnos.filter(alumno => alumno.nombre.toLowerCase().includes(deferredSearch)), [alumnos, deferredSearch])

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 300, background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '4px 8px', marginBottom: 12 }}><Search size={13} style={{ color: 'var(--text-muted)' }} /><input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Buscar alumno" style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontSize: '0.75rem', color: 'var(--text-primary)' }} /></div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 80, overflowY: 'auto' }}>{filtered.length === 0 ? <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No se encontraron alumnos</span> : filtered.map(alumno => <button key={alumno.id} type="button" className={`chip ${selectedSet.has(alumno.id) ? 'active' : ''} `} style={{ fontSize: '0.75rem' }} onClick={() => toggleAlumno(alumno.id)}>{selectedSet.has(alumno.id) && <CheckCircle2 size={12} style={{ marginRight: 3 }} />}{alumno.avatar} {alumno.nombre.split(' ')[0]}</button>)}</div>
        </div>
    )
})
