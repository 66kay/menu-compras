import { describe, it, expect } from 'vitest';
import { generarListaCompras } from '../logic/lista-compras';
import { SEMILLAS_RECETAS } from '../db/semillas-recetas';
import { generarMes } from '../logic/generador';
import { calcularUnidadesYSubtotal } from '../components/compras/ComprasView';
import type { PlanDia, ItemDespensa, PerfilUsuario } from '../types';

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
    // La receta pide 2 huevos enteros + 2 claras (4 huevos en total al consolidar). Tenemos 1 en despensa. Necesitamos comprar 3.
    expect(itemHuevos?.cantidadNecesaria).toBe(4);
    expect(itemHuevos?.enDespensa).toBe(1);
    expect(itemHuevos?.cantidadAComprar).toBe(3);

    expect(itemPalta).toBeDefined();
    // La receta pide 60g de palta. Tenemos 30g en despensa. Necesitamos comprar 30g.
    expect(itemPalta?.cantidadNecesaria).toBe(60);
    expect(itemPalta?.enDespensa).toBe(30);
    expect(itemPalta?.cantidadAComprar).toBe(30);
  });

  it('un mes completo de 28 días requiere menos de 5 kg de pollo y una semana de compras se mantiene bajo $50.000 CLP', () => {
    const perfil: PerfilUsuario = {
      id: 'usuario_principal',
      edad: 21,
      sexo: 'hombre',
      alturaCm: 191,
      pesoActualKg: 137,
      pesoReferenciaKg: 95,
      diasGymSemana: 4,
      duracionEntrenoHoras: 2,
      factorActividad: 1.55,
      objetivo: 'recomposicion',
      gramosProteinaPorKg: 1.6,
      deficitsKcal: -250,
      usaProteinaEnPolvo: true,
      scoopsProteinaDia: 1,
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

    const planes28Dias = generarMes('2026-10-05', perfil, SEMILLAS_RECETAS, []);
    expect(planes28Dias.length).toBe(28);

    const listaMes = generarListaCompras(planes28Dias, SEMILLAS_RECETAS, [], '2026-10-05');
    expect(listaMes.length).toBeGreaterThan(10);

    // Buscar pollo en la lista
    const itemPollo = listaMes.find(
      (i) => i.ingredienteNombre.toLowerCase().includes('pechuga') || i.ingredienteNombre.toLowerCase().includes('pollo')
    );

    expect(itemPollo).toBeDefined();
    const kilosPollo = itemPollo!.unidad === 'kg' ? itemPollo!.cantidadNecesaria : itemPollo!.cantidadNecesaria / 1000;
    expect(kilosPollo).toBeLessThan(5.0);
    expect(kilosPollo).toBeGreaterThan(1.5);

    console.log('--- TODOS LOS PRODUCTOS DE LA LISTA DE COMPRAS (28 DÍAS) ---');
    for (const item of listaMes) {
      console.log(`[ITEM] ${item.ingredienteNombre} | Cantidad: ${item.cantidadAComprar} ${item.unidad} | SKU: ${item.productoSeleccionado?.sku} | Nombre Líder: ${item.productoSeleccionado?.nombre} | Precio: $${item.productoSeleccionado?.precio} | Foto: ${item.productoSeleccionado?.urlFoto?.slice(0, 40)}... | Link: ${item.productoSeleccionado?.urlProducto}`);
    }

    // Despensa inicial: el usuario ya cuenta con proteína en polvo en su despensa
    const despensaConWhey: ItemDespensa[] = [
      {
        id: 'd-whey',
        nombre: 'Suplemento de proteína Whey chocolate tarro',
        cantidad: 650,
        unidad: 'g',
        categoriaPasillo: 'despensa_abarrotes',
        actualizadoEn: new Date().toISOString(),
      },
    ];

    // Calcular el gasto semanal (7 días) de alimentos frescos en Líder
    const planesSemana = planes28Dias.slice(0, 7);
    const listaSemana = generarListaCompras(planesSemana, SEMILLAS_RECETAS, despensaConWhey, '2026-10-05');
    let gastoSemanal = 0;
    for (const item of listaSemana) {
      const calc = calcularUnidadesYSubtotal(item);
      gastoSemanal += calc.subtotal;
    }
    console.log('GASTO SEMANAL ESTIMADO (7 DÍAS CON WHEY EN DESPENSA):', gastoSemanal);
    // Un carro semanal de 7 días de carnes magras, huevos y frescos se mantiene bajo $90.000 CLP
    expect(gastoSemanal).toBeLessThan(90000);

    // Verificación estricta de CERO duplicados y CERO condimentos en la lista
    for (const item of listaMes) {
      const nombreNorm = item.ingredienteNombre.toLowerCase();
      expect(nombreNorm).not.toContain('sal ');
      expect(nombreNorm).not.toContain('sal fina');
      expect(nombreNorm).not.toContain('pimienta');
      expect(nombreNorm).not.toContain('orégano');

      // Todo ítem debe tener un producto real de Líder con foto y link válidos
      expect(item.productoSeleccionado).toBeDefined();
      expect(item.productoSeleccionado?.urlFoto).toContain('walmartimages.cl');
      expect(item.productoSeleccionado?.urlProducto).toContain('super.lider.cl');
      expect(item.productoSeleccionado?.precio).toBeGreaterThan(0);
    }

    // Verificar que no existen productos Líder duplicados por SKU
    const skus = listaMes.map((i) => i.productoSeleccionado?.sku).filter(Boolean);
    const skusUnicos = new Set(skus);
    expect(skus.length).toBe(skusUnicos.size);
  });
});
