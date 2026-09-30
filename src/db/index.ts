import Dexie, { type EntityTable } from 'dexie';
import type {
  PerfilUsuario,
  Receta,
  PlanDia,
  ItemCompra,
  Producto,
  RegistroProgreso,
  ItemDespensa,
} from '../types';
import { SEMILLAS_RECETAS } from './semillas-recetas';
import {
  PERFIL_DEFAULT,
  obtenerBackupPerfil,
  guardarBackupPerfil,
  obtenerBackupPlan,
  obtenerBackupCompras,
  obtenerBackupRegistros,
} from '../logic/persistencia';

export class MenuComprasDB extends Dexie {
  perfil!: EntityTable<PerfilUsuario, 'id'>;
  recetas!: EntityTable<Receta, 'id'>;
  plan!: EntityTable<PlanDia, 'fecha'>;
  compras!: EntityTable<ItemCompra, 'id'>;
  productos!: EntityTable<Producto, 'id'>;
  registros!: EntityTable<RegistroProgreso, 'id'>;
  despensa!: EntityTable<ItemDespensa, 'id'>;

  constructor() {
    super('MenuComprasDB');
    this.version(1).stores({
      perfil: 'id',
      recetas: 'id, categoria, fuenteProteinaPrincipal, batchCooking, esFavorita',
      plan: 'fecha',
      compras: 'id, fechaSemana, categoriaPasillo, comprado',
      productos: 'id, sku, categoriaPasillo, terminoBusqueda',
      registros: 'id, fecha',
      despensa: 'id, nombre, categoriaPasillo',
    });
  }
}

export const db = new MenuComprasDB();

/**
 * Inicializa la base de datos local (IndexedDB) sembrando o actualizando las 40 recetas chilenas/gym
 * ultra rápidas (2-15 min, 1 sartén/olla, microondas o al paso), estrictamente sin legumbres,
 * sin licuadora y sin ingredientes no deseados (pepinillos, alcaparras, aceitunas, pasas, mostaza, jengibre).
 */
export async function inicializarBaseDatos(): Promise<void> {
  try {
    // 1. Solicitar almacenamiento persistente al navegador (PWA / Mobile Safari / Chrome)
    // Esto previene que el sistema operativo o navegador limpie IndexedDB si hay poca memoria libre.
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        const esPersistente = await navigator.storage.persisted();
        if (!esPersistente) {
          await navigator.storage.persist();
        }
      } catch (errPersist) {
        console.warn('Persistencia de almacenamiento no concedida o no soportada:', errPersist);
      }
    }

    const RECETAS_VERSION = 'v11-2800kcal-balance-ajustado';
    const versionGuardada = localStorage.getItem('menu_recetas_version');
    const conteoRecetas = await db.recetas.count();

    if (conteoRecetas === 0 || versionGuardada !== RECETAS_VERSION) {
      // bulkPut inserta o actualiza las semillas por su ID único sin tocar recetas personalizadas del usuario
      await db.recetas.bulkPut(SEMILLAS_RECETAS);

      // Sembrar proteína Whey en despensa si no existe (el usuario ya cuenta con su propio tarro)
      const despExistente = await db.despensa.toArray();
      if (!despExistente.some((d) => d.nombre.toLowerCase().includes('whey') || d.nombre.toLowerCase().includes('proteína en polvo'))) {
        await db.despensa.put({
          id: 'desp-whey-proteina-usuario',
          nombre: 'Suplemento de proteína Whey chocolate tarro',
          cantidad: 1000,
          unidad: 'g',
          categoriaPasillo: 'despensa_abarrotes',
          actualizadoEn: new Date().toISOString(),
        });
      }

      localStorage.setItem('menu_recetas_version', RECETAS_VERSION);
    }

    // 2. Respaldo y recuperación resiliente del perfil
    let p: PerfilUsuario | undefined = await db.perfil.get('usuario_principal');
    if (!p) {
      const backup = obtenerBackupPerfil();
      p = backup ?? PERFIL_DEFAULT;
    }

    // Migrar perfil existente asegurando las 2800 kcal exactas y peso atlético de referencia (95 kg)
    const perfilActualizado: PerfilUsuario = {
      ...p,
      caloriasPersonalizadas: 2800,
      pesoReferenciaKg: p.pesoReferenciaKg && p.pesoReferenciaKg <= 110 ? p.pesoReferenciaKg : 95,
      usaProteinaEnPolvo: p.usaProteinaEnPolvo ?? true,
      scoopsProteinaDia: p.scoopsProteinaDia ?? 1,
    };
    await db.perfil.put(perfilActualizado);
    guardarBackupPerfil(perfilActualizado);

    // 3. Restaurar planes si no existen en IndexedDB pero existen en localStorage
    const conteoPlanes = await db.plan.count();
    if (conteoPlanes === 0) {
      const backupPlanes = obtenerBackupPlan();
      if (backupPlanes && backupPlanes.length > 0) {
        await db.plan.bulkPut(backupPlanes);
      }
    }

    // 4. Restaurar compras si no existen en IndexedDB pero existen en localStorage
    const conteoCompras = await db.compras.count();
    if (conteoCompras === 0) {
      const backupCompras = obtenerBackupCompras();
      if (backupCompras && backupCompras.length > 0) {
        await db.compras.bulkPut(backupCompras);
      }
    }

    // 5. Restaurar registros de progreso si no existen en IndexedDB pero existen en localStorage
    const conteoRegistros = await db.registros.count();
    if (conteoRegistros === 0) {
      const backupRegs = obtenerBackupRegistros();
      if (backupRegs && backupRegs.length > 0) {
        await db.registros.bulkPut(backupRegs);
      }
    }
  } catch (error) {
    console.error('Error al inicializar la base de datos IndexedDB:', error);
  }
}
