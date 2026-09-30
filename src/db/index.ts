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
    const RECETAS_VERSION = 'v5-no-duplicates-real-lider-products';
    const versionGuardada = localStorage.getItem('menu_recetas_version');
    const conteoRecetas = await db.recetas.count();

    if (conteoRecetas === 0 || versionGuardada !== RECETAS_VERSION) {
      // bulkPut inserta o actualiza las semillas por su ID único sin tocar recetas personalizadas del usuario
      await db.recetas.bulkPut(SEMILLAS_RECETAS);
      // Limpiar planes y lista de compras previas para regenerar con porciones limpias y productos reales de Líder
      await db.plan.clear();
      await db.compras.clear();

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

    // Migrar perfil existente si le faltan los campos de peso atlético de referencia o proteína en polvo
    const p = await db.perfil.get('usuario_principal');
    if (p && (!p.pesoReferenciaKg || p.usaProteinaEnPolvo === undefined)) {
      await db.perfil.put({
        ...p,
        pesoReferenciaKg: p.pesoReferenciaKg ?? 95,
        usaProteinaEnPolvo: p.usaProteinaEnPolvo ?? true,
        scoopsProteinaDia: p.scoopsProteinaDia ?? 1,
      });
    }
  } catch (error) {
    console.error('Error al inicializar la base de datos IndexedDB:', error);
  }
}
