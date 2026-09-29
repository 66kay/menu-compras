import { describe, it, expect } from 'vitest';
import { generarListaCompras } from '../logic/lista-compras';
import { SEMILLAS_RECETAS } from '../db/semillas-recetas';
import type { PlanDia, ItemDespensa } from '../types';

describe('Consolidación de Lista de Compras y Descuento de Despensa', () => {
  it('consolida ingredientes y descuenta la despensa existente correctamente', () => {
    // Tomamos la receta "Huevos Revueltos con Marraqueta Tostada y Palta" (des-01)
    const recDes01 = SEMILLAS_RECETAS.find((r) => r.id === 'des-01')!;

    const planMock: PlanDia[] = [
      {
        fecha: '2026-10-05',
        esDiaGym: true,
        comidas: {
          desayuno: {
            id: 'c1',
            recetaId: recDes01.id,
            recetaNombre: recDes01.nombre,
            porciones: 1,
            fijada: false,
            consumida: false,
            tipoMomentoEntreno: 'ninguno',
            macros: recDes01.macrosPorPorcion,
          },
          almuerzo: null,
          colacion: null,
          once: null,
          cena: null,
        },
        metaDia: {
          calorias: 2800,
          proteinas: 220,
          carbohidratos: 250,
          grasas: 80,
          fibra: 35,
        },
        actualizadoEn: new Date().toISOString(),
      },
    ];

    // Despensa: ya tenemos 1 huevo y 30g de palta
    const despensaMock: ItemDespensa[] = [
      {
        id: 'd1',
        nombre: 'Huevos de gallina',
        cantidad: 1,
        unidad: 'unidad',
        categoriaPasillo: 'lacteos_huevos',
        actualizadoEn: new Date().toISOString(),
      },
      {
        id: 'd2',
        nombre: 'Palta Hass',
        cantidad: 30,
        unidad: 'g',
        categoriaPasillo: 'frutas_verduras',
        actualizadoEn: new Date().toISOString(),
      },
    ];

    const lista = generarListaCompras(planMock, SEMILLAS_RECETAS, despensaMock, '2026-10-05');

    const itemHuevos = lista.find((i) => i.ingredienteNombre.includes('Huevos de gallina'));
    const itemPalta = lista.find((i) => i.ingredienteNombre.includes('Palta'));

    expect(itemHuevos).toBeDefined();
    // La receta pide 2 huevos. Tenemos 1 en despensa. Necesitamos comprar 1.
    expect(itemHuevos?.cantidadNecesaria).toBe(2);
    expect(itemHuevos?.enDespensa).toBe(1);
    expect(itemHuevos?.cantidadAComprar).toBe(1);

    expect(itemPalta).toBeDefined();
    // La receta pide 60g de palta. Tenemos 30g en despensa. Necesitamos comprar 30g.
    expect(itemPalta?.cantidadNecesaria).toBe(60);
    expect(itemPalta?.enDespensa).toBe(30);
    expect(itemPalta?.cantidadAComprar).toBe(30);
  });
});
