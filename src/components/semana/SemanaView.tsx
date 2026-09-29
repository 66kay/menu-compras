import React, { useState } from 'react';
import {
  Sparkles,
  Dumbbell,
  Pin,
  CalendarDays,
  Layers,
  ChevronRight,
} from 'lucide-react';
import type { PlanDia, Receta, PerfilUsuario } from '../../types';
import { generarSemana } from '../../logic/generador';
import { db } from '../../db';

interface SemanaViewProps {
  planSemana: PlanDia[];
  perfil: PerfilUsuario;
  todasLasRecetas: Receta[];
  fechaInicioLunes: string;
  onSeleccionarDia: (fecha: string) => void;
  onSemanaGenerada: () => void;
}

export const SemanaView: React.FC<SemanaViewProps> = ({
  planSemana,
  perfil,
  todasLasRecetas,
  fechaInicioLunes,
  onSeleccionarDia,
  onSemanaGenerada,
}) => {
  const [usarBatchCooking, setUsarBatchCooking] = useState<boolean>(true);
  const [generando, setGenerando] = useState<boolean>(false);

  const handleGenerar = async () => {
    setGenerando(true);
    try {
      const nuevosPlanes = generarSemana(
        fechaInicioLunes,
        perfil,
        todasLasRecetas,
        planSemana,
        usarBatchCooking
      );
      await db.plan.bulkPut(nuevosPlanes);
      onSemanaGenerada();
    } catch (err) {
      console.error('Error generando semana:', err);
    } finally {
      setGenerando(false);
    }
  };

  const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Resumen semanal acumulado
  const totalCalorias = planSemana.reduce((acc, d) => {
    const comidas = [
      d.comidas.desayuno,
      d.comidas.almuerzo,
      d.comidas.colacion,
      d.comidas.once,
      d.comidas.cena,
    ].filter(Boolean);
    return acc + comidas.reduce((sum, c) => sum + (c?.macros.calorias ?? 0), 0);
  }, 0);

  const totalProteina = planSemana.reduce((acc, d) => {
    const comidas = [
      d.comidas.desayuno,
      d.comidas.almuerzo,
      d.comidas.colacion,
      d.comidas.once,
      d.comidas.cena,
    ].filter(Boolean);
    return acc + comidas.reduce((sum, c) => sum + (c?.macros.proteinas ?? 0), 0);
  }, 0);

  const promedioCalorias = planSemana.length > 0 ? Math.round(totalCalorias / planSemana.length) : 0;
  const promedioProteina = planSemana.length > 0 ? Math.round(totalProteina / planSemana.length) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Cabecera y Controles de Generación */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[var(--accent-protein)]" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Plan Semanal Inteligente
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Ciclado de carbohidratos, variedad proteica y cero legumbres.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={usarBatchCooking}
                onChange={(e) => setUsarBatchCooking(e.target.checked)}
                className="rounded accent-[var(--accent-protein)]"
              />
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Cocinar en lote
              </span>
            </label>

            <button
              onClick={handleGenerar}
              disabled={generando}
              className="py-2.5 px-4 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-base)] text-xs font-bold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-[var(--accent-protein)]" />
              <span>{generando ? 'Generando...' : 'Generar Semana'}</span>
            </button>
          </div>
        </div>

        {/* Resumen Semanal Promedio */}
        {planSemana.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs">
            <div className="p-3 rounded-xl bg-[var(--bg-elevated)]">
              <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold block">
                Promedio Diario
              </span>
              <span className="font-bold text-[var(--text-primary)] text-sm tabular-nums">
                {promedioCalorias} kcal
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-elevated)]">
              <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold block">
                Proteína Promedio
              </span>
              <span className="font-bold text-[var(--accent-protein)] text-sm tabular-nums">
                {promedioProteina} g/día
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-elevated)]">
              <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold block">
                Sesiones Gym
              </span>
              <span className="font-bold text-[var(--text-primary)] text-sm">
                {planSemana.filter((d) => d.esDiaGym).length} días
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-elevated)]">
              <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold block">
                Días Descanso
              </span>
              <span className="font-bold text-[var(--text-primary)] text-sm">
                {planSemana.filter((d) => !d.esDiaGym).length} días
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Matriz Lunes a Domingo */}
      <div className="space-y-3">
        {planSemana.map((dia, idx) => {
          const nombreDia = diasNombres[idx] || `Día ${idx + 1}`;
          const comidas = [
            dia.comidas.desayuno,
            dia.comidas.almuerzo,
            dia.comidas.colacion,
            dia.comidas.once,
            dia.comidas.cena,
          ].filter(Boolean);

          const cals = comidas.reduce((sum, c) => sum + (c?.macros.calorias ?? 0), 0);
          const prot = comidas.reduce((sum, c) => sum + (c?.macros.proteinas ?? 0), 0);

          return (
            <div
              key={dia.fecha}
              onClick={() => onSeleccionarDia(dia.fecha)}
              className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-protein)]/50 transition-all cursor-pointer shadow-xs group"
            >
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm text-[var(--text-primary)]">{nombreDia}</span>
                  <span className="text-xs text-[var(--text-muted)] font-medium tabular-nums">
                    {dia.fecha}
                  </span>
                  {dia.esDiaGym ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-protein)]/15 text-[var(--accent-protein)]">
                      <Dumbbell className="w-3 h-3" /> Gym
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                      Descanso
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs tabular-nums">
                  <span className="font-semibold text-[var(--text-primary)]">{cals} kcal</span>
                  <span className="font-bold text-[var(--accent-protein)]">{prot}g P</span>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Vista rápida de almuerzo y cena */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
                <div className="p-2 rounded-lg bg-[var(--bg-elevated)]/60 flex items-center justify-between">
                  <span className="truncate">
                    <strong>Almuerzo:</strong> {dia.comidas.almuerzo?.recetaNombre ?? 'Sin asignar'}
                  </span>
                  {dia.comidas.almuerzo?.fijada && <Pin className="w-3 h-3 text-[var(--accent-protein)] shrink-0 ml-1" />}
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-elevated)]/60 flex items-center justify-between">
                  <span className="truncate">
                    <strong>Cena:</strong> {dia.comidas.cena?.recetaNombre ?? 'Sin asignar'}
                  </span>
                  {dia.comidas.cena?.fijada && <Pin className="w-3 h-3 text-[var(--accent-protein)] shrink-0 ml-1" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
