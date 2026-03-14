export function formatISODate(date = new Date()) {
    const localDate = new Date(date)
    localDate.setHours(0, 0, 0, 0)
    const year = localDate.getFullYear()
    const month = String(localDate.getMonth() + 1).padStart(2, '0')
    const day = String(localDate.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export function parseISODate(isoDate) {
    const [year, month, day] = isoDate.split('-').map(Number)
    return new Date(year, month - 1, day, 12, 0, 0, 0)
}

export function shiftISODate(isoDate, dayOffset) {
    const shiftedDate = parseISODate(isoDate)
    shiftedDate.setDate(shiftedDate.getDate() + dayOffset)
    return formatISODate(shiftedDate)
}

export function getTodayISO() {
    return formatISODate(new Date())
}

export function getWeekDates(anchorISO) {
    const anchorDate = parseISODate(anchorISO)
    const currentDay = anchorDate.getDay()
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
    const monday = new Date(anchorDate)
    monday.setDate(anchorDate.getDate() + mondayOffset)

    return Array.from({ length: 7 }, (_, index) => {
        const currentDate = new Date(monday)
        currentDate.setDate(monday.getDate() + index)
        return formatISODate(currentDate)
    })
}

export function getShortWeekdayLabel(isoDate, locale = 'es-AR') {
    const label = parseISODate(isoDate).toLocaleDateString(locale, { weekday: 'short' }).replace('.', '')
    return label.charAt(0).toUpperCase() + label.slice(1)
}

export function getLongDateLabel(isoDate, locale = 'es-AR') {
    return parseISODate(isoDate).toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    })
}

export function getMonthKey(date = new Date()) {
    const localDate = new Date(date)
    return `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthKeyFromISO(isoDate) {
    return getMonthKey(parseISODate(isoDate))
}

export function getMonthLabel(dateLike, locale = 'es-AR') {
    const date = typeof dateLike === 'string' ? parseISODate(dateLike) : new Date(dateLike)
    const label = date.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
    return label.charAt(0).toUpperCase() + label.slice(1)
}

export function getMonthOptions({ previous = 2, next = 3 } = {}) {
    const baseDate = new Date()
    const options = []

    for (let offset = -previous; offset <= next; offset += 1) {
        const date = new Date(baseDate)
        date.setMonth(baseDate.getMonth() + offset)
        options.push(getMonthLabel(date))
    }

    return options
}
