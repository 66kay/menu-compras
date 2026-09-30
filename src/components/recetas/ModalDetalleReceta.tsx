import React, { useEffect } from 'react';
import { X, Clock, Flame, Dumbbell, Apple, Droplet, Sparkles, ChefHat } from 'lucide-react';
import type { Receta } from '../../types';

interface ModalDetalleRecetaProps {
  receta: Receta | null;
  onCerrar: () => void;
}

export const ModalDetalleReceta: React.FC<ModalDetalleRecetaProps> = ({ receta, onCerrar }) => {
  // Cerrar con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCerrar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCerrar]);

  if (!receta) return null;

  const categoriaNombre = {
    desayuno: 'Desayuno',
    almuerzo: 'Almuerzo',
    colacion: 'Colación / Snack',
    once: 'Once Chilena',
    cena: 'Cena',
  }[receta.categoria] || receta.categoria;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 overflow-y-auto shadow-2xl space-y-5 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-protein)]/15 text-[var(--accent-protein)] border border-[var(--accent-protein)]/30">
                {categoriaNombre}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)]">
                <Clock className="w-3.5 h-3.5 text-[var(--accent-carb)]" />
                {receta.tiempoMinutos} min de cocina
              </span>
              {receta.aptaPreEntreno && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-carb)]/15 text-[var(--accent-carb)]">
                  ⚡ Pre-Entreno
                </span>
              )}
              {receta.aptaPostEntreno && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                  💪 Post-Entreno
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] leading-snug">
              {receta.nombre}
            </h3>
            {receta.descripcion && (
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {receta.descripcion}
              </p>
            )}
          </div>

          <button
            onClick={onCerrar}
            title="Cerrar (Esc)"
            className="w-8 h-8 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]/80 text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resumen de Macros por Porción */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs tabular-nums p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <div>
            <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase flex items-center justify-center gap-0.5">
              <Flame className="w-3 h-3 text-[var(--accent-carb)]" /> Cals
            </span>
            <span className="font-bold text-[var(--text-primary)] text-sm">
              {receta.macrosPorPorcion.calorias}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--accent-protein)] font-semibold uppercase flex items-center justify-center gap-0.5">
              <Dumbbell className="w-3 h-3 text-[var(--accent-protein)]" /> Prot
            </span>
            <span className="font-bold text-[var(--accent-protein)] text-sm">
              {receta.macrosPorPorcion.proteinas}g
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase flex items-center justify-center gap-0.5">
              <Apple className="w-3 h-3 text-emerald-500" /> Carbs
            </span>
            <span className="font-bold text-[var(--text-primary)] text-sm">
              {receta.macrosPorPorcion.carbohidratos}g
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase flex items-center justify-center gap-0.5">
              <Droplet className="w-3 h-3 text-amber-500" /> Grasas
            </span>
            <span className="font-bold text-[var(--text-primary)] text-sm">
              {receta.macrosPorPorcion.grasas}g
            </span>
          </div>
        </div>

        {/* LISTADO EXACTO DE INGREDIENTES Y CANTIDADES (Lo solicitado por el usuario) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <ChefHat className="w-4 h-4 text-[var(--accent-protein)]" />
              Cuánto es de cada cosa ({receta.porciones} porción):
            </h4>
            <span className="text-[11px] text-[var(--text-muted)]">Medida exacta</span>
          </div>

          <div className="space-y-1.5">
            {receta.ingredientes.map((ing, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-protein)] shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate">
                    {ing.nombre}
                  </span>
                  {ing.opcional && (
                    <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
                      opcional
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-[var(--accent-protein)]/15 border border-[var(--accent-protein)]/30 text-xs sm:text-sm font-bold text-[var(--accent-protein)] tabular-nums">
                    {ing.cantidad} {ing.unidad}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instrucciones Paso a Paso de Cocina */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[var(--accent-carb)]" />
            Cómo prepararlo (Paso a Paso):
          </h4>
          <div className="space-y-2">
            {receta.instrucciones.map((inst, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-2.5 rounded-xl bg-[var(--bg-elevated)]/40 border border-[var(--border-subtle)]/50 text-xs leading-relaxed text-[var(--text-secondary)]"
              >
                <span className="w-5 h-5 rounded-full bg-[var(--accent-carb)]/15 text-[var(--accent-carb)] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[var(--text-primary)] flex-1">{inst}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Botón de cierre inferior */}
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <button
            onClick={onCerrar}
            className="w-full py-2.5 rounded-xl bg-[var(--accent-protein)] hover:bg-[var(--accent-protein)]/90 text-[var(--bg-base)] text-xs font-bold transition-all cursor-pointer shadow-md active:scale-[0.98]"
          >
            Entendido, cerrar receta
          </button>
        </div>
      </div>
    </div>
  );
};
