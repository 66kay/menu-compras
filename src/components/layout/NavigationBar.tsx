import React from 'react';
import { Calendar, CalendarRange, ShoppingCart, ChefHat, Target } from 'lucide-react';

export type TabId = 'hoy' | 'semana' | 'compras' | 'recetas' | 'metas';

interface NavigationBarProps {
  tabActiva: TabId;
  onCambiarTab: (tab: TabId) => void;
  conteoComprasPendientes?: number;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  tabActiva,
  onCambiarTab,
  conteoComprasPendientes = 0,
}) => {
  const tabs = [
    { id: 'hoy' as TabId, label: 'Hoy', icono: Calendar },
    { id: 'semana' as TabId, label: 'Semana', icono: CalendarRange },
    { id: 'compras' as TabId, label: 'Compras', icono: ShoppingCart, badge: conteoComprasPendientes },
    { id: 'recetas' as TabId, label: 'Recetas', icono: ChefHat },
    { id: 'metas' as TabId, label: 'Metas', icono: Target },
  ];

  return (
    <>
      {/* Barra Inferior Móvil (<1024px) */}
      <nav
        aria-label="Navegación principal móvil"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-base)]/95 backdrop-blur-md border-t border-[var(--border-subtle)] pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-1 px-2"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icono = tab.icono;
            const esActiva = tabActiva === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onCambiarTab(tab.id)}
                className={`relative flex flex-col items-center justify-center min-w-[54px] min-h-[48px] py-1 px-2 rounded-xl transition-all ${
                  esActiva
                    ? 'text-[var(--accent-protein)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] font-medium'
                }`}
              >
                <div className="relative">
                  <Icono className={`w-5 h-5 transition-transform ${esActiva ? 'scale-110' : ''}`} />
                  {Boolean(tab.badge && tab.badge > 0) && (
                    <span className="absolute -top-1.5 -right-2 bg-[var(--accent-carb)] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center leading-tight">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
                {esActiva && (
                  <span className="absolute bottom-0.5 w-4 h-0.5 rounded-full bg-[var(--accent-protein)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Barra Lateral Escritorio (≥1024px) */}
      <aside
        aria-label="Barra lateral de navegación de escritorio"
        className="hidden lg:flex fixed top-[57px] bottom-0 left-0 w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] flex-col justify-between p-4 z-30"
      >
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-3 mb-2">
            Módulos Principales
          </p>
          {tabs.map((tab) => {
            const Icono = tab.icono;
            const esActiva = tabActiva === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onCambiarTab(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  esActiva
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icono
                    className={`w-5 h-5 ${
                      esActiva ? 'text-[var(--accent-protein)]' : 'text-[var(--text-muted)]'
                    }`}
                  />
                  <span>{tab.label}</span>
                </div>
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="bg-[var(--accent-carb)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pie de navegación desktop */}
        <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
          <p className="font-semibold text-[var(--text-primary)] mb-1">Local &amp; Privado</p>
          <p className="text-[11px] leading-relaxed">
            Sin legumbres • Precios Líder Casona • Datos en IndexedDB.
          </p>
        </div>
      </aside>
    </>
  );
};
