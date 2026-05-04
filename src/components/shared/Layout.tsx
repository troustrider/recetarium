import { NavLink, Outlet } from 'react-router-dom'

const LINKS = [
  { to: '/', label: 'Catálogo' },
  { to: '/favoritas', label: 'Favoritas' },
  { to: '/lista-compra', label: 'Lista de compra' },
]

function Layout() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-slate-900 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
          <span className="font-display font-bold text-white text-lg tracking-tight">Recetarium</span>
          <nav className="flex gap-6">
            {LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors pb-0.5 ${
                    isActive
                      ? 'text-white border-b-2 border-teal-400'
                      : 'text-slate-400 hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
