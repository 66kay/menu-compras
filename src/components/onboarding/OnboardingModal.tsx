import React, { useState } from 'react';
import { Dumbbell, ShieldCheck, Check } from 'lucide-react';
import type { PerfilUsuario, ObjetivoNutricional } from '../../types';
import { calcularTMB, calcularGET, calcularMetasBase } from '../../logic/nutricion';
import { db } from '../../db';

interface OnboardingModalProps {
  onCompletado: (perfil: PerfilUsuario) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onCompletado }) => {
  // Valores iniciales con las características del usuario (21 años, 191 cm, 137 kg, 4 días gym)
  const [edad, setEdad] = useState<number>(21);
  const [alturaCm, setAlturaCm] = useState<number>(191);
  const [pesoKg, setPesoKg] = useState<number>(137);
  const [diasGym, setDiasGym] = useState<number>(4);
  const [objetivo, setObjetivo] = useState<ObjetivoNutricional>('recomposicion');
  const [gramosProteina, setGramosProteina] = useState<number>(1.6);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Exclusiones de alimentos ambiguos (por defecto en false = excluidos de la dieta)
  const [exclusiones, setExclusiones] = useState({
    arvejasVerdes: false,
    porotosVerdes: false,
    mani: false,
    soyaTofu: false,
  });

  // Cálculo en tiempo real con Mifflin-St Jeor
  const tmbCalculada = calcularTMB(pesoKg, alturaCm, edad);
  const factorActividad = diasGym >= 5 ? 1.65 : 1.55;
  const getCalculado = calcularGET(tmbCalculada, factorActividad);

  const perfilTemporal: PerfilUsuario = {
    id: 'usuario_principal',
    edad,
    sexo: 'hombre',
    alturaCm,
    pesoActualKg: pesoKg,
    diasGymSemana: diasGym,
    duracionEntrenoHoras: 2,
    factorActividad,
    objetivo,
    gramosProteinaPorKg: gramosProteina,
    deficitsKcal: -250,
    exclusionesAmbiguas: exclusiones,
    sucursalLiderPreferida: 'Líder Casona, Osorno',
    cupoMensualCocaColaZero: 8,
    cupoMensualAntojos: 4,
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
  };

  const metas = calcularMetasBase(perfilTemporal);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await db.perfil.put(perfilTemporal);
      onCompletado(perfilTemporal);
    } catch (err) {
      console.error('Error al guardar perfil en IndexedDB:', err);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-protein)]/15 border border-[var(--accent-protein)]/30 flex items-center justify-center text-[var(--accent-protein)]">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Bienvenido a Menú &amp; Compras
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Configura tus métricas iniciales para calcular tu nutrición deportiva.
            </p>
          </div>
        </div>

        {/* Garantía de Privacidad Local-First */}
        <div className="mb-6 p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-start gap-3 text-xs text-[var(--text-secondary)]">
          <ShieldCheck className="w-4 h-4 text-[var(--accent-protein)] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[var(--text-primary)] block mb-0.5">
              Privacidad Absoluta Local-First
            </span>
            Tus datos corporales jamás saldrán de tu dispositivo. Residen exclusivamente en el almacenamiento local de tu navegador (IndexedDB).
          </div>
        </div>

        <form onSubmit={handleGuardar} className="space-y-5">
          {/* Métricas Corporales */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Edad (años)
              </label>
              <input
                type="number"
                min="16"
                max="90"
                value={edad}
                onChange={(e) => setEdad(Number(e.target.value))}
                className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium tabular-nums"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Altura (cm)
              </label>
              <input
                type="number"
                min="140"
                max="230"
                value={alturaCm}
                onChange={(e) => setAlturaCm(Number(e.target.value))}
                className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium tabular-nums"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Peso Actual (kg)
              </label>
              <input
                type="number"
                min="50"
                max="250"
                step="0.5"
                value={pesoKg}
                onChange={(e) => setPesoKg(Number(e.target.value))}
                className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium tabular-nums"
                required
              />
            </div>
          </div>

          {/* Rutina de Fuerza y Objetivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Entrenamiento de fuerza
              </label>
              <select
                value={diasGym}
                onChange={(e) => setDiasGym(Number(e.target.value))}
                className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
              >
                <option value={3}>3 días por semana (~2h/sesión)</option>
                <option value={4}>4 días por semana (~2h/sesión)</option>
                <option value={5}>5 días por semana (~2h/sesión)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Objetivo principal
              </label>
              <select
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value as ObjetivoNutricional)}
                className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
              >
                <option value="recomposicion">Recomposición (Bajar grasa + Ganar músculo)</option>
                <option value="bajar_grasa">Bajar grasa (Déficit moderado)</option>
                <option value="subir_musculo">Subir músculo (Superávit leve)</option>
                <option value="mantener">Mantenimiento calórico</option>
              </select>
            </div>
          </div>

          {/* Proteína por kg */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Proteína diaria (g/kg de peso)
              </label>
              <span className="text-xs font-bold text-[var(--accent-protein)] tabular-nums">
                {gramosProteina} g/kg ({Math.round(pesoKg * gramosProteina)}g netos)
              </span>
            </div>
            <input
              type="range"
              min="1.4"
              max="2.2"
              step="0.1"
              value={gramosProteina}
              onChange={(e) => setGramosProteina(Number(e.target.value))}
              className="w-full accent-[var(--accent-protein)] cursor-pointer"
            />
          </div>

          {/* Tarjeta de Resumen en Tiempo Real de Fórmulas */}
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)]">Fórmula Mifflin-St Jeor (TMB):</span>
              <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                {tmbCalculada.toLocaleString('es-CL')} kcal
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)]">Mantenimiento estimado (GET):</span>
              <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                {getCalculado.toLocaleString('es-CL')} kcal
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[var(--accent-carb)] uppercase tracking-wide block">
                  Meta Diaria Recomendada
                </span>
                <span className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                  {metas.caloriasObjetivo.toLocaleString('es-CL')} kcal
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[var(--accent-protein)] uppercase tracking-wide block">
                  Proteína Meta
                </span>
                <span className="text-xl font-bold text-[var(--accent-protein)] tabular-nums">
                  {metas.proteinasGramos} g/día
                </span>
              </div>
            </div>
          </div>

          {/* Exclusión de legumbres */}
          <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs">
            <span className="font-semibold text-[var(--text-primary)] block mb-1">
              Filtro de Ingredientes:
            </span>
            <p className="text-[var(--text-muted)] mb-2">
              ✓ <strong>Cero legumbres garantizado</strong>: Lentejas, porotos, garbanzos y derivados jamás aparecerán en tus comidas.
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-secondary)]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exclusiones.arvejasVerdes}
                  onChange={(e) =>
                    setExclusiones({ ...exclusiones, arvejasVerdes: e.target.checked })
                  }
                  className="rounded"
                />
                <span>Permitir arvejas verdes</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exclusiones.porotosVerdes}
                  onChange={(e) =>
                    setExclusiones({ ...exclusiones, porotosVerdes: e.target.checked })
                  }
                  className="rounded"
                />
                <span>Permitir porotos verdes</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exclusiones.mani}
                  onChange={(e) =>
                    setExclusiones({ ...exclusiones, mani: e.target.checked })
                  }
                  className="rounded"
                />
                <span>Permitir maní</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exclusiones.soyaTofu}
                  onChange={(e) =>
                    setExclusiones({ ...exclusiones, soyaTofu: e.target.checked })
                  }
                  className="rounded"
                />
                <span>Permitir soya / tofu</span>
              </label>
            </div>
          </div>

          {/* Botón de Entrada */}
          <button
            type="submit"
            disabled={guardando}
            className="w-full py-3 px-4 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-base)] font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-md"
          >
            <Check className="w-4 h-4" />
            <span>{guardando ? 'Guardando...' : 'Comenzar a Planificar Mis Comidas'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
