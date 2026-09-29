import { z } from 'zod';

export const RegistroProgresoSchema = z.object({
  id: z.string(),
  fecha: z.string(), // YYYY-MM-DD
  pesoKg: z.number().positive(),
  cinturaCm: z.number().positive().optional(),
  notas: z.string().optional(),
  creadoEn: z.string().datetime().default(() => new Date().toISOString()),
});

export type RegistroProgreso = z.infer<typeof RegistroProgresoSchema>;

export const SugerenciaAjusteSchema = z.object({
  tipo: z.enum(['superavit_leve', 'deficit_leve', 'mantener', 'alerta_rapida', 'estancamiento']),
  titulo: z.string(),
  mensaje: z.string(),
  deltaCaloriasRecomendado: z.number(), // ej: +150, -150
  pesoMedioActual: z.number(),
  variacionPorcentualSemanal: z.number(),
  requiereConfirmacion: z.literal(true).default(true),
});

export type SugerenciaAjuste = z.infer<typeof SugerenciaAjusteSchema>;
