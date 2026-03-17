import { useState, useMemo, useRef } from 'react'
import { useAppCatalog, useAppNutrition, useAppSession } from '../context/AppContext'
import {
    Plus, X, Search, Sparkles, Apple, Flame, Beef, Wheat, Droplets,
    ChevronLeft, ChevronRight, Camera, Upload, ImageIcon, ClipboardList, Trash2
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { analyzeFoodImageBase64, analyzeFoodText } from '../utils/aiScanner'
import { isSupabaseConfigured } from '../lib/supabase'
import { getLongDateLabel, getShortWeekdayLabel, getTodayISO, getWeekDates, shiftISODate } from '../utils/date'

const getFoodOriginLabel = (food) => {
    if (food?.origenLabel) return food.origenLabel
    if (food?.origen_label) return food.origen_label
    const rawSource = String(food?.source || food?.fuente || '').toLowerCase()
    return rawSource === 'community' || rawSource === 'comunidad'
        ? 'Subido por la comunidad'
        : 'Base del sistema'
}


const MAX_UPLOAD_PHOTO_WIDTH = 1280
const MAX_UPLOAD_PHOTO_HEIGHT = 1280
const COMPRESSED_PHOTO_QUALITY = 0.82

async function optimizeImageForAnalyzer(file) {
    const supportedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
    const inputType = supportedImageTypes.has(file.type) ? file.type : 'image/jpeg'

    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (event) => resolve(event.target?.result)
        reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
        reader.readAsDataURL(file)
    })

    const image = await new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('No se pudo procesar la imagen.'))
        img.src = String(dataUrl)
    })

    const width = image.width || 1
    const height = image.height || 1
    const ratio = Math.min(MAX_UPLOAD_PHOTO_WIDTH / width, MAX_UPLOAD_PHOTO_HEIGHT / height, 1)
    const targetWidth = Math.max(1, Math.round(width * ratio))
    const targetHeight = Math.max(1, Math.round(height * ratio))

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
        throw new Error('No se pudo preparar la imagen para analizar.')
    }

    ctx.drawImage(image, 0, 0, targetWidth, targetHeight)

    const compressedDataUrl = canvas.toDataURL(inputType, COMPRESSED_PHOTO_QUALITY)

    return {
        preview: compressedDataUrl,
        mimeType: inputType,
        base64: compressedDataUrl.split(',')[1] || '',
    }
}

export function MiNutricion() {
    const { currentAlumnoId } = useAppSession()
    const { getAlumnoNutricion, addFoodItem, removeFoodItem, editFoodItem, initializeNutritionDay, analyzeFood, planesNutricionales, addCustomFood } = useAppNutrition()
    const { foodDatabase, foodCategories } = useAppCatalog()
    const nutri = getAlumnoNutricion(currentAlumnoId)

    const assignedPlan = useMemo(() => {
        if (!nutri.planActivo) return null;
        const p = planesNutricionales.find(p => p.id === nutri.planActivo);
        // Fallback to unstructured text if the planActivo is simply text 
        return p || { isTextOnly: true, text: nutri.planActivo };
    }, [nutri.planActivo, planesNutricionales]);
    const [selectedDate, setSelectedDate] = useState(getTodayISO())
    const [showAddModal, setShowAddModal] = useState(null) // null or meal type string
    const [editingFood, setEditingFood] = useState(null) // { tipo, index, item }
    const [activeTab, setActiveTab] = useState('hoy')

    const registrosByFecha = useMemo(() => Object.fromEntries(nutri.registros.map(registro => [registro.fecha, registro])), [nutri.registros])

    // Virtual Registro logic: If no user log exists for today, but they have an assigned plan, fake a registro for display purposes
    const registro = useMemo(() => {
        const actual = registrosByFecha[selectedDate]
        if (actual) return actual

        if (assignedPlan && assignedPlan.comidas && !assignedPlan.isTextOnly) {
            return {
                fecha: selectedDate,
                comidas: assignedPlan.comidas // these have the items their trainer created
            }
        }
        return null
    }, [registrosByFecha, selectedDate, assignedPlan])

    const getScaledMacros = (item) => {
        if (!item) return { cal: 0, p: 0, c: 0, g: 0 }
        // Si no tiene peso, asumimos que ya vienió en absoluto (ej: AI o manual)
        if (!item.peso) return { cal: item.calorias || 0, p: item.proteinas || 0, c: item.carbos || 0, g: item.grasas || 0 }

        const isUnit = item.nombre ? (item.nombre.includes('unidad') || item.nombre.includes('cda') || item.nombre.includes('Scoop')) : false;
        const base = isUnit ? 1 : 100;
        const ratio = item.peso / base;

        // If the item has `base_calorias` we use that, otherwise if it came from the DB it has `calorias` for 100g. 
        // We ensure we don't double compound by trusting `base_calorias` when editing multiple times.
        const cals = item.base_calorias !== undefined ? item.base_calorias : item.calorias;
        const pros = item.base_proteinas !== undefined ? item.base_proteinas : item.proteinas;
        const carbs = item.base_carbos !== undefined ? item.base_carbos : item.carbos;
        const fats = item.base_grasas !== undefined ? item.base_grasas : item.grasas;

        return {
            cal: Math.round(cals * ratio) || 0,
            p: Math.round(pros * ratio) || 0,
            c: Math.round(carbs * ratio) || 0,
            g: Math.round(fats * ratio) || 0
        }
    }

    const totals = useMemo(() => {
        if (!registro) return { calorias: 0, proteinas: 0, carbos: 0, grasas: 0 }
        return registro.comidas.reduce((acc, c) => {
            c.items.forEach(i => {
                const scaled = getScaledMacros(i)
                acc.calorias += scaled.cal
                acc.proteinas += scaled.p
                acc.carbos += scaled.c
                acc.grasas += scaled.g
            })
            return acc
        }, { calorias: 0, proteinas: 0, carbos: 0, grasas: 0 })
    }, [registro])

    const calPercent = Math.min(100, Math.round((totals.calorias / nutri.metaDiaria.calorias) * 100))
    const protPercent = Math.min(100, Math.round((totals.proteinas / nutri.metaDiaria.proteinas) * 100))
    const carbPercent = Math.min(100, Math.round((totals.carbos / nutri.metaDiaria.carbos) * 100))
    const fatPercent = Math.min(100, Math.round((totals.grasas / nutri.metaDiaria.grasas) * 100))

    const calRemaining = Math.max(0, nutri.metaDiaria.calorias - totals.calorias)

    // Weekly chart data
    const weekData = useMemo(() => getWeekDates(selectedDate).map(date => {
        const weekRegistro = registrosByFecha[date]
        // Doesn't fallback to assignedPlan for historical weekly chart (unless specifically requested), keeping it real-world accurate
        const calorias = weekRegistro ? weekRegistro.comidas.reduce((sum, meal) => sum + meal.items.reduce((itemSum, item) => itemSum + getScaledMacros(item).cal, 0), 0) : 0
        return { dia: getShortWeekdayLabel(date), calorias, meta: nutri.metaDiaria.calorias }
    }), [nutri.metaDiaria.calorias, registrosByFecha, selectedDate])

    const mealTypes = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack']

    const changeDate = dir => {
        setSelectedDate(currentDate => shiftISODate(currentDate, dir))
    }

    const checkAndInitDay = () => {
        if (!registrosByFecha[selectedDate] && assignedPlan?.comidas) {
            initializeNutritionDay(currentAlumnoId, selectedDate, assignedPlan.comidas)
        }
    }

    const handleAddFood = (tipo, item) => {
        checkAndInitDay()
        addFoodItem(currentAlumnoId, selectedDate, tipo, item)
        setShowAddModal(null)
    }

    const handleRemoveFood = (tipo, index) => {
        checkAndInitDay()
        removeFoodItem(currentAlumnoId, selectedDate, tipo, index)
    }

    const handleEditFoodItem = (newMacros) => {
        if (!editingFood) return
        checkAndInitDay()
        editFoodItem(currentAlumnoId, selectedDate, editingFood.tipo, editingFood.index, newMacros)
        setEditingFood(null)
    }

    // SVG Ring Component
    const CalorieRing = ({ value, max, size = 160, strokeWidth = 12 }) => {
        const radius = (size - strokeWidth) / 2
        const circumference = 2 * Math.PI * radius
        const percent = Math.min(100, (value / max) * 100)
        const offset = circumference - (percent / 100) * circumference

        return (
            <div className="macro-ring" style={{ width: size, height: size }}>
                <svg viewBox={`0 0 ${size} ${size}`}>
                    <circle className="track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
                    <circle className="fill" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth}
                        stroke="url(#calGrad)"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset} />
                    <defs>
                        <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6c63ff" />
                            <stop offset="100%" stopColor="#00d4aa" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="macro-center">
                    <div className="value">{Math.round(calRemaining)}</div>
                    <div className="label">restantes</div>
                </div>
            </div>
        )
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h2>Mi <span className="gradient-text">Nutricion</span></h2>
                    <p className="page-subtitle">Registra tus comidas y segui tu progreso</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ maxWidth: 400, marginBottom: 24 }}>
                <button className={`tab ${activeTab === 'hoy' ? 'active' : ''}`} onClick={() => setActiveTab('hoy')}>Hoy</button>
                <button className={`tab ${activeTab === 'semanal' ? 'active' : ''}`} onClick={() => setActiveTab('semanal')}>Semanal</button>
                <button className={`tab ${activeTab === 'plan' ? 'active' : ''}`} onClick={() => setActiveTab('plan')}>Mi Plan</button>
            </div>

            {activeTab === 'hoy' && (
                <>
                    {/* Date Selector */}
                    <div className="flex-center" style={{ justifyContent: 'center', gap: 20, marginBottom: 24 }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => changeDate(-1)}><ChevronLeft size={20} /></button>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            {getLongDateLabel(selectedDate)}
                        </span>
                        <button className="btn btn-ghost btn-icon" onClick={() => changeDate(1)}><ChevronRight size={20} /></button>
                    </div>

                    {/* Macro Overview */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
                            <CalorieRing value={totals.calorias} max={nutri.metaDiaria.calorias} />

                            <div className="responsive-grid-2">
                                <MacroCard icon={<Flame size={18} />} label="Calorias" value={totals.calorias} max={nutri.metaDiaria.calorias} percent={calPercent} color="var(--accent-primary)" />
                                <MacroCard icon={<Beef size={18} />} label="Proteinas" value={`${Math.round(totals.proteinas)}g`} max={`${nutri.metaDiaria.proteinas}g`} percent={protPercent} color="var(--accent-secondary)" />
                                <MacroCard icon={<Wheat size={18} />} label="Carbos" value={`${Math.round(totals.carbos)}g`} max={`${nutri.metaDiaria.carbos}g`} percent={carbPercent} color="var(--accent-warning)" />
                                <MacroCard icon={<Droplets size={18} />} label="Grasas" value={`${Math.round(totals.grasas)}g`} max={`${nutri.metaDiaria.grasas}g`} percent={fatPercent} color="var(--accent-tertiary)" />
                            </div>
                        </div>
                    </div>

                    {/* Meals */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {mealTypes.map(tipo => {
                            const comida = registro?.comidas.find(c => c.tipo === tipo)
                            const mealCal = comida ? comida.items.reduce((s, i) => s + getScaledMacros(i).cal, 0) : 0
                            const icons = { Desayuno: 'AM', Almuerzo: 'AL', Merienda: 'ME', Cena: 'PM', Snack: 'SN' }

                            return (
                                <div key={tipo} className="meal-card" style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    backdropFilter: 'blur(10px)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                }}>
                                    <div className="flex-between" style={{ marginBottom: comida ? 12 : 0 }}>
                                        <div className="flex-center">
                                            <span style={{ fontSize: '1.2rem' }}>{icons[tipo]}</span>
                                            <div>
                                                <div className="meal-time" style={{ marginBottom: 0 }}>{tipo}</div>
                                                {mealCal > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{mealCal} cal</span>}
                                            </div>
                                        </div>
                                        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(tipo)}>
                                            <Plus size={14} /> Agregar
                                        </button>
                                    </div>

                                    {comida && (
                                        <div className="meal-items">
                                            {comida.items.map((item, ii) => {
                                                const sm = getScaledMacros(item);
                                                return (
                                                    <div key={ii} className="meal-item" style={{
                                                        display: 'flex', flexDirection: 'column', cursor: 'pointer',
                                                        background: 'rgba(255, 255, 255, 0.02)', padding: '12px',
                                                        borderRadius: 'var(--radius-md)', marginBottom: 8
                                                    }} onClick={() => setEditingFood({ tipo, index: ii, item })}>
                                                        <div className="flex-between" style={{ marginBottom: 6 }}>
                                                            <span className="meal-item-name" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.nombre}</span>
                                                            <button
                                                                className="btn btn-ghost btn-sm"
                                                                style={{ padding: '4px', color: 'var(--accent-danger)' }}
                                                                onClick={(e) => { e.stopPropagation(); handleRemoveFood(tipo, ii) }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="meal-item-macros" style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                            <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{sm.cal} kcal</span>
                                                            <span>P: {sm.p}g</span>
                                                            <span>C: {sm.c}g</span>
                                                            <span>G: {sm.g}g</span>
                                                            {item.peso && <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}>{item.peso}{item.nombre?.includes('unidad') || item.nombre?.includes('cda') || item.nombre?.includes('Scoop') ? 'u' : 'g'}</span>}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {activeTab === 'semanal' && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title"><Flame size={18} /> Calorias de la Semana</span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={weekData}>
                            <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: '#6b6b82', fontSize: 13 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b6b82', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                                formatter={(v) => [`${v} cal`, 'Calorias']}
                            />
                            <Bar dataKey="calorias" radius={[8, 8, 0, 0]}>
                                {weekData.map((entry, i) => (
                                    <Cell key={i} fill={entry.calorias >= entry.meta * 0.8 ? '#6c63ff' : 'rgba(108, 99, 255, 0.3)'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Meta diaria: {nutri.metaDiaria.calorias} cal - Las barras brillantes indican que alcanzaste el 80% o mas de tu meta</div>
                </div>
            )}

            {activeTab === 'plan' && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Plan asignado por tu entrenador</span>
                    </div>
                    <div style={{ padding: '0 24px 24px' }}>
                        {assignedPlan ? (
                            assignedPlan.isTextOnly ? (
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    {assignedPlan.text}
                                </div>
                            ) : (
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>{assignedPlan.nombre}</div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>{assignedPlan.descripcion}</p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {assignedPlan.comidas.map((meal, index) => (
                                            <div key={index} className="meal-card" style={{ padding: 16 }}>
                                                <div className="meal-time" style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 12 }}>{meal.tipo}</div>
                                                <div className="meal-items">
                                                    {meal.items.map((item, ii) => (
                                                        <div key={ii} className="meal-item" style={{ background: 'var(--bg-card)' }}>
                                                            <span className="meal-item-name">{item.nombre}</span>
                                                            <div className="meal-item-macros">
                                                                <span><span className="macro-dot cal" /> {item.calorias}</span>
                                                                <span><span className="macro-dot protein" /> {item.proteinas}g</span>
                                                                <span><span className="macro-dot carbs" /> {item.carbos}g</span>
                                                                <span><span className="macro-dot fat" /> {item.grasas}g</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="empty-state">
                                <ClipboardList />
                                <h3>Sin plan asignado</h3>
                                <p>Tu entrenador todavia no te ha escrito un plan alimenticio especifico.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {editingFood && (
                <EditFoodModal
                    food={editingFood.item}
                    onClose={() => setEditingFood(null)}
                    onSave={handleEditFoodItem}
                />
            )}

            {showAddModal && (
                <AddFoodModal
                    tipo={showAddModal}
                    foodDatabase={foodDatabase}
                    foodCategories={foodCategories}
                    analyzeFood={analyzeFood}
                    onAdd={(item) => handleAddFood(showAddModal, item)}
                    onSaveCustomFood={addCustomFood}
                    onClose={() => setShowAddModal(null)}
                />
            )}
        </div>
    )
}

function MacroCard({ icon, label, value, max, percent, color }) {
    return (
        <div style={{
            padding: '14px 18px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
            minWidth: 0
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color }}>
                {icon}
                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{label}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 2 }}>{value}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6 }}>de {max}</div>
            <div className="progress-bar" style={{ height: 5 }}>
                <div style={{ height: '100%', borderRadius: 'var(--radius-full)', width: `${percent}%`, background: color, transition: 'width 0.5s ease' }} />
            </div>
        </div>
    )
}

function AddFoodModal({ tipo, foodDatabase, foodCategories, analyzeFood, onAdd, onSaveCustomFood, onClose }) {
    const [mode, setMode] = useState('buscar') // buscar, foto, ai, manual
    const [search, setSearch] = useState('')
    const [filterCat, setFilterCat] = useState('Todos')
    const [aiText, setAiText] = useState('')
    const [aiResults, setAiResults] = useState([])
    const [manualForm, setManualForm] = useState({ nombre: '', calorias: '', proteinas: '', carbos: '', grasas: '', categoria: 'Personalizados' })
    const [selectedFood, setSelectedFood] = useState(null)
    const [weightInput, setWeightInput] = useState(100)
    const [analyzing, setAnalyzing] = useState(false)
    const [photoPreview, setPhotoPreview] = useState(null)
    const [photoPayload, setPhotoPayload] = useState(null)
    const [photoAnalyzed, setPhotoAnalyzed] = useState(false)
    const [analysisError, setAnalysisError] = useState('')
    const fileInputRef = useRef(null)

    const filteredFoods = useMemo(() => {
        return foodDatabase.filter(f => {
            const matchSearch = f.nombre.toLowerCase().includes(search.toLowerCase())
            const matchCat = filterCat === 'Todos' || f.categoria === filterCat
            return matchSearch && matchCat
        }).slice(0, 50) // High performance limiting for mobile smoothness
    }, [search, filterCat, foodDatabase])

    const handleAIAnalyze = async (text) => {
        const inputText = String(text || aiText || '').trim()
        if (!inputText) return

        setAnalysisError('')
        setAnalyzing(true)

        try {
            const results = isSupabaseConfigured
                ? await analyzeFoodText(inputText).catch(() => analyzeFood(inputText))
                : analyzeFood(inputText)

            setAiResults(results)
            setPhotoAnalyzed(true)
        } catch (error) {
            setAnalysisError(error.message || 'Error al analizar el texto.')
        } finally {
            setAnalyzing(false)
        }
    }

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setAnalysisError('')
        setPhotoAnalyzed(false)
        setAiResults([])

        try {
            const prepared = await optimizeImageForAnalyzer(file)
            setPhotoPreview(prepared.preview)
            setPhotoPayload({ base64: prepared.base64, mimeType: prepared.mimeType })
        } catch (error) {
            setPhotoPreview(null)
            setPhotoPayload(null)
            setAnalysisError(error?.message || 'No se pudo preparar la imagen para analizar.')
        }
    }

    const analyzePhoto = async () => {
        if (!photoPreview || !photoPayload?.base64) return
        setAnalysisError('')
        setAnalyzing(true)

        try {
            if (!isSupabaseConfigured) {
                throw new Error('Configura Supabase y la funcion nutrition-analyzer para analizar fotos.')
            }

            const resultados = await analyzeFoodImageBase64(photoPayload.base64, photoPayload.mimeType || 'image/jpeg')
            setAiResults(resultados)
            setPhotoAnalyzed(true)
        } catch (error) {
            setAnalysisError(error.message || 'Error al analizar la imagen con la IA.')
        } finally {
            setAnalyzing(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Agregar a {tipo}</h3>
                    <button onClick={onClose} style={{ position: 'absolute', right: 16, background: 'var(--bg-input)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={16} />
                    </button>
                </div>
                <div className="modal-body" style={{ padding: 0, maxHeight: 'min(75vh, calc(100dvh - 140px))', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    {selectedFood ? (
                        <div style={{ padding: '20px' }}>
                            <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16, padding: 0 }} onClick={() => setSelectedFood(null)}>
                                <ChevronLeft size={18} style={{ marginRight: 4 }} /> Volver
                            </button>
                            <div className="card" style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>{selectedFood.nombre}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--accent-secondary)', marginBottom: 8 }}>{getFoodOriginLabel(selectedFood)}</div>
                                <div style={{ display: 'flex', gap: 12, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{Math.round(selectedFood.calorias * (weightInput / (selectedFood.nombre.includes('unidad') || selectedFood.nombre.includes('cda') || selectedFood.nombre.includes('Scoop') ? 1 : 100)))} kcal</span>
                                    <span>P: {Math.round(selectedFood.proteinas * (weightInput / (selectedFood.nombre.includes('unidad') || selectedFood.nombre.includes('cda') || selectedFood.nombre.includes('Scoop') ? 1 : 100)))}g</span>
                                    <span>C: {Math.round(selectedFood.carbos * (weightInput / (selectedFood.nombre.includes('unidad') || selectedFood.nombre.includes('cda') || selectedFood.nombre.includes('Scoop') ? 1 : 100)))}g</span>
                                    <span>G: {Math.round(selectedFood.grasas * (weightInput / (selectedFood.nombre.includes('unidad') || selectedFood.nombre.includes('cda') || selectedFood.nombre.includes('Scoop') ? 1 : 100)))}g</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Cantidad ({selectedFood.nombre.includes('unidad') || selectedFood.nombre.includes('cda') || selectedFood.nombre.includes('Scoop') ? 'unidades/porciones' : 'gramos'})</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    style={{ fontSize: '1.2rem', padding: '12px 16px' }}
                                    value={weightInput}
                                    onChange={e => setWeightInput(Number(e.target.value))}
                                    min="1"
                                    autoFocus
                                />
                            </div>

                            <button className="btn btn-primary" style={{ width: '100%', padding: '14px 0', marginTop: 12 }} onClick={() => {
                                // Add base placeholders so future edits don't continuously compound errors
                                onAdd({
                                    ...selectedFood,
                                    peso: weightInput,
                                    base_calorias: selectedFood.base_calorias !== undefined ? selectedFood.base_calorias : selectedFood.calorias,
                                    base_proteinas: selectedFood.base_proteinas !== undefined ? selectedFood.base_proteinas : selectedFood.proteinas,
                                    base_carbos: selectedFood.base_carbos !== undefined ? selectedFood.base_carbos : selectedFood.carbos,
                                    base_grasas: selectedFood.base_grasas !== undefined ? selectedFood.base_grasas : selectedFood.grasas,
                                })
                                onClose()
                            }}>
                                <Plus size={18} style={{ marginRight: 8 }} /> Agregar a {tipo}
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Apple Segmented Control */}
                            <div style={{ padding: '16px 20px 12px' }}>
                                <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 8, padding: 3, width: '100%' }}>
                                    {['buscar', 'foto', 'ai', 'manual'].map(m => (
                                        <button key={m} onClick={() => { setMode(m); setAnalysisError('') }}
                                            style={{
                                                flex: 1, padding: '6px 0', fontSize: '0.82rem', fontWeight: mode === m ? 600 : 500,
                                                background: mode === m ? 'var(--bg-card)' : 'transparent',
                                                color: mode === m ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                borderRadius: 6, border: 'none',
                                                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                                transition: 'all 0.2s ease', textTransform: 'capitalize',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                                cursor: 'pointer'
                                            }}>
                                            {m === 'buscar' && <Search size={14} />}
                                            {m === 'foto' && <Camera size={14} />}
                                            {m === 'ai' && <Sparkles size={14} />}
                                            {m === 'buscar' ? 'Buscar' : m === 'foto' ? 'Escaner' : m === 'ai' ? 'Texto' : 'Manual'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {analysisError && (
                                <div style={{ padding: '0 20px 12px' }}>
                                    <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255, 69, 58, 0.12)', border: '1px solid rgba(255, 69, 58, 0.24)', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                                        {analysisError}
                                    </div>
                                </div>
                            )}

                            {mode === 'buscar' && (
                                <>
                                    {/* iOS Style Search Bar */}
                                    <div style={{ padding: '0 20px', marginBottom: 12 }}>
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
                                                placeholder="Buscar..."
                                                value={search}
                                                onChange={e => setSearch(e.target.value)}
                                                autoFocus
                                            />
                                            {search && (
                                                <button onClick={() => setSearch('')} style={{ background: 'var(--text-muted)', border: 'none', color: 'var(--bg-card)', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Horizontal Categories Filter */}
                                    <div style={{
                                        display: 'flex', overflowX: 'auto', gap: 8, padding: '0 20px 12px',
                                        scrollbarWidth: 'none', msOverflowStyle: 'none'
                                    }}>
                                        <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
                                        <div className="no-scrollbar" style={{ display: 'flex', gap: 8 }}>
                                            {['Todos', ...foodCategories].map(cat => (
                                                <button key={cat} onClick={() => setFilterCat(cat)}
                                                    style={{
                                                        padding: '6px 14px', borderRadius: 16, fontSize: '0.8rem', whiteSpace: 'nowrap',
                                                        border: 'none', fontWeight: 500, transition: 'all 0.2s', cursor: 'pointer',
                                                        background: filterCat === cat ? 'var(--text-primary)' : 'var(--bg-input)',
                                                        color: filterCat === cat ? 'var(--bg-card)' : 'var(--text-secondary)'
                                                    }}>
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Apple Flat List Style */}
                                    <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column' }}>
                                        {filteredFoods.map((f, i) => (
                                            <div key={i} onClick={() => {
                                                setSelectedFood(f)
                                                setWeightInput(f.nombre.includes('unidad') || f.nombre.includes('cda') || f.nombre.includes('Scoop') ? 1 : 100)
                                            }}
                                                style={{
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: '14px 0', cursor: 'pointer',
                                                    borderBottom: i === filteredFoods.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                                    transition: 'opacity 0.2s'
                                                }}
                                                onPointerDown={e => e.currentTarget.style.opacity = '0.5'}
                                                onPointerUp={e => e.currentTarget.style.opacity = '1'}
                                                onPointerLeave={e => e.currentTarget.style.opacity = '1'}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                                        {f.nombre}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 12, alignItems: 'center' }}>
                                                        <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{f.calorias} kcal</span>
                                                        <span>P: {f.proteinas}g</span>
                                                        <span>C: {f.carbos}g</span>
                                                        <span>G: {f.grasas}g</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-secondary)', marginTop: 4 }}>
                                                        {getFoodOriginLabel(f)}
                                                    </div>
                                                </div>
                                                <button style={{
                                                    background: 'var(--bg-input)', border: 'none', width: 28, height: 28,
                                                    borderRadius: '50%', color: 'var(--accent-primary)', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                                }}>
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {filteredFoods.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                                                <Search size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                                                <div style={{ fontSize: '0.9rem' }}>No se encontraron alimentos.</div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {mode === 'foto' && (
                                <div style={{ padding: '0 20px 20px' }}>
                                    <div style={{
                                        padding: 16, background: 'rgba(0, 212, 170, 0.08)', border: '1px solid rgba(0, 212, 170, 0.2)',
                                        borderRadius: 12, marginBottom: 16, fontSize: '0.85rem', color: 'var(--text-secondary)'
                                    }}>
                                        <Camera size={16} style={{ color: 'var(--accent-secondary)', verticalAlign: 'middle', marginRight: 6 }} />
                                        <strong>Foto de comida</strong> - Subi una foto y la IA identificara los macros y alimentos.</div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handlePhotoUpload}
                                        style={{ display: 'none' }}
                                    />

                                    {!photoPreview ? (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{
                                                border: '2px dashed rgba(108, 99, 255, 0.3)',
                                                borderRadius: 16, padding: '40px 20px',
                                                textAlign: 'center', cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                background: 'rgba(108, 99, 255, 0.04)',
                                            }}
                                            onPointerDown={e => { e.currentTarget.style.background = 'rgba(108, 99, 255, 0.08)' }}
                                            onPointerUp={e => { e.currentTarget.style.background = 'rgba(108, 99, 255, 0.04)' }}
                                            onPointerLeave={e => { e.currentTarget.style.background = 'rgba(108, 99, 255, 0.04)' }}
                                        >
                                            <Upload size={32} style={{ color: 'var(--accent-primary)', marginBottom: 12 }} />
                                            <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>Tomar o subir foto</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mantene la comida bien iluminada</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>La app optimiza automaticamente la foto antes de enviarla.</div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{
                                                borderRadius: 16, overflow: 'hidden',
                                                marginBottom: 16, position: 'relative',
                                                maxHeight: 200, display: 'flex', justifyContent: 'center',
                                                background: 'var(--bg-input)'
                                            }}>
                                                <img src={photoPreview} alt="Comida a analizar"
                                                    style={{ maxHeight: 200, objectFit: 'contain', borderRadius: 16 }} />
                                                <button style={{
                                                    position: 'absolute', top: 8, right: 8,
                                                    background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                                                    padding: 6, color: '#fff', cursor: 'pointer', display: 'flex'
                                                }} onClick={() => { setPhotoPreview(null); setPhotoPayload(null); setAiResults([]); setPhotoAnalyzed(false); setAnalysisError('') }}>
                                                    <X size={14} />
                                                </button>
                                            </div>

                                            {!photoAnalyzed && (
                                                <button className="btn btn-primary" onClick={analyzePhoto} disabled={analyzing}
                                                    style={{ width: '100%', justifyContent: 'center', marginBottom: 16, borderRadius: 12, padding: '14px 0' }}>
                                                    {analyzing ? (
                                                        <><Sparkles size={14} /> Procesando...</>
                                                    ) : (
                                                        <><Sparkles size={16} /> Analizar Foto con IA</>
                                                    )}
                                                </button>
                                            )}
                                            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

                                            {aiResults.length > 0 && (
                                                <div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-secondary)' }}>
                                                        Encontrados ({aiResults.length})
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        {aiResults.map((f, i) => (
                                                            <div key={i} onClick={() => {
                                                                setSelectedFood(f)
                                                                setWeightInput(f.nombre.includes('unidad') || f.nombre.includes('cda') || f.nombre.includes('Scoop') ? 1 : 100)
                                                            }}
                                                                style={{
                                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                                    padding: '14px 0', cursor: 'pointer',
                                                                    borderBottom: i === aiResults.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                                                    transition: 'opacity 0.2s'
                                                                }}
                                                                onPointerDown={e => e.currentTarget.style.opacity = '0.5'}
                                                                onPointerUp={e => e.currentTarget.style.opacity = '1'}
                                                                onPointerLeave={e => e.currentTarget.style.opacity = '1'}
                                                            >
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                                                        {f.nombre}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 12, alignItems: 'center' }}>
                                                                        <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{f.calorias} kcal</span>
                                                                        <span>P: {f.proteinas}g</span>
                                                                        <span>C: {f.carbos}g</span>
                                                                        <span>G: {f.grasas}g</span>
                                                                    </div>
                                                                </div>
                                                                <button style={{
                                                                    background: 'var(--bg-input)', border: 'none', width: 28, height: 28,
                                                                    borderRadius: '50%', color: 'var(--accent-primary)', display: 'flex',
                                                                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                                                }}>
                                                                    <Plus size={16} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {mode === 'ai' && (
                                <div style={{ padding: '0 20px 20px' }}>
                                    <div style={{
                                        padding: 16, background: 'rgba(108, 99, 255, 0.08)', border: '1px solid rgba(108, 99, 255, 0.2)',
                                        borderRadius: 12, marginBottom: 16, fontSize: '0.85rem', color: 'var(--text-secondary)'
                                    }}>
                                        <Sparkles size={16} style={{ color: 'var(--accent-primary)', verticalAlign: 'middle', marginRight: 6 }} />
                                        <strong>Texto Libre IA</strong> - Escribi que comiste y la IA va a dividirlo y estimar los macros exactos.</div>

                                    <div className="input-group" style={{ marginBottom: 16 }}>
                                        <textarea
                                            style={{
                                                width: '100%', background: 'var(--bg-input)', border: 'none',
                                                color: 'var(--text-primary)', padding: '12px 16px', borderRadius: 12,
                                                fontSize: '0.95rem', minHeight: 90, outline: 'none', resize: 'none'
                                            }}
                                            value={aiText} onChange={e => setAiText(e.target.value)}
                                            placeholder="Ej: Plato gigante de ravioles con tuco y abundante queso de rallar. Un vaso grande de coca sprite."
                                        />
                                    </div>

                                    <button className="btn btn-primary" onClick={() => handleAIAnalyze()} disabled={!aiText || analyzing}
                                        style={{ width: '100%', justifyContent: 'center', marginBottom: 20, borderRadius: 12, padding: '14px 0' }}>
                                        {analyzing ? (
                                            <><Sparkles size={14} /> Analizando...</>
                                        ) : (
                                            <><Sparkles size={16} /> Procesar texto libre</>
                                        )}
                                    </button>

                                    {aiResults.length > 0 && (
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-secondary)' }}>
                                                Extraidos automaticamente ({aiResults.length})
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                {aiResults.map((f, i) => (
                                                    <div key={i} onClick={() => { onAdd(f); setTimeout(() => onClose(), 200) }}
                                                        style={{
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                            padding: '14px 0', cursor: 'pointer',
                                                            borderBottom: i === aiResults.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                                            transition: 'opacity 0.2s'
                                                        }}
                                                        onPointerDown={e => e.currentTarget.style.opacity = '0.5'}
                                                        onPointerUp={e => e.currentTarget.style.opacity = '1'}
                                                        onPointerLeave={e => e.currentTarget.style.opacity = '1'}
                                                    >
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                                                {f.nombre}
                                                            </div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 12, alignItems: 'center' }}>
                                                                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{f.calorias} kcal</span>
                                                                <span>P: {f.proteinas}g</span>
                                                                <span>C: {f.carbos}g</span>
                                                                <span>G: {f.grasas}g</span>
                                                            </div>
                                                        </div>
                                                        <button style={{
                                                            background: 'var(--bg-input)', border: 'none', width: 28, height: 28,
                                                            borderRadius: '50%', color: 'var(--accent-primary)', display: 'flex',
                                                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                                        }}>
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {mode === 'manual' && (
                                <div style={{ padding: '0 20px 20px' }}>
                                    <div className="input-group">
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Metrica y Nombre del alimento</label>
                                        <input className="input-field" style={{ borderRadius: 10, padding: '12px 14px' }} value={manualForm.nombre} onChange={e => setManualForm(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Ej: Dos latas de atun" />
                                    </div>
                                    <div className="form-row" style={{ gap: 12, marginTop: 12 }}>
                                        <div className="input-group">
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Calorias (kcal)</label>
                                            <input className="input-field" type="number" style={{ borderRadius: 10, padding: '12px 14px' }} value={manualForm.calorias} onChange={e => setManualForm(prev => ({ ...prev, calorias: Number(e.target.value) }))} placeholder="0" />
                                        </div>
                                        <div className="input-group">
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Proteinas (g)</label>
                                            <input className="input-field" type="number" style={{ borderRadius: 10, padding: '12px 14px' }} value={manualForm.proteinas} onChange={e => setManualForm(prev => ({ ...prev, proteinas: Number(e.target.value) }))} placeholder="0" />
                                        </div>
                                    </div>
                                    <div className="form-row" style={{ gap: 12, marginTop: 12 }}>
                                        <div className="input-group">
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Carbohidratos (g)</label>
                                            <input className="input-field" type="number" style={{ borderRadius: 10, padding: '12px 14px' }} value={manualForm.carbos} onChange={e => setManualForm(prev => ({ ...prev, carbos: Number(e.target.value) }))} placeholder="0" />
                                        </div>
                                        <div className="input-group">
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Grasas (g)</label>
                                            <input className="input-field" type="number" style={{ borderRadius: 10, padding: '12px 14px' }} value={manualForm.grasas} onChange={e => setManualForm(prev => ({ ...prev, grasas: Number(e.target.value) }))} placeholder="0" />
                                        </div>
                                    </div>
                                    <div className="input-group" style={{ marginTop: 12, marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Categoria (opcional)</label>
                                        <input className="input-field" style={{ borderRadius: 10, padding: '12px 14px' }} value={manualForm.categoria} onChange={e => setManualForm(prev => ({ ...prev, categoria: e.target.value }))} placeholder="Personalizados" />
                                    </div>
                                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 12, borderRadius: 12, padding: '12px 0' }}
                                        onClick={() => {
                                            if (!manualForm.nombre || !manualForm.calorias) return
                                            onSaveCustomFood({
                                                nombre: manualForm.nombre,
                                                categoria: manualForm.categoria || 'Personalizados',
                                                calorias: Number(manualForm.calorias) || 0,
                                                proteinas: Number(manualForm.proteinas) || 0,
                                                carbos: Number(manualForm.carbos) || 0,
                                                grasas: Number(manualForm.grasas) || 0,
                                                source: 'community',
                                                fuente: 'comunidad',
                                                origenLabel: 'Subido por la comunidad',
                                            })
                                        }} disabled={!manualForm.nombre || !manualForm.calorias}>
                                        Guardar en mis alimentos
                                    </button>
                                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 12, borderRadius: 12, padding: '14px 0' }}
                                        onClick={() => {
                                            if (manualForm.nombre && manualForm.calorias) {
                                                const food = {
                                                    nombre: manualForm.nombre,
                                                    calorias: Number(manualForm.calorias),
                                                    proteinas: Number(manualForm.proteinas) || 0,
                                                    carbos: Number(manualForm.carbos) || 0,
                                                    grasas: Number(manualForm.grasas) || 0,
                                                    source: 'community',
                                                    fuente: 'comunidad',
                                                    origenLabel: 'Subido por la comunidad',
                                                    base_calorias: Number(manualForm.calorias),
                                                    base_proteinas: Number(manualForm.proteinas) || 0,
                                                    base_carbos: Number(manualForm.carbos) || 0,
                                                    base_grasas: Number(manualForm.grasas) || 0,
                                                }
                                                setSelectedFood(food)
                                                setWeightInput(100)
                                            }
                                        }} disabled={!manualForm.nombre || !manualForm.calorias}>
                                        Siguiente
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

function EditFoodModal({ food, onClose, onSave }) {
    const isUnit = food.nombre ? (food.nombre.includes('unidad') || food.nombre.includes('cda') || food.nombre.includes('Scoop')) : false;
    const base = isUnit ? 1 : 100;
    const [weight, setWeight] = useState(food.peso || base)

    // Calculate new macros dynamically taking into base considerations
    const cals = food.base_calorias !== undefined ? food.base_calorias : food.calorias;
    const pros = food.base_proteinas !== undefined ? food.base_proteinas : food.proteinas;
    const carbs = food.base_carbos !== undefined ? food.base_carbos : food.carbos;
    const fats = food.base_grasas !== undefined ? food.base_grasas : food.grasas;

    const ratio = weight / base
    const newCalorias = Math.round(cals * ratio) || 0
    const newProteinas = Math.round(pros * ratio) || 0
    const newCarbos = Math.round(carbs * ratio) || 0
    const newGrasas = Math.round(fats * ratio) || 0

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ height: 'auto', maxHeight: '90vh' }}>
                <div className="modal-header">
                    <h2>Editar Porcion</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>
                <div style={{ padding: '0 20px 20px' }}>
                    <div style={{ marginBottom: 20 }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: 4 }}>{food.nombre}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ajusta los gramos que consumiste para recalcular.</p>
                    </div>

                    <div className="input-group" style={{ marginBottom: 24 }}>
                        <label>Peso consumido (g)</label>
                        <input
                            className="input-field"
                            type="number"
                            value={weight || ''}
                            onChange={e => setWeight(Number(e.target.value))}
                            autoFocus
                        />
                    </div>

                    <div className="card" style={{ marginBottom: 24, padding: 16 }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>Nuevos Macros (Estimado)</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{newCalorias}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Kcal</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{newProteinas}g</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Prot</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{newCarbos}g</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Carb</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{newGrasas}g</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gras</div>
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '14px 0', justifyContent: 'center' }}
                        onClick={() => {
                            onSave({
                                peso: weightInput || weight,
                                calorias: newCalorias,
                                proteinas: newProteinas,
                                carbos: newCarbos,
                                grasas: newGrasas,
                                base_calorias: cals,
                                base_proteinas: pros,
                                base_carbos: carbs,
                                base_grasas: fats,
                            })
                        }}
                    >
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    )
}

export default MiNutricion

