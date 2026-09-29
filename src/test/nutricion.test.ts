import { describe, it, expect } from 'vitest';
import { calcularTMB, calcularGET, calcularMetasBase, calcularMetasDia } from '../logic/nutricion';
import type { PerfilUsuario } from '../types';

describe('Cálculos Nutricionales y Fórmulas', () => {
  it('calcula la TMB exacta de Mifflin-St Jeor para 137kg, 191cm, 21 años', () => {
    // TMB = 10 * 137 + 6.25 * 191 - 5 * 21 + 5
    // = 1370 + 1193.75 - 105 + 5 = 2463.75
    const tmb = calcularTMB(137, 191, 21);
    expect(tmb).toBe(2463.75);
  });

  it('calcula el GET para 4 días de gimnasio (factor 1.55)', () => {
    const tmb = 2463.75;
    const get = calcularGET(tmb, 1.55);
    // 2463.75 * 1.55 = 3818.8125 -> Math.round = 3819
    expect(get).toBe(3819);
  });

  it('respeta el piso de seguridad: las calorías objetivo jamás son menores a la TMB', () => {
    const perfilExtremo: PerfilUsuario = {
      id: 'usuario_principal',
      edad: 21,
      sexo: 'hombre',
      alturaCm: 191,
      pesoActualKg: 137,
      diasGymSemana: 4,
      duracionEntrenoHoras: 2,
      factorActividad: 1.2, // Muy bajo
      objetivo: 'bajar_grasa',
      gramosProteinaPorKg: 1.6,
      deficitsKcal: -1000, // Déficit agresivo forzado
      exclusionesAmbiguas: {
        arvejasVerdes: false,
        porotosVerdes: false,
        mani: false,
        soyaTofu: false,
      },
      sucursalLiderPreferida: 'Líder Casona, Osorno',
      cupoMensualCocaColaZero: 8,
      cupoMensualAntojos: 4,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    };

    const metas = calcularMetasBase(perfilExtremo);
    expect(metas.caloriasObjetivo).toBeGreaterThanOrEqual(metas.tmb);
  });

  it('aplica ciclado de carbohidratos en días de gimnasio vs descanso', () => {
    const perfil: PerfilUsuario = {
      id: 'usuario_principal',
      edad: 21,
      sexo: 'hombre',
      alturaCm: 191,
      pesoActualKg: 137,
      diasGymSemana: 4,
      duracionEntrenoHoras: 2,
      factorActividad: 1.55,
      objetivo: 'recomposicion',
      gramosProteinaPorKg: 1.6,
      deficitsKcal: -250,
      exclusionesAmbiguas: {
        arvejasVerdes: false,
        porotosVerdes: false,
        mani: false,
        soyaTofu: false,
      },
      sucursalLiderPreferida: 'Líder Casona, Osorno',
      cupoMensualCocaColaZero: 8,
      cupoMensualAntojos: 4,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    };

    const metaGym = calcularMetasDia(perfil, true);
    const metaDescanso = calcularMetasDia(perfil, false);

    expect(metaGym.calorias).toBeGreaterThan(metaDescanso.calorias);
    expect(metaGym.carbohidratos).toBeGreaterThan(metaDescanso.carbohidratos);
    // La proteína se mantiene constante para soporte muscular
    expect(metaGym.proteinas).toBe(metaDescanso.proteinas);
  });
});
