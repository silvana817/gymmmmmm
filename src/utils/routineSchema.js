export const ROUTINE_GOAL_MODES = {
    EXACT: 'exact',
    RANGE: 'range',
    TIME: 'time',
    CUSTOM: 'custom',
}

const DEFAULT_REST_SECONDS = 60
const DEFAULT_SERIES = 3
const DEFAULT_TARGET_REPS = 12

function toInt(value, fallback = 0) {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : fallback
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value))
}

function sanitizeWeight(value) {
    if (value === null || value === undefined) return ''
    return String(value).replace(',', '.').replace(/[^0-9.]/g, '').trim()
}

function parseLegacyGoal(rawGoal) {
    const value = String(rawGoal || '').trim()

    if (!value) {
        return {
            goalMode: ROUTINE_GOAL_MODES.EXACT,
            targetReps: DEFAULT_TARGET_REPS,
            targetRepsMin: DEFAULT_TARGET_REPS,
            targetRepsMax: DEFAULT_TARGET_REPS,
            targetSeconds: 30,
            targetCustom: '',
        }
    }

    const exactMatch = value.match(/^\d+$/)
    if (exactMatch) {
        const targetReps = clamp(toInt(value, DEFAULT_TARGET_REPS), 1, 100)
        return {
            goalMode: ROUTINE_GOAL_MODES.EXACT,
            targetReps,
            targetRepsMin: targetReps,
            targetRepsMax: targetReps,
            targetSeconds: 30,
            targetCustom: '',
        }
    }

    const rangeMatch = value.match(/^(\d+)\s*-\s*(\d+)$/)
    if (rangeMatch) {
        const min = clamp(toInt(rangeMatch[1], DEFAULT_TARGET_REPS), 1, 100)
        const max = clamp(toInt(rangeMatch[2], min), min, 100)
        return {
            goalMode: ROUTINE_GOAL_MODES.RANGE,
            targetReps: max,
            targetRepsMin: min,
            targetRepsMax: max,
            targetSeconds: 30,
            targetCustom: '',
        }
    }

    const timeMatch = value.match(/^(\d+)\s*s$/i)
    if (timeMatch) {
        const targetSeconds = clamp(toInt(timeMatch[1], 30), 5, 600)
        return {
            goalMode: ROUTINE_GOAL_MODES.TIME,
            targetReps: DEFAULT_TARGET_REPS,
            targetRepsMin: DEFAULT_TARGET_REPS,
            targetRepsMax: DEFAULT_TARGET_REPS,
            targetSeconds,
            targetCustom: '',
        }
    }

    return {
        goalMode: ROUTINE_GOAL_MODES.CUSTOM,
        targetReps: DEFAULT_TARGET_REPS,
        targetRepsMin: DEFAULT_TARGET_REPS,
        targetRepsMax: DEFAULT_TARGET_REPS,
        targetSeconds: 30,
        targetCustom: value,
    }
}

function normalizeGoal(raw = {}) {
    if (raw.goalMode) {
        const goalMode = Object.values(ROUTINE_GOAL_MODES).includes(raw.goalMode)
            ? raw.goalMode
            : ROUTINE_GOAL_MODES.CUSTOM

        const targetReps = clamp(toInt(raw.targetReps, DEFAULT_TARGET_REPS), 1, 100)
        const targetRepsMin = clamp(toInt(raw.targetRepsMin, targetReps), 1, 100)
        const targetRepsMax = clamp(toInt(raw.targetRepsMax, Math.max(targetReps, targetRepsMin)), targetRepsMin, 100)
        const targetSeconds = clamp(toInt(raw.targetSeconds, 30), 5, 600)
        const targetCustom = String(raw.targetCustom || '').trim()

        if (goalMode === ROUTINE_GOAL_MODES.RANGE) {
            return { goalMode, targetReps, targetRepsMin, targetRepsMax, targetSeconds, targetCustom: '' }
        }

        if (goalMode === ROUTINE_GOAL_MODES.TIME) {
            return { goalMode, targetReps, targetRepsMin, targetRepsMax, targetSeconds, targetCustom: '' }
        }

        if (goalMode === ROUTINE_GOAL_MODES.CUSTOM) {
            return { goalMode, targetReps, targetRepsMin, targetRepsMax, targetSeconds, targetCustom }
        }

        return {
            goalMode: ROUTINE_GOAL_MODES.EXACT,
            targetReps,
            targetRepsMin: targetReps,
            targetRepsMax: targetReps,
            targetSeconds,
            targetCustom: '',
        }
    }

    return parseLegacyGoal(raw.repeticiones)
}

export function parseRestSeconds(rawValue) {
    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
        return clamp(Math.round(rawValue), 0, 900)
    }

    const value = String(rawValue || '').trim().toLowerCase()
    const secondsMatch = value.match(/^(\d+)\s*s$/)
    if (secondsMatch) return clamp(toInt(secondsMatch[1], DEFAULT_REST_SECONDS), 0, 900)
    if (/^\d+$/.test(value)) return clamp(toInt(value, DEFAULT_REST_SECONDS), 0, 900)
    return DEFAULT_REST_SECONDS
}

export function normalizeRoutineExercise(raw = {}) {
    const normalizedGoal = normalizeGoal(raw)
    return {
        ejercicioId: raw.ejercicioId || '',
        series: clamp(toInt(raw.series, DEFAULT_SERIES), 1, 10),
        ...normalizedGoal,
        targetWeightKg: sanitizeWeight(raw.targetWeightKg ?? raw.pesoObjetivoKg ?? ''),
        restSeconds: parseRestSeconds(raw.restSeconds ?? raw.descanso ?? DEFAULT_REST_SECONDS),
    }
}

export function createDefaultRoutineExercise(ejercicioId) {
    return normalizeRoutineExercise({
        ejercicioId,
        series: DEFAULT_SERIES,
        goalMode: ROUTINE_GOAL_MODES.EXACT,
        targetReps: DEFAULT_TARGET_REPS,
        targetWeightKg: '',
        restSeconds: DEFAULT_REST_SECONDS,
    })
}

export function normalizeRoutineDay(raw = {}, index = 0) {
    return {
        dia: String(raw.dia || `Dia ${index + 1}`).trim() || `Dia ${index + 1}`,
        ejercicios: Array.isArray(raw.ejercicios)
            ? raw.ejercicios.map(item => normalizeRoutineExercise(item))
            : [],
    }
}

export function normalizeRoutine(raw = {}) {
    return {
        ...raw,
        nombre: String(raw.nombre || '').trim(),
        descripcion: String(raw.descripcion || '').trim(),
        tipo: String(raw.tipo || 'Hipertrofia').trim() || 'Hipertrofia',
        dias: Array.isArray(raw.dias)
            ? raw.dias.map((dia, index) => normalizeRoutineDay(dia, index))
            : [],
        asignaciones: Array.isArray(raw.asignaciones) ? [...raw.asignaciones] : [],
    }
}

export function formatExerciseGoal(item) {
    if (!item) return '-'

    switch (item.goalMode) {
        case ROUTINE_GOAL_MODES.RANGE:
            return `${item.targetRepsMin}-${item.targetRepsMax} reps`
        case ROUTINE_GOAL_MODES.TIME:
            return `${item.targetSeconds}s`
        case ROUTINE_GOAL_MODES.CUSTOM:
            return item.targetCustom || '-'
        default:
            return `${item.targetReps} reps`
    }
}

export function formatTargetWeight(item) {
    return item?.targetWeightKg ? `${item.targetWeightKg} kg` : ''
}

export function formatRest(item) {
    return `${parseRestSeconds(item?.restSeconds)}s`
}

export function getSuggestedActualReps(item) {
    if (!item) return ''
    if (item.goalMode === ROUTINE_GOAL_MODES.EXACT) return String(item.targetReps)
    if (item.goalMode === ROUTINE_GOAL_MODES.RANGE) return String(item.targetRepsMax)
    return ''
}

export function getWorkoutLogDate(entry) {
    if (!entry) return ''
    if (entry.sessionDate) return String(entry.sessionDate)
    if (entry.completedAt) return String(entry.completedAt).slice(0, 10)
    return ''
}

export function buildWorkoutSetKey({ rutinaId, dayIndex, exerciseIndex, setIndex, sessionDate = '' }) {
    const normalizedDate = String(sessionDate || 'session')
    return `${normalizedDate}:${rutinaId}:${dayIndex}:${exerciseIndex}:${setIndex}`
}
