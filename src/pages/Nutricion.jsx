import { useMemo, useState } from 'react'
import { Apple, ClipboardList, Eye, Target, Plus, Search, Edit2, Trash2, X } from 'lucide-react'
import { useAppAlumnos, useAppNutrition, useAppCatalog } from '../context/AppContext'
import { getTodayISO } from '../utils/date'

const getFoodOriginLabel = (food) => {
    if (food?.origenLabel) return food.origenLabel
    if (food?.origen_label) return food.origen_label
    const rawSource = String(food?.source || food?.fuente || '').toLowerCase()
    return rawSource === 'community' || rawSource === 'comunidad'
        ? 'Subido por la comunidad'
        : 'Base del sistema'
}

export default function Nutricion() {
    const { alumnos } = useAppAlumnos()
    const {
        getAlumnoNutricion, setNutritionGoals, setNutritionPlan,
        planesNutricionales, deletePlanNutricional, addPlanNutricional, updatePlanNutricional, addCustomFood
    } = useAppNutrition()
    const { foodDatabase, foodCategories } = useAppCatalog()

    const [activeTab, setActiveTab] = useState('control') // 'control' | 'planes'

    const [selectedAlumno, setSelectedAlumno] = useState(null)
    const [showGoals, setShowGoals] = useState(null)
    const [showPlan, setShowPlan] = useState(null)

    const [editingPlan, setEditingPlan] = useState(null)
    const [isCreating, setIsCreating] = useState(false)

    const todayISO = getTodayISO()

    const nutritionCards = useMemo(() => {
        return alumnos.map(alumno => {
            const nutri = getAlumnoNutricion(alumno.id)
            const todayRecord = nutri.registros.find(registro => registro.fecha === todayISO)
            const totalCal = todayRecord ? todayRecord.comidas.reduce((sum, meal) => sum + meal.items.reduce((itemSum, item) => itemSum + item.calorias, 0), 0) : 0
            const totalProt = todayRecord ? todayRecord.comidas.reduce((sum, meal) => sum + meal.items.reduce((itemSum, item) => itemSum + item.proteinas, 0), 0) : 0

            return {
                alumno,
                nutri,
                todayRecord,
                totalCal,
                totalProt,
                calPercent: Math.min(100, Math.round((totalCal / nutri.metaDiaria.calorias) * 100)),
                protPercent: Math.min(100, Math.round((totalProt / nutri.metaDiaria.proteinas) * 100)),
            }
        })
    }, [alumnos, getAlumnoNutricion, todayISO])

    const renderControlTab = () => (
        <div className="grid-auto">
            {nutritionCards.map(({ alumno, nutri, todayRecord, totalCal, totalProt, calPercent, protPercent }) => (
                <div key={alumno.id} className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div className="user-avatar" style={{ width: 40, height: 40 }}>{alumno.avatar}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{alumno.nombre}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{alumno.objetivo} • {alumno.peso}kg</div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedAlumno(selectedAlumno === alumno.id ? null : alumno.id)}><Eye size={15} /></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowPlan(alumno.id)}><ClipboardList size={15} /></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowGoals(alumno.id)}><Target size={15} /></button>
                        </div>
                    </div>

                    <ProgressRow label="Calorias" value={`${totalCal} / ${nutri.metaDiaria.calorias}`} percent={calPercent} />
                    <ProgressRow label="Proteinas" value={`${Math.round(totalProt)}g / ${nutri.metaDiaria.proteinas}g`} percent={protPercent} colorClass="green" />

                    {todayRecord ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)' }}>✓ {todayRecord.comidas.length} comidas registradas hoy</div>
                    ) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin registros hoy</div>
                    )}

                    {selectedAlumno === alumno.id && todayRecord && (
                        <div style={{ marginTop: 16, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                            {todayRecord.comidas.map((meal, index) => (
                                <div key={`${alumno.id}-${index}`} className="meal-card" style={{ padding: 12, marginBottom: 8 }}>
                                    <div className="meal-time">{meal.tipo}</div>
                                    <div className="meal-items">
                                        {meal.items.map((item, itemIndex) => (
                                            <div key={`${meal.tipo}-${itemIndex}`} className="meal-item" style={{ padding: '6px 10px' }}>
                                                <span className="meal-item-name" style={{ fontSize: '0.78rem' }}>{item.nombre}</span>
                                                <div className="meal-item-macros">
                                                    <span><span className="macro-dot cal" /> {item.calorias} cal</span>
                                                    <span><span className="macro-dot protein" /> {item.proteinas}g P</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )

    const renderPlanesTab = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="grid-auto">
                {planesNutricionales.map(plan => (
                    <div key={plan.id} className="card" style={{ padding: '18px 20px' }}>
                        <div className="flex-between" style={{ marginBottom: 12 }}>
                            <span className="badge badge-purple">{plan.comidas.length} comidas</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button className="btn btn-ghost btn-sm" title="Editar" onClick={() => setEditingPlan(plan)}><Edit2 size={15} /></button>
                                <button className="btn btn-ghost btn-sm" title="Eliminar" style={{ color: 'var(--accent-danger)' }} onClick={() => deletePlanNutricional(plan.id)}><Trash2 size={15} /></button>
                            </div>
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>{plan.nombre}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>{plan.descripcion}</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {plan.comidas.map((c, i) => (
                                <span key={i} className="badge" style={{ fontSize: '0.65rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{c.tipo} ({c.items.length})</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {planesNutricionales.length === 0 && (
                <div className="empty-state">No hay planes nutricionales creados.</div>
            )}
        </div>
    )

    return (
        <div className="page-container">
            <div className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
                <div className="flex-between" style={{ width: '100%' }}>
                    <div>
                        <h2>Control <span className="gradient-text">Nutricional</span></h2>
                        <p className="page-subtitle">Gestiona dietas y supervision</p>
                    </div>
                    {activeTab === 'planes' && (
                        <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
                            <Plus size={18} style={{ marginRight: 6 }} /> Crear Plan
                        </button>
                    )}
                </div>
                <div className="tabs" style={{ maxWidth: 400, marginBottom: 0 }}>
                    <button className={`tab ${activeTab === 'control' ? 'active' : ''}`} onClick={() => setActiveTab('control')}>Control Alumnos</button>
                    <button className={`tab ${activeTab === 'planes' ? 'active' : ''}`} onClick={() => setActiveTab('planes')}>Planes Nutricionales</button>
                </div>
            </div>

            {activeTab === 'control' ? renderControlTab() : renderPlanesTab()}

            {showGoals && (
                <GoalsModal
                    alumno={alumnos.find(alumno => alumno.id === showGoals)}
                    goals={getAlumnoNutricion(showGoals).metaDiaria}
                    onSave={goals => { setNutritionGoals(showGoals, goals); setShowGoals(null) }}
                    onClose={() => setShowGoals(null)}
                />
            )}

            {showPlan && (
                <PlanModal
                    alumno={alumnos.find(alumno => alumno.id === showPlan)}
                    planId={getAlumnoNutricion(showPlan).planActivo || ''}
                    planes={planesNutricionales}
                    onSave={planId => { setNutritionPlan(showPlan, planId); setShowPlan(null) }}
                    onClose={() => setShowPlan(null)}
                />
            )}

            {(isCreating || editingPlan) && (
                <PlanNutricionalBuilder
                    initialPlan={editingPlan}
                    foodDatabase={foodDatabase}
                    foodCategories={foodCategories}
                    addCustomFood={addCustomFood}
                    onSave={plan => {
                        if (editingPlan) updatePlanNutricional(editingPlan.id, plan)
                        else addPlanNutricional(plan)
                        setIsCreating(false)
                        setEditingPlan(null)
                    }}
                    onClose={() => {
                        setIsCreating(false)
                        setEditingPlan(null)
                    }}
                />
            )}
        </div>
    )
}

function ProgressRow({ label, value, percent, colorClass = '' }) {
    return (
        <div style={{ marginBottom: 12 }}>
            <div className="flex-between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{value}</span>
            </div>
            <div className="progress-bar">
                <div className={`progress-fill ${colorClass}`.trim()} style={{ width: `${percent}%` }} />
            </div>
        </div>
    )
}

function GoalsModal({ alumno, goals, onSave, onClose }) {
    const [form, setForm] = useState({ ...goals })
    const update = (key, value) => setForm(prev => ({ ...prev, [key]: Number(value) || 0 }))

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Metas Nutricionales - {alumno?.nombre}</h3>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <div className="form-row">
                        <div className="input-group"><label>Calorias diarias</label><input className="input-field" type="number" value={form.calorias} onChange={e => update('calorias', e.target.value)} /></div>
                        <div className="input-group"><label>Proteinas (g)</label><input className="input-field" type="number" value={form.proteinas} onChange={e => update('proteinas', e.target.value)} /></div>
                    </div>
                    <div className="form-row">
                        <div className="input-group"><label>Carbohidratos (g)</label><input className="input-field" type="number" value={form.carbos} onChange={e => update('carbos', e.target.value)} /></div>
                        <div className="input-group"><label>Grasas (g)</label><input className="input-field" type="number" value={form.grasas} onChange={e => update('grasas', e.target.value)} /></div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" onClick={() => onSave(form)}>Guardar Metas</button>
                </div>
            </div>
        </div>
    )
}

function PlanModal({ alumno, planId, planes, onSave, onClose }) {
    const [selected, setSelected] = useState(planId)

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Asignar Plan - {alumno?.nombre}</h3>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <div className="input-group">
                        <label>Seleccionar Plan Nutricional</label>
                        <select className="input-field" value={selected} onChange={e => setSelected(e.target.value)}>
                            <option value="">Ninguno (Libre)</option>
                            {planes.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>
                    {selected && planes.find(p => p.id === selected) && (
                        <div style={{ marginTop: 20, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{planes.find(p => p.id === selected)?.descripcion}</p>
                            {planes.find(p => p.id === selected)?.comidas.map((c, i) => (
                                <div key={i} style={{ marginBottom: 4 }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>{c.tipo}: </span>
                                    {c.items.map(it => it.nombre).join(', ')}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" onClick={() => onSave(selected)}>Guardar Asignacion</button>
                </div>
            </div>
        </div>
    )
}

function PlanNutricionalBuilder({ initialPlan, foodDatabase, foodCategories, addCustomFood, onSave, onClose }) {
    const [nombre, setNombre] = useState(initialPlan?.nombre || '')
    const [descripcion, setDescripcion] = useState(initialPlan?.descripcion || '')
    const [comidas, setComidas] = useState(initialPlan?.comidas || [
        { tipo: 'Desayuno', items: [] },
        { tipo: 'Almuerzo', items: [] },
        { tipo: 'Merienda', items: [] },
        { tipo: 'Cena', items: [] }
    ])

    const [activeMeal, setActiveMeal] = useState(0)
    const [search, setSearch] = useState('')
    const [filterCat, setFilterCat] = useState('Todos')

    const [newFood, setNewFood] = useState({ nombre: '', categoria: 'Personalizados', calorias: '', proteinas: '', carbos: '', grasas: '' })

    const createCustomFood = () => {
        const nombre = String(newFood.nombre || '').trim()
        if (!nombre) return

        const created = addCustomFood({
            nombre,
            categoria: newFood.categoria || 'Personalizados',
            calorias: Number(newFood.calorias) || 0,
            proteinas: Number(newFood.proteinas) || 0,
            carbos: Number(newFood.carbos) || 0,
            grasas: Number(newFood.grasas) || 0,
            source: 'community',
            fuente: 'comunidad',
            origenLabel: 'Subido por la comunidad',
        })

        if (created) {
            setSearch(created.nombre)
            setFilterCat(created.categoria || 'Todos')
            setNewFood({ nombre: '', categoria: 'Personalizados', calorias: '', proteinas: '', carbos: '', grasas: '' })
        }
    }

    const addMeal = () => {
        setComidas(prev => [...prev, { tipo: `Comida ${prev.length + 1}`, items: [] }])
        setActiveMeal(comidas.length)
    }

    const removeMeal = (index) => {
        setComidas(prev => {
            const next = prev.filter((_, i) => i !== index)
            setActiveMeal(Math.max(0, index - 1))
            return next
        })
    }

    const addItem = (food) => {
        // Assume default weight is 100 unless specified (or 1 for items like "unidad")
        const defaultWeight = food.nombre.includes('unidad') ? 1 : 100;
        setComidas(prev => prev.map((meal, i) => i === activeMeal ? { ...meal, items: [...meal.items, { ...food, peso: defaultWeight }] } : meal))
    }

    const updateItemWeight = (mealIndex, itemIndex, newWeight) => {
        setComidas(prev => prev.map((meal, i) => {
            if (i !== mealIndex) return meal;
            const newItems = [...meal.items];
            newItems[itemIndex] = { ...newItems[itemIndex], peso: Math.max(1, newWeight) };
            return { ...meal, items: newItems };
        }))
    }

    const removeItem = (mealIndex, itemIndex) => {
        setComidas(prev => prev.map((meal, i) => i === mealIndex ? { ...meal, items: meal.items.filter((_, j) => j !== itemIndex) } : meal))
    }

    const filteredFoods = useMemo(() => {
        const q = search.toLowerCase()
        return foodDatabase.filter(f => {
            const matchSearch = f.nombre.toLowerCase().includes(q)
            const matchCat = filterCat === 'Todos' || f.categoria === filterCat
            return matchSearch && matchCat
        }).slice(0, 50)
    }, [foodDatabase, search, filterCat])

    const canSave = Boolean(nombre.trim()) && comidas.some(c => c.items.length > 0)

    const totals = useMemo(() => {
        let cal = 0, p = 0, c = 0, g = 0
        comidas.forEach(meal => {
            meal.items.forEach(item => {
                const isUnit = item.nombre.includes('unidad') || item.nombre.includes('cda') || item.nombre.includes('Scoop');
                const ratio = (item.peso || 100) / (isUnit ? 1 : 100);
                cal += item.calorias * ratio
                p += item.proteinas * ratio
                c += item.carbos * ratio
                g += item.grasas * ratio
            })
        })
        return { cal: Math.round(cal), p: Math.round(p), c: Math.round(c), g: Math.round(g) }
    }, [comidas])

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal routine-builder-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ flexShrink: 0 }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Apple size={20} /> Crear Plan Nutricional</h3>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="routine-builder-meta-grid">
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>Nombre del plan</label>
                            <input className="input-field" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Definicion 2800 kcal" />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>Descripcion</label>
                            <input className="input-field" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Ej: Dieta alta en proteinas..." />
                        </div>
                    </div>

                    <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span><strong>Total Calorias:</strong> {totals.cal} kcal</span>
                        <span><strong>P:</strong> {totals.p}g</span>
                        <span><strong>C:</strong> {totals.c}g</span>
                        <span><strong>G:</strong> {totals.g}g</span>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {comidas.map((meal, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <button type="button" className={`chip ${activeMeal === index ? 'active' : ''}`} onClick={() => setActiveMeal(index)} style={{ fontSize: '0.78rem' }}>
                                    {meal.tipo} ({meal.items.length})
                                </button>
                                {comidas.length > 1 && <button type="button" className="btn btn-ghost" style={{ padding: '2px 4px', opacity: 0.6 }} onClick={() => removeMeal(index)}><X size={11} /></button>}
                            </div>
                        ))}
                        <button type="button" className="btn btn-ghost btn-sm" onClick={addMeal}><Plus size={14} /> Comida</button>
                    </div>

                    <div className="routine-builder-main-grid">
                        <div className="builder-library-col">
                            <div className="card" style={{ padding: 10, marginBottom: 10, border: '1px dashed var(--border-color)' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>Crear alimento personalizado</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 8, marginBottom: 8 }}>
                                    <input className="input-field" style={{ padding: '8px 10px', fontSize: '0.82rem' }} value={newFood.nombre} onChange={e => setNewFood(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Ej: Tarta de atún casera" />
                                    <input className="input-field" style={{ padding: '8px 10px', fontSize: '0.82rem' }} type="number" value={newFood.calorias} onChange={e => setNewFood(prev => ({ ...prev, calorias: e.target.value }))} placeholder="kcal" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
                                    <input className="input-field" style={{ padding: '8px 10px', fontSize: '0.8rem' }} type="number" value={newFood.proteinas} onChange={e => setNewFood(prev => ({ ...prev, proteinas: e.target.value }))} placeholder="P" />
                                    <input className="input-field" style={{ padding: '8px 10px', fontSize: '0.8rem' }} type="number" value={newFood.carbos} onChange={e => setNewFood(prev => ({ ...prev, carbos: e.target.value }))} placeholder="C" />
                                    <input className="input-field" style={{ padding: '8px 10px', fontSize: '0.8rem' }} type="number" value={newFood.grasas} onChange={e => setNewFood(prev => ({ ...prev, grasas: e.target.value }))} placeholder="G" />
                                    <input className="input-field" style={{ padding: '8px 10px', fontSize: '0.8rem' }} value={newFood.categoria} onChange={e => setNewFood(prev => ({ ...prev, categoria: e.target.value }))} placeholder="Categoria" />
                                </div>
                                <button type="button" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={createCustomFood} disabled={!String(newFood.nombre || '').trim()}>
                                    <Plus size={14} /> Guardar alimento
                                </button>
                            </div>
                            <div style={{ padding: '0 0px', marginBottom: 12, flexShrink: 0 }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', background: 'var(--bg-input)',
                                    borderRadius: 10, padding: '8px 12px', transition: 'all 0.2s'
                                }}>
                                    <Search size={16} style={{ color: 'var(--text-muted)', marginRight: 8 }} />
                                    <input
                                        style={{
                                            background: 'transparent', border: 'none', color: 'var(--text-primary)',
                                            width: '100%', fontSize: '0.95rem', outline: 'none'
                                        }}
                                        placeholder="Buscar alimentos..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                    {search && (
                                        <button onClick={() => setSearch('')} style={{ background: 'var(--text-muted)', border: 'none', color: 'var(--bg-card)', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, flexShrink: 0, marginBottom: 8 }} className="hide-scrollbar">
                                <button type="button" className={`chip ${filterCat === 'Todos' ? 'active' : ''}`} onClick={() => setFilterCat('Todos')}>Todos</button>
                                {foodCategories.map(cat => (
                                    <button key={cat} type="button" className={`chip ${filterCat === cat ? 'active' : ''}`} onClick={() => setFilterCat(cat)}>{cat}</button>
                                ))}
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 16 }}>
                                {filteredFoods.map(food => (
                                    <div key={food.id || food.nombre} className="card" style={{ padding: 10, cursor: 'pointer', transition: 'all 0.2s ease', border: '1px solid var(--border-color)', flexShrink: 0 }} onClick={() => addItem(food)}>
                                        <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 4 }}>{food.nombre}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{food.calorias} cal | P:{food.proteinas} C:{food.carbos} G:{food.grasas}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <span className="badge" style={{ fontSize: '0.6rem' }}>{food.categoria}</span>
                                                <span className="badge" style={{ fontSize: '0.6rem', background: 'rgba(123, 92, 255, 0.18)', color: 'var(--accent-primary)' }}>{getFoodOriginLabel(food)}</span>
                                            </div>
                                            <button className="btn btn-ghost btn-sm" style={{ padding: 0, color: 'var(--accent-primary)' }}><Plus size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="builder-editor-col">
                            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <input
                                    className="input-field"
                                    style={{ fontSize: '1.2rem', fontWeight: 600, padding: '4px 8px', background: 'transparent', border: '1px solid transparent', flex: 1 }}
                                    value={comidas[activeMeal]?.tipo || ''}
                                    onChange={e => setComidas(prev => prev.map((m, i) => i === activeMeal ? { ...m, tipo: e.target.value } : m))}
                                    placeholder="Nombre de la comida"
                                />
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>
                                {comidas[activeMeal]?.items.length === 0 ? (
                                    <div className="empty-state">No hay alimentos en esta comida. Busca a la izquierda y haz clic para agregar.</div>
                                ) : (
                                    comidas[activeMeal]?.items.map((item, index) => {
                                        const isUnit = item.nombre.includes('unidad') || item.nombre.includes('cda') || item.nombre.includes('Scoop');
                                        const ratio = (item.peso || 100) / (isUnit ? 1 : 100);
                                        const cal = Math.round(item.calorias * ratio);
                                        const prot = Math.round(item.proteinas * ratio);

                                        return (
                                            <div key={index} className="card flex-between" style={{ padding: 12, background: 'var(--bg-secondary)' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{item.nombre}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                                                        {cal} cal • {prot}g Prot
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <input
                                                            type="number"
                                                            className="input-field"
                                                            style={{ width: 80, padding: '4px 8px', fontSize: '0.8rem' }}
                                                            value={item.peso || 100}
                                                            onChange={e => updateItemWeight(activeMeal, index, Number(e.target.value))}
                                                            min="1"
                                                        />
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isUnit ? 'unidades' : 'gramos'}</span>
                                                    </div>
                                                </div>
                                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-danger)' }} onClick={() => removeItem(activeMeal, index)}><Trash2 size={16} /></button>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="modal-footer" style={{ flexShrink: 0 }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" disabled={!canSave} onClick={() => onSave({ nombre, descripcion, comidas })}>
                        Guardar Plan
                    </button>
                </div>
            </div>
        </div>
    )
}
