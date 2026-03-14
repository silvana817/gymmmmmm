#!/usr/bin/env node

/**
 * Estimador simple de transferencia y costo de ancho de banda.
 *
 * Uso:
 *   node scripts/estimate-bandwidth-cost.mjs
 *   node scripts/estimate-bandwidth-cost.mjs --users 200 --sessions-per-user-day 1 --price-per-gb 0.08
 */

const args = process.argv.slice(2)

function getArg(name, fallback) {
  const index = args.indexOf(`--${name}`)
  if (index === -1 || index === args.length - 1) return fallback
  const raw = Number(args[index + 1])
  return Number.isFinite(raw) ? raw : fallback
}

const users = getArg('users', 200)
const sessionsPerUserDay = getArg('sessions-per-user-day', 1)
const pricePerGb = getArg('price-per-gb', 0.08)
const monthDays = getArg('month-days', 30)

// MB transferidos por usuario por sesion (estimaciones conservadoras del documento)
const scenarios = [
  { key: 'base', label: 'Solo carga inicial', mbPerUserSession: 0.09 },
  { key: 'light', label: 'Sesion sin muchas imagenes', mbPerUserSession: 0.26 },
  { key: 'typical', label: 'Sesion tipica con imagenes', mbPerUserSession: 1.76 },
  { key: 'heavy', label: 'Sesion intensa con muchas imagenes', mbPerUserSession: 6.26 },
]

const MB_PER_GB = 1024

console.log(`Estimacion para ${users} usuarios, ${sessionsPerUserDay} sesion(es)/usuario/dia, $${pricePerGb}/GB, ${monthDays} dias/mes\n`)

for (const scenario of scenarios) {
  const mbDay = scenario.mbPerUserSession * users * sessionsPerUserDay
  const gbDay = mbDay / MB_PER_GB
  const gbMonth = gbDay * monthDays
  const costDay = gbDay * pricePerGb
  const costMonth = gbMonth * pricePerGb

  console.log(`${scenario.label}`)
  console.log(`  - Transferencia diaria: ${mbDay.toFixed(2)} MB (${gbDay.toFixed(3)} GB)`)
  console.log(`  - Transferencia mensual: ${(gbMonth).toFixed(3)} GB`)
  console.log(`  - Costo diario aprox: $${costDay.toFixed(4)}`)
  console.log(`  - Costo mensual aprox: $${costMonth.toFixed(4)}\n`)
}
