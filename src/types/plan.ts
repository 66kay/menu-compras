import { z } from 'zod';
import { MacrosSchema } from './receta';

export const TipoMomentoEntrenoSchema = z.enum([
  'ninguno',
  'pre_entreno',
  'post_entreno',
]);
export type TipoMomentoEntreno = z.infer<typeof TipoMomentoEntrenoSchema>;

export const ComidaPlanificadaSchema = z.object({
  id: z.string(), // ID único de la instancia
  recetaId: z.string(),
  recetaNombre: stringSchema(),
  porciones: z.number().positive().default(1),
  fijada: z.boolean().default(false),
  consumida: z.boolean().default(false),
  tipoMomentoEntreno: TipoMomentoEntrenoSchema.default('ninguno'),
  macros: MacrosSchema,
});

function stringSchema() {
  return z.string().min(1);
}

export type ComidaPlanificada = z.infer<typeof ComidaPlanificadaSchema>;

export const PlanDiaSchema = z.object({
  fecha: z.string(), // Formato ISO "YYYY-MM-DD"
  esDiaGym: z.boolean().default(false),
  comidas: z.object({
    desayuno: ComidaPlanificadaSchema.nullable(),
    almuerzo: ComidaPlanificadaSchema.nullable(),
    colacion: ComidaPlanificadaSchema.nullable(),
    once: ComidaPlanificadaSchema.nullable(),
    cena: ComidaPlanificadaSchema.nullable(),
  }),
  metaDia: MacrosSchema,
  actualizadoEn: z.string().datetime().default(() => new Date().toISOString()),
});

export type PlanDia = z.infer<typeof PlanDiaSchema>;
