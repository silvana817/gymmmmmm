import { Minus, Plus } from 'lucide-react'

function parseInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : fallback
}

export default function NumberStepper({
    value,
    onChange,
    min = 0,
    max = 999,
    step = 1,
    size = 'md',
    inputId,
    disabled = false,
}) {
    const numericValue = Number.isFinite(Number(value)) ? Number(value) : min
    const buttonSize = size === 'sm' ? 36 : 44
    const inputWidth = size === 'sm' ? 56 : 72
    const fontSize = size === 'sm' ? '1rem' : '1.15rem'

    const commit = nextValue => {
        const clamped = Math.min(max, Math.max(min, nextValue))
        onChange(clamped)
    }

    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <button
                type="button"
                className="btn btn-secondary"
                disabled={disabled || numericValue <= min}
                onClick={() => commit(numericValue - step)}
                style={{ width: buttonSize, height: buttonSize, padding: 0, borderRadius: 10 }}
                aria-label="Disminuir"
            >
                <Minus size={14} />
            </button>
            <input
                id={inputId}
                className="input-field"
                type="number"
                inputMode="numeric"
                min={min}
                max={max}
                step={step}
                value={numericValue}
                disabled={disabled}
                onChange={event => commit(parseInteger(event.target.value, numericValue))}
                style={{ width: inputWidth, padding: '6px 8px', textAlign: 'center', fontSize }}
            />
            <button
                type="button"
                className="btn btn-secondary"
                disabled={disabled || numericValue >= max}
                onClick={() => commit(numericValue + step)}
                style={{ width: buttonSize, height: buttonSize, padding: 0, borderRadius: 10 }}
                aria-label="Aumentar"
            >
                <Plus size={14} />
            </button>
        </div>
    )
}
