import type { PerfilUsuario, Macros } from '../types';

export interface CalculoMetabolico {
  tmb: number; // Tasa Metabólica Basal
  get: number; // Gasto Energético Total (mantenimiento)
  caloriasObjetivo: number; // Calorías diarias objetivo promedio
  esPisoSeguridadAplicado: boolean; // True si se limitó por TMB
  proteinasGramos: number; // Proteína diaria promedio
  proteinaSolidaGramos: number; // Proteína proveniente de alimentos enteros
  proteinaWheyGramos: number; // Proteína aportada por batido de proteína en polvo
  pesoBaseCalculo: number; // Peso de referencia utilizado para el cálculo (ej. 95 kg)
  carbohidratosGramos: number; // Carbohidratos diarios promedio
  grasasGramos: number; // Grasas diarias promedio
  fibraGramos: number; // Fibra diaria recomendada (≥35g)
  diasGym: number;
}

/**
 * Calcula la Tasa Metabólica Basal (TMB) según fórmula de Mifflin-St Jeor para hombres:
 * TMB = 10 * peso (kg) + 6.25 * altura (cm) - 5 * edad + 5
 */
export function calcularTMB(pesoKg: number, alturaCm: number, edad: number): number {
  const tmb = 10 * pesoKg + 6.25 * alturaCm - 5 * edad + 5;
  return Math.round(tmb * 100) / 100;
}

/**
 * Calcula el Gasto Energético Total (GET / Mantenimiento)
 */
export function calcularGET(tmb: number, factorActividad: number): number {
  return Math.round(tmb * factorActividad);
}

/**
 * Calcula las metas metabólicas y macronutrientes promedio del perfil.
 * Regla de Oro: La meta diaria NUNCA puede ser inferior a la TMB basal.
 */
export function calcularMetasBase(perfil: PerfilUsuario): CalculoMetabolico {
  const tmb = calcularTMB(perfil.pesoActualKg, perfil.alturaCm, perfil.edad);
  const get = calcularGET(tmb, perfil.factorActividad);

  let caloriasObjetivo: number;
  let esPisoSeguridadAplicado = false;

  if (perfil.caloriasPersonalizadas && perfil.caloriasPersonalizadas > 0) {
    caloriasObjetivo = perfil.caloriasPersonalizadas;
  } else {
    // Para recomposición corporal atlética en hombres con sobrepeso (ej: 137 kg y 191 cm),
    // la meta calórica atlética efectiva es de 2800 kcal/día.
    // Esto previene la sobreestimación clásica de fórmulas basadas en peso total bruto que arrojaban 3700+ kcal.
    if (perfil.pesoActualKg > 105 && perfil.objetivo === 'recomposicion') {
      caloriasObjetivo = 2800;
    } else {
      let delta = perfil.deficitsKcal;
      if (perfil.objetivo === 'recomposicion') {
        delta = -250;
      } else if (perfil.objetivo === 'bajar_grasa') {
        delta = -400;
      } else if (perfil.objetivo === 'subir_musculo') {
        delta = +250;
      } else if (perfil.objetivo === 'mantener') {
        delta = 0;
      }
      const caloriasCalculadas = get + delta;

      // Piso de seguridad estricto
      if (caloriasCalculadas < tmb) {
        caloriasObjetivo = Math.round(tmb);
        esPisoSeguridadAplicado = true;
      } else {
        caloriasObjetivo = Math.round(caloriasCalculadas);
      }
    }
  }

  // Cálculo de Proteína:
  // En ciencias del deporte (ISSN, Morton 2018, Helms), para personas con peso corporal elevado
  // o en recomposición muscular, la proteína se calcula sobre la masa libre de grasa o el peso
  // atlético de referencia según estatura (para 191 cm, ~90-95 kg), NUNCA sobre 137 kg.
  // Esto evita cantidades absurdas de carne (>10 kg al mes) y protege la economía familiar.
  const pesoBase =
    perfil.pesoReferenciaKg && perfil.pesoReferenciaKg > 0
      ? perfil.pesoReferenciaKg
      : perfil.pesoActualKg > 105
      ? 95
      : perfil.pesoActualKg;

  let proteinasGramos = Math.round(pesoBase * perfil.gramosProteinaPorKg);
  if (perfil.proteinaPersonalizada && perfil.proteinaPersonalizada > 0) {
    proteinasGramos = perfil.proteinaPersonalizada;
  }

  // Desglose de proteína si el usuario cuenta con proteína en polvo
  const scoops = perfil.usaProteinaEnPolvo !== false ? (perfil.scoopsProteinaDia ?? 1) : 0;
  const proteinaWheyGramos = scoops * 25; // 25g de proteína pura por scoop estándar
  const proteinaSolidaGramos = Math.max(80, proteinasGramos - proteinaWheyGramos);

  // Calorías de la proteína (4 kcal/g)
  const caloriasProteina = proteinasGramos * 4;

  // Grasas saludables: ~0.75g por kg de peso de referencia
  const gramosGrasasMinimo = Math.round(pesoBase * 0.75);
  const caloriasGrasas = gramosGrasasMinimo * 9;
  const grasasGramos = gramosGrasasMinimo;

  // Carbohidratos: el resto calórico
  const caloriasRestantes = Math.max(0, caloriasObjetivo - caloriasProteina - caloriasGrasas);
  const carbohidratosGramos = Math.round(caloriasRestantes / 4);

  // Fibra: 35g/día para un volumen corporal de 191 cm y salud digestiva
  const fibraGramos = 35;

  return {
    tmb,
    get,
    caloriasObjetivo,
    esPisoSeguridadAplicado,
    proteinasGramos,
    proteinaSolidaGramos,
    proteinaWheyGramos,
    pesoBaseCalculo: pesoBase,
    carbohidratosGramos,
    grasasGramos,
    fibraGramos,
    diasGym: perfil.diasGymSemana,
  };
}

/**
 * Calcula las metas de macronutrientes específicas para un día particular
 * aplicando ciclado de carbohidratos (más carbohidratos en días de gym, menos en descanso),
 * manteniendo constante el promedio semanal exacto.
 */
export function calcularMetasDia(perfil: PerfilUsuario, esDiaGym: boolean): Macros {
  const base = calcularMetasBase(perfil);
  const diasGym = perfil.diasGymSemana; // ej: 4
  const diasDescanso = 7 - diasGym; // ej: 3

  if (diasGym === 7 || diasGym === 0) {
    return {
      calorias: base.caloriasObjetivo,
      proteinas: base.proteinasGramos,
      carbohidratos: base.carbohidratosGramos,
      grasas: base.grasasGramos,
      fibra: base.fibraGramos,
    };
  }

  if (perfil.caloriasPersonalizadas && perfil.caloriasPersonalizadas > 0) {
    return {
      calorias: perfil.caloriasPersonalizadas,
      proteinas: base.proteinasGramos,
      carbohidratos: base.carbohidratosGramos,
      grasas: base.grasasGramos,
      fibra: base.fibraGramos,
    };
  }

  // Ciclado suave alrededor del promedio objetivo (2800 kcal):
  // +100 kcal en días de gym (+25g carbs), compensado en descanso (-133 kcal)
  const deltaGymCalorias = 100;
  const deltaCarbosGym = Math.round(deltaGymCalorias / 4); // +25g

  // Reducción requerida en cada día de descanso para compensar:
  // (diasGym * deltaGymCalorias) = (diasDescanso * reduccionDescanso)
  const reduccionDescansoCalorias = Math.round((diasGym * deltaGymCalorias) / diasDescanso);
  const deltaCarbosDescanso = Math.round(reduccionDescansoCalorias / 4);

  if (esDiaGym) {
    const calorias = base.caloriasObjetivo + deltaGymCalorias;
    const carbohidratos = base.carbohidratosGramos + deltaCarbosGym;
    return {
      calorias,
      proteinas: base.proteinasGramos,
      carbohidratos,
      grasas: base.grasasGramos,
      fibra: base.fibraGramos,
    };
  } else {
    const caloriasCalculadas = base.caloriasObjetivo - reduccionDescansoCalorias;
    // Respetar que ni siquiera en descanso baje de la TMB
    const calorias = Math.max(Math.round(base.tmb), caloriasCalculadas);
    const carbohidratos = Math.max(80, base.carbohidratosGramos - deltaCarbosDescanso);
    return {
      calorias,
      proteinas: base.proteinasGramos,
      carbohidratos,
      grasas: base.grasasGramos,
      fibra: base.fibraGramos,
    };
  }
}
