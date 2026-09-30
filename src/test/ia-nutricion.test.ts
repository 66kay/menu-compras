import { describe, it, expect } from 'vitest';
import {
  parsearTextoNutricional,
  evaluarProductoNutricional,
  responderDudaSupermercado,
  SUSTITUCIONES_LIDER,
  type MetricasTablaNutricional,
} from '../services/ia-nutricion';

describe('QA Tester Suite: Motor de IA Nutricional y OCR para Supermercado Líder', () => {
  describe('1. Parsing de Texto Nutricional OCR (Norma Chilena Minsal)', () => {
    it('extrae correctamente los valores numéricos sin confundir la columna de "100g" con la cantidad del macronutriente', () => {
      // Simula el texto real extraído por OCR de una caja de leche con proteína chilena (ej. Protein+ Colun)
      const textoOcrReal = `
        INFORMACION NUTRICIONAL
        Porción: 1 vaso (200 ml)
        Porciones por envase: 5
        100ml | Porción
        Energía (kcal) 100ml: 46 | Porción: 92
        Proteínas (g) 100ml: 6.5 | Porción: 13.0
        Grasas totales (g) 100ml: 0.2 | Porción: 0.4
        Grasas saturadas (g) 100ml: 0.1 | Porción: 0.2
        Hidratos de carbono disp. (g) 100ml: 4.8 | Porción: 9.6
        Azúcares totales (g) 100ml: 4.5 | Porción: 9.0
        Sodio (mg) 100ml: 58 | Porción: 116
      `;

      const metricas = parsearTextoNutricional(textoOcrReal);

      // Verificación crítica: NO debe ser 100
      expect(metricas.proteinasGramos).toBe(6.5);
      expect(metricas.caloriasPor100g).toBe(46);
      expect(metricas.grasasTotalesGramos).toBe(0.2);
      expect(metricas.grasasSaturadasGramos).toBe(0.1);
      expect(metricas.carbohidratosGramos).toBe(4.8);
      expect(metricas.azucaresGramos).toBe(4.5);
      expect(metricas.sodioMg).toBe(58);
      expect(metricas.sellosDetectados).toEqual([]);
    });

    it('detecta sellos negros oficiales de advertencia del Minsal', () => {
      const textoConSellos = `
        GALLETAS CHOCOLATE RELLENAS
        ALTO EN CALORIAS
        ALTO EN AZÚCARES
        ALTO EN GRASAS SATURADAS
        ALTO EN SODIO
        Energia: 480 kcal
        Proteina: 4g
        Grasas totales: 22g
        Azúcar: 35g
      `;

      const metricas = parsearTextoNutricional(textoConSellos);

      expect(metricas.sellosDetectados).toContain('Alto en Calorías');
      expect(metricas.sellosDetectados).toContain('Alto en Azúcares');
      expect(metricas.sellosDetectados).toContain('Alto en Grasas Saturadas');
      expect(metricas.sellosDetectados).toContain('Alto en Sodio');
      expect(metricas.sellosDetectados.length).toBe(4);
    });

    it('maneja textos vacíos, incompletos o con ruido de imagen sin caerse ni arrojar NaN', () => {
      const textoRuido = '### Imagen borrosa de pasillo ### LIDER CASONA 2026 $$$';
      const metricas = parsearTextoNutricional(textoRuido);

      expect(metricas.proteinasGramos).toBeUndefined();
      expect(metricas.caloriasPor100g).toBeUndefined();
      expect(metricas.sellosDetectados).toEqual([]);
    });
  });

  describe('2. Evaluación Nutricional y Veredicto Deportivo (Recomposición Muscular)', () => {
    it('otorga "🟢 Visto Bueno" (calificación >= 7) a alimentos densos en proteína y bajos en grasas/azúcares', () => {
      const metricasPollo: MetricasTablaNutricional = {
        proteinasGramos: 24,
        caloriasPor100g: 110,
        grasasTotalesGramos: 1.5,
        grasasSaturadasGramos: 0.3,
        carbohidratosGramos: 0,
        azucaresGramos: 0,
        sodioMg: 65,
        sellosDetectados: [],
      };

      const veredicto = evaluarProductoNutricional(metricasPollo, 'carnes_aves');

      expect(veredicto.tipo).toBe('visto_bueno');
      expect(veredicto.calificacion).toBeGreaterThanOrEqual(7);
      expect(veredicto.aptoParaRecomposicion).toBe(true);
      expect(veredicto.puntosPositivos.length).toBeGreaterThan(0);
      expect(veredicto.titulo).toContain('Visto Bueno');
    });

    it('otorga "🟡 Aceptable" a opciones intermedias que salvan el apuro pero con porción moderada', () => {
      const metricasIntermedio: MetricasTablaNutricional = {
        proteinasGramos: 11,
        caloriasPor100g: 170,
        grasasTotalesGramos: 8,
        grasasSaturadasGramos: 4,
        carbohidratosGramos: 6,
        azucaresGramos: 2,
        sodioMg: 350,
        sellosDetectados: ['Alto en Grasas Saturadas'],
      };

      const veredicto = evaluarProductoNutricional(metricasIntermedio, 'lacteos');

      expect(veredicto.tipo).toBe('aceptable');
      expect(veredicto.calificacion).toBeGreaterThanOrEqual(4);
      expect(veredicto.calificacion).toBeLessThan(7);
      expect(veredicto.porcionRecomendada).toContain('moderada');
    });

    it('otorga "🔴 No Recomendado" a productos ultraprocesados con sellos y baja proteína', () => {
      const metricasGalletas: MetricasTablaNutricional = {
        proteinasGramos: 3,
        caloriasPor100g: 490,
        grasasTotalesGramos: 24,
        grasasSaturadasGramos: 12,
        carbohidratosGramos: 65,
        azucaresGramos: 38,
        sodioMg: 420,
        sellosDetectados: ['Alto en Azúcares', 'Alto en Grasas Saturadas', 'Alto en Calorías'],
      };

      const veredicto = evaluarProductoNutricional(metricasGalletas, 'dulces');

      expect(veredicto.tipo).toBe('no_recomendado');
      expect(veredicto.calificacion).toBeLessThan(4);
      expect(veredicto.aptoParaRecomposicion).toBe(false);
      expect(veredicto.puntosAtencion.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('3. Chatbot Asistente en Supermercado Líder y Sustitutos Rápidos', () => {
    it('responde con opciones concretas de Líder cuando se pregunta por pollo agotado', () => {
      const respuesta = responderDudaSupermercado('No encontré pechuga de pollo, ¿qué compro?');
      expect(respuesta).toContain('Pechuga Entera con hueso');
      expect(respuesta).toContain('Pavo');
      expect(respuesta).toContain('Lomo centro de cerdo');
    });

    it('responde con alternativas magras cuando se pregunta por posta negra', () => {
      const respuesta = responderDudaSupermercado('Se acabó la posta negra en Líder');
      expect(respuesta).toContain('Carne molida tártaro 4%');
      expect(respuesta).toContain('Posta Rosada');
      expect(respuesta).toContain('huachalomo');
    });

    it('recomienda sustitutos para jamón pierna artesanal', () => {
      const respuesta = responderDudaSupermercado('¿Qué jamón compro si no hay jamón pierna?');
      expect(respuesta).toContain('Pechuga de pavo cocida');
      expect(respuesta).toContain('Lomo centro de cerdo');
    });

    it('recomienda sustitutos para leche proteica', () => {
      const respuesta = responderDudaSupermercado('¿Cuál leche protein me sirve?');
      expect(respuesta).toContain('Protein+');
      expect(respuesta).toContain('Whey');
    });

    it('la base de sustitutos SUSTITUCIONES_LIDER cubre los grupos clave del usuario', () => {
      const grupos = Object.keys(SUSTITUCIONES_LIDER);
      expect(grupos).toContain('pollo');
      expect(grupos).toContain('jamon');
      expect(grupos).toContain('huevos');
      expect(grupos).toContain('quesillo');
      expect(grupos).toContain('proteina');
      expect(grupos).toContain('palta');
      expect(grupos).toContain('ensalada');
    });
  });
});
