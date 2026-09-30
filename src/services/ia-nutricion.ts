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
        ventaja: 'Misma proteína magra (~24g/100g), cero grasa y se cocina en 5 min.',
        equivalencia: '120g de pavo por 120g de pollo.',
      },
      {
        nombre: 'Pechuga entera con hueso',
        ventaja: '35% más barata en Líder. Retiras piel y hueso en 1 minuto.',
        equivalencia: '1 pechuga entera rinde 2 porciones.',
      },
      {
        nombre: 'Lomo centro de cerdo magro en bistec',
        ventaja: 'Ultra magro (solo 2.5g grasa), muy barato y rico en sartén.',
        equivalencia: '1 bistec de 120g.',
      },
      {
        nombre: 'Trutro entero deshuesado sin piel',
        ventaja: 'Jugoso y económico en Líder.',
        equivalencia: '120g.',
      },
    ],
  },
  jamon: {
    ingredientePrincipal: 'Jamón Pierna Tradicional (La Preferida)',
    sustitutos: [
      {
        nombre: 'Pechuga de pavo cocida en lonjas (Líder / Sopraval)',
        ventaja: 'Magro, 18g de proteína y listo para consumir en frío o caliente.',
        equivalencia: '2 láminas (25g a 30g).',
      },
      {
        nombre: 'Lomo centro de cerdo cocido o dorado',
        ventaja: 'Músculo 100% puro sin almidón ni sodio agregado.',
        equivalencia: '1 filete delgado de 30g.',
      },
      {
        nombre: 'Huevos duros en rodajas',
        ventaja: 'Aporte proteico similar y más económico.',
        equivalencia: '1 huevo duro por 2 láminas de jamón.',
      },
    ],
  },
  huevos: {
    ingredientePrincipal: 'Huevos de gallina (Cintazul / Líder)',
    sustitutos: [
      {
        nombre: 'Claras líquidas pasteurizadas (Botella 1L Líder)',
        ventaja: '100% albúmina pura sin colesterol ni grasa. Lista en 2 min en microondas.',
        equivalencia: '60 ml de clara = 2 claras de huevo.',
      },
      {
        nombre: 'Quesillo de vaca sureño',
        ventaja: 'Caseína pura, fresca y suave en pan tostado.',
        equivalencia: '50g de quesillo = 2 huevos.',
      },
      {
        nombre: 'Lomitos de atún al agua',
        ventaja: 'Proteína completa sin preparación.',
        equivalencia: '1/2 lata de atún al agua = 2 huevos.',
      },
    ],
  },
  leche_protein: {
    ingredientePrincipal: 'Leche Descremada Protein+ (Colun 13g)',
    sustitutos: [
      {
        nombre: 'Leche Protein+ Soprole 1L',
        ventaja: 'Idéntico perfil: 10g a 13g de proteína por vaso y 0 sellos.',
        equivalencia: '1 vaso (200 ml).',
      },
      {
        nombre: 'Leche descremada natural + 1/2 scoop Whey',
        ventaja: 'Leche normal de $1.290 mezclada con tu proteína en polvo.',
        equivalencia: '200 ml de leche + 15g whey = 19g prote.',
      },
      {
        nombre: 'Yogurt Protein natural (15g prote)',
        ventaja: 'Cremoso, digestivo y sin azúcar.',
        equivalencia: '1 pote individual (155g).',
      },
    ],
  },
  granola: {
    ingredientePrincipal: 'Granola Miel y Almendras (Quaker)',
    sustitutos: [
      {
        nombre: 'Avena instantánea tradicional en hojuelas',
        ventaja: 'Carbohidrato complejo más saciante y económico. Agrégale toque de canela.',
        equivalencia: '30g de avena = 25g granola.',
      },
      {
        nombre: 'Galletas de agua integrales',
        ventaja: 'Crocantes, económicas y sin sellos.',
        equivalencia: '4 galletas = 1 porción de granola.',
      },
      {
        nombre: 'Pan de molde integral tostado en cubitos',
        ventaja: 'Tostado crujiente para mezclar con leche tibia o yogurt.',
        equivalencia: '1 rebanada tostada picada.',
      },
    ],
  },
  vacuno: {
    ingredientePrincipal: 'Posta negra de vacuno (Tártaro / Bistec)',
    sustitutos: [
      {
        nombre: 'Posta rosada o asiento de vacuno',
        ventaja: 'Cortes magros equivalentes en proteína (~22g/100g), muy tiernos.',
        equivalencia: '1 bistec de 110g-120g.',
      },
      {
        nombre: 'Carne molida tártaro 4% grasa Líder',
        ventaja: 'Se dora en sartén en 3 minutos sin aceite adicional.',
        equivalencia: '110g de carne molida.',
      },
      {
        nombre: 'Pollo ganso o posta paleta fileteada fina',
        ventaja: 'Económico y magro.',
        equivalencia: '120g.',
      },
    ],
  },
  atun: {
    ingredientePrincipal: 'Lomitos de atún al agua en conserva',
    sustitutos: [
      {
        nombre: 'Jurel al agua natural (San José / Único)',
        ventaja: 'Baratísimo, alto en Omega-3 y con 22g de proteína por lata.',
        equivalencia: '1 taza de jurel limpio sin espinas.',
      },
      {
        nombre: 'Filete de merluza austral fresca o congelada',
        ventaja: 'Pescado blanco ultra magro, listo en 5 min a la plancha.',
        equivalencia: '1 filete de 120g.',
      },
      {
        nombre: 'Huevos revueltos (2 huevos enteros)',
        ventaja: 'Aporte proteico equivalente.',
        equivalencia: '2 huevos enteros.',
      },
    ],
  },
  merluza: {
    ingredientePrincipal: 'Filete de merluza austral con piel',
    sustitutos: [
      {
        nombre: 'Filetes de reineta congelada Líder',
        ventaja: 'Pescado blanco firme y muy magro, se sella con limón y sal en 5 min.',
        equivalencia: '1 filete de 120g.',
      },
      {
        nombre: 'Lomitos de atún al agua',
        ventaja: 'Cero cocción y precio controlado.',
        equivalencia: '1 lata drenada.',
      },
      {
        nombre: 'Pechuga de pollo en tiras',
        ventaja: 'Misma proteína magra de absorción limpia.',
        equivalencia: '120g de pollo.',
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
        ventaja: 'Cremoso para untar con orégano en marraqueta.',
        equivalencia: '70g a 90g.',
      },
      {
        nombre: 'Huevos revueltos o duros',
        ventaja: 'Proteína pura sin lactosa.',
        equivalencia: '1 a 2 huevos.',
      },
    ],
  },
  proteina: {
    ingredientePrincipal: 'Proteína en polvo (Whey Protein)',
    sustitutos: [
      {
        nombre: 'Leche con proteína (Protein+ Colun 13g)',
        ventaja: 'Aporta 13g por vaso (30g por 500ml), lista para tomar.',
        equivalencia: '1 vaso grande (300 ml).',
      },
      {
        nombre: 'Yogurt Protein natural',
        ventaja: '12g a 15g de proteína por pote.',
        equivalencia: '1 a 2 potes de yogurt protein.',
      },
      {
        nombre: 'Claras líquidas pasteurizadas',
        ventaja: '150 ml aportan ~17g de proteína pura.',
        equivalencia: '150 ml cocinados 2 min al microondas.',
      },
    ],
  },
  pan: {
    ingredientePrincipal: 'Pan de molde integral o Marraqueta fresca',
    sustitutos: [
      {
        nombre: 'Tortillas de trigo integrales (Rapiditas)',
        ventaja: 'Se calientan 20 segundos y no se echan a perder.',
        equivalencia: '1 a 2 tortillas integrales.',
      },
      {
        nombre: 'Pan pita integral 100%',
        ventaja: 'Bajo en sodio y crujiente al tostador.',
        equivalencia: '1 pan pita mediano.',
      },
      {
        nombre: 'Avena en hojuelas con agua o leche',
        ventaja: 'Carbohidrato complejo con más fibra.',
        equivalencia: '40g de avena en copos.',
      },
    ],
  },
  ensalada: {
    ingredientePrincipal: 'Ensalada Toscana fresca (Fresh Cut 300g)',
    sustitutos: [
      {
        nombre: 'Mix de lechugas hidropónicas lavadas',
        ventaja: 'Cero preparación, abrir bolsa y aliñar con limón y sal.',
        equivalencia: '1 plato hondo (~80g).',
      },
      {
        nombre: 'Espinaca baby lavada en bolsa',
        ventaja: 'Alta en hierro y magnesio, crujiente en crudo.',
        equivalencia: '80g de espinaca.',
      },
      {
        nombre: 'Lechuga escarola o repollada granel',
        ventaja: 'La opción más económica por kilo en Líder.',
        equivalencia: '4 hojas grandes lavadas.',
      },
    ],
  },
  palta: {
    ingredientePrincipal: 'Palta Hass malla o granel',
    sustitutos: [
      {
        nombre: 'Aceite de oliva extra virgen en crudo',
        ventaja: 'Mismas grasas monoinsaturadas cardiosaludables.',
        equivalencia: '1 cucharadita (5 ml) = ~25g de palta.',
      },
      {
        nombre: 'Quesillo de vaca sureño molido',
        ventaja: 'Da textura cremosa en tostadas sumando proteína.',
        equivalencia: '30g de quesillo.',
      },
    ],
  },
  frutas: {
    ingredientePrincipal: 'Plátano maduro o Arándanos frescos',
    sustitutos: [
      {
        nombre: 'Manzana verde Granny Smith',
        ventaja: 'Baja en azúcar, ultra crujiente y dura semanas fresca.',
        equivalencia: '1 manzana mediana por 1 plátano.',
      },
      {
        nombre: 'Arándanos congelados bolsa 500g',
        ventaja: 'Rinden el doble que el pote fresco y no se dañan.',
        equivalencia: '1 puñado (40g).',
      },
    ],
  },
  pastas_arroz: {
    ingredientePrincipal: 'Arroz grado 1 o Fideos Spaghetti',
    sustitutos: [
      {
        nombre: 'Papas granel cocidas (al vapor o microondas)',
        ventaja: 'El carbohidrato más saciante del mundo según el índice de saciedad.',
        equivalencia: '1 papa mediana (150g) = 50g arroz crudo.',
      },
      {
        nombre: 'Zapallo camote asado o hervido',
        ventaja: 'Bajísimo en calorías, permite comer porciones enormes.',
        equivalencia: '200g de zapallo camote.',
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

    // Limpiar '100g', '100ml', 'por 100' para que el regex no confunda la columna de 100g con el valor del macro
    const lSin100 = l
      .replace(/\b100\s*(?:g|gr|ml)\b/gi, '')
      .replace(/\bpor\s+100\b/gi, '')
      .replace(/\b100\s*g\b/gi, '');

    // Calorías / Energía
    if (l.includes('energia') || l.includes('energía') || l.includes('calorias') || l.includes('calorías') || l.includes('kcal')) {
      const match = lSin100.match(/(\d+)\s*(?:kcal|cal)?/i) || l.match(/(\d+)\s*(?:kcal|cal)/i);
      if (match?.[1] && !caloriasPor100g) {
        caloriasPor100g = parseInt(match[1], 10);
      }
    }

    // Proteínas
    if (l.includes('proteina') || l.includes('proteína') || l.includes('protein')) {
      const match = lSin100.match(regexNum);
      if (match?.[1] && proteinasGramos === undefined) {
        proteinasGramos = parseFloat(match[1].replace(',', '.'));
      }
    }

    // Grasas totales
    if ((l.includes('grasa total') || l.includes('grasas totales') || l.includes('lipidos')) && !l.includes('saturada')) {
      const match = lSin100.match(regexNum);
      if (match?.[1] && grasasTotalesGramos === undefined) {
        grasasTotalesGramos = parseFloat(match[1].replace(',', '.'));
      }
    }

    // Grasas saturadas
    if (l.includes('saturada')) {
      const match = lSin100.match(regexNum);
      if (match?.[1] && grasasSaturadasGramos === undefined) {
        grasasSaturadasGramos = parseFloat(match[1].replace(',', '.'));
      }
    }

    // Carbohidratos
    if (l.includes('carbohidrato') || l.includes('h. de c') || l.includes('hidratos de carbono')) {
      const match = lSin100.match(regexNum);
      if (match?.[1] && carbohidratosGramos === undefined) {
        carbohidratosGramos = parseFloat(match[1].replace(',', '.'));
      }
    }

    // Azúcares
    if (l.includes('azucar') || l.includes('azúcar')) {
      const match = lSin100.match(regexNum);
      if (match?.[1] && azucaresGramos === undefined) {
        azucaresGramos = parseFloat(match[1].replace(',', '.'));
      }
    }

    // Sodio
    if (l.includes('sodio')) {
      const match = lSin100.match(/(\d+)\s*(?:mg)?/i);
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
    return '🍗 Si no hay Pechuga Deshuesada en Líder:\n• 1° Pechuga Entera con hueso (35% más barata, retiras hueso en 1 min)\n• 2° Filete de Pavo Sopraval corte fino\n• 3° Trutro entero deshuesado sin piel\n• 4° Lomo centro de cerdo magro en bistec.';
  }

  if (p.includes('carne') || p.includes('vacuno') || p.includes('posta')) {
    return '🥩 Si no hay Posta Negra:\n• 1° Carne molida tártaro 4% grasa Líder\n• 2° Posta Rosada en bistec (magra y muy tierna)\n• 3° Asiento de vacuno o Pollo Ganso fileteado fino\n⚠️ Evita huachalomo o sobrecostilla (>10% grasa).';
  }

  if (p.includes('jamon') || p.includes('jamón')) {
    return '🥓 Si no hay Jamón Pierna La Preferida:\n• 1° Pechuga de pavo cocida en lonjas (Líder / Sopraval)\n• 2° Lomo centro de cerdo dorado en láminas finas\n• 3° Huevo duro en rodajas con orégano.';
  }

  if (p.includes('leche') || p.includes('protein+')) {
    return '🥛 Si no hay Leche Protein+ Colun 13g:\n• 1° Leche Protein+ Soprole 1L\n• 2° Leche descremada común de $1.290 + 1/2 scoop de tu proteína Whey\n• 3° Yogurt Protein natural (15g proteína por pote).';
  }

  if (p.includes('granola')) {
    return '🥣 Si no hay Granola Quaker Miel Almendras:\n• 1° Avena instantánea en hojuelas con canela y endulzante\n• 2° Galletas de agua integrales Line\n• 3° Pan de molde integral tostado en cubitos crocantes.';
  }

  if (p.includes('merluza') || p.includes('pescado')) {
    return '🐟 Si no hay Merluza Austral en Líder:\n• 1° Filetes de Reineta congelada en porciones\n• 2° Lomitos de atún al agua en lata\n• 3° Pechuga de pollo en tiras sellada con limón.';
  }

  if (p.includes('ensalada') || p.includes('lechuga') || p.includes('espinaca')) {
    return '🥗 Si no hay Ensalada Toscana Fresh Cut:\n• 1° Mix de lechugas hidropónicas lavadas en bolsa\n• 2° Espinaca baby en bolsa (lista para consumir)\n• 3° Lechuga escarola o repollada a granel.';
  }

  if (p.includes('atun') || p.includes('atún')) {
    return '🐟 En atún Líder:\n• SIEMPRE: "Lomitos de Atún al Agua" (San José, Líder o Robinson Crusoe)\n❌ Evita atún en aceite (triplica calorías) y atún desmenuzado (rinde menos proteína neta).';
  }

  if (p.includes('quesillo') || p.includes('queso')) {
    return '🧀 Si no hay Quesillo Colun:\n• 1° Queso fresco tradicional o light\n• 2° Queso ricotta descremada para untar\n• 3° Huevos revueltos o duros.';
  }

  if (p.includes('huevo') || p.includes('huevos')) {
    return '🥚 Si no hay bandejas de 30 huevos:\n• 1° Claras líquidas pasteurizadas en botella 1L Líder (microondas 2 min)\n• 2° Quesillo sureño (50g = 2 huevos)\n• 3° Lomitos de atún al agua.';
  }

  if (p.includes('proteina') || p.includes('whey') || p.includes('polvo')) {
    return '💪 Si se te acaba la proteína en polvo:\n• 1° Leche Protein+ Colun o Soprole (30g prote por 500ml)\n• 2° Botella de claras pasteurizadas líquidas (150 ml = ~18g prote)\n• 3° 1 lata de lomitos de atún al agua.';
  }

  return '💡 Sube o toma una foto de la tabla nutricional con el botón de cámara/galería aquí abajo y te daré un veredicto instantáneo de 3 líneas sobre si te sirve o te conviene otra opción.';
}
