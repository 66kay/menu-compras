import type {
  PlanDia,
  Receta,
  ItemDespensa,
  ItemCompra,
  CategoriaPasillo,
  UnidadMedida,
} from '../types';
import { obtenerMejorOpcionBase } from '../services/catalogo-lider-base';

interface AcumuladorIngrediente {
  nombre: string;
  cantidadBase: number; // en g, ml, o unidades directas
  tipoUnidad: 'peso' | 'volumen' | 'unidad';
  categoriaPasillo: CategoriaPasillo;
  terminoBusquedaLider?: string;
}

/**
 * Normaliza nombres de ingredientes para agrupar variantes similares
 * (ej: "Pechuga de pollo deshuesada" vs "Pechuga de pollo en tiras" -> "Pechuga de pollo")
 */
function normalizarNombreIngrediente(nombre: string): string {
  const n = nombre.trim().toLowerCase();
  if (n.includes('pechuga de pollo') || n.includes('pechuga pollo')) return 'Pechuga de pollo deshuesada';
  if (n.includes('posta negra') || n.includes('tártaro') || n.includes('carne molida')) return 'Posta negra de vacuno';
  if (n.includes('salmón') || n.includes('salmon')) return 'Filete de salmón';
  if (n.includes('merluza')) return 'Filete de merluza austral';
  if (n.includes('claras de huevo') || n.includes('clara') || n.includes('huevo')) return 'Huevos de gallina';
  if (n.includes('marraqueta')) return 'Marraqueta fresca';
  if (n.includes('hallulla')) return 'Hallulla integral';
  if (n.includes('pan de molde') || n.includes('pan molde')) return 'Pan de molde integral';
  if (n.includes('galleta')) return 'Galletas de agua integrales';
  if (n.includes('palta')) return 'Palta Hass';
  if (n.includes('granola')) return 'Granola con miel y almendras';
  if (n.includes('leche')) return 'Leche descremada con proteína (Protein+)';
  if (n.includes('yogurt') && n.includes('protein')) return 'Yogurt tipo griego natural protein';
  if (n.includes('quesillo')) return 'Quesillo de vaca sureño';
  if (n.includes('jamon') || n.includes('jamón') || n.includes('pierna')) return 'Jamón Pierna tradicional envasado';
  if (n.includes('arroz')) return 'Arroz blanco grado 1';
  if (n.includes('papas') || n.includes('papa')) return 'Papas granel';
  if (n.includes('zapallo camote')) return 'Zapallo camote';
  if (n.includes('zapallito')) return 'Zapallito italiano';
  if (n.includes('ensalada') || n.includes('mix') || n.includes('toscana') || n.includes('lechuga') || n.includes('espinaca')) return 'Ensalada Mix Toscana Bolsa, 180 g';
  if (n.includes('champiñon') || n.includes('champinon')) return 'Champiñones laminados';
  if (n.includes('fideo') || n.includes('spaghetti') || n.includes('tallarin')) return 'Fideos spaghetti o tallarines';
  if (n.includes('tortilla')) return 'Tortillas de trigo integrales (rapiditas)';
  if (n.includes('tomate')) return 'Tomate chileno';
  if (n.includes('cebolla')) return 'Cebolla granel';
  if (n.includes('plátano') || n.includes('platano')) return 'Plátano maduro';
  if (n.includes('mayo') || n.includes('mayonesa') || n.includes('kraft')) return 'Mayonesa Regular Frasco, 1.262 g';
  if (n.includes('aceite')) return 'Aceite de oliva o vegetal';
  if (n.includes('atún') || n.includes('atun')) return 'Lomitos de atún al agua';
  if (n.includes('proteína en polvo') || n.includes('whey')) return 'Suplemento de proteína Whey chocolate tarro';
  return nombre.trim();
}

/**
 * Convierte cantidad y unidad a una unidad base normalizada (g, ml o conteo de unidades)
 */
function aUnidadBase(cantidad: number, unidad: UnidadMedida): { cantidadBase: number; tipo: 'peso' | 'volumen' | 'unidad' } {
  switch (unidad) {
    case 'kg':
      return { cantidadBase: cantidad * 1000, tipo: 'peso' };
    case 'g':
      return { cantidadBase: cantidad, tipo: 'peso' };
    case 'l':
      return { cantidadBase: cantidad * 1000, tipo: 'volumen' };
    case 'ml':
      return { cantidadBase: cantidad, tipo: 'volumen' };
    case 'cucharada':
      return { cantidadBase: cantidad * 15, tipo: 'peso' };
    case 'cucharadita':
      return { cantidadBase: cantidad * 5, tipo: 'peso' };
    case 'taza':
      return { cantidadBase: cantidad * 200, tipo: 'peso' };
    case 'rebanada':
    case 'unidad':
    case 'pizca':
    default:
      return { cantidadBase: cantidad, tipo: 'unidad' };
  }
}

/**
 * Convierte desde la unidad base a una unidad legible de compra (ej: 1500g -> 1.5 kg)
 */
function desdeUnidadBase(cantidadBase: number, tipo: 'peso' | 'volumen' | 'unidad'): { cantidad: number; unidad: UnidadMedida } {
  if (tipo === 'peso') {
    if (cantidadBase >= 1000) {
      return {
        cantidad: Math.round((cantidadBase / 1000) * 10) / 10,
        unidad: 'kg',
      };
    }
    return {
      cantidad: Math.round(cantidadBase),
      unidad: 'g',
    };
  }
  if (tipo === 'volumen') {
    if (cantidadBase >= 1000) {
      return {
        cantidad: Math.round((cantidadBase / 1000) * 10) / 10,
        unidad: 'l',
      };
    }
    return {
      cantidad: Math.round(cantidadBase),
      unidad: 'ml',
    };
  }
  return {
    cantidad: Math.round(cantidadBase),
    unidad: 'unidad',
  };
}

function esCondimentoODespensaPermanente(nombre: string, unidad: string, opcional?: boolean): boolean {
  if (opcional || unidad === 'pizca') return true;
  const n = nombre.toLowerCase().trim();
  const palabrasCondimento = [
    'sal',
    'pimienta',
    'orégano',
    'oregano',
    'comino',
    'ajo en polvo',
    'canela',
    'ciboulette',
    'aliño',
    'condimento',
    'hierbas',
    'laurel',
    'curry',
    'páprika',
    'paprika',
    'nuez moscada',
    'clavo de olor',
    'polvos de hornear',
    'bicarbonato',
    'esencia de vainilla',
  ];
  return palabrasCondimento.some((c) => n.includes(c));
}

/**
 * Genera y consolida la lista de compras para una semana del planificador,
 * restando las existencias de la despensa y agrupando por pasillo de supermercado.
 */
export function generarListaCompras(
  planSemana: PlanDia[],
  recetas: Receta[],
  despensa: ItemDespensa[],
  fechaSemana: string
): ItemCompra[] {
  const acumulados = new Map<string, AcumuladorIngrediente>();
  const mapaRecetas = new Map<string, Receta>(recetas.map((r) => [r.id, r]));

  // 1. Recorrer todos los días del plan y sumar ingredientes
  for (const dia of planSemana) {
    const comidas = [
      dia.comidas.desayuno,
      dia.comidas.almuerzo,
      dia.comidas.colacion,
      dia.comidas.once,
      dia.comidas.cena,
    ];

    for (const comida of comidas) {
      if (!comida) continue;
      const receta = mapaRecetas.get(comida.recetaId);
      if (!receta) continue;

      const factorPorciones = comida.porciones / receta.porciones;

      for (const ing of receta.ingredientes) {
        // Ignorar condimentos básicos de despensa (sal, pimienta, orégano, comino, ajo en polvo, etc.) y pizcas
        if (esCondimentoODespensaPermanente(ing.nombre, ing.unidad, ing.opcional)) {
          continue;
        }

        const nombreNorm = normalizarNombreIngrediente(ing.nombre);
        const { cantidadBase, tipo } = aUnidadBase(ing.cantidad * factorPorciones, ing.unidad);

        const existente = acumulados.get(nombreNorm);
        if (existente) {
          existente.cantidadBase += cantidadBase;
        } else {
          acumulados.set(nombreNorm, {
            nombre: nombreNorm,
            cantidadBase,
            tipoUnidad: tipo,
            categoriaPasillo: ing.categoriaPasillo,
            terminoBusquedaLider: ing.terminoBusquedaLider,
          });
        }
      }
    }
  }

  // 2. Mapear despensa actual por nombre normalizado
  const mapaDespensa = new Map<string, number>();
  for (const item of despensa) {
    const norm = normalizarNombreIngrediente(item.nombre);
    const { cantidadBase } = aUnidadBase(item.cantidad, item.unidad);
    mapaDespensa.set(norm, (mapaDespensa.get(norm) ?? 0) + cantidadBase);
  }

  // 3. Crear items de compra descontando despensa
  const itemsCompra: ItemCompra[] = [];

  for (const [nombre, acum] of acumulados.entries()) {
    let enDespensaBase = mapaDespensa.get(nombre) ?? 0;

    // Si es proteína en polvo (Whey), el usuario ya cuenta con su tarro en casa
    if (nombre.includes('proteína Whey') || nombre.includes('proteina Whey') || nombre.includes('Whey')) {
      enDespensaBase = Math.max(enDespensaBase, acum.cantidadBase);
    }

    const aComprarBase = Math.max(0, acum.cantidadBase - enDespensaBase);

    // Si ya lo tiene 100% en despensa (como su proteína Whey), no requiere comprarlo en el súper
    if (aComprarBase <= 0) {
      continue;
    }

    const necesaria = desdeUnidadBase(acum.cantidadBase, acum.tipoUnidad);
    const despensaVisible = desdeUnidadBase(enDespensaBase, acum.tipoUnidad);
    const comprarVisible = desdeUnidadBase(aComprarBase, acum.tipoUnidad);

    const productoLider = obtenerMejorOpcionBase(
      acum.terminoBusquedaLider || nombre,
      acum.categoriaPasillo
    );

    // 4. Deduplicación estricta por producto de Líder:
    // Si dos ingredientes distintos apuntan al mismo SKU o producto en Líder,
    // se fusionan en un único ítem con cantidades sumadas para evitar duplicados visuales en la góndola.
    if (productoLider) {
      const yaExiste = itemsCompra.find(
        (i) =>
          i.productoSeleccionado?.id === productoLider.id ||
          (productoLider.sku && i.productoSeleccionado?.sku === productoLider.sku)
      );
      if (yaExiste) {
        yaExiste.cantidadNecesaria += necesaria.cantidad;
        yaExiste.cantidadAComprar += comprarVisible.cantidad;
        continue;
      }
    }

    itemsCompra.push({
      id: `compra_${fechaSemana}_${nombre.replace(/\s+/g, '_').toLowerCase()}`,
      ingredienteNombre: nombre,
      cantidadNecesaria: necesaria.cantidad,
      unidad: necesaria.unidad,
      categoriaPasillo: acum.categoriaPasillo,
      comprado: false,
      fechaSemana,
      enDespensa: despensaVisible.cantidad,
      cantidadAComprar: comprarVisible.cantidad,
      productoSeleccionado: productoLider,
    });
  }

  // Ordenar por pasillo para facilitar el recorrido
  return itemsCompra.sort((a, b) => a.categoriaPasillo.localeCompare(b.categoriaPasillo));
}

export const TITULOS_PASILLOS: Record<CategoriaPasillo, { titulo: string; icono: string }> = {
  carnes_aves: { titulo: 'Carnes, Pollo y Aves', icono: 'Beef' },
  pescados_mariscos: { titulo: 'Pescados y Mariscos', icono: 'Fish' },
  lacteos_huevos: { titulo: 'Lácteos, Huevos y Quesos', icono: 'Milk' },
  frutas_verduras: { titulo: 'Frutas y Verduras Frescas', icono: 'Apple' },
  panaderia_cereales: { titulo: 'Panadería, Avena y Cereales', icono: 'Croissant' },
  despensa_abarrotes: { titulo: 'Despensa y Abarrotes', icono: 'Package' },
  congelados: { titulo: 'Congelados', icono: 'Snowflake' },
  bebidas: { titulo: 'Bebidas e Infusiones', icono: 'Coffee' },
};
