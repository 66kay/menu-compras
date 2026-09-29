import { z } from 'zod';
import { CategoriaPasilloSchema, UnidadMedidaSchema } from './receta';

export const ItemDespensaSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1),
  cantidad: z.number().nonnegative(),
  unidad: UnidadMedidaSchema,
  categoriaPasillo: CategoriaPasilloSchema,
  actualizadoEn: z.string().datetime().default(() => new Date().toISOString()),
});

export type ItemDespensa = z.infer<typeof ItemDespensaSchema>;
