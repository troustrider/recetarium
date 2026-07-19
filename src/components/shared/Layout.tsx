import { useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, ShoppingCart, Search, Menu, X, BookOpen, ShoppingBasket, CalendarDays } from 'lucide-react'
import useDarkMode from '../../hooks/useDarkMode'
import { useListaCompraContext } from '../../context'
import ListaCompraDrawer from '../lista-compra/ListaCompraDrawer'
import AvisoDespensa from '../despensa/AvisoDespensa'

const LINKS_MAIN = [
  { to: '/', label: 'Catálogo' },
  { to: '/favoritas', label: 'Favoritas' },
]

const LINKS_EXTRA = [
  { to: '/planificador', label: 'Planificador semanal' },
  { to: '/despensa', label: 'Mi despensa' },
]

const ALL_LINKS = [...LINKS_MAIN, ...LINKS_EXTRA]

// Nav inferior móvil: las cuatro zonas de uso diario al alcance del pulgar.
// "Lista" no es una ruta: abre el drawer de la lista de la compra.
const LINKS_BOTTOM = [
  { to: '/', label: 'Catálogo', Icono: BookOpen },
  { to: '/despensa', label: 'Despensa', Icono: ShoppingBasket },
  { action: 'lista' as const, label: 'Lista', Icono: ShoppingCart },
  { to: '/planificador', label: 'Semana', Icono: CalendarDays },
]

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06L5.404 4.343a.75.75 0 00-1.06 1.06l1.06 1.061z" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clipRule="evenodd" />
    </svg>
  )
}

function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { dark, toggle } = useDarkMode()
  const { listaCompra } = useListaCompraContext()
  const [menuOpen, setMenuOpen] = useState(false)      // Más dropdown (desktop)
  const [mobileOpen, setMobileOpen] = useState(false)  // Mobile menu
  const [listaOpen, setListaOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchValue.trim()
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/')
    setMobileOpen(false)
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-950 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 shadow-sm dark:shadow-none">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">

          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm shadow-orange-400/30 dark:shadow-orange-900/30">
              <ChefHat className="w-4 h-4 text-white" strokeWidth={2.2} />
            </div>
            <span className="font-display font-bold text-gray-900 dark:text-gray-100 text-lg tracking-tight">
              Recetarium
            </span>
          </NavLink>

          {/* Search — desktop */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xs hidden sm:block mx-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Buscar recetas..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-full border-0 outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-600 transition-all"
              />
            </div>
          </form>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-4 ml-auto">
            {LINKS_MAIN.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-orange-500 dark:text-orange-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`
                }>
                {label}
              </NavLink>
            ))}

            {/* Más — desktop */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                  LINKS_EXTRA.some((l) => location.pathname.startsWith(l.to))
                    ? 'text-orange-500 dark:text-orange-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Más
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 mt-0.5">
                  <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <motion.div
                      className="absolute right-0 top-9 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-20"
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                    >
                      {LINKS_EXTRA.map(({ to, label }) => (
                        <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}
                          className={({ isActive }) =>
                            `block px-4 py-2.5 text-sm font-medium transition-colors ${
                              isActive
                                ? 'text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`
                          }>
                          {label}
                        </NavLink>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Iconos derechos — siempre visibles */}
          <div className="flex items-center gap-1 ml-auto sm:ml-0">
            {/* Cart */}
            <motion.button
              onClick={() => setListaOpen(true)}
              className="relative hidden sm:block p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Lista de compra"
              whileTap={{ scale: 0.88 }}
            >
              <ShoppingCart className="w-5 h-5" />
              {listaCompra.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none tabular-nums">
                  {listaCompra.length}
                </span>
              )}
            </motion.button>

            {/* Dark mode */}
            <motion.button
              onClick={toggle}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
              whileTap={{ scale: 0.85 }}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </motion.button>

            {/* Hamburger — solo mobile */}
            <motion.button
              onClick={() => setMobileOpen((o) => !o)}
              className="sm:hidden p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Menú"
              whileTap={{ scale: 0.88 }}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile menu — slide-down */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="sm:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
              {/* Search mobile */}
              <div className="px-4 pt-3 pb-2">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="search"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="Buscar recetas..."
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-full border-0 outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-600"
                    />
                  </div>
                </form>
              </div>
              {/* Links */}
              <nav className="px-2 pb-3 flex flex-col">
                {ALL_LINKS.map(({ to, label }) => (
                  <NavLink key={to} to={to} end={to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                        isActive
                          ? 'text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`
                    }>
                    {label}
                  </NavLink>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24 sm:py-8">
        {children}
      </main>

      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex pb-[env(safe-area-inset-bottom)]">
        {LINKS_BOTTOM.map((item) => {
          const { label, Icono } = item
          if ('action' in item) {
            return (
              <button
                key={label}
                onClick={() => setListaOpen(true)}
                className="relative flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <span className="relative">
                  <Icono className="w-5 h-5" strokeWidth={2} />
                  {listaCompra.length > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-3.5 h-3.5 px-[3px] bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none tabular-nums">
                      {listaCompra.length}
                    </span>
                  )}
                </span>
                {label}
              </button>
            )
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[10px] font-semibold transition-colors ${
                  isActive
                    ? 'text-orange-500 dark:text-orange-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`
              }
            >
              <Icono className="w-5 h-5" strokeWidth={2} />
              {label}
            </NavLink>
          )
        })}
      </nav>

      <ListaCompraDrawer open={listaOpen} onClose={() => setListaOpen(false)} />
      <AvisoDespensa />
    </div>
  )
}

export default Layout
