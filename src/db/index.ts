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
 * Inicializa la base de datos local (IndexedDB) sembrando o actualizando las 40 recetas chilenas/gym
 * ultra rápidas (2-15 min, 1 sartén/olla, microondas o al paso), estrictamente sin legumbres,
 * sin licuadora y sin ingredientes no deseados (pepinillos, alcaparras, aceitunas, pasas, mostaza, jengibre).
 */
export async function inicializarBaseDatos(): Promise<void> {
  try {
    const RECETAS_VERSION = 'v3-express-no-blender-clean';
    const versionGuardada = localStorage.getItem('menu_recetas_version');
    const conteoRecetas = await db.recetas.count();

    if (conteoRecetas === 0 || versionGuardada !== RECETAS_VERSION) {
      // bulkPut inserta o actualiza las semillas por su ID único sin tocar recetas personalizadas del usuario
      await db.recetas.bulkPut(SEMILLAS_RECETAS);
      localStorage.setItem('menu_recetas_version', RECETAS_VERSION);
    }
  } catch (error) {
    console.error('Error al inicializar la base de datos IndexedDB:', error);
  }
}
