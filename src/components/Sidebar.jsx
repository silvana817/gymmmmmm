import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppSession } from '../context/AppContext'
import { appConfig } from '../config/app'
import {
    Users, Dumbbell, Apple, ClipboardList, Salad,
    ChevronRight, TrendingUp, Trophy, X, Moon, Sun
} from 'lucide-react'

function getInitialTheme() {
    if (typeof window === 'undefined') {
        return appConfig.defaultTheme
    }

    const storedTheme = window.localStorage.getItem(appConfig.themeStorageKey)
    if (storedTheme === 'dark' || storedTheme === 'light') {
        return storedTheme
    }

    const documentTheme = document.documentElement.getAttribute('data-theme')
    return documentTheme === 'dark' ? 'dark' : appConfig.defaultTheme
}

export default function Sidebar({ isOpen = false, onClose }) {
    const { role, setRole, currentAlumno, trainerProfile } = useAppSession()
    const navigate = useNavigate()
    const location = useLocation()
    const [theme, setTheme] = useState(getInitialTheme)

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(appConfig.themeStorageKey, theme)
        }
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light')
    }

    const trainerNav = [
        { label: 'Alumnos', icon: Users, path: '/alumnos' },
        { label: 'Rutinas', icon: Dumbbell, path: '/rutinas' },
        { label: 'Nutricion', icon: Apple, path: '/nutricion' },
    ]

    const studentNav = [
        { label: 'Mi Rutina', icon: ClipboardList, path: '/mi-rutina' },
        { label: 'Mi Nutricion', icon: Salad, path: '/mi-nutricion' },
        { label: 'Progresion', icon: TrendingUp, path: '/progresion' },
        { label: 'Logros', icon: Trophy, path: '/logros' },
    ]

    const navItems = role === 'entrenador' ? trainerNav : studentNav
    const currentProfile = role === 'entrenador'
        ? trainerProfile
        : {
            name: currentAlumno?.nombre || 'Alumno',
            initials: currentAlumno?.avatar || 'AL',
        }

    const handleNavigate = path => {
        navigate(path)
        onClose?.()
    }

    const switchRole = nextRole => {
        setRole(nextRole)
        navigate(nextRole === 'entrenador' ? '/rutinas' : '/mi-rutina')
        onClose?.()
    }

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon" style={{ background: 'var(--accent-primary)', borderRadius: '50%', width: '40px', height: '40px' }}>
                        <Dumbbell size={20} color="white" strokeWidth={3} />
                    </div>
                    <div>
                        <h1 style={{ color: 'var(--text-primary)' }}>{appConfig.appName}</h1>
                        <span style={{ color: 'var(--text-muted)' }}>{appConfig.appTagline}</span>
                    </div>
                </div>
                <button type="button" className="sidebar-close" aria-label="Cerrar menu" onClick={() => onClose?.()}>
                    <X size={18} />
                </button>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <div className="nav-section-title">
                        {role === 'entrenador' ? 'Gestion' : 'Mi Espacio'}
                    </div>
                    {navItems.map(item => (
                        <button
                            key={item.path}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => handleNavigate(item.path)}
                        >
                            <item.icon />
                            {item.label}
                            {item.badge && <span className="nav-badge">{item.badge}</span>}
                            {location.pathname === item.path && <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
                        </button>
                    ))}
                </div>
            </nav>

            <div className="sidebar-user">
                <div className="sidebar-user-info">
                    <div className="user-avatar">
                        {currentProfile.initials}
                    </div>
                    <div className="user-details">
                        <h4>{currentProfile.name}</h4>
                        <p>{role === 'entrenador' ? 'Entrenador' : 'Alumno'}</p>
                    </div>
                </div>
                <button
                    className="nav-item"
                    onClick={toggleTheme}
                    style={{ marginTop: 12, marginBottom: 8, justifyContent: 'center', background: 'transparent', gap: 8, color: 'var(--text-secondary)' }}
                >
                    {theme === 'light' ? <><Moon size={18} /> Modo Oscuro</> : <><Sun size={18} /> Modo Claro</>}
                </button>
                <div className="role-switch">
                    <button
                        className={role === 'entrenador' ? 'active' : ''}
                        onClick={() => switchRole('entrenador')}
                    >
                        Entrenador
                    </button>
                    <button
                        className={role === 'alumno' ? 'active' : ''}
                        onClick={() => switchRole('alumno')}
                    >
                        Alumno
                    </button>
                </div>
            </div>
        </aside>
    )
}
