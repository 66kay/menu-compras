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
 * Inicializa la base de datos local (IndexedDB) sembrando las 40 recetas chilenas/gym
 * estrictamente sin legumbres si la tabla está vacía.
 */
export async function inicializarBaseDatos(): Promise<void> {
  try {
    const conteoRecetas = await db.recetas.count();
    if (conteoRecetas === 0) {
      await db.recetas.bulkAdd(SEMILLAS_RECETAS);
    }
  } catch (error) {
    console.error('Error al inicializar la base de datos IndexedDB:', error);
  }
}
