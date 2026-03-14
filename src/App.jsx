import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Menu } from 'lucide-react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import { useAppSession } from './context/AppContext'
import WorkoutTimer from './components/WorkoutTimer'
import { appConfig } from './config/app'

const Alumnos = lazy(() => import('./pages/Alumnos'))
const Rutinas = lazy(() => import('./pages/Rutinas'))
const Nutricion = lazy(() => import('./pages/Nutricion'))
const MiRutina = lazy(() => import('./pages/MiRutina'))
const MiNutricion = lazy(() => import('./pages/MiNutricion'))
const Progresion = lazy(() => import('./pages/Progresion'))
const Logros = lazy(() => import('./pages/Logros'))

function RouteFallback() {
    return (
        <div className="page-container">
            <div className="card" style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Cargando modulo...</span>
            </div>
        </div>
    )
}

function getMobileTitle(pathname, role) {
    const titles = role === 'entrenador'
        ? {
            '/alumnos': 'Alumnos',
            '/rutinas': 'Rutinas',
            '/nutricion': 'Nutricion',
        }
        : {
            '/mi-rutina': 'Mi Rutina',
            '/mi-nutricion': 'Mi Nutricion',
            '/progresion': 'Progresion',
            '/logros': 'Logros',
        }

    return titles[pathname] || appConfig.appName
}

export default function App() {
    const { role } = useAppSession()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        setSidebarOpen(false)
    }, [location.pathname, role])

    const mobileTitle = useMemo(() => getMobileTitle(location.pathname, role), [location.pathname, role])

    return (
        <div className="app-layout">
            {sidebarOpen && <button type="button" className="sidebar-backdrop" aria-label="Cerrar menu" onClick={() => setSidebarOpen(false)} />}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="main-content">
                <div className="mobile-topbar">
                    <button type="button" className="mobile-nav-btn" aria-label="Abrir menu" onClick={() => setSidebarOpen(true)}>
                        <Menu size={20} />
                    </button>
                    <div className="mobile-topbar-title">{mobileTitle}</div>
                </div>
                <Suspense fallback={<RouteFallback />}>
                    <Routes>
                        {role === 'entrenador' && (
                            <>
                                <Route path="/" element={<Navigate to="/rutinas" replace />} />
                                <Route path="/alumnos" element={<Alumnos />} />
                                <Route path="/rutinas" element={<Rutinas />} />
                                <Route path="/nutricion" element={<Nutricion />} />
                            </>
                        )}
                        {role === 'alumno' && (
                            <>
                                <Route path="/" element={<Navigate to="/mi-rutina" replace />} />
                                <Route path="/mi-rutina" element={<MiRutina />} />
                                <Route path="/mi-nutricion" element={<MiNutricion />} />
                                <Route path="/progresion" element={<Progresion />} />
                                <Route path="/logros" element={<Logros />} />
                            </>
                        )}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </main>
            {role === 'alumno' && <WorkoutTimer />}
        </div>
    )
}



