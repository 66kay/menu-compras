import { createWorker } from 'tesseract.js';

export interface MetricasTablaNutricional {
  porcionTexto?: string;
  caloriasPor100g?: number;
  proteinasGramos?: number;
  grasasTotalesGramos?: number;
  grasasSaturadasGramos?: number;
  carbohidratosGramos?: number;
  azucaresGramos?: number;
  sodioMg?: number;
  sellosDetectados: string[];
  confianzaOCR?: number;
  textoCrudo?: string;
}

export type VeredictoNutricionalTipo = 'visto_bueno' | 'aceptable' | 'no_recomendado';

export interface VeredictoNutricional {
  tipo: VeredictoNutricionalTipo;
  titulo: string;
  calificacion: number; // 1 a 10
  mensaje: string;
  puntosPositivos: string[];
  puntosAtencion: string[];
  porcionRecomendada: string;
  aptoParaRecomposicion: boolean;
  metricas: MetricasTablaNutricional;
}

/**
 * Base de conocimiento de sustituciones rápidas en supermercado Líder
 */
export const SUSTITUCIONES_LIDER: Record<
  string,
  {
    ingredientePrincipal: string;
    sustitutos: { nombre: string; ventaja: string; equivalencia: string }[];
  }
> = {
  pollo: {
    ingredientePrincipal: 'Pechuga de pollo deshuesada',
    sustitutos: [
      {
        nombre: 'Filete de pechuga de pavo (Sopraval / Líder)',
        ventaja: 'Misma proteína magra (~24g/100g), cero grasa y se dora en sartén en 5 min.',
        equivalencia: '120g de pavo por 120g de pollo.',
      },
      {
        nombre: 'Pechuga de pollo entera con hueso',
        ventaja: '30% a 40% más barata. Solo le retiras la piel y el hueso con cuchillo.',
        equivalencia: '1 pechuga entera rinde aprox. 2 porciones de filete.',
      },
      {
        nombre: 'Trutro entero deshuesado sin piel',
        ventaja: 'Más jugoso, precio similar o menor en Líder.',
        equivalencia: '120g en sartén.',
      },
      {
        nombre: 'Lomo centro de cerdo magro',
        ventaja: 'Ultra magro (menos grasa que el trutro), baratísimo y listo en 5 minutos.',
        equivalencia: '1 bistec de 120g.',
      },
    ],
  },
  vacuno: {
    ingredientePrincipal: 'Posta negra de vacuno (Tártaro / Bistec)',
    sustitutos: [
      {
        nombre: 'Posta rosada o asiento de vacuno',
        ventaja: 'Cortes magros equivalentes en proteína (~22g/100g), muy blandos en sartén.',
        equivalencia: '1 bistec de 110-120g.',
      },
      {
        nombre: 'Carne molida tártaro 4% o vacuno 7% grasa',
        ventaja: 'Excelente ratio proteico, dorada en 4 minutos sin aceite adicional.',
        equivalencia: '110g de carne molida.',
      },
      {
        nombre: 'Pollo ganso o posta paleta',
        ventaja: 'Económico si está en oferta, apto para bistec fino.',
        equivalencia: '120g.',
      },
    ],
  },
  atun: {
    ingredientePrincipal: 'Lomitos de atún al agua en conserva',
    sustitutos: [
      {
        nombre: 'Jurel al agua natural (San José / Único)',
        ventaja: 'Súper económico, alto en Omega-3 y con 22g de proteína por porción.',
        equivalencia: '1 taza de jurel desmenuzado sin espinas.',
      },
      {
        nombre: 'Filete de merluza austral fresca o congelada',
        ventaja: 'Pescado blanco ultra magro, listo en 6 minutos al sartén con limón.',
        equivalencia: '1 filete de 130g.',
      },
      {
        nombre: 'Huevos enteros + claras',
        ventaja: 'Siempre disponible y el costo por gramo de proteína más bajo.',
        equivalencia: '2 huevos enteros + 2 claras equivalen a 1 lata de atún.',
      },
    ],
  },
  quesillo: {
    ingredientePrincipal: 'Quesillo de vaca sureño (Colun / Líder)',
    sustitutos: [
      {
        nombre: 'Queso fresco light o descremado',
        ventaja: 'Similar textura, alto en caseína y bajo en grasa.',
        equivalencia: '80g a 100g en tostadas o ensalada.',
      },
      {
        nombre: 'Queso ricotta magro (Light)',
        ventaja: 'Textura cremosa para untar en pan con orégano o fruta.',
        equivalencia: '70g a 90g.',
      },
      {
        nombre: 'Huevos revueltos o duros',
        ventaja: 'Proteína pura sin lactosa.',
        equivalencia: '2 huevos duros en rebanadas con tomate.',
      },
    ],
  },
  proteina: {
    ingredientePrincipal: 'Proteína en polvo (Whey Protein)',
    sustitutos: [
      {
        nombre: 'Leche con proteína (Protein+ Colun o Soprole)',
        ventaja: 'Aporta 30g de proteína pura por envase, lista para tomar fría sin shaker.',
        equivalencia: '1 caja de 330ml o 1 vaso grande de 350ml de leche protein.',
      },
      {
        nombre: 'Yogurt Protein (Soprole o Loncoleche)',
        ventaja: 'Aporta entre 12g y 15g de proteína por pote, ideal con 1 plátano.',
        equivalencia: '1 a 2 potes de yogurt protein.',
      },
      {
        nombre: 'Claras de huevo pasteurizadas líquidas en botella',
        ventaja: 'Se venden en Líder en botella de 1 litro. Se cocinan 2 minutos en microondas.',
        equivalencia: '150 ml de claras líquidas aportan ~17g de proteína pura.',
      },
    ],
  },
  pan: {
    ingredientePrincipal: 'Pan de molde integral 100% o Marraqueta',
    sustitutos: [
      {
        nombre: 'Pan pita integral 100%',
        ventaja: 'Bajo en sodio, crujiente en tostador en 2 minutos.',
        equivalencia: '1 pan pita mediano.',
      },
      {
        nombre: 'Tortillas de trigo integrales (Rapiditas Protein o Integrales)',
        ventaja: 'Duran semanas en despensa, listas en 20 segundos.',
        equivalencia: '1 a 2 tortillas.',
      },
      {
        nombre: 'Avena instantánea tradicional en tazón',
        ventaja: 'Carbohidrato complejo de absorción lenta con más fibra.',
        equivalencia: '40g a 50g de avena en copos.',
      },
    ],
  },
};

/**
 * Escanea una imagen de tabla nutricional usando Tesseract.js en el navegador.
 */
export async function escanearTablaNutricionalOCR(
  imagenFile: File | Blob | string,
  onProgreso?: (progreso: number, estado: string) => void
): Promise<MetricasTablaNutricional> {
  let worker;
  try {
    onProgreso?.(10, 'Iniciando motor de reconocimiento OCR...');
    worker = await createWorker('spa');

    onProgreso?.(35, 'Analizando imagen y extrayendo texto...');
    const ret = await worker.recognize(imagenFile);
    const texto = ret.data.text;
    const confianza = ret.data.confidence;

    onProgreso?.(85, 'Interpretando macronutrientes y sellos...');
    const metricas = parsearTextoNutricional(texto);
    metricas.confianzaOCR = confianza;
    metricas.textoCrudo = texto;

    onProgreso?.(100, 'Análisis completado.');
    return metricas;
  } catch (err) {
    console.warn('Error en OCR local de Tesseract, aplicando fallback heurístico:', err);
    return {
      sellosDetectados: [],
      textoCrudo: '',
      confianzaOCR: 0,
    };
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

/**
 * Parsea el texto extraído por OCR buscando patrones estándar chilenos (Minsal)
 */
export function parsearTextoNutricional(texto: string): MetricasTablaNutricional {
  const lineas = texto.toLowerCase().split('\n');

  let caloriasPor100g: number | undefined;
  let proteinasGramos: number | undefined;
  let grasasTotalesGramos: number | undefined;
  let grasasSaturadasGramos: number | undefined;
  let carbohidratosGramos: number | undefined;
  let azucaresGramos: number | undefined;
  let sodioMg: number | undefined;
  let porcionTexto: string | undefined;

  const sellosDetectados: string[] = [];
  if (texto.toLowerCase().includes('alto en azucares') || texto.toLowerCase().includes('alto en azúcares')) {
    sellosDetectados.push('Alto en Azúcares');
  }
  if (texto.toLowerCase().includes('alto en grasas saturadas')) {
    sellosDetectados.push('Alto en Grasas Saturadas');
  }
  if (texto.toLowerCase().includes('alto en sodio')) {
    sellosDetectados.push('Alto en Sodio');
  }
  if (texto.toLowerCase().includes('alto en calorias') || texto.toLowerCase().includes('alto en calorías')) {
    sellosDetectados.push('Alto en Calorías');
  }

  const regexNum = /(\d+(?:[.,]\d+)?)/;

  for (const l of lineas) {
    if (l.includes('porcion') || l.includes('porción')) {
      porcionTexto = l.trim();
    }

    // Calorías / Energía
    if (l.includes('energia') || l.includes('energía') || l.includes('calorias') || l.includes('calorías') || l.includes('kcal')) {
      const match = l.match(/(\d+)\s*(?:kcal|cal)?/i);
      if (match?.[1] && !caloriasPor100g) {
        caloriasPor100g = parseInt(match[1], 10);
      }
    }

    // Proteínas
    if (l.includes('proteina') || l.includes('proteína') || l.includes('protein')) {
      const match = l.match(regexNum);
      if (match?.[1] && proteinasGramos === undefined) {
        proteinasGramos = parseFloat(match[1].replace(',', '.'));
      }
    }

    // Grasas totales
    if ((l.includes('grasa total') || l.includes('grasas totales') || l.includes('lipidos')) && !l.includes('saturada')) {
      const match = l.match(regexNum);
      if (match?.[1] && grasasTotalesGramos === undefined) {
        grasasTotalesGramos = parseFloat(match[1].replace(',', '.'));
      }
    }

    // Grasas saturadas
    if (l.includes('saturada')) {
      const match = l.match(regexNum);
      if (match?.[1] && grasasSaturadasGramos === undefined) {
        grasasSaturadasGramos = parseFloat(match[1].replace(',', '.'));
      }
    }

    // Carbohidratos
    if (l.includes('carbohidrato') || l.includes('h. de c') || l.includes('hidratos de carbono')) {
      const match = l.match(regexNum);
      if (match?.[1] && carbohidratosGramos === undefined) {
        carbohidratosGramos = parseFloat(match[1].replace(',', '.'));
      }
    }

    // Azúcares
    if (l.includes('azucar') || l.includes('azúcar')) {
      const match = l.match(regexNum);
      if (match?.[1] && azucaresGramos === undefined) {
        azucaresGramos = parseFloat(match[1].replace(',', '.'));
      }
    }

    // Sodio
    if (l.includes('sodio')) {
      const match = l.match(/(\d+)\s*(?:mg)?/i);
      if (match?.[1] && sodioMg === undefined) {
        sodioMg = parseInt(match[1], 10);
      }
    }
  }

  return {
    porcionTexto,
    caloriasPor100g,
    proteinasGramos,
    grasasTotalesGramos,
    grasasSaturadasGramos,
    carbohidratosGramos,
    azucaresGramos,
    sodioMg,
    sellosDetectados,
  };
}

/**
 * Evalúa las métricas nutricionales contra el objetivo deportivo
 * (Hombre, 21 años, 191cm, recomposición muscular y fuerza)
 */
export function evaluarProductoNutricional(
  metricas: MetricasTablaNutricional,
  categoriaBuscada: string = 'general'
): VeredictoNutricional {
  const prote = metricas.proteinasGramos ?? 0;
  const cals = metricas.caloriasPor100g ?? (prote * 4 + (metricas.carbohidratosGramos ?? 0) * 4 + (metricas.grasasTotalesGramos ?? 0) * 9);
  const grasas = metricas.grasasTotalesGramos ?? 0;
  const azucares = metricas.azucaresGramos ?? 0;
  const sellos = metricas.sellosDetectados;

  const puntosPositivos: string[] = [];
  const puntosAtencion: string[] = [];
  let score = 5;

  const ratioProteina = cals > 0 ? (prote * 4) / cals : 0;

  if (prote >= 18 || ratioProteina >= 0.4) {
    puntosPositivos.push(`Excelente densidad proteica: ${prote}g de proteína por porción/100g.`);
    score += 3;
  } else if (prote >= 10 || ratioProteina >= 0.25) {
    puntosPositivos.push(`Aporte proteico moderado: ${prote}g por porción.`);
    score += 1;
  } else {
    puntosAtencion.push(`Bajo en proteína (${prote}g). No ayuda significativamente a tu meta de 150g diarios.`);
    score -= 2;
  }

  if (grasas <= 3) {
    puntosPositivos.push('Muy bajo en grasas (<3g), ideal para recomposición muscular limpia.');
    score += 1;
  } else if (grasas > 12) {
    puntosAtencion.push(`Alto contenido de grasa (${grasas}g), lo que eleva bastante las calorías totales.`);
    score -= 2;
  }

  if (azucares > 10 || sellos.includes('Alto en Azúcares')) {
    puntosAtencion.push('Contiene azúcares añadidos. Puede provocar picos de glucosa y frenar la pérdida de grasa.');
    score -= 2;
  }

  if (sellos.includes('Alto en Grasas Saturadas')) {
    puntosAtencion.push('Sello "Alto en Grasas Saturadas". Consumir con mucha moderación.');
    score -= 1;
  }

  if (sellos.length === 0) {
    puntosPositivos.push('Cero sellos negros: alimento limpio y sin excesos de nutrientes críticos.');
    score += 1;
  }

  score = Math.max(1, Math.min(10, score));

  let tipo: VeredictoNutricionalTipo;
  let titulo: string;
  let mensaje: string;
  let porcionRecomendada: string;

  if (score >= 7) {
    tipo = 'visto_bueno';
    titulo = '🟢 Visto Bueno: Excelente opción para tu dieta';
    mensaje = `Este producto cumple con creces tus requerimientos deportivos: tiene un perfil magro con ${prote}g de proteína y calorías controladas. Puedes comprarlo sin dudar como reemplazo.`;
    porcionRecomendada = categoriaBuscada.includes('carne') || categoriaBuscada.includes('pollo')
      ? 'Porción ideal: 110g a 130g en plato principal.'
      : 'Porción sugerida: 1 envase individual o 100g.';
  } else if (score >= 4) {
    tipo = 'aceptable';
    titulo = '🟡 Aceptable: Salva el apuro, pero modera la porción';
    mensaje = `Es una opción decente si no encontraste tu alternativa habitual en Líder. Aporta ${prote}g de proteína, aunque ten en cuenta sus ${grasas}g de grasa o carbohidratos adicionales.`;
    porcionRecomendada = 'Consume una porción moderada (80g a 100g) y acompáñalo con verduras frescas.';
  } else {
    tipo = 'no_recomendado';
    titulo = '🔴 No Recomendado: Busca otra opción en el pasillo';
    mensaje = `No se alinea con tu objetivo de recomposición. Su nivel de proteína es insuficiente (${prote}g) o tiene un exceso de grasa/azúcar que desperdiciará tus calorías diarias.`;
    porcionRecomendada = 'Mejor busca cortes magros, atún al agua, quesillo o huevos.';
  }

  return {
    tipo,
    titulo,
    calificacion: score,
    mensaje,
    puntosPositivos,
    puntosAtencion,
    porcionRecomendada,
    aptoParaRecomposicion: score >= 6,
    metricas,
  };
}

/**
 * Respuestas precalculadas para dudas comunes en el supermercado
 */
export function responderDudaSupermercado(pregunta: string): string {
  const p = pregunta.toLowerCase();

  if (p.includes('pollo') || p.includes('pechuga')) {
    return '🍗 Si no hay Pechuga Deshuesada en Líder:\n1) Lleva Pechuga Entera con hueso (es mucho más barata y le sacas la piel en 1 min);\n2) Filete de Pavo Sopraval corte fino;\n3) Trutro entero deshuesado sin piel;\n4) Lomo centro de cerdo magro en bistec.';
  }

  if (p.includes('carne') || p.includes('vacuno') || p.includes('posta')) {
    return '🥩 Si no hay Posta Negra tártaro:\n1) Tártaro 4% grasa en bandeja envasada;\n2) Posta Rosada (corte magro muy tierno para sartén);\n3) Asiento de vacuno;\n4) Pollo Ganso fileteado delgado.\n⚠️ Evita carnes con más de 10% de grasa como huachalomo o sobrecostilla.';
  }

  if (p.includes('atun') || p.includes('atún')) {
    return '🐟 En atún: compra SIEMPRE "Lomitos de Atún al Agua" (San José, Líder o Robinson Crusoe).\n❌ Evita el atún en aceite (triplica las calorías) y el atún desmenuzado (contiene más agua y rinde menos proteína neta).';
  }

  if (p.includes('quesillo') || p.includes('queso')) {
    return '🧀 Si no hay Quesillo Colun:\n1) Queso fresco light (menos de 8g de grasa);\n2) Ricotta descremada Colun o Quillayes;\n3) Claras de huevo en sartén o huevos duros como reemplazo directo.';
  }

  if (p.includes('proteina') || p.includes('whey') || p.includes('polvo')) {
    return '💪 Si se te acaba la proteína en polvo o no tienes shaker a mano:\n1) Leche con Proteína (Protein+ Colun o Soprole) aporta 30g de proteína de absorción rápida;\n2) Botella de claras pasteurizadas (150 ml = ~18g prote);\n3) Dos latas de atún al agua.';
  }

  return '💡 Para darte un veredicto exacto de ese producto, sube o toma una foto de la Tabla Nutricional y la leeré al instante para decirte si tiene Visto Bueno o si te conviene buscar otra alternativa.';
}
