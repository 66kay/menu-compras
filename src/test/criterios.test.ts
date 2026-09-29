import { describe, it, expect } from 'vitest';
import { evaluarProducto, clasificarOpciones } from '../logic/criterios';
import type { Producto } from '../types';

describe('Sistema de Evaluación 0-100 y Recomendación de Alimentos', () => {
  const yogurtIdeal: Producto = {
    id: 'yog-01',
    sku: '123456',
    nombre: 'Yogurt Griego Protein 15g sin sellos',
    marca: 'Colun',
    precio: 990,
    urlFoto: 'https://images.lider.cl/colun-protein.jpg',
    categoriaPasillo: 'lacteos_huevos',
    fechaActualizacion: new Date().toISOString(),
    vendedorTipo: 'directo_lider',
    puntajeNutricional: 0,
    sellosNegros: 0,
    disponibleEnCasona: true,
    macros100g: {
      calorias: 70,
      proteinas: 15,
      carbohidratos: 4,
      grasas: 0,
      fibra: 0,
    },
  };

  const yogurtUltraprocesado: Producto = {
    id: 'yog-02',
    sku: '654321',
    nombre: 'Yogurt con Confites y Azúcar Añadida',
    marca: 'Genérica',
    precio: 850,
    urlFoto: 'https://images.lider.cl/yogurt-dulce.jpg',
    categoriaPasillo: 'lacteos_huevos',
    fechaActualizacion: new Date().toISOString(),
    vendedorTipo: 'marketplace',
    puntajeNutricional: 0,
    sellosNegros: 3, // Alto en azúcares, grasas y calorías
    disponibleEnCasona: true,
    macros100g: {
      calorias: 180,
      proteinas: 3,
      carbohidratos: 28,
      grasas: 7,
      fibra: 0,
    },
  };

  it('asigna mayor puntaje al producto con alta proteína y cero sellos negros', () => {
    const evalIdeal = evaluarProducto(yogurtIdeal);
    const evalMalo = evaluarProducto(yogurtUltraprocesado);

    expect(evalIdeal.puntaje).toBeGreaterThan(evalMalo.puntaje);
    expect(evalIdeal.desglose.penalizacionSellos).toBe(0);
    expect(evalMalo.desglose.penalizacionSellos).toBeLessThan(0);
  });

  it('clasifica correctamente la mejor opción nutricional y la mejor opción Líder', () => {
    const clasificados = clasificarOpciones([yogurtUltraprocesado, yogurtIdeal]);
    const mejor = clasificados.find((p) => p.esMejorOpcion);
    const lider = clasificados.find((p) => p.esMejorLider);

    expect(mejor?.id).toBe('yog-01');
    expect(lider?.id).toBe('yog-01');
  });
});
