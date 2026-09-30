import { describe, it, expect, beforeEach } from 'vitest';
import {
  PERFIL_DEFAULT,
  guardarBackupPerfil,
  obtenerBackupPerfil,
  guardarBackupPlan,
  obtenerBackupPlan,
  guardarBackupCompras,
  obtenerBackupCompras,
  guardarBackupRegistros,
  obtenerBackupRegistros,
  restaurarRespaldoCompletoJSON,
} from '../logic/persistencia';
import type { PlanDia, ItemCompra, RegistroProgreso } from '../types';

const store: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k in store) delete store[k];
    },
  };
}

describe('Persistencia y Respaldo Dual para Teléfono', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('guarda y recupera el perfil predeterminado de 2800 kcal desde localStorage', () => {
    guardarBackupPerfil(PERFIL_DEFAULT);
    const recuperado = obtenerBackupPerfil();
    expect(recuperado).not.toBeNull();
    expect(recuperado?.caloriasPersonalizadas).toBe(2800);
    expect(recuperado?.pesoReferenciaKg).toBe(95);
    expect(recuperado?.pesoActualKg).toBe(137);
    expect(recuperado?.edad).toBe(21);
    expect(recuperado?.alturaCm).toBe(191);
    expect(recuperado?.usaProteinaEnPolvo).toBe(true);
  });

  it('guarda y recupera los planes de comidas del mes en localStorage', () => {
    const planesMock: PlanDia[] = [
      {
        fecha: '2026-09-28',
        esDiaGym: true,
        actualizadoEn: new Date().toISOString(),
        metaDia: {
          calorias: 2800,
          proteinas: 219,
          carbohidratos: 300,
          grasas: 75,
          fibra: 35,
        },
        comidas: {
          desayuno: null,
          almuerzo: null,
          colacion: null,
          once: null,
          cena: null,
        },
      },
    ];

    guardarBackupPlan(planesMock);
    const recuperados = obtenerBackupPlan();
    expect(recuperados).toHaveLength(1);
    expect(recuperados?.[0]?.fecha).toBe('2026-09-28');
    expect(recuperados?.[0]?.metaDia.calorias).toBe(2800);
  });

  it('guarda y recupera el estado de compras con items marcados como comprados', () => {
    const comprasMock: ItemCompra[] = [
      {
        id: 'comp-1',
        ingredienteNombre: 'Huevos de gallina',
        cantidadNecesaria: 30,
        cantidadAComprar: 30,
        unidad: 'unidad',
        categoriaPasillo: 'lacteos_huevos',
        fechaSemana: '2026-09-28',
        enDespensa: 0,
        comprado: true,
      },
    ];

    guardarBackupCompras(comprasMock);
    const recuperados = obtenerBackupCompras();
    expect(recuperados).toHaveLength(1);
    expect(recuperados?.[0]?.comprado).toBe(true);
    expect(recuperados?.[0]?.ingredienteNombre).toBe('Huevos de gallina');
  });

  it('guarda y recupera registros de pesaje de progreso', () => {
    const registrosMock: RegistroProgreso[] = [
      {
        id: 'reg_1',
        fecha: '2026-09-28',
        pesoKg: 136.5,
        creadoEn: new Date().toISOString(),
      },
    ];

    guardarBackupRegistros(registrosMock);
    const recuperados = obtenerBackupRegistros();
    expect(recuperados).toHaveLength(1);
    expect(recuperados?.[0]?.pesoKg).toBe(136.5);
  });

  it('falla adecuadamente al restaurar un JSON corrupto', async () => {
    const res = await restaurarRespaldoCompletoJSON('texto-no-json');
    expect(res.exito).toBe(false);
  });
});
