import type { Producto } from '../types';

export interface DesglosePuntaje {
  densidadProteica: number; // 0-35
  penalizacionSellos: number; // 0 a -30 (-10 por sello)
  fibraSalud: number; // 0-15
  eficienciaCostoProteina: number; // 0-25
  bonoDirectoLider: number; // 0-10
  bonoDisponibilidad: number; // 0-5
  total: number; // Clamped a 0-100
}

export interface ResultadoEvaluacion {
  producto: Producto;
  puntaje: number;
  desglose: DesglosePuntaje;
  razonRecomendacion: string;
}

/**
 * Evalúa un producto de supermercado Líder con una rúbrica multi-criterio transparente de 0 a 100.
 */
export function evaluarProducto(prod: Producto): ResultadoEvaluacion {
  const macros = prod.macros100g ?? {
    calorias: 150,
    proteinas: 10,
    carbohidratos: 15,
    grasas: 5,
    fibra: 1,
  };

  const sellos = prod.sellosNegros ?? 0;

  // 1. Densidad proteica (0 a 35 pts)
  // 25g+ de proteina por 100g = max score (35)
  const proteinasPor100g = macros.proteinas;
  const densidadProteica = Math.min(35, Math.round((proteinasPor100g / 25) * 35));

  // 2. Sellos negros (0 a -30 pts, -8 por sello)
  const penalizacionSellos = sellos === 0 ? 0 : -Math.min(30, sellos * 8);

  // 3. Fibra y calidad nutricional (0 a 15 pts)
  const fibra = macros.fibra;
  const fibraSalud = Math.min(15, Math.round((fibra / 6) * 15));

  // 4. Eficiencia de costo por gramo de proteína (0 a 25 pts)
  // Si el precio es accesible y rinde mucha proteína
  let eficienciaCostoProteina = 15;
  if (prod.precio > 0 && proteinasPor100g > 0) {
    // Estimación de costo por g de proteína para 1kg o envase base
    if (prod.precio < 4000 && proteinasPor100g >= 15) {
      eficienciaCostoProteina = 25;
    } else if (prod.precio < 6000 && proteinasPor100g >= 12) {
      eficienciaCostoProteina = 20;
    } else if (prod.precio > 12000) {
      eficienciaCostoProteina = 8;
    }
  }

  // 5. Bono Líder Directo (10 pts) vs Marketplace
  const bonoDirectoLider = prod.vendedorTipo === 'directo_lider' ? 10 : 0;

  // 6. Bono Disponibilidad en Casona (5 pts)
  const bonoDisponibilidad = prod.disponibleEnCasona ? 5 : 0;

  // Total acumulado
  const bruto =
    densidadProteica +
    penalizacionSellos +
    fibraSalud +
    eficienciaCostoProteina +
    bonoDirectoLider +
    bonoDisponibilidad;

  const total = Math.max(0, Math.min(100, bruto));

  // Razón explicativa sintética y transparente
  let razon = '';
  if (sellos === 0 && proteinasPor100g >= 15) {
    razon = 'Excelente: 0 sellos negros y altísima concentración de proteína.';
  } else if (sellos === 0) {
    razon = 'Perfil limpio sin sellos y buena calidad de macronutrientes.';
  } else if (sellos > 2) {
    razon = `Penalizado por tener ${sellos} sellos de advertencia.`;
  } else {
    razon = `Buen aporte de proteína (${proteinasPor100g}g/100g) a precio competitivo.`;
  }

  const desglose: DesglosePuntaje = {
    densidadProteica,
    penalizacionSellos,
    fibraSalud,
    eficienciaCostoProteina,
    bonoDirectoLider,
    bonoDisponibilidad,
    total,
  };

  return {
    producto: {
      ...prod,
      puntajeNutricional: total,
      razonRecomendacion: razon,
    },
    puntaje: total,
    desglose,
    razonRecomendacion: razon,
  };
}

/**
 * Compara un conjunto de productos para un mismo alimento y asigna
 * las etiquetas "Mejor opción nutricional" y "Mejor disponible en Líder".
 */
export function clasificarOpciones(productos: Producto[]): Producto[] {
  if (productos.length === 0) return [];

  const evaluados = productos.map((p) => evaluarProducto(p));

  // Ordenar por puntaje descendente
  evaluados.sort((a, b) => b.puntaje - a.puntaje);

  // Mejor opción global
  const mejorGlobalId = evaluados[0]?.producto.id;

  // Mejor opción vendida directamente por Líder
  const mejorLiderItem = evaluados.find(
    (e) => e.producto.vendedorTipo === 'directo_lider' && e.producto.disponibleEnCasona
  );
  const mejorLiderId = mejorLiderItem ? mejorLiderItem.producto.id : mejorGlobalId;

  return evaluados.map((item) => ({
    ...item.producto,
    esMejorOpcion: item.producto.id === mejorGlobalId,
    esMejorLider: item.producto.id === mejorLiderId,
  }));
}
