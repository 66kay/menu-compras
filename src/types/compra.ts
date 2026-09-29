import { z } from 'zod';
import { CategoriaPasilloSchema, UnidadMedidaSchema } from './receta';
import { ProductoSchema } from './producto';

export const ItemCompraSchema = z.object({
  id: z.string(),
  ingredienteNombre: z.string().min(1),
  cantidadNecesaria: z.number().positive(),
  unidad: UnidadMedidaSchema,
  categoriaPasillo: CategoriaPasilloSchema,
  comprado: z.boolean().default(false),
  fechaSemana: z.string(), // YYYY-MM-DD inicio de semana
  enDespensa: z.number().nonnegative().default(0),
  cantidadAComprar: z.number().nonnegative(),
  productoSeleccionado: ProductoSchema.optional(),
  productoManual: z.object({
    nombre: z.string().min(1),
    precio: z.number().nonnegative(),
    fotoUrl: z.string().optional(),
    marca: z.string().optional(),
  }).optional(),
  notas: z.string().optional(),
});

export type ItemCompra = z.infer<typeof ItemCompraSchema>;
