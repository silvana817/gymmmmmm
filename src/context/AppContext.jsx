import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { EXERCISES, MUSCLE_GROUPS } from '../data/exercises'
import { FOOD_DATABASE } from '../data/foods'
import { buildWorkoutSetKey, normalizeRoutine } from '../utils/routineSchema'
import { getTodayISO } from '../utils/date'
import { appConfig } from '../config/app'

const AppContext = createContext(null)
const SessionContext = createContext(null)
const CatalogContext = createContext(null)
const AlumnosContext = createContext(null)
const RutinasContext = createContext(null)
const PagosContext = createContext(null)
const NutricionContext = createContext(null)
const WorkoutLogsContext = createContext(null)

const DEFAULT_NUTRITION_META = { calorias: 2000, proteinas: 150, carbos: 250, grasas: 65 }
const createDefaultNutritionProfile = () => ({
    metaDiaria: { ...DEFAULT_NUTRITION_META },
    registros: [],
    planActivo: '',
})

const INITIAL_WORKOUT_LOGS = {}


/* ============ INITIAL STUDENTS ============ */
const INITIAL_ALUMNOS = [
    { id: 'a1', nombre: 'Martin Lopez', email: 'martin@mail.com', telefono: '11-2345-6789', plan: 'Musculacion', fechaInicio: '2025-11-01', estado: 'activo', avatar: 'ML', peso: 78, altura: 175, edad: 28, objetivo: 'Hipertrofia' },
    { id: 'a2', nombre: 'Lucia Fernandez', email: 'lucia@mail.com', telefono: '11-3456-7890', plan: 'Full', fechaInicio: '2025-09-15', estado: 'activo', avatar: 'LF', peso: 62, altura: 165, edad: 24, objetivo: 'Tonificacion' },
    { id: 'a3', nombre: 'Diego Ramirez', email: 'diego@mail.com', telefono: '11-4567-8901', plan: 'Musculacion', fechaInicio: '2026-01-10', estado: 'activo', avatar: 'DR', peso: 85, altura: 180, edad: 31, objetivo: 'Fuerza' },
    { id: 'a4', nombre: 'Valentina Torres', email: 'vale@mail.com', telefono: '11-5678-9012', plan: 'Funcional', fechaInicio: '2025-12-01', estado: 'activo', avatar: 'VT', peso: 58, altura: 160, edad: 22, objetivo: 'Bajar de peso' },
    { id: 'a5', nombre: 'Tomas Garcia', email: 'tomas@mail.com', telefono: '11-6789-0123', plan: 'Full', fechaInicio: '2026-02-01', estado: 'vencido', avatar: 'TG', peso: 92, altura: 185, edad: 35, objetivo: 'Hipertrofia' },
    { id: 'a6', nombre: 'Camila Rodriguez', email: 'cami@mail.com', telefono: '11-7890-1234', plan: 'Musculacion', fechaInicio: '2025-10-20', estado: 'activo', avatar: 'CR', peso: 55, altura: 158, edad: 26, objetivo: 'Tonificacion' },
]

/* ============ INITIAL ROUTINES ============ */
const INITIAL_RUTINAS = [
    {
        id: 'r1',
        nombre: 'Hipertrofia - Tren Superior',
        descripcion: 'Rutina de hipertrofia enfocada en pecho, espalda y brazos',
        tipo: 'Hipertrofia',
        creador: appConfig.trainerName,
        dias: [
            {
                dia: 'Dia 1 - Pecho y Triceps',
                ejercicios: [
                    { ejercicioId: 'ex1', series: 4, repeticiones: '10-12', descanso: '90s' },
                    { ejercicioId: 'ex5', series: 3, repeticiones: '12-15', descanso: '60s' },
                    { ejercicioId: 'ex7', series: 3, repeticiones: '8-10', descanso: '90s' },
                    { ejercicioId: 'ex55', series: 3, repeticiones: '12-15', descanso: '60s' },
                    { ejercicioId: 'ex58', series: 3, repeticiones: '10-12', descanso: '60s' },
                ]
            },
            {
                dia: 'Dia 2 - Espalda y Biceps',
                ejercicios: [
                    { ejercicioId: 'ex13', series: 4, repeticiones: '6-8', descanso: '120s' },
                    { ejercicioId: 'ex15', series: 4, repeticiones: '10-12', descanso: '90s' },
                    { ejercicioId: 'ex19', series: 3, repeticiones: '12-15', descanso: '60s' },
                    { ejercicioId: 'ex49', series: 3, repeticiones: '12-15', descanso: '60s' },
                    { ejercicioId: 'ex51', series: 3, repeticiones: '12-15', descanso: '60s' },
                ]
            },
            {
                dia: 'Dia 3 - Hombros y Core',
                ejercicios: [
                    { ejercicioId: 'ex39', series: 4, repeticiones: '8-10', descanso: '90s' },
                    { ejercicioId: 'ex42', series: 3, repeticiones: '15-20', descanso: '45s' },
                    { ejercicioId: 'ex44', series: 3, repeticiones: '15-20', descanso: '45s' },
                    { ejercicioId: 'ex45', series: 3, repeticiones: '15-20', descanso: '45s' },
                    { ejercicioId: 'ex63', series: 3, repeticiones: '45-60s', descanso: '30s' },
                    { ejercicioId: 'ex67', series: 3, repeticiones: '12-15', descanso: '60s' },
                ]
            },
        ],
        asignaciones: ['a1', 'a3']
    },
    {
        id: 'r2',
        nombre: 'Tonificacion Completa',
        descripcion: 'Rutina de cuerpo completo para definir',
        tipo: 'Tonificacion',
        creador: appConfig.trainerName,
        dias: [
            {
                dia: 'Dia 1 - Full Body A',
                ejercicios: [
                    { ejercicioId: 'ex25', series: 4, repeticiones: '12-15', descanso: '60s' },
                    { ejercicioId: 'ex1', series: 3, repeticiones: '12-15', descanso: '60s' },
                    { ejercicioId: 'ex15', series: 3, repeticiones: '12-15', descanso: '60s' },
                    { ejercicioId: 'ex42', series: 3, repeticiones: '15-20', descanso: '45s' },
                    { ejercicioId: 'ex63', series: 3, repeticiones: '30-45s', descanso: '30s' },
                ]
            },
            {
                dia: 'Dia 2 - Full Body B',
                ejercicios: [
                    { ejercicioId: 'ex73', series: 4, repeticiones: '12-15', descanso: '60s' },
                    { ejercicioId: 'ex33', series: 3, repeticiones: '12/lado', descanso: '60s' },
                    { ejercicioId: 'ex39', series: 3, repeticiones: '12-15', descanso: '60s' },
                    { ejercicioId: 'ex45', series: 3, repeticiones: '15-20', descanso: '45s' },
                    { ejercicioId: 'ex65', series: 3, repeticiones: '20', descanso: '30s' },
                ]
            },
            {
                dia: 'Dia 3 - Full Body C',
                ejercicios: [
                    { ejercicioId: 'ex20', series: 3, repeticiones: '10', descanso: '90s' },
                    { ejercicioId: 'ex4', series: 3, repeticiones: '12-15', descanso: '60s' },
                    { ejercicioId: 'ex30', series: 3, repeticiones: '15', descanso: '60s' },
                    { ejercicioId: 'ex31', series: 3, repeticiones: '15', descanso: '60s' },
                    { ejercicioId: 'ex68', series: 3, repeticiones: '20/lado', descanso: '30s' },
                ]
            }
        ],
        asignaciones: ['a2', 'a6']
    },
    {
        id: 'r3',
        nombre: 'Fuerza Base',
        descripcion: 'Programa de fuerza 5x5 con progresion lineal',
        tipo: 'Fuerza',
        creador: appConfig.trainerName,
        dias: [
            {
                dia: 'Dia A',
                ejercicios: [
                    { ejercicioId: 'ex25', series: 5, repeticiones: '5', descanso: '180s' },
                    { ejercicioId: 'ex1', series: 5, repeticiones: '5', descanso: '180s' },
                    { ejercicioId: 'ex15', series: 5, repeticiones: '5', descanso: '180s' },
                ]
            },
            {
                dia: 'Dia B',
                ejercicios: [
                    { ejercicioId: 'ex25', series: 5, repeticiones: '5', descanso: '180s' },
                    { ejercicioId: 'ex39', series: 5, repeticiones: '5', descanso: '180s' },
                    { ejercicioId: 'ex20', series: 1, repeticiones: '5', descanso: '300s' },
                ]
            }
        ],
        asignaciones: ['a3']
    },
]

/* ============ INITIAL PAYMENTS ============ */
const INITIAL_PAGOS = [
    { id: 'p1', alumnoId: 'a1', monto: 15000, fecha: '2026-03-01', mes: 'Marzo 2026', metodo: 'Transferencia', estado: 'pagado' },
    { id: 'p2', alumnoId: 'a2', monto: 20000, fecha: '2026-03-02', mes: 'Marzo 2026', metodo: 'Efectivo', estado: 'pagado' },
    { id: 'p3', alumnoId: 'a3', monto: 15000, fecha: '2026-03-05', mes: 'Marzo 2026', metodo: 'MercadoPago', estado: 'pagado' },
    { id: 'p4', alumnoId: 'a4', monto: 18000, fecha: '2026-02-28', mes: 'Marzo 2026', metodo: 'Transferencia', estado: 'pendiente' },
    { id: 'p5', alumnoId: 'a5', monto: 20000, fecha: '2026-02-15', mes: 'Febrero 2026', metodo: 'Efectivo', estado: 'vencido' },
    { id: 'p6', alumnoId: 'a6', monto: 15000, fecha: '2026-03-04', mes: 'Marzo 2026', metodo: 'MercadoPago', estado: 'pagado' },
    { id: 'p7', alumnoId: 'a1', monto: 15000, fecha: '2026-02-01', mes: 'Febrero 2026', metodo: 'Transferencia', estado: 'pagado' },
    { id: 'p8', alumnoId: 'a2', monto: 20000, fecha: '2026-02-03', mes: 'Febrero 2026', metodo: 'Efectivo', estado: 'pagado' },
]

/* ============ INITIAL NUTRITION ============ */
const INITIAL_NUTRICION = {
    a1: {
        metaDiaria: { calorias: 2800, proteinas: 180, carbos: 320, grasas: 80 },
        planActivo: 'plan1',
        registros: [
            {
                fecha: '2026-03-07',
                comidas: [
                    {
                        tipo: 'Desayuno', items: [
                            { nombre: 'Avena con leche', calorias: 350, proteinas: 15, carbos: 55, grasas: 8 },
                            { nombre: 'Banana', calorias: 105, proteinas: 1.3, carbos: 27, grasas: 0.4 },
                            { nombre: 'Whey Protein', calorias: 120, proteinas: 24, carbos: 3, grasas: 1.5 },
                        ]
                    },
                    {
                        tipo: 'Almuerzo', items: [
                            { nombre: 'Pechuga de pollo 200g', calorias: 330, proteinas: 62, carbos: 0, grasas: 7 },
                            { nombre: 'Arroz integral 150g', calorias: 170, proteinas: 4, carbos: 36, grasas: 1.5 },
                            { nombre: 'Ensalada mixta', calorias: 45, proteinas: 2, carbos: 8, grasas: 0.5 },
                        ]
                    },
                    {
                        tipo: 'Merienda', items: [
                            { nombre: 'Yogur griego', calorias: 130, proteinas: 15, carbos: 6, grasas: 5 },
                            { nombre: 'Almendras 30g', calorias: 175, proteinas: 6, carbos: 6, grasas: 15 },
                        ]
                    },
                    {
                        tipo: 'Cena', items: [
                            { nombre: 'Salmon 200g', calorias: 412, proteinas: 40, carbos: 0, grasas: 27 },
                            { nombre: 'Papa al horno 200g', calorias: 186, proteinas: 4, carbos: 42, grasas: 0.2 },
                            { nombre: 'Brocoli 150g', calorias: 51, proteinas: 4, carbos: 10, grasas: 0.5 },
                        ]
                    },
                ]
            },
            {
                fecha: '2026-03-06',
                comidas: [
                    {
                        tipo: 'Desayuno', items: [
                            { nombre: 'Tostadas integrales x3', calorias: 210, proteinas: 9, carbos: 36, grasas: 3 },
                            { nombre: 'Huevos revueltos x3', calorias: 270, proteinas: 18, carbos: 3, grasas: 21 },
                        ]
                    },
                    {
                        tipo: 'Almuerzo', items: [
                            { nombre: 'Carne vacuna magra 200g', calorias: 360, proteinas: 52, carbos: 0, grasas: 16 },
                            { nombre: 'Fideos integrales 120g', calorias: 420, proteinas: 15, carbos: 80, grasas: 3 },
                        ]
                    },
                    {
                        tipo: 'Merienda', items: [
                            { nombre: 'Batido de proteinas', calorias: 200, proteinas: 30, carbos: 12, grasas: 3 },
                        ]
                    },
                    {
                        tipo: 'Cena', items: [
                            { nombre: 'Ensalada Cesar con pollo', calorias: 420, proteinas: 35, carbos: 15, grasas: 25 },
                        ]
                    },
                ]
            }
        ]
    },
    a2: {
        metaDiaria: { calorias: 1800, proteinas: 120, carbos: 200, grasas: 55 },
        planActivo: 'plan2',
        registros: [
            {
                fecha: '2026-03-07',
                comidas: [
                    {
                        tipo: 'Desayuno', items: [
                            { nombre: 'Yogur con granola', calorias: 250, proteinas: 10, carbos: 35, grasas: 8 },
                            { nombre: 'Cafe con leche', calorias: 60, proteinas: 3, carbos: 5, grasas: 3 },
                        ]
                    },
                    {
                        tipo: 'Almuerzo', items: [
                            { nombre: 'Bowl de quinoa con verduras', calorias: 380, proteinas: 14, carbos: 55, grasas: 12 },
                        ]
                    },
                    {
                        tipo: 'Merienda', items: [
                            { nombre: 'Manzana', calorias: 95, proteinas: 0.5, carbos: 25, grasas: 0.3 },
                        ]
                    },
                    {
                        tipo: 'Cena', items: [
                            { nombre: 'Merluza al horno 180g', calorias: 180, proteinas: 36, carbos: 0, grasas: 3 },
                            { nombre: 'Ensalada de rucula', calorias: 35, proteinas: 2, carbos: 4, grasas: 1 },
                        ]
                    },
                ]
            }
        ]
    }
}


/* ============ INITIAL NUTRITION PLANS ============ */
const INITIAL_PLANES_NUTRICIONALES = [
    {
        id: 'plan1',
        nombre: 'Volumen Limpio',
        descripcion: 'Plan alto en carbos complejos',
        comidas: [
            { tipo: 'Desayuno', items: [{ nombre: 'Avena con leche', calorias: 350, proteinas: 15, carbos: 55, grasas: 8 }, { nombre: 'Whey Protein', calorias: 120, proteinas: 24, carbos: 3, grasas: 1.5 }] },
            { tipo: 'Almuerzo', items: [{ nombre: 'Pechuga de pollo 200g', calorias: 330, proteinas: 62, carbos: 0, grasas: 7 }, { nombre: 'Arroz integral 150g', calorias: 170, proteinas: 4, carbos: 36, grasas: 1.5 }] },
            { tipo: 'Cena', items: [{ nombre: 'Salmon 200g', calorias: 412, proteinas: 40, carbos: 0, grasas: 27 }, { nombre: 'Papa al horno 200g', calorias: 186, proteinas: 4, carbos: 42, grasas: 0.2 }] }
        ]
    },
    {
        id: 'plan2',
        nombre: 'Definicion Estricta',
        descripcion: 'Plan bajo en carbos, alto en proteina',
        comidas: [
            { tipo: 'Desayuno', items: [{ nombre: 'Huevos revueltos x3', calorias: 270, proteinas: 18, carbos: 3, grasas: 21 }] },
            { tipo: 'Almuerzo', items: [{ nombre: 'Pechuga de pollo 200g', calorias: 330, proteinas: 62, carbos: 0, grasas: 7 }, { nombre: 'Ensalada mixta', calorias: 45, proteinas: 2, carbos: 8, grasas: 0.5 }] },
            { tipo: 'Cena', items: [{ nombre: 'Merluza al horno 180g', calorias: 180, proteinas: 36, carbos: 0, grasas: 3 }, { nombre: 'Ensalada de rucula', calorias: 35, proteinas: 2, carbos: 4, grasas: 1 }] }
        ]
    }
]

/* ============ AI NUTRITION ANALYSIS (fallback estimator) ============ */
function analyzeNutritionAI(description) {
    // Fallback text estimator used when Gemini is not configured
    const keywords = description.toLowerCase()
    const items = []

    const foodMappings = [
        { keys: ['pollo', 'pechuga'], food: { nombre: 'Pechuga de pollo', calorias: 165, proteinas: 31, carbos: 0, grasas: 3.6 } },
        { keys: ['arroz'], food: { nombre: 'Arroz', calorias: 200, proteinas: 4, carbos: 44, grasas: 0.5 } },
        { keys: ['huevo', 'huevos'], food: { nombre: 'Huevos', calorias: 156, proteinas: 12, carbos: 1.2, grasas: 10 } },
        { keys: ['banana', 'bananas'], food: { nombre: 'Banana', calorias: 105, proteinas: 1.3, carbos: 27, grasas: 0.4 } },
        { keys: ['ensalada'], food: { nombre: 'Ensalada', calorias: 50, proteinas: 2, carbos: 8, grasas: 1 } },
        { keys: ['avena'], food: { nombre: 'Avena', calorias: 152, proteinas: 5.3, carbos: 27, grasas: 2.7 } },
        { keys: ['pan', 'tostada'], food: { nombre: 'Pan integral', calorias: 140, proteinas: 6, carbos: 24, grasas: 2 } },
        { keys: ['carne', 'bife', 'asado'], food: { nombre: 'Carne vacuna', calorias: 250, proteinas: 26, carbos: 0, grasas: 16 } },
        { keys: ['pasta', 'fideos'], food: { nombre: 'Pasta', calorias: 220, proteinas: 8, carbos: 43, grasas: 1.3 } },
        { keys: ['yogur', 'yogurt'], food: { nombre: 'Yogur', calorias: 130, proteinas: 15, carbos: 6, grasas: 5 } },
        { keys: ['leche'], food: { nombre: 'Leche', calorias: 90, proteinas: 8, carbos: 12, grasas: 0.5 } },
        { keys: ['cafe', 'cafe'], food: { nombre: 'Cafe con leche', calorias: 60, proteinas: 3, carbos: 5, grasas: 3 } },
        { keys: ['salmon', 'salmon'], food: { nombre: 'Salmon', calorias: 206, proteinas: 20, carbos: 0, grasas: 13 } },
        { keys: ['papa', 'papas', 'patata'], food: { nombre: 'Papa', calorias: 186, proteinas: 4, carbos: 42, grasas: 0.2 } },
        { keys: ['milanesa'], food: { nombre: 'Milanesa de pollo', calorias: 280, proteinas: 28, carbos: 12, grasas: 14 } },
        { keys: ['empanada', 'empanadas'], food: { nombre: 'Empanadas x3', calorias: 600, proteinas: 24, carbos: 54, grasas: 30 } },
        { keys: ['protein', 'proteina', 'batido'], food: { nombre: 'Batido proteinas', calorias: 200, proteinas: 30, carbos: 12, grasas: 3 } },
    ]

    for (const mapping of foodMappings) {
        if (mapping.keys.some(k => keywords.includes(k))) {
            items.push({ ...mapping.food })
        }
    }

    if (items.length === 0) {
        // Generic meal estimation
        items.push({ nombre: description, calorias: 350, proteinas: 20, carbos: 35, grasas: 12 })
    }

    return items
}

/* ============ INITIAL EXERCISE OVERRIDES ============ */
const INITIAL_EXERCISE_DESCRIPTIONS = {
    // Example: 'ex1': 'Empuja fuerte y rapido'
}

function sanitizeRole(role) {
    return role === 'alumno' ? 'alumno' : 'entrenador'
}

function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function canUseStorage() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function deepClone(value) {
    if (typeof structuredClone === 'function') {
        return structuredClone(value)
    }

    return JSON.parse(JSON.stringify(value))
}

function createEntityId(prefix) {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
        return `${prefix}-${globalThis.crypto.randomUUID()}`
    }

    if (typeof globalThis.crypto?.getRandomValues === 'function') {
        const randomValues = globalThis.crypto.getRandomValues(new Uint8Array(12))
        const token = Array.from(randomValues, value => value.toString(16).padStart(2, '0')).join('')
        return `${prefix}-${token}`
    }

    return `${prefix}-${Math.random().toString(36).slice(2, 14)}`
}

function buildInitials(value, fallback = 'NA') {
    const initials = String(value || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(segment => segment[0]?.toUpperCase() || '')
        .join('')

    return initials || fallback
}

function createEmptyAppState() {
    return {
        role: 'entrenador',
        currentAlumnoId: '',
        alumnos: [],
        rutinas: [],
        pagos: [],
        nutricion: {},
        planesNutricionales: [],
        customFoods: [],
        customExerciseDescriptions: {},
        workoutLogs: {},
    }
}

function createBaseAppState() {
    if (!appConfig.enableDemoData) {
        return createEmptyAppState()
    }

    return {
        role: 'entrenador',
        currentAlumnoId: INITIAL_ALUMNOS[0]?.id || '',
        alumnos: deepClone(INITIAL_ALUMNOS),
        rutinas: INITIAL_RUTINAS.map(rutina => normalizeRoutine(deepClone(rutina))),
        pagos: deepClone(INITIAL_PAGOS),
        nutricion: deepClone(INITIAL_NUTRICION),
        planesNutricionales: deepClone(INITIAL_PLANES_NUTRICIONALES),
        customFoods: [],
        customExerciseDescriptions: deepClone(INITIAL_EXERCISE_DESCRIPTIONS),
        workoutLogs: deepClone(INITIAL_WORKOUT_LOGS),
    }
}

function sanitizeCurrentAlumnoId(alumnos, currentAlumnoId) {
    return alumnos.some(alumno => alumno.id === currentAlumnoId)
        ? currentAlumnoId
        : (alumnos[0]?.id || '')
}

function normalizeAppState(rawState) {
    const baseState = createBaseAppState()

    if (!isRecord(rawState)) {
        return baseState
    }

    const alumnos = Array.isArray(rawState.alumnos) ? rawState.alumnos : baseState.alumnos

    return {
        role: sanitizeRole(rawState.role ?? baseState.role),
        currentAlumnoId: sanitizeCurrentAlumnoId(alumnos, rawState.currentAlumnoId ?? baseState.currentAlumnoId),
        alumnos,
        rutinas: Array.isArray(rawState.rutinas)
            ? rawState.rutinas.map(rutina => normalizeRoutine(rutina))
            : baseState.rutinas,
        pagos: Array.isArray(rawState.pagos) ? rawState.pagos : baseState.pagos,
        nutricion: isRecord(rawState.nutricion) ? rawState.nutricion : baseState.nutricion,
        planesNutricionales: Array.isArray(rawState.planesNutricionales)
            ? rawState.planesNutricionales
            : baseState.planesNutricionales,
        customFoods: Array.isArray(rawState.customFoods) ? rawState.customFoods : baseState.customFoods,
        customExerciseDescriptions: isRecord(rawState.customExerciseDescriptions)
            ? rawState.customExerciseDescriptions
            : baseState.customExerciseDescriptions,
        workoutLogs: isRecord(rawState.workoutLogs) ? rawState.workoutLogs : baseState.workoutLogs,
    }
}

function readPersistedAppState() {
    const baseState = createBaseAppState()

    if (!canUseStorage()) {
        return baseState
    }

    try {
        const rawValue = window.localStorage.getItem(appConfig.stateStorageKey)
        return rawValue ? normalizeAppState(JSON.parse(rawValue)) : baseState
    } catch {
        return baseState
    }
}

function writePersistedAppState(state) {
    if (!canUseStorage()) {
        return
    }

    try {
        window.localStorage.setItem(appConfig.stateStorageKey, JSON.stringify(state))
    } catch {
        // Ignore storage quota and privacy mode errors.
    }
}

/* ============ PROVIDER ============ */
export function AppProvider({ children }) {
    const initialStateRef = useRef(null)
    if (initialStateRef.current === null) {
        initialStateRef.current = readPersistedAppState()
    }

    const initialState = initialStateRef.current
    const [roleState, setRoleState] = useState(initialState.role)
    const [currentAlumnoIdState, setCurrentAlumnoIdState] = useState(initialState.currentAlumnoId)
    const [alumnos, setAlumnos] = useState(initialState.alumnos)
    const [rutinas, setRutinas] = useState(initialState.rutinas)
    const [pagos, setPagos] = useState(initialState.pagos)
    const [nutricion, setNutricion] = useState(initialState.nutricion)
    const [planesNutricionales, setPlanesNutricionales] = useState(initialState.planesNutricionales)
    const [customFoods, setCustomFoods] = useState(initialState.customFoods)
    const [customExerciseDescriptions, setCustomExerciseDescriptions] = useState(initialState.customExerciseDescriptions)
    const [workoutLogs, setWorkoutLogs] = useState(initialState.workoutLogs)

    const role = roleState
    const setRole = useCallback((nextRole) => {
        setRoleState(prev => sanitizeRole(typeof nextRole === 'function' ? nextRole(prev) : nextRole))
    }, [])

    const currentAlumnoId = currentAlumnoIdState
    const setCurrentAlumnoId = useCallback((nextAlumnoId) => {
        setCurrentAlumnoIdState(prev => {
            const resolvedValue = typeof nextAlumnoId === 'function' ? nextAlumnoId(prev) : nextAlumnoId
            return typeof resolvedValue === 'string' ? resolvedValue : ''
        })
    }, [])

    const trainerProfile = useMemo(() => ({
        name: appConfig.trainerName,
        initials: buildInitials(appConfig.trainerName, appConfig.trainerInitials),
    }), [])

    const currentAlumno = useMemo(
        () => alumnos.find(alumno => alumno.id === currentAlumnoId) || null,
        [alumnos, currentAlumnoId],
    )

    useEffect(() => {
        const nextAlumnoId = sanitizeCurrentAlumnoId(alumnos, currentAlumnoId)
        if (nextAlumnoId !== currentAlumnoId) {
            setCurrentAlumnoIdState(nextAlumnoId)
        }
    }, [alumnos, currentAlumnoId])

    useEffect(() => {
        writePersistedAppState({
            role,
            currentAlumnoId,
            alumnos,
            rutinas,
            pagos,
            nutricion,
            planesNutricionales,
            customFoods,
            customExerciseDescriptions,
            workoutLogs,
        })
    }, [
        role,
        currentAlumnoId,
        alumnos,
        rutinas,
        pagos,
        nutricion,
        planesNutricionales,
        customFoods,
        customExerciseDescriptions,
        workoutLogs,
    ])

    // Student CRUD
    const addAlumno = useCallback((alumno) => {
        const newAlumno = {
            ...alumno,
            id: createEntityId('alumno'),
            avatar: buildInitials(alumno.nombre, 'AL'),
        }
        setAlumnos(prev => [...prev, newAlumno])
        return newAlumno
    }, [])

    const updateAlumno = useCallback((id, data) => {
        setAlumnos(prev => prev.map(a => a.id === id ? { ...a, ...data } : a))
    }, [])

    const deleteAlumno = useCallback((id) => {
        const nextAlumnoId = alumnos.find(alumno => alumno.id !== id)?.id || ''

        setAlumnos(prev => prev.filter(a => a.id !== id))
        setRutinas(prev => prev.map(rutina => rutina.asignaciones.includes(id)
            ? { ...rutina, asignaciones: rutina.asignaciones.filter(alumnoId => alumnoId !== id) }
            : rutina
        ))
        setPagos(prev => prev.filter(pago => pago.alumnoId !== id))
        setNutricion(prev => {
            if (!(id in prev)) return prev
            const next = { ...prev }
            delete next[id]
            return next
        })
        setWorkoutLogs(prev => {
            if (!(id in prev)) return prev
            const next = { ...prev }
            delete next[id]
            return next
        })
        setCurrentAlumnoId(prev => prev === id ? nextAlumnoId : prev)
    }, [alumnos])

    const addRutina = useCallback((rutina) => {
        const newRutina = normalizeRoutine({
            ...rutina,
            id: createEntityId('rutina'),
            creador: trainerProfile.name,
            asignaciones: rutina.asignaciones || [],
        })
        setRutinas(prev => [...prev, newRutina])
        return newRutina
    }, [trainerProfile.name])

    const updateRutina = useCallback((id, data) => {
        setRutinas(prev => prev.map(r => r.id === id ? normalizeRoutine({ ...r, ...data }) : r))
    }, [])

    const deleteRutina = useCallback((id) => {
        setRutinas(prev => prev.filter(r => r.id !== id))
        setWorkoutLogs(prev => {
            let changed = false
            const nextLogsByAlumno = Object.fromEntries(
                Object.entries(prev).map(([alumnoId, logs]) => {
                    const filteredLogs = Object.fromEntries(
                        Object.entries(logs).filter(([, log]) => log.rutinaId !== id),
                    )

                    if (Object.keys(filteredLogs).length !== Object.keys(logs).length) {
                        changed = true
                    }

                    return [alumnoId, filteredLogs]
                }),
            )

            return changed ? nextLogsByAlumno : prev
        })
    }, [])

    const assignRutina = useCallback((rutinaId, alumnoIds) => {
        setRutinas(prev => prev.map(r => r.id === rutinaId ? { ...r, asignaciones: [...alumnoIds] } : r))
    }, [])

    // Payments
    const addPago = useCallback((pago) => {
        const newPago = { ...pago, id: createEntityId('pago') }
        setPagos(prev => [...prev, newPago])
        return newPago
    }, [])

    const updatePago = useCallback((id, data) => {
        setPagos(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    }, [])

    // Nutrition Plans
    const addPlanNutricional = useCallback((plan) => {
        const newPlan = { ...plan, id: createEntityId('plan') }
        setPlanesNutricionales(prev => [...prev, newPlan])
        return newPlan
    }, [])

    const updatePlanNutricional = useCallback((id, data) => {
        setPlanesNutricionales(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    }, [])

    const deletePlanNutricional = useCallback((id) => {
        setPlanesNutricionales(prev => prev.filter(p => p.id !== id))
        setNutricion(prev => {
            let changed = false
            const nextNutricion = Object.fromEntries(
                Object.entries(prev).map(([alumnoId, alumnoData]) => {
                    if (alumnoData.planActivo !== id) {
                        return [alumnoId, alumnoData]
                    }

                    changed = true
                    return [
                        alumnoId,
                        {
                            ...alumnoData,
                            planActivo: '',
                        },
                    ]
                }),
            )

            return changed ? nextNutricion : prev
        })
    }, [])

    // Nutrition
    const addFoodItem = useCallback((alumnoId, fecha, tipo, item) => {
        setNutricion(prev => {
            const currentAlumnoData = prev[alumnoId]
            const alumnoData = currentAlumnoData
                ? {
                    ...currentAlumnoData,
                    metaDiaria: { ...currentAlumnoData.metaDiaria },
                    registros: currentAlumnoData.registros.map(registro => ({
                        ...registro,
                        comidas: registro.comidas.map(comida => ({
                            ...comida,
                            items: [...comida.items],
                        })),
                    })),
                }
                : createDefaultNutritionProfile()

            const registroIndex = alumnoData.registros.findIndex(registro => registro.fecha === fecha)

            if (registroIndex === -1) {
                alumnoData.registros = [{ fecha, comidas: [{ tipo, items: [item] }] }, ...alumnoData.registros]
            } else {
                const registro = alumnoData.registros[registroIndex]
                const comidaIndex = registro.comidas.findIndex(comida => comida.tipo === tipo)

                if (comidaIndex === -1) {
                    registro.comidas.push({ tipo, items: [item] })
                } else {
                    const comida = registro.comidas[comidaIndex]
                    registro.comidas[comidaIndex] = {
                        ...comida,
                        items: [...comida.items, item],
                    }
                }
            }

            return { ...prev, [alumnoId]: alumnoData }
        })
    }, [])

    const removeFoodItem = useCallback((alumnoId, fecha, tipo, itemIndex) => {
        setNutricion(prev => {
            const currentAlumnoData = prev[alumnoId]
            if (!currentAlumnoData) return prev

            const alumnoData = {
                ...currentAlumnoData,
                registros: currentAlumnoData.registros.map(r => ({
                    ...r,
                    comidas: r.comidas.map(c => ({ ...c, items: [...c.items] }))
                }))
            }

            const registroIndex = alumnoData.registros.findIndex(r => r.fecha === fecha)
            if (registroIndex !== -1) {
                const registro = alumnoData.registros[registroIndex]
                const comidaIndex = registro.comidas.findIndex(c => c.tipo === tipo)
                if (comidaIndex !== -1) {
                    registro.comidas[comidaIndex].items.splice(itemIndex, 1)
                }
            }

            return { ...prev, [alumnoId]: alumnoData }
        })
    }, [])

    const editFoodItem = useCallback((alumnoId, fecha, tipo, itemIndex, updatedItemValues) => {
        setNutricion(prev => {
            const currentAlumnoData = prev[alumnoId]
            if (!currentAlumnoData) return prev

            const alumnoData = {
                ...currentAlumnoData,
                registros: currentAlumnoData.registros.map(r => {
                    if (r.fecha !== fecha) return r
                    return {
                        ...r,
                        comidas: r.comidas.map(c => {
                            if (c.tipo !== tipo) return c
                            const newItems = [...c.items]
                            if (newItems[itemIndex]) {
                                newItems[itemIndex] = { ...newItems[itemIndex], ...updatedItemValues }
                            }
                            return { ...c, items: newItems }
                        })
                    }
                })
            }

            return { ...prev, [alumnoId]: alumnoData }
        })
    }, [])

    const initializeNutritionDay = useCallback((alumnoId, fecha, comidasTemplate) => {
        setNutricion(prev => {
            const currentAlumnoData = prev[alumnoId] || createDefaultNutritionProfile()
            if (currentAlumnoData.registros.some(r => r.fecha === fecha)) return prev // Already initialized

            const newRegistro = {
                fecha,
                comidas: deepClone(comidasTemplate)
            }

            return {
                ...prev,
                [alumnoId]: {
                    ...currentAlumnoData,
                    registros: [newRegistro, ...currentAlumnoData.registros]
                }
            }
        })
    }, [])

    const setNutritionGoals = useCallback((alumnoId, goals) => {
        setNutricion(prev => {
            const alumnoData = prev[alumnoId] ? { ...prev[alumnoId] } : createDefaultNutritionProfile()
            return {
                ...prev,
                [alumnoId]: {
                    ...alumnoData,
                    metaDiaria: { ...DEFAULT_NUTRITION_META, ...goals },
                },
            }
        })
    }, [])

    const setNutritionPlan = useCallback((alumnoId, plan) => {
        setNutricion(prev => {
            const alumnoData = prev[alumnoId] ? { ...prev[alumnoId] } : createDefaultNutritionProfile()
            return {
                ...prev,
                [alumnoId]: {
                    ...alumnoData,
                    planActivo: plan,
                },
            }
        })
    }, [])

    const addCustomFood = useCallback((foodInput) => {
        if (!isRecord(foodInput)) return null

        const nombre = String(foodInput.nombre ?? '').trim()
        if (!nombre) return null

        const toNumber = value => {
            const parsed = Number(value)
            return Number.isFinite(parsed) ? parsed : 0
        }

        const normalizedFood = {
            id: createEntityId('food'),
            nombre,
            calorias: toNumber(foodInput.calorias),
            proteinas: toNumber(foodInput.proteinas),
            carbos: toNumber(foodInput.carbos),
            grasas: toNumber(foodInput.grasas),
            fibra: toNumber(foodInput.fibra),
            categoria: String(foodInput.categoria || 'Personalizados').trim() || 'Personalizados',
            source: 'custom',
            createdAt: new Date().toISOString(),
        }

        setCustomFoods(prev => {
            const key = normalizedFood.nombre.toLowerCase()
            const withoutSameName = prev.filter(item => String(item.nombre || '').toLowerCase() !== key)
            return [normalizedFood, ...withoutSameName]
        })

        return normalizedFood
    }, [])

    const analyzeFood = useCallback((description) => {
        return analyzeNutritionAI(description)
    }, [])

    const updateWorkoutSetLog = useCallback((alumnoId, logKey, patch) => {
        setWorkoutLogs(prev => {
            const alumnoLogs = prev[alumnoId] || {}
            const current = alumnoLogs[logKey] || {}
            const nextEntry = {
                ...current,
                ...patch,
            }

            if (patch.completed === true && !current.completedAt) {
                nextEntry.completedAt = new Date().toISOString()
            }

            if (patch.completed === false) {
                delete nextEntry.completedAt
            }

            return {
                ...prev,
                [alumnoId]: {
                    ...alumnoLogs,
                    [logKey]: nextEntry,
                },
            }
        })
    }, [])

    const hydrateWorkoutLogsForAlumno = useCallback((alumnoId, sessionDate = getTodayISO()) => {
        const alumnoRutinas = rutinas.filter(rutina => rutina.asignaciones.includes(alumnoId))
        setWorkoutLogs(prev => {
            const currentLogs = prev[alumnoId] || {}
            let changed = false
            const nextLogs = { ...currentLogs }

            alumnoRutinas.forEach(rutina => {
                rutina.dias.forEach((dia, dayIndex) => {
                    dia.ejercicios.forEach((item, exerciseIndex) => {
                        for (let setIndex = 0; setIndex < item.series; setIndex += 1) {
                            const logKey = buildWorkoutSetKey({ rutinaId: rutina.id, dayIndex, exerciseIndex, setIndex, sessionDate })
                            if (!nextLogs[logKey]) {
                                nextLogs[logKey] = {
                                    rutinaId: rutina.id,
                                    dayIndex,
                                    exerciseIndex,
                                    setIndex,
                                    exerciseId: item.ejercicioId,
                                    sessionDate,
                                    completed: false,
                                    actualReps: '',
                                    actualWeightKg: '',
                                }
                                changed = true
                            }
                        }
                    })
                })
            })

            return changed ? { ...prev, [alumnoId]: nextLogs } : prev
        })
    }, [rutinas])

    // Helpers
    const getAlumnoRutinas = useCallback((alumnoId) => {
        return rutinas.filter(r => r.asignaciones.includes(alumnoId))
    }, [rutinas])

    const getAlumnoPagos = useCallback((alumnoId) => {
        return pagos.filter(p => p.alumnoId === alumnoId)
    }, [pagos])

    const getAlumnoNutricion = useCallback((alumnoId) => {
        return nutricion[alumnoId] || createDefaultNutritionProfile()
    }, [nutricion])

    const getAlumnoWorkoutLogs = useCallback((alumnoId) => {
        return workoutLogs[alumnoId] || {}
    }, [workoutLogs])

    // Exercises
    const updateExerciseDescription = useCallback((exerciseId, newDescription) => {
        setCustomExerciseDescriptions(prev => ({ ...prev, [exerciseId]: newDescription }))
    }, [])

    // Session Context Value
    const sessionValue = useMemo(() => ({
        role,
        setRole,
        currentAlumnoId,
        setCurrentAlumnoId,
        currentAlumno,
        trainerProfile,
        isDemoMode: appConfig.enableDemoData,
    }), [currentAlumno, currentAlumnoId, role, setCurrentAlumnoId, setRole, trainerProfile])

    // Catalog Context Value
    const catalogValue = useMemo(() => {
        const normalizedCustomFoods = customFoods
            .filter(item => isRecord(item) && String(item.nombre || '').trim())
            .map(item => ({ ...item, source: 'custom' }))

        const mergedFoodDatabase = [
            ...normalizedCustomFoods,
            ...FOOD_DATABASE.filter(baseFood => !normalizedCustomFoods.some(customFood => customFood.nombre.toLowerCase() === baseFood.nombre.toLowerCase())),
        ]

        return {
            exercises: EXERCISES.map(ex => ({
                ...ex,
                descripcion: customExerciseDescriptions[ex.id] || ex.descripcion
            })),
            muscleGroups: MUSCLE_GROUPS,
            foodDatabase: mergedFoodDatabase,
            foodCategories: Array.from(new Set(mergedFoodDatabase.map(food => food.categoria).filter(Boolean))),
            updateExerciseDescription
        }
    }, [customExerciseDescriptions, customFoods, updateExerciseDescription])

    const alumnosValue = useMemo(() => ({
        alumnos,
        addAlumno,
        updateAlumno,
        deleteAlumno,
    }), [alumnos, addAlumno, updateAlumno, deleteAlumno])

    const rutinasValue = useMemo(() => ({
        rutinas,
        addRutina,
        updateRutina,
        deleteRutina,
        assignRutina,
        getAlumnoRutinas,
    }), [rutinas, addRutina, updateRutina, deleteRutina, assignRutina, getAlumnoRutinas])

    const pagosValue = useMemo(() => ({
        pagos,
        addPago,
        updatePago,
        getAlumnoPagos,
    }), [pagos, addPago, updatePago, getAlumnoPagos])

    const nutricionValue = useMemo(() => ({
        nutricion,
        planesNutricionales,
        addFoodItem,
        removeFoodItem,
        editFoodItem,
        initializeNutritionDay,
        setNutritionGoals,
        setNutritionPlan,
        analyzeFood,
        getAlumnoNutricion,
        addPlanNutricional,
        updatePlanNutricional,
        deletePlanNutricional,
        addCustomFood,
    }), [nutricion, planesNutricionales, addFoodItem, removeFoodItem, editFoodItem, initializeNutritionDay, setNutritionGoals, setNutritionPlan, analyzeFood, getAlumnoNutricion, addPlanNutricional, updatePlanNutricional, deletePlanNutricional, addCustomFood])

    const workoutLogsValue = useMemo(() => ({
        workoutLogs,
        updateWorkoutSetLog,
        hydrateWorkoutLogsForAlumno,
        getAlumnoWorkoutLogs,
    }), [workoutLogs, updateWorkoutSetLog, hydrateWorkoutLogsForAlumno, getAlumnoWorkoutLogs])

    const legacyValue = useMemo(() => ({
        role,
        setRole,
        currentAlumnoId,
        setCurrentAlumnoId,
        currentAlumno,
        trainerProfile,
        isDemoMode: appConfig.enableDemoData,
        alumnos,
        rutinas,
        pagos,
        nutricion,
        workoutLogs,
        planesNutricionales,
        customFoods,
        exercises: catalogValue.exercises,
        muscleGroups: catalogValue.muscleGroups,
        foodDatabase: catalogValue.foodDatabase,
        foodCategories: catalogValue.foodCategories,
        addAlumno,
        updateAlumno,
        deleteAlumno,
        addRutina,
        updateRutina,
        deleteRutina,
        assignRutina,
        addPago,
        updatePago,
        addFoodItem,
        removeFoodItem,
        editFoodItem,
        initializeNutritionDay,
        setNutritionGoals,
        setNutritionPlan,
        analyzeFood,
        addPlanNutricional,
        updatePlanNutricional,
        deletePlanNutricional,
        addCustomFood,
        updateWorkoutSetLog,
        hydrateWorkoutLogsForAlumno,
        getAlumnoRutinas,
        getAlumnoPagos,
        getAlumnoNutricion,
        getAlumnoWorkoutLogs,
    }), [
        role,
        setRole,
        currentAlumnoId,
        setCurrentAlumnoId,
        currentAlumno,
        trainerProfile,
        alumnos,
        rutinas,
        pagos,
        nutricion,
        workoutLogs,
        planesNutricionales,
        customFoods,
        catalogValue,
        addAlumno,
        updateAlumno,
        deleteAlumno,
        addRutina,
        updateRutina,
        deleteRutina,
        assignRutina,
        addPago,
        updatePago,
        addFoodItem,
        removeFoodItem,
        editFoodItem,
        initializeNutritionDay,
        setNutritionGoals,
        setNutritionPlan,
        analyzeFood,
        addPlanNutricional,
        updatePlanNutricional,
        deletePlanNutricional,
        addCustomFood,
        updateWorkoutSetLog,
        hydrateWorkoutLogsForAlumno,
        getAlumnoRutinas,
        getAlumnoPagos,
        getAlumnoNutricion,
        getAlumnoWorkoutLogs,
    ])

    return (
        <AppContext.Provider value={legacyValue}>
            <SessionContext.Provider value={sessionValue}>
                <CatalogContext.Provider value={catalogValue}>
                    <AlumnosContext.Provider value={alumnosValue}>
                        <RutinasContext.Provider value={rutinasValue}>
                            <PagosContext.Provider value={pagosValue}>
                                <NutricionContext.Provider value={nutricionValue}>
                                    <WorkoutLogsContext.Provider value={workoutLogsValue}>
                                        {children}
                                    </WorkoutLogsContext.Provider>
                                </NutricionContext.Provider>
                            </PagosContext.Provider>
                        </RutinasContext.Provider>
                    </AlumnosContext.Provider>
                </CatalogContext.Provider>
            </SessionContext.Provider>
        </AppContext.Provider>
    )
}

function useRequiredContext(context, hookName) {
    const value = useContext(context)
    if (!value) throw new Error(hookName + ' must be used within AppProvider')
    return value
}

export function useAppSession() {
    return useRequiredContext(SessionContext, 'useAppSession')
}

export function useAppCatalog() {
    return useRequiredContext(CatalogContext, 'useAppCatalog')
}

export function useAppAlumnos() {
    return useRequiredContext(AlumnosContext, 'useAppAlumnos')
}

export function useAppRutinas() {
    return useRequiredContext(RutinasContext, 'useAppRutinas')
}

export function useAppPagos() {
    return useRequiredContext(PagosContext, 'useAppPagos')
}

export function useAppNutrition() {
    return useRequiredContext(NutricionContext, 'useAppNutrition')
}

export function useAppWorkoutLogs() {
    return useRequiredContext(WorkoutLogsContext, 'useAppWorkoutLogs')
}

export function useApp() {
    return useRequiredContext(AppContext, 'useApp')
}









