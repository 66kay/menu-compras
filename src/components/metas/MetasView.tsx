import React, { useState } from 'react';
import {
  Target,
  Scale,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  Coffee,
} from 'lucide-react';
import type {
  PerfilUsuario,
  RegistroProgreso,
  SugerenciaAjuste,
  ObjetivoNutricional,
} from '../../types';
import { calcularMetasBase } from '../../logic/nutricion';
import { calcularMediaMovil, analizarTendenciaYGenerarSugerencia } from '../../logic/progreso';
import { db } from '../../db';

interface MetasViewProps {
  perfil: PerfilUsuario;
  registrosProgreso: RegistroProgreso[];
  onActualizarPerfil: (perfil: PerfilUsuario) => void;
  onActualizarRegistros: () => void;
}

export const MetasView: React.FC<MetasViewProps> = ({
  perfil,
  registrosProgreso,
  onActualizarPerfil,
  onActualizarRegistros,
}) => {
  // Estado de edición del perfil
  const [edad, setEdad] = useState<number>(perfil.edad);
  const [alturaCm, setAlturaCm] = useState<number>(perfil.alturaCm);
  const [pesoActualKg, setPesoActualKg] = useState<number>(perfil.pesoActualKg);
  const [diasGym, setDiasGym] = useState<number>(perfil.diasGymSemana);
  const [objetivo, setObjetivo] = useState<ObjetivoNutricional>(perfil.objetivo);
  const [gramosProteina, setGramosProteina] = useState<number>(perfil.gramosProteinaPorKg);
  const [guardadoExitoso, setGuardadoExitoso] = useState<boolean>(false);

  // Registro de nuevo pesaje
  const [modalNuevoPeso, setModalNuevoPeso] = useState<boolean>(false);
  const [fechaNuevoPeso, setFechaNuevoPeso] = useState<string>(
    () => new Date().toISOString().split('T')[0] || ''
  );
  const [pesoInput, setPesoInput] = useState<string>(perfil.pesoActualKg.toString());
  const [cinturaInput, setCinturaInput] = useState<string>('');
  const [notasInput, setNotasInput] = useState<string>('');

  // Contador de gustos del mes
  const [latasConsumidas, setLatasConsumidas] = useState<number>(3);
  const [antojosConsumidos, setAntojosConsumidos] = useState<number>(1);

  // Fórmulas
  const factorActividad = diasGym >= 5 ? 1.65 : 1.55;
  const perfilActivo: PerfilUsuario = {
    ...perfil,
    edad,
    alturaCm,
    pesoActualKg,
    diasGymSemana: diasGym,
    factorActividad,
    objetivo,
    gramosProteinaPorKg: gramosProteina,
  };

  const metas = calcularMetasBase(perfilActivo);
  const mediaMovil = calcularMediaMovil(registrosProgreso, 7);
  const sugerencia = analizarTendenciaYGenerarSugerencia(
    registrosProgreso,
    mediaMovil ?? pesoActualKg
  );

  // Guardar perfil
  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    const actualizado: PerfilUsuario = {
      ...perfilActivo,
      actualizadoEn: new Date().toISOString(),
    };
    await db.perfil.put(actualizado);
    onActualizarPerfil(actualizado);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 2500);
  };

  // Agregar pesaje
  const handleAgregarPesaje = async (e: React.FormEvent) => {
    e.preventDefault();
    const pesoNum = Number(pesoInput);
    if (!pesoNum || pesoNum <= 0) return;

    const nuevo: RegistroProgreso = {
      id: `reg_${Date.now()}`,
      fecha: fechaNuevoPeso,
      pesoKg: pesoNum,
      cinturaCm: cinturaInput ? Number(cinturaInput) : undefined,
      notas: notasInput,
      creadoEn: new Date().toISOString(),
    };

    await db.registros.put(nuevo);

    // Actualizar también peso actual en perfil
    const perfilConNuevoPeso = {
      ...perfil,
      pesoActualKg: pesoNum,
    };
    await db.perfil.put(perfilConNuevoPeso);
    onActualizarPerfil(perfilConNuevoPeso);

    setModalNuevoPeso(false);
    onActualizarRegistros();
  };

  // Eliminar pesaje
  const handleEliminarPesaje = async (id: string) => {
    await db.registros.delete(id);
    onActualizarRegistros();
  };

  // Aceptar sugerencia adaptativa
  const handleAplicarSugerencia = async (sug: SugerenciaAjuste) => {
    const nuevoDeficit = perfil.deficitsKcal + sug.deltaCaloriasRecomendado;
    const actualizado: PerfilUsuario = {
      ...perfil,
      deficitsKcal: nuevoDeficit,
      actualizadoEn: new Date().toISOString(),
    };
    await db.perfil.put(actualizado);
    onActualizarPerfil(actualizado);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Banner de Sugerencia Adaptativa (si existe) */}
      {sugerencia && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--accent-protein)] shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[var(--accent-protein)] shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                  {sugerencia.titulo}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-protein)]/15 text-[var(--accent-protein)]">
                  Requiere tu confirmación
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                {sugerencia.mensaje}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs">
            {sugerencia.deltaCaloriasRecomendado !== 0 && (
              <button
                onClick={() => handleAplicarSugerencia(sugerencia)}
                className="px-3.5 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-base)] font-bold flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>
                  Aplicar ajuste ({sugerencia.deltaCaloriasRecomendado > 0 ? '+' : ''}
                  {sugerencia.deltaCaloriasRecomendado} kcal)
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Editor de Parámetros Nutricionales */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--accent-protein)]" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Fórmula Metabólica (Mifflin-St Jeor)
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Cálculo transparente basado en tu composición corporal y días de fuerza.
            </p>
          </div>
        </div>

        <form onSubmit={handleGuardarPerfil} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Edad (años)
              </label>
              <input
                type="number"
                value={edad}
                onChange={(e) => setEdad(Number(e.target.value))}
                className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium tabular-nums"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Altura (cm)
              </label>
              <input
                type="number"
                value={alturaCm}
                onChange={(e) => setAlturaCm(Number(e.target.value))}
                className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium tabular-nums"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Peso Actual (kg)
              </label>
              <input
                type="number"
                step="0.5"
                value={pesoActualKg}
                onChange={(e) => setPesoActualKg(Number(e.target.value))}
                className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium tabular-nums"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Días Gym
              </label>
              <select
                value={diasGym}
                onChange={(e) => setDiasGym(Number(e.target.value))}
                className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
              >
                <option value={3}>3 días</option>
                <option value={4}>4 días</option>
                <option value={5}>5 días</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Objetivo Nutricional
              </label>
              <select
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value as ObjetivoNutricional)}
                className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
              >
                <option value="recomposicion">Recomposición (-250 kcal + alta proteína)</option>
                <option value="bajar_grasa">Bajar grasa (-400 kcal)</option>
                <option value="subir_musculo">Subir músculo (+250 kcal)</option>
                <option value="mantener">Mantenimiento (0 kcal)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-[var(--text-secondary)]">
                  Proteína diaria (g/kg)
                </label>
                <span className="font-bold text-[var(--accent-protein)] tabular-nums">
                  {gramosProteina} g/kg ({Math.round(pesoActualKg * gramosProteina)}g netos)
                </span>
              </div>
              <input
                type="range"
                min="1.4"
                max="2.2"
                step="0.1"
                value={gramosProteina}
                onChange={(e) => setGramosProteina(Number(e.target.value))}
                className="w-full accent-[var(--accent-protein)] cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Tarjeta de Fórmulas y Piso de Seguridad */}
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">TMB Basal (Mifflin-St Jeor):</span>
              <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                {metas.tmb.toLocaleString('es-CL')} kcal
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Gasto Energético Total (Mantenimiento):</span>
              <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                {metas.get.toLocaleString('es-CL')} kcal
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
              <div>
                <span className="font-bold text-[var(--accent-carb)] uppercase tracking-wide block text-[11px]">
                  Meta Calórica Diaria Promedio
                </span>
                <span className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                  {metas.caloriasObjetivo.toLocaleString('es-CL')} kcal
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-[var(--accent-protein)] uppercase tracking-wide block text-[11px]">
                  Proteína Objetivo
                </span>
                <span className="text-xl font-bold text-[var(--accent-protein)] tabular-nums">
                  {metas.proteinasGramos} g/día
                </span>
              </div>
            </div>

            {metas.esPisoSeguridadAplicado && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-500 pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Piso de seguridad activo: La meta calórica no puede descender de tu TMB basal.
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 items-center">
            {guardadoExitoso && (
              <span className="text-xs text-[var(--accent-protein)] font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Parámetros actualizados
              </span>
            )}
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-base)] text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>

      {/* Historial y Media Móvil de 7 Días */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-[var(--accent-protein)]" />
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Registro de Peso &amp; Media Móvil
              </h3>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              La media móvil amortigua las retenciones de agua y glucógeno del entrenamiento.
            </p>
          </div>

          <button
            onClick={() => setModalNuevoPeso(true)}
            className="px-3 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-base)] text-xs font-bold flex items-center gap-1 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Pesaje</span>
          </button>
        </div>

        {/* Indicador de Media Móvil */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">
              Último Registro
            </span>
            <span className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
              {perfil.pesoActualKg} kg
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">
              Media Móvil (7 días)
            </span>
            <span className="text-lg font-bold text-[var(--accent-protein)] tabular-nums">
              {mediaMovil !== null ? `${mediaMovil} kg` : 'Sin datos suficientes'}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">
              Registros Totales
            </span>
            <span className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
              {registrosProgreso.length} pesajes
            </span>
          </div>
        </div>

        {/* Lista de Registros */}
        <div className="space-y-2 pt-2">
          {registrosProgreso.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] text-center py-4">
              Aún no tienes registros de pesaje. Agrega tu primer pesaje matutino en ayunas.
            </p>
          ) : (
            registrosProgreso.slice(-5).map((reg) => (
              <div
                key={reg.id}
                className="p-3 rounded-xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-[var(--text-primary)] tabular-nums mr-2">
                    {reg.fecha}
                  </span>
                  {reg.cinturaCm && (
                    <span className="text-[var(--text-muted)] tabular-nums mr-2">
                      Cintura: {reg.cinturaCm} cm
                    </span>
                  )}
                  {reg.notas && <span className="text-[var(--text-muted)] italic">({reg.notas})</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-[var(--accent-protein)] tabular-nums">
                    {reg.pesoKg} kg
                  </span>
                  <button
                    onClick={() => handleEliminarPesaje(reg.id)}
                    className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Módulo: Gustos del Mes (Sin Culpa) */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-[var(--accent-carb)]" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Gustos del Mes (Sin Culpa)
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Flexibilidad sostenible: cupos mensuales planificados para Coca-Cola Zero y antojos libres.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Coca-Cola Zero */}
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--text-primary)]">Coca-Cola Sin Azúcar</span>
              <span className="font-bold text-[var(--accent-protein)] tabular-nums">
                {latasConsumidas} / {perfil.cupoMensualCocaColaZero} consumidas
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Tip de compra en Líder Casona: la botella retornable de 2.5L rinde a $756/L (el mejor precio por litro).
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setLatasConsumidas(Math.max(0, latasConsumidas - 1))}
                className="px-2 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              >
                -1
              </button>
              <button
                onClick={() => setLatasConsumidas(latasConsumidas + 1)}
                className="px-2 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] font-semibold"
              >
                +1 lata/vaso
              </button>
            </div>
          </div>

          {/* Antojos / Dulces */}
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--text-primary)]">Antojos / Dulces del Mes</span>
              <span className="font-bold text-[var(--accent-carb)] tabular-nums">
                {antojosConsumidos} / {perfil.cupoMensualAntojos} ocasiones
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Permite disfrutar sin culpa ni remordimientos, contabilizándolo dentro de tu adherencia mensual.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setAntojosConsumidos(Math.max(0, antojosConsumidos - 1))}
                className="px-2 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              >
                -1
              </button>
              <button
                onClick={() => setAntojosConsumidos(antojosConsumidos + 1)}
                className="px-2 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] font-semibold"
              >
                +1 ocasión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Nuevo Pesaje */}
      {modalNuevoPeso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Registrar Pesaje Matutino</h3>
              <p className="text-xs text-[var(--text-muted)]">En ayunas al despertar</p>
            </div>

            <form onSubmit={handleAgregarPesaje} className="space-y-3">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Fecha</label>
                <input
                  type="date"
                  value={fechaNuevoPeso}
                  onChange={(e) => setFechaNuevoPeso(e.target.value)}
                  className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  Peso Corporal (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pesoInput}
                  onChange={(e) => setPesoInput(e.target.value)}
                  className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold tabular-nums"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  Cintura (cm) - Opcional
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="Ej: 104"
                  value={cinturaInput}
                  onChange={(e) => setCinturaInput(e.target.value)}
                  className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] tabular-nums"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  Notas (sensaciones, sueño, etc.)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Buena energía en el entreno de ayer"
                  value={notasInput}
                  onChange={(e) => setNotasInput(e.target.value)}
                  className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNuevoPeso(false)}
                  className="px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-base)] text-xs font-bold shadow-xs cursor-pointer"
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
