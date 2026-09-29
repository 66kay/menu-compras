import { describe, it, expect } from 'vitest';
import { SEMILLAS_RECETAS } from '../db/semillas-recetas';
import { RecetaSchema } from '../types';
import { esRecetaPermitida } from '../logic/generador';
import type { PerfilUsuario } from '../types';

describe('Exclusión Estricta de Legumbres y Validación de Recetas', () => {
  const perfilBase: PerfilUsuario = {
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

  it('contiene exactamente 40 recetas semilla y todas cumplen con RecetaSchema de Zod', () => {
    expect(SEMILLAS_RECETAS.length).toBe(40);
    for (const receta of SEMILLAS_RECETAS) {
      expect(() => RecetaSchema.parse(receta)).not.toThrow();
    }
  });

  it('ninguna de las 40 recetas semilla contiene legumbres en nombre, descripción ni ingredientes', () => {
    const palabrasProhibidas = [
      'lenteja',
      'lentejas',
      'poroto',
      'porotos',
      'garbanzo',
      'garbanzos',
      'arveja',
      'arvejas',
      'haba',
      'habas',
      'hummus',
      'soya',
      'soja',
      'tofu',
      'maní',
      'mani',
    ];

    for (const receta of SEMILLAS_RECETAS) {
      const texto = `${receta.nombre} ${receta.descripcion ?? ''} ${receta.ingredientes
        .map((i) => i.nombre)
        .join(' ')}`.toLowerCase();

      for (const prohibida of palabrasProhibidas) {
        expect(
          texto.includes(prohibida),
          `La receta "${receta.nombre}" contiene la palabra prohibida "${prohibida}"`
        ).toBe(false);
      }
    }
  });

  it('todas las 40 recetas son aprobadas por el filtro esRecetaPermitida con la configuración por defecto', () => {
    for (const receta of SEMILLAS_RECETAS) {
      expect(esRecetaPermitida(receta, perfilBase)).toBe(true);
    }
  });

  it('esRecetaPermitida rechaza automáticamente recetas que contengan legumbres o ingredientes excluidos', () => {
    const recetaConLentejas = {
      ...SEMILLAS_RECETAS[0],
      id: 'test-lentejas',
      nombre: 'Guiso de lentejas con zapallo',
    };
    expect(esRecetaPermitida(recetaConLentejas, perfilBase)).toBe(false);

    const recetaConGarbanzos = {
      ...SEMILLAS_RECETAS[0],
      id: 'test-garbanzos',
      ingredientes: [
        {
          nombre: 'Garbanzos cocidos',
          cantidad: 200,
          unidad: 'g' as const,
          categoriaPasillo: 'despensa_abarrotes' as const,
          opcional: false,
        },
      ],
    };
    expect(esRecetaPermitida(recetaConGarbanzos, perfilBase)).toBe(false);
  });
});
