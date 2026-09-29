import { z } from 'zod';
import { CategoriaPasilloSchema } from './receta';

export const Macros100gSchema = z.object({
  calorias: z.number().min(0),
  proteinas: z.number().min(0),
  carbohidratos: z.number().min(0),
  grasas: z.number().min(0),
  fibra: z.number().min(0),
  sodioMg: z.number().min(0).optional(),
});
export type Macros100g = z.infer<typeof Macros100gSchema>;

export const ProductoSchema = z.object({
  id: z.string(),
  sku: z.string(),
  nombre: z.string().min(1),
  marca: z.string().optional(),
  precio: z.number().nonnegative(),
  precioReferencial: z.boolean().optional(),
  urlFoto: z.string(),
  urlProducto: z.string().optional(),
  categoriaPasillo: CategoriaPasilloSchema,
  fechaActualizacion: z.string(), // ISO string
  vendedorTipo: z.enum(['directo_lider', 'marketplace']).optional(),
  puntajeNutricional: z.number().min(0).max(100).optional(),
  macros100g: Macros100gSchema.optional(),
  sellosNegros: z.number().int().min(0).max(4).optional(),
  cantidadPresentacion: z.string().optional(),
  precioPorUnidadMedida: z.string().optional(),
  disponibleEnCasona: z.boolean().optional(),
  esMejorOpcion: z.boolean().optional(),
  esMejorLider: z.boolean().optional(),
  razonRecomendacion: z.string().optional(),
  terminoBusqueda: z.string().optional(),
});

export type Producto = z.infer<typeof ProductoSchema>;
