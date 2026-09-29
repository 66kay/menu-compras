import type { Producto } from '../types';
import { db } from '../db';
import { CATALOGO_LIDER_BASE } from './catalogo-lider-base';
import { clasificarOpciones } from '../logic/criterios';

export interface PriceProvider {
  buscar(termino: string, sucursal?: string): Promise<Producto[]>;
}

export class LiderApifyProvider implements PriceProvider {
  private readonly HORAS_CADUCIDAD_CACHE = 24;

  async buscar(termino: string, sucursal: string = 'Líder Casona, Osorno'): Promise<Producto[]> {
    const qNorm = termino.trim().toLowerCase();
    if (!qNorm) return [];

    // 1. Revisar caché local en IndexedDB (Dexie)
    try {
      const productosEnCache = await db.productos
        .filter((p) => {
          const coincideBusqueda =
            p.terminoBusqueda?.toLowerCase().includes(qNorm) ||
            p.nombre.toLowerCase().includes(qNorm);
          if (!coincideBusqueda) return false;

          const horasAntiguedad =
            (Date.now() - new Date(p.fechaActualizacion).getTime()) / (1000 * 60 * 60);
          return horasAntiguedad < this.HORAS_CADUCIDAD_CACHE;
        })
        .toArray();

      if (productosEnCache.length > 0) {
        return clasificarOpciones(productosEnCache);
      }
    } catch (err) {
      console.warn('Error leyendo caché de productos IndexedDB:', err);
    }

    // 2. Intentar llamar a la función serverless /api/precios
    try {
      const url = `/api/precios?q=${encodeURIComponent(qNorm)}&store=${encodeURIComponent(sucursal)}`;
      const resp = await fetch(url);

      if (resp.ok) {
        const data = await resp.json();
        if (data.success && Array.isArray(data.productos) && data.productos.length > 0) {
          const productosNuevos: Producto[] = data.productos.map((item: any, idx: number) => ({
            id: `lid_api_${item.sku || idx}_${Date.now()}`,
            sku: item.sku || `SKU-${idx}`,
            nombre: item.name || item.nombre,
            marca: item.brand || 'Líder',
            precio: item.price || 0,
            precioReferencial: false,
            urlFoto: item.imageUrl || item.urlFoto || 'https://images.lider.cl/default.jpg',
            urlProducto: item.url,
            categoriaPasillo: 'despensa_abarrotes',
            fechaActualizacion: new Date().toISOString(),
            vendedorTipo: 'directo_lider',
            puntajeNutricional: 50,
            sellosNegros: 0,
            disponibleEnCasona: true,
            terminoBusqueda: qNorm,
          }));

          const clasificados = clasificarOpciones(productosNuevos);
          await db.productos.bulkPut(clasificados);
          return clasificados;
        }
      }
    } catch (err) {
      console.info('Modo offline o API remota no disponible. Usando catálogo base:', err);
    }

    // 3. Fallback: Buscar en el catálogo base curado de Líder Casona Osorno
    const resultadosLocales = CATALOGO_LIDER_BASE.filter((p) => {
      const nom = p.nombre.toLowerCase();
      const term = p.terminoBusqueda?.toLowerCase() ?? '';
      return nom.includes(qNorm) || term.includes(qNorm) || qNorm.includes(term);
    });

    if (resultadosLocales.length > 0) {
      const clasificados = clasificarOpciones(resultadosLocales);
      // Guardar en la base de datos local para acceso offline
      try {
        await db.productos.bulkPut(clasificados);
      } catch (e) {
        console.warn('No se pudo guardar en IndexedDB:', e);
      }
      return clasificados;
    }

    // 4. Si no hay coincidencia exacta, devolver un producto vacío "sin dato"
    // para que la interfaz nunca invente precios y permita ingreso manual
    return [];
  }
}

export class ManualProvider {
  async guardarProductoManual(
    itemCompraId: string,
    nombre: string,
    precio: number,
    fotoUrl?: string,
    marca: string = 'Manual / Feria'
  ): Promise<void> {
    const item = await db.compras.get(itemCompraId);
    if (!item) return;

    item.productoManual = {
      nombre,
      precio,
      fotoUrl,
      marca,
    };
    await db.compras.put(item);
  }
}

export const liderProvider = new LiderApifyProvider();
export const manualProvider = new ManualProvider();
