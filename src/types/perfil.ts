import { z } from 'zod';

export const ObjetivoNutricionalSchema = z.enum([
  'recomposicion',
  'bajar_grasa',
  'subir_musculo',
  'mantener',
]);
export type ObjetivoNutricional = z.infer<typeof ObjetivoNutricionalSchema>;

export const ExclusionAmbiguaSchema = z.object({
  arvejasVerdes: z.boolean().default(false), // false = excluida (no permitir)
  porotosVerdes: z.boolean().default(false),
  mani: z.boolean().default(false),
  soyaTofu: z.boolean().default(false),
});
export type ExclusionAmbigua = z.infer<typeof ExclusionAmbiguaSchema>;

export const PerfilUsuarioSchema = z.object({
  id: z.string().default('usuario_principal'),
  edad: z.number().int().min(14).max(100),
  sexo: z.literal('hombre').default('hombre'),
  alturaCm: z.number().min(120).max(230),
  pesoActualKg: z.number().min(40).max(250),
  pesoReferenciaKg: z.number().min(40).max(250).optional(),
  diasGymSemana: z.number().int().min(1).max(7).default(4),
  duracionEntrenoHoras: z.number().min(0.5).max(4).default(2),
  factorActividad: z.number().min(1.2).max(2.2).default(1.55),
  objetivo: ObjetivoNutricionalSchema.default('recomposicion'),
  gramosProteinaPorKg: z.number().min(1.2).max(3.0).default(1.6),
  deficitsKcal: z.number().min(-1000).max(1000).default(-250),
  caloriasPersonalizadas: z.number().optional(),
  proteinaPersonalizada: z.number().optional(),
  exclusionesAmbiguas: ExclusionAmbiguaSchema.default({
    arvejasVerdes: false,
    porotosVerdes: false,
    mani: false,
    soyaTofu: false,
  }),
  sucursalLiderPreferida: z.string().default('Líder Casona, Osorno'),
  cupoMensualCocaColaZero: z.number().int().min(0).default(8), // latas o botellas por mes
  cupoMensualAntojos: z.number().int().min(0).default(4), // ocasiones por mes
  creadoEn: z.string().datetime().default(() => new Date().toISOString()),
  actualizadoEn: z.string().datetime().default(() => new Date().toISOString()),
});

export type PerfilUsuario = z.infer<typeof PerfilUsuarioSchema>;
