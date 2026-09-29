import React from 'react';
import { Dumbbell, Moon, Sun, ShieldCheck } from 'lucide-react';
import type { PerfilUsuario } from '../../types';

interface HeaderProps {
  perfil: PerfilUsuario | null;
  esDiaGym?: boolean;
  caloriasConsumidas?: number;
  caloriasMeta?: number;
  proteinaConsumida?: number;
  proteinaMeta?: number;
}

export const Header: React.FC<HeaderProps> = ({
  perfil,
  esDiaGym = false,
  caloriasConsumidas = 0,
  caloriasMeta = 0,
  proteinaConsumida = 0,
  proteinaMeta = 0,
}) => {
  const [esOscuro, setEsOscuro] = React.useState(true);

  React.useEffect(() => {
    // Modo oscuro activado por defecto (Basalt & Lime)
    document.documentElement.classList.add('dark');
  }, []);

  const toggleModo = () => {
    setEsOscuro(!esOscuro);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/95 backdrop-blur-md pt-[calc(0.75rem+env(safe-area-inset-top))] px-4 pb-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Marca y Subtítulo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-protein)] shadow-xs">
            <span className="font-bold text-base tracking-tighter">M&amp;C</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-[var(--text-primary)] leading-tight tracking-tight">
                Menú &amp; Compras
              </h1>
              {esDiaGym ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[var(--accent-protein)]/15 text-[var(--accent-protein)] border border-[var(--accent-protein)]/30">
                  <Dumbbell className="w-3 h-3" />
                  Gym
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  Descanso
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-medium">
              {perfil?.sucursalLiderPreferida ?? 'Líder Casona, Osorno'}
            </p>
          </div>
        </div>

        {/* Resumen Compacto Rápido & Acciones */}
        <div className="flex items-center gap-2">
          {caloriasMeta > 0 && (
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs tabular-nums">
              <div>
                <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold block">Calorías</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {caloriasConsumidas} <span className="text-[var(--text-muted)] font-normal">/ {caloriasMeta}</span>
                </span>
              </div>
              <div className="w-px h-6 bg-[var(--border-subtle)]" />
              <div>
                <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold block">Proteína</span>
                <span className="font-semibold text-[var(--accent-protein)]">
                  {proteinaConsumida}g <span className="text-[var(--text-muted)] font-normal">/ {proteinaMeta}g</span>
                </span>
              </div>
            </div>
          )}

          <div
            title="Datos guardados exclusivamente en tu dispositivo (Local-First IndexedDB)"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-help"
          >
            <ShieldCheck className="w-4 h-4 text-[var(--accent-protein)]" />
          </div>

          <button
            onClick={toggleModo}
            aria-label="Cambiar tema visual"
            className="w-9 h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {esOscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
