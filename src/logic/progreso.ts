import type { RegistroProgreso, SugerenciaAjuste } from '../types';

/**
 * Calcula la media móvil de los últimos 7 registros (o días) para suavizar
 * las variaciones de agua, glucógeno y tránsito intestinal.
 */
export function calcularMediaMovil(registros: RegistroProgreso[], ventana: number = 7): number | null {
  if (registros.length === 0) return null;

  // Ordenar cronológicamente ascendente
  const ordenados = [...registros].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  const muestra = ordenados.slice(-ventana);
  const suma = muestra.reduce((acc, r) => acc + r.pesoKg, 0);
  return Math.round((suma / muestra.length) * 10) / 10;
}

/**
 * Analiza la tendencia de los registros y genera sugerencias de ajuste calórico.
 * REGLA DE ORO: Las sugerencias SIEMPRE requieren confirmación explícita del usuario.
 */
export function analizarTendenciaYGenerarSugerencia(
  registros: RegistroProgreso[],
  pesoActual: number
): SugerenciaAjuste | null {
  if (registros.length < 4) {
    return null; // Aún no hay suficientes datos para una tendencia fiable
  }

  const ordenados = [...registros].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  const mediaReciente = calcularMediaMovil(ordenados.slice(-4), 4) ?? pesoActual;
  const mediaAnterior = calcularMediaMovil(ordenados.slice(-8, -4), 4) ?? mediaReciente;

  const deltaKg = mediaReciente - mediaAnterior;
  const variacionPorcentualSemanal = (deltaKg / mediaAnterior) * 100;

  // Caso 1: Pérdida acelerada (> 1.0% de peso en una semana)
  // Riesgo alto de pérdida de masa muscular en déficit excesivo
  if (variacionPorcentualSemanal < -1.0) {
    return {
      tipo: 'alerta_rapida',
      titulo: 'Pérdida de peso más rápida de lo recomendado',
      mensaje: `Has bajado un ${Math.abs(variacionPorcentualSemanal).toFixed(1)}% de tu peso esta semana (${Math.abs(deltaKg).toFixed(1)} kg). Para blindar tu masa muscular y no perder fuerza en el gimnasio, se sugiere aumentar ligeramente la ingesta calórica.`,
      deltaCaloriasRecomendado: 150,
      pesoMedioActual: mediaReciente,
      variacionPorcentualSemanal,
      requiereConfirmacion: true,
    };
  }

  // Caso 2: Estancamiento prolongado (variación entre -0.1% y +0.1% por varias semanas)
  if (registros.length >= 8 && Math.abs(variacionPorcentualSemanal) < 0.15) {
    return {
      tipo: 'estancamiento',
      titulo: 'Ritmo estable / Posible estancamiento',
      mensaje: `Tu peso medio se ha mantenido en ${mediaReciente.toFixed(1)} kg en las últimas semanas. Si tu objetivo prioritario es seguir bajando grasa corporal, podrías considerar un ajuste leve de déficit.`,
      deltaCaloriasRecomendado: -150,
      pesoMedioActual: mediaReciente,
      variacionPorcentualSemanal,
      requiereConfirmacion: true,
    };
  }

  // Caso 3: Ritmo óptimo de recomposición (-0.3% a -0.8% semanal)
  if (variacionPorcentualSemanal <= -0.2 && variacionPorcentualSemanal >= -1.0) {
    return {
      tipo: 'mantener',
      titulo: 'Ritmo de recomposición óptimo',
      mensaje: `Excelente progreso: estás reduciendo grasa a un ritmo controlado (${Math.abs(deltaKg).toFixed(1)} kg/sem) que protege al 100% tu tejido muscular. Mantén las calorías actuales.`,
      deltaCaloriasRecomendado: 0,
      pesoMedioActual: mediaReciente,
      variacionPorcentualSemanal,
      requiereConfirmacion: true,
    };
  }

  return null;
}
