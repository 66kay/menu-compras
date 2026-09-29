import type {
  PerfilUsuario,
  Receta,
  PlanDia,
  ComidaPlanificada,
  Macros,
} from '../types';
import { calcularMetasDia } from './nutricion';

const PALABRAS_PROHIBIDAS_LEGUMBRES = [
  'lenteja',
  'lentejas',
  'poroto',
  'porotos',
  'garbanzo',
  'garbanzos',
  'arveja seca',
  'arvejas secas',
  'haba seca',
  'habas secas',
  'hummus',
  'harina de garbanzo',
  'harina de lenteja',
];

/**
 * Valida si una receta contiene alguna legumbre prohibida o ingredientes ambiguos excluidos.
 */
export function esRecetaPermitida(receta: Receta, perfil: PerfilUsuario): boolean {
  const textoCompleto = `${receta.nombre} ${receta.descripcion ?? ''} ${receta.ingredientes
    .map((i) => i.nombre)
    .join(' ')}`.toLowerCase();

  // 1. Prohibición estricta absoluta de legumbres
  for (const palabra of PALABRAS_PROHIBIDAS_LEGUMBRES) {
    if (textoCompleto.includes(palabra)) {
      return false;
    }
  }

  // 2. Toggles de alimentos ambiguos (por defecto excluidos)
  const exc = perfil.exclusionesAmbiguas;
  if (!exc.arvejasVerdes && (textoCompleto.includes('arveja') || textoCompleto.includes('arvejas'))) {
    return false;
  }
  if (!exc.porotosVerdes && (textoCompleto.includes('poroto verde') || textoCompleto.includes('porotos verdes'))) {
    return false;
  }
  if (!exc.mani && (textoCompleto.includes('maní') || textoCompleto.includes('mani') || textoCompleto.includes('cacahuate'))) {
    return false;
  }
  if (!exc.soyaTofu && (textoCompleto.includes('soya') || textoCompleto.includes('soja') || textoCompleto.includes('tofu'))) {
    return false;
  }

  return true;
}

/**
 * Suma los macros de las 5 comidas planificadas de un día.
 */
export function calcularMacrosConsumidosDia(planDia: PlanDia): Macros {
  const comidas = [
    planDia.comidas.desayuno,
    planDia.comidas.almuerzo,
    planDia.comidas.colacion,
    planDia.comidas.once,
    planDia.comidas.cena,
  ].filter((c): c is ComidaPlanificada => c !== null);

  return comidas.reduce(
    (acc, curr) => ({
      calorias: acc.calorias + curr.macros.calorias,
      proteinas: acc.proteinas + curr.macros.proteinas,
      carbohidratos: acc.carbohidratos + curr.macros.carbohidratos,
      grasas: acc.grasas + curr.macros.grasas,
      fibra: acc.fibra + curr.macros.fibra,
    }),
    { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 }
  );
}

/**
 * Generador de Plan Semanal Inteligente
 */
export function generarSemana(
  fechaInicioLunes: string, // YYYY-MM-DD
  perfil: PerfilUsuario,
  recetasDisponibles: Receta[],
  planesExistentes: PlanDia[] = [],
  usarBatchCooking: boolean = true
): PlanDia[] {
  // Filtrar recetas seguras sin legumbres
  const recetasValidas = recetasDisponibles.filter((r) => esRecetaPermitida(r, perfil));

  const desayunos = recetasValidas.filter((r) => r.categoria === 'desayuno');
  const almuerzos = recetasValidas.filter((r) => r.categoria === 'almuerzo');
  const colaciones = recetasValidas.filter((r) => r.categoria === 'colacion');
  const onces = recetasValidas.filter((r) => r.categoria === 'once');
  const cenas = recetasValidas.filter((r) => r.categoria === 'cena');

  // Determinar días de gym según frecuencia (ej: 4 días = Lun, Mar, Jue, Vie; 5 días = Lun, Mar, Mié, Vie, Sáb)
  const esGymPorDiaIndice = (diaIdx: number): boolean => {
    if (perfil.diasGymSemana === 4) return diaIdx === 0 || diaIdx === 1 || diaIdx === 3 || diaIdx === 4; // Lun, Mar, Jue, Vie
    if (perfil.diasGymSemana === 5) return diaIdx === 0 || diaIdx === 1 || diaIdx === 2 || diaIdx === 4 || diaIdx === 5; // Lun, Mar, Mié, Vie, Sáb
    if (perfil.diasGymSemana === 3) return diaIdx === 0 || diaIdx === 2 || diaIdx === 4; // Lun, Mié, Vie
    return diaIdx < perfil.diasGymSemana;
  };

  const resultadoSemana: PlanDia[] = [];
  const fechaBase = new Date(fechaInicioLunes + 'T00:00:00');

  // Selección de batch cooking si está activo
  const almuerzoBatch = usarBatchCooking
    ? almuerzos.find((r) => r.batchCooking) ?? almuerzos[0]
    : null;

  let almuerzoIdx = 0;
  let cenaIdx = 0;
  let desayunoIdx = 0;
  let onceIdx = 0;
  let colacionIdx = 0;

  for (let i = 0; i < 7; i++) {
    const fechaDia = new Date(fechaBase);
    fechaDia.setDate(fechaDia.getDate() + i);
    const fechaISO = fechaDia.toISOString().split('T')[0];

    const planExistente = planesExistentes.find((p) => p.fecha === fechaISO);
    const esDiaGym = esGymPorDiaIndice(i);
    const metaDia = calcularMetasDia(perfil, esDiaGym);

    // Desayuno
    let desayuno = planExistente?.comidas.desayuno;
    if (!desayuno || !desayuno.fijada) {
      const rec = desayunos[desayunoIdx % desayunos.length];
      desayunoIdx++;
      desayuno = {
        id: `des_${fechaISO}_${rec.id}`,
        recetaId: rec.id,
        recetaNombre: rec.nombre,
        porciones: 1,
        fijada: false,
        consumida: false,
        tipoMomentoEntreno: esDiaGym && rec.aptaPreEntreno ? 'pre_entreno' : 'ninguno',
        macros: rec.macrosPorPorcion,
      };
    }

    // Almuerzo
    let almuerzo = planExistente?.comidas.almuerzo;
    if (!almuerzo || !almuerzo.fijada) {
      // Si usamos batch cooking en lunes y martes
      const rec =
        usarBatchCooking && almuerzoBatch && (i === 0 || i === 1)
          ? almuerzoBatch
          : almuerzos[almuerzoIdx % almuerzos.length];
      if (!(usarBatchCooking && (i === 0 || i === 1))) {
        almuerzoIdx++;
      }
      almuerzo = {
        id: `alm_${fechaISO}_${rec.id}`,
        recetaId: rec.id,
        recetaNombre: rec.nombre,
        porciones: 1,
        fijada: false,
        consumida: false,
        tipoMomentoEntreno: esDiaGym && rec.aptaPostEntreno ? 'post_entreno' : 'ninguno',
        macros: rec.macrosPorPorcion,
      };
    }

    // Colación
    let colacion = planExistente?.comidas.colacion;
    if (!colacion || !colacion.fijada) {
      const rec = colaciones[colacionIdx % colaciones.length];
      colacionIdx++;
      colacion = {
        id: `col_${fechaISO}_${rec.id}`,
        recetaId: rec.id,
        recetaNombre: rec.nombre,
        porciones: 1,
        fijada: false,
        consumida: false,
        tipoMomentoEntreno: esDiaGym && !desayuno.tipoMomentoEntreno && rec.aptaPreEntreno ? 'pre_entreno' : 'ninguno',
        macros: rec.macrosPorPorcion,
      };
    }

    // Once
    let once = planExistente?.comidas.once;
    if (!once || !once.fijada) {
      const rec = onces[onceIdx % onces.length];
      onceIdx++;
      once = {
        id: `onc_${fechaISO}_${rec.id}`,
        recetaId: rec.id,
        recetaNombre: rec.nombre,
        porciones: 1,
        fijada: false,
        consumida: false,
        tipoMomentoEntreno: 'ninguno',
        macros: rec.macrosPorPorcion,
      };
    }

    // Cena
    let cena = planExistente?.comidas.cena;
    if (!cena || !cena.fijada) {
      const rec = cenas[cenaIdx % cenas.length];
      cenaIdx++;
      cena = {
        id: `cen_${fechaISO}_${rec.id}`,
        recetaId: rec.id,
        recetaNombre: rec.nombre,
        porciones: 1,
        fijada: false,
        consumida: false,
        tipoMomentoEntreno: 'ninguno',
        macros: rec.macrosPorPorcion,
      };
    }

    resultadoSemana.push({
      fecha: fechaISO,
      esDiaGym,
      comidas: {
        desayuno,
        almuerzo,
        colacion,
        once,
        cena,
      },
      metaDia,
      actualizadoEn: new Date().toISOString(),
    });
  }

  return resultadoSemana;
}
