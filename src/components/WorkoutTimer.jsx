import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, X, RotateCcw } from 'lucide-react'

export default function WorkoutTimer() {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isRunning, setIsRunning] = useState(false)
    const [time, setTime] = useState(0)
    const timerRef = useRef(null)

    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setTime(prev => prev + 1)
            }, 1000)
        } else {
            clearInterval(timerRef.current)
        }

        return () => clearInterval(timerRef.current)
    }, [isRunning])

    const toggleTimer = (e) => {
        if (e) e.stopPropagation();
        setIsRunning(!isRunning)
    }

    const resetTimer = (e) => {
        if (e) e.stopPropagation();
        setIsRunning(false)
        setTime(0)
        clearInterval(timerRef.current)
    }

    const formatTime = (seconds, showHours = false) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60

        if (h > 0 || showHours) {
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    // Toggle expansion when background pill is clicked
    const handlePillClick = () => {
        if (!isExpanded) setIsExpanded(true)
    }

    return (
        <div className="timer-dynamic-island">
            <div
                className={`timer-pill-container ${isExpanded ? 'expanded' : ''}`}
                onClick={handlePillClick}
            >
                {!isExpanded ? (
                    // --- COMPACT PILL STATE ---
                    <div className="pill-compact-content">
                        <div className="pill-time">
                            <div className={`pulse-dot ${!isRunning ? 'paused' : ''}`} />
                            {formatTime(time)}
                        </div>
                        <button
                            className="pill-mini-btn"
                            onClick={toggleTimer}
                            aria-label={isRunning ? "Pausar" : "Iniciar"}
                        >
                            {isRunning ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                        </button>
                    </div>
                ) : (
                    // --- EXPANDED CONTROL PANEL STATE ---
                    <div className="pill-expanded-content">
                        <div className="expanded-header">
                            <span>Descanso</span>
                            <button
                                className="close-btn"
                                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="expanded-time">
                            {formatTime(time, time >= 3600)}
                        </div>

                        <div className="expanded-controls">
                            <button
                                className="btn-reset"
                                onClick={resetTimer}
                                disabled={time === 0}
                            >
                                <RotateCcw size={20} />
                                Reiniciar
                            </button>
                            <button
                                className={isRunning ? "btn-pause" : "btn-play"}
                                onClick={toggleTimer}
                            >
                                {isRunning ? (
                                    <>
                                        <Pause size={20} fill="currentColor" />
                                        Pausar
                                    </>
                                ) : (
                                    <>
                                        <Play size={20} fill="currentColor" />
                                        Iniciar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
