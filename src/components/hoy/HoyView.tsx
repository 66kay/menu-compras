import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  CheckCircle2,
  Circle,
  Pin,
  RefreshCw,
  ChefHat,
  Eye,
} from 'lucide-react';
import type { PlanDia, ComidaPlanificada, Receta, PerfilUsuario, CategoriaComida } from '../../types';
import { db } from '../../db';
import { fechaALocalISO, sumarDiasISO } from '../../logic/fechas';

interface HoyViewProps {
  planDia: PlanDia | null;
  perfil: PerfilUsuario;
  todasLasRecetas: Receta[];
  fechaSeleccionada: string;
  onCambiarFecha: (nuevaFecha: string) => void;
  onActualizarPlan: () => void;
  onVerRecetaDetalle: (receta: Receta) => void;
}

export const HoyView: React.FC<HoyViewProps> = ({
  planDia,
  perfil: _perfil,
  todasLasRecetas,
  fechaSeleccionada,
  onCambiarFecha,
  onActualizarPlan,
  onVerRecetaDetalle,
}) => {
  const [modalCambiarComida, setModalCambiarComida] = useState<{
    categoria: CategoriaComida;
    comidaActual: ComidaPlanificada;
  } | null>(null);

  // Navegación de fecha
  const ajustarDia = (delta: number) => {
    onCambiarFecha(sumarDiasISO(fechaSeleccionada, delta));
  };

  // Formato de fecha chilena
  const formatearFechaLarga = (fechaStr: string) => {
    const d = new Date(fechaStr + 'T00:00:00');
    return d.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const hoyISO = fechaALocalISO();
  const esHoy = fechaSeleccionada === hoyISO;

  // Cálculo de macros consumidos
  const comidasList = planDia
    ? [
        planDia.comidas.desayuno,
        planDia.comidas.almuerzo,
        planDia.comidas.colacion,
        planDia.comidas.once,
        planDia.comidas.cena,
      ].filter((c): c is ComidaPlanificada => c !== null)
    : [];

  const macrosConsumidos = comidasList
    .filter((c) => c.consumida)
    .reduce(
      (acc, c) => ({
        calorias: acc.calorias + c.macros.calorias,
        proteinas: acc.proteinas + c.macros.proteinas,
        carbohidratos: acc.carbohidratos + c.macros.carbohidratos,
        grasas: acc.grasas + c.macros.grasas,
        fibra: acc.fibra + c.macros.fibra,
      }),
      { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 }
    );

  const macrosTotalesPlanificados = comidasList.reduce(
    (acc, c) => ({
      calorias: acc.calorias + c.macros.calorias,
      proteinas: acc.proteinas + c.macros.proteinas,
      carbohidratos: acc.carbohidratos + c.macros.carbohidratos,
      grasas: acc.grasas + c.macros.grasas,
      fibra: acc.fibra + c.macros.fibra,
    }),
    { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 }
  );

  const metaDia = planDia?.metaDia ?? {
    calorias: 2800,
    proteinas: 220,
    carbohidratos: 250,
    grasas: 80,
    fibra: 35,
  };

  // Toggle consumida
  const handleToggleConsumida = async (categoria: CategoriaComida) => {
    if (!planDia) return;
    const comida = planDia.comidas[categoria];
    if (!comida) return;

    comida.consumida = !comida.consumida;
    await db.plan.put(planDia);
    onActualizarPlan();
  };

  // Toggle fijada
  const handleToggleFijada = async (categoria: CategoriaComida) => {
    if (!planDia) return;
    const comida = planDia.comidas[categoria];
    if (!comida) return;

    comida.fijada = !comida.fijada;
    await db.plan.put(planDia);
    onActualizarPlan();
  };

  // Reemplazar comida por otra receta
  const handleReemplazarComida = async (recetaNueva: Receta) => {
    if (!planDia || !modalCambiarComida) return;
    const cat = modalCambiarComida.categoria;

    planDia.comidas[cat] = {
      id: `c_${fechaSeleccionada}_${recetaNueva.id}`,
      recetaId: recetaNueva.id,
      recetaNombre: recetaNueva.nombre,
      porciones: 1,
      fijada: true, // Se fija automáticamente al ser elegida a mano
      consumida: false,
      tipoMomentoEntreno: modalCambiarComida.comidaActual.tipoMomentoEntreno,
      macros: recetaNueva.macrosPorPorcion,
    };

    await db.plan.put(planDia);
    setModalCambiarComida(null);
    onActualizarPlan();
  };

  const categoriasConfig: { id: CategoriaComida; label: string }[] = [
    { id: 'desayuno', label: 'Desayuno' },
    { id: 'almuerzo', label: 'Almuerzo' },
    { id: 'colacion', label: 'Colación' },
    { id: 'once', label: 'Once Chilena' },
    { id: 'cena', label: 'Cena' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Selector y Navegador de Fecha */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs">
        <button
          onClick={() => ajustarDia(-1)}
          aria-label="Día anterior"
          className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-bold text-[var(--text-primary)] capitalize">
              {formatearFechaLarga(fechaSeleccionada)}
            </span>
            {esHoy && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-protein)]/15 text-[var(--accent-protein)]">
                Hoy
              </span>
            )}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5 flex items-center justify-center gap-1.5">
            {planDia?.esDiaGym ? (
              <span className="text-[var(--accent-protein)] font-semibold flex items-center gap-1">
                <Dumbbell className="w-3 h-3" /> Día de Fuerza (~2h Gym)
              </span>
            ) : (
              <span>Día de Recuperación y Descanso</span>
            )}
          </div>
        </div>

        <button
          onClick={() => ajustarDia(1)}
          aria-label="Día siguiente"
          className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Panel de Metas Nutricionales y Barras de Progreso (Inicia en 0 cada nuevo día) */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
              Balance del Día
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {comidasList.filter((c) => c.consumida).length > 0
                ? `${macrosConsumidos.calorias} kcal consumidas (${comidasList.filter((c) => c.consumida).length}/5 comidas completadas)`
                : 'Inicia en 0 kcal. Al marcar cada comida como lista (✓), se suman tus calorías y macros.'}
            </p>
          </div>
          <div className="text-right tabular-nums">
            <span className="text-xl font-bold text-[var(--accent-protein)]">
              {macrosConsumidos.proteinas}g
            </span>
            <span className="text-xs text-[var(--text-muted)]"> / {metaDia.proteinas}g Prot</span>
          </div>
        </div>

        {/* Barras de Progreso: Empiezan en 0% y aumentan con cada comida consumida */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Calorías */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--text-secondary)] font-medium">Calorías Totales</span>
              <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                {macrosConsumidos.calorias} / {metaDia.calorias} kcal
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden">
              <div
                className="h-full bg-[var(--accent-carb)] transition-all duration-300"
                style={{
                  width: `${Math.min(100, (macrosConsumidos.calorias / metaDia.calorias) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Proteína */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--text-secondary)] font-medium">Proteína</span>
              <span className="font-semibold text-[var(--accent-protein)] tabular-nums">
                {macrosConsumidos.proteinas} / {metaDia.proteinas} g
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden">
              <div
                className="h-full bg-[var(--accent-protein)] transition-all duration-300"
                style={{
                  width: `${Math.min(100, (macrosConsumidos.proteinas / metaDia.proteinas) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Carbohidratos */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--text-secondary)] font-medium">Carbohidratos</span>
              <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                {macrosConsumidos.carbohidratos} / {metaDia.carbohidratos} g
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden">
              <div
                className="h-full bg-[var(--text-secondary)] transition-all duration-300"
                style={{
                  width: `${Math.min(100, (macrosConsumidos.carbohidratos / metaDia.carbohidratos) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Fibra */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--text-secondary)] font-medium">Fibra Dietética</span>
              <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                {macrosConsumidos.fibra} / {metaDia.fibra} g
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden">
              <div
                className="h-full bg-[#15803D] transition-all duration-300"
                style={{
                  width: `${Math.min(100, (macrosConsumidos.fibra / metaDia.fibra) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Indicador de menú planificado y calorías pendientes */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
          <span>Menú planificado para hoy: <strong>{macrosTotalesPlanificados.calorias} kcal</strong> ({macrosTotalesPlanificados.proteinas}g prote)</span>
          <span className="font-medium text-[var(--accent-protein)]">
            {metaDia.calorias - macrosConsumidos.calorias > 0
              ? `Faltan ${metaDia.calorias - macrosConsumidos.calorias} kcal`
              : '¡Meta diaria completada!'}
          </span>
        </div>
      </div>

      {/* Lista de las 5 Comidas */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">
          Comidas Programadas (5 al día)
        </h3>

        {categoriasConfig.map(({ id: catId, label }) => {
          const comida = planDia?.comidas[catId];
          const recetaOriginal = comida
            ? todasLasRecetas.find((r) => r.id === comida.recetaId)
            : null;

          if (!comida) {
            return (
              <div
                key={catId}
                className="p-4 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center text-xs text-[var(--text-muted)]"
              >
                No hay comida asignada a {label}. Genera la semana o asigna una receta.
              </div>
            );
          }

          return (
            <div
              key={catId}
              onClick={() => recetaOriginal && onVerRecetaDetalle(recetaOriginal)}
              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer hover:border-[var(--accent-protein)]/60 hover:shadow-md active:scale-[0.995] ${
                comida.consumida
                  ? 'bg-[var(--bg-elevated)]/60 border-[var(--border-subtle)] opacity-75'
                  : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Checkbox de Consumido */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleConsumida(catId);
                  }}
                  className="mt-0.5 text-[var(--accent-protein)] hover:scale-105 active:scale-90 transition-transform cursor-pointer shrink-0"
                  aria-label={comida.consumida ? 'Marcar como pendiente' : 'Marcar como consumida'}
                >
                  {comida.consumida ? (
                    <CheckCircle2 className="w-6 h-6 text-[var(--accent-protein)] fill-[var(--accent-protein)]/20" />
                  ) : (
                    <Circle className="w-6 h-6 text-[var(--text-muted)] hover:text-[var(--text-secondary)]" />
                  )}
                </button>

                {/* Contenido de la comida */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      {label}
                    </span>

                    {/* Badge Pre/Post Entreno */}
                    {comida.tipoMomentoEntreno === 'pre_entreno' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-carb)]/15 text-[var(--accent-carb)] border border-[var(--accent-carb)]/30">
                        ⚡ Pre-Entreno
                      </span>
                    )}
                    {comida.tipoMomentoEntreno === 'post_entreno' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-protein)]/15 text-[var(--accent-protein)] border border-[var(--accent-protein)]/30">
                        💪 Post-Entreno
                      </span>
                    )}

                    {comida.fijada && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)] flex items-center gap-0.5">
                        <Pin className="w-2.5 h-2.5" /> Fijada
                      </span>
                    )}
                  </div>

                  <div className="group/title">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm sm:text-base font-bold text-[var(--text-primary)] group-hover/title:text-[var(--accent-protein)] transition-colors ${
                          comida.consumida ? 'line-through text-[var(--text-muted)]' : ''
                        }`}
                      >
                        {comida.recetaNombre}
                      </h4>
                      <span className="text-[11px] text-[var(--accent-protein)] opacity-0 group-hover/title:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0 font-medium">
                        <Eye className="w-3.5 h-3.5" /> Ver receta y gramos
                      </span>
                    </div>

                    {/* Macros de la porción */}
                    <div className="flex items-center gap-3 mt-1.5 text-xs tabular-nums text-[var(--text-secondary)] flex-wrap">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {comida.macros.calorias} kcal
                      </span>
                      <span className="font-semibold text-[var(--accent-protein)]">
                        {comida.macros.proteinas}g Prot
                      </span>
                      <span>{comida.macros.carbohidratos}g Carb</span>
                      <span>{comida.macros.grasas}g Grasa</span>
                      <span className="text-[var(--text-muted)]">{comida.macros.fibra}g Fibra</span>
                    </div>
                  </div>

                  {/* Detalle visual de Ingredientes (Cuánto es de cada cosa) */}
                  {recetaOriginal && (
                    <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)]/70 group/ing">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-[11px] text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                          <ChefHat className="w-3.5 h-3.5 text-[var(--accent-protein)]" />
                          Cuánto es de cada cosa:
                        </span>
                        <span className="text-[11px] font-semibold text-[var(--accent-protein)] group-hover/ing:underline flex items-center gap-0.5">
                          Tocar receta para ver preparación
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {recetaOriginal.ingredientes.map((ing, i) => (
                          <div
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]/80 border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] transition-colors shadow-2xs"
                          >
                            <span className="font-bold text-[var(--accent-protein)] tabular-nums">
                              {ing.cantidad} {ing.unidad}
                            </span>
                            <span className="text-[var(--text-secondary)]">{ing.nombre}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Acciones de la comida (Fijar / Cambiar) */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFijada(catId);
                    }}
                    title={comida.fijada ? 'Desfijar comida' : 'Fijar comida (no cambiar al generar)'}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      comida.fijada
                        ? 'bg-[var(--accent-protein)]/15 text-[var(--accent-protein)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalCambiarComida({ categoria: catId, comidaActual: comida });
                    }}
                    title="Cambiar esta comida por otra receta"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para Cambiar Comida */}
      {modalCambiarComida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg max-h-[85vh] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Cambiar {modalCambiarComida.categoria}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Selecciona una receta chilena o gym (sin legumbres)
                </p>
              </div>
              <button
                onClick={() => setModalCambiarComida(null)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-2">
              {todasLasRecetas
                .filter((r) => r.categoria === modalCambiarComida.categoria)
                .map((receta) => (
                  <button
                    key={receta.id}
                    onClick={() => handleReemplazarComida(receta)}
                    className="w-full text-left p-3.5 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--accent-protein)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-sm text-[var(--text-primary)]">
                        {receta.nombre}
                      </span>
                      <span className="text-xs font-bold text-[var(--accent-protein)] tabular-nums shrink-0 ml-2">
                        {receta.macrosPorPorcion.proteinas}g Prot
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] tabular-nums">
                      <span>{receta.macrosPorPorcion.calorias} kcal</span>
                      <span>{receta.macrosPorPorcion.carbohidratos}g Carbs</span>
                      <span>⏱️ {receta.tiempoMinutos} min</span>
                      {receta.batchCooking && <span>📦 Batch</span>}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
