import type {
  PerfilUsuario,
  PlanDia,
  ItemCompra,
  RegistroProgreso,
  ItemDespensa,
} from '../types';
import { db } from '../db';

/**
 * Perfil por defecto con los requerimientos exactos del usuario:
 * Hombre, 21 años, 191 cm, 137 kg peso actual, 95 kg peso atlético de referencia.
 * 4 días de gimnasio, recomposición muscular (-250 kcal), exactamente 2.800 kcal diarias.
 * 1.6 g/kg proteína (~219g netos: 194g en comida + 25g scoop Whey).
 * Supermercado: Líder Casona, Osorno.
 */
export const PERFIL_DEFAULT: PerfilUsuario = {
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
  caloriasPersonalizadas: 2800,
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
  creadoEn: '2026-09-01T00:00:00.000Z',
  actualizadoEn: new Date().toISOString(),
};

// Claves de respaldo persistente en localStorage
const KEY_PERFIL = 'menu_backup_perfil_usuario';
const KEY_PLAN = 'menu_backup_plan_mes';
const KEY_COMPRAS = 'menu_backup_compras_mes';
const KEY_REGISTROS = 'menu_backup_registros_progreso';
const KEY_DESPENSA = 'menu_backup_despensa';

// ----------------- RESPALDO & RESTAURACIÓN EN LOCALSTORAGE -----------------

export function guardarBackupPerfil(perfil: PerfilUsuario): void {
  try {
    const serialized = JSON.stringify(perfil);
    localStorage.setItem(KEY_PERFIL, serialized);
    localStorage.setItem('backup_perfil_usuario', serialized); // retrocompatibilidad
  } catch (err) {
    console.warn('Error al guardar backup de perfil en localStorage:', err);
  }
}

export function obtenerBackupPerfil(): PerfilUsuario | null {
  try {
    const raw = localStorage.getItem(KEY_PERFIL) || localStorage.getItem('backup_perfil_usuario');
    if (!raw) return null;
    return JSON.parse(raw) as PerfilUsuario;
  } catch (err) {
    console.warn('Error al leer backup de perfil desde localStorage:', err);
    return null;
  }
}

export function guardarBackupPlan(planes: PlanDia[]): void {
  try {
    localStorage.setItem(KEY_PLAN, JSON.stringify(planes));
  } catch (err) {
    console.warn('Error al guardar backup de plan en localStorage:', err);
  }
}

export function obtenerBackupPlan(): PlanDia[] | null {
  try {
    const raw = localStorage.getItem(KEY_PLAN);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as PlanDia[]) : null;
  } catch (err) {
    console.warn('Error al leer backup de plan desde localStorage:', err);
    return null;
  }
}

export function guardarBackupCompras(items: ItemCompra[]): void {
  try {
    localStorage.setItem(KEY_COMPRAS, JSON.stringify(items));
  } catch (err) {
    console.warn('Error al guardar backup de compras en localStorage:', err);
  }
}

export function obtenerBackupCompras(): ItemCompra[] | null {
  try {
    const raw = localStorage.getItem(KEY_COMPRAS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as ItemCompra[]) : null;
  } catch (err) {
    console.warn('Error al leer backup de compras desde localStorage:', err);
    return null;
  }
}

export function guardarBackupRegistros(registros: RegistroProgreso[]): void {
  try {
    localStorage.setItem(KEY_REGISTROS, JSON.stringify(registros));
  } catch (err) {
    console.warn('Error al guardar backup de registros en localStorage:', err);
  }
}

export function obtenerBackupRegistros(): RegistroProgreso[] | null {
  try {
    const raw = localStorage.getItem(KEY_REGISTROS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RegistroProgreso[]) : null;
  } catch (err) {
    console.warn('Error al leer backup de registros desde localStorage:', err);
    return null;
  }
}

export function guardarBackupDespensa(despensa: ItemDespensa[]): void {
  try {
    localStorage.setItem(KEY_DESPENSA, JSON.stringify(despensa));
  } catch (err) {
    console.warn('Error al guardar backup de despensa en localStorage:', err);
  }
}

export function obtenerBackupDespensa(): ItemDespensa[] | null {
  try {
    const raw = localStorage.getItem(KEY_DESPENSA);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ItemDespensa[]) : null;
  } catch (err) {
    console.warn('Error al leer backup de despensa desde localStorage:', err);
    return null;
  }
}

// ----------------- EXPORTACIÓN & IMPORTACIÓN COMPLETA (JSON) -----------------

export interface RespaldoCompletoApp {
  version: number;
  fechaExportacion: string;
  perfil: PerfilUsuario;
  planes: PlanDia[];
  compras: ItemCompra[];
  registros: RegistroProgreso[];
  despensa: ItemDespensa[];
}

/**
 * Genera un archivo JSON descargable con todo el estado actual del usuario:
 * perfil, compras, comidas consumidas del mes, y registros de peso.
 */
export async function exportarRespaldoCompletoJSON(): Promise<string> {
  const perfil = (await db.perfil.get('usuario_principal')) || obtenerBackupPerfil() || PERFIL_DEFAULT;
  const planes = await db.plan.toArray();
  const compras = await db.compras.toArray();
  const registros = await db.registros.toArray();
  const despensa = await db.despensa.toArray();

  const backup: RespaldoCompletoApp = {
    version: 1,
    fechaExportacion: new Date().toISOString(),
    perfil,
    planes: planes.length > 0 ? planes : (obtenerBackupPlan() ?? []),
    compras: compras.length > 0 ? compras : (obtenerBackupCompras() ?? []),
    registros: registros.length > 0 ? registros : (obtenerBackupRegistros() ?? []),
    despensa: despensa.length > 0 ? despensa : (obtenerBackupDespensa() ?? []),
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Restaura todo el estado desde una cadena JSON de respaldo.
 * Actualiza tanto IndexedDB como localStorage de forma inmediata.
 */
export async function restaurarRespaldoCompletoJSON(
  jsonStr: string
): Promise<{ exito: boolean; mensaje: string }> {
  try {
    const data = JSON.parse(jsonStr) as Partial<RespaldoCompletoApp>;

    if (!data.perfil) {
      return { exito: false, mensaje: 'El archivo de respaldo no contiene un perfil válido.' };
    }

    // 1. Restaurar Perfil
    await db.perfil.put(data.perfil);
    guardarBackupPerfil(data.perfil);

    // 2. Restaurar Planes
    if (data.planes && Array.isArray(data.planes) && data.planes.length > 0) {
      await db.plan.clear();
      await db.plan.bulkPut(data.planes);
      guardarBackupPlan(data.planes);
    }

    // 3. Restaurar Compras
    if (data.compras && Array.isArray(data.compras) && data.compras.length > 0) {
      await db.compras.clear();
      await db.compras.bulkPut(data.compras);
      guardarBackupCompras(data.compras);
    }

    // 4. Restaurar Registros de peso
    if (data.registros && Array.isArray(data.registros)) {
      await db.registros.clear();
      if (data.registros.length > 0) {
        await db.registros.bulkPut(data.registros);
      }
      guardarBackupRegistros(data.registros);
    }

    // 5. Restaurar Despensa
    if (data.despensa && Array.isArray(data.despensa)) {
      await db.despensa.clear();
      if (data.despensa.length > 0) {
        await db.despensa.bulkPut(data.despensa);
      }
      guardarBackupDespensa(data.despensa);
    }

    return { exito: true, mensaje: 'Respaldo restaurado exitosamente en tu teléfono.' };
  } catch (err) {
    console.error('Error al restaurar respaldo JSON:', err);
    return { exito: false, mensaje: 'Error al procesar el archivo JSON: formato inválido.' };
  }
}
