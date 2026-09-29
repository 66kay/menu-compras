import { z } from 'zod';

export const CategoriaPasilloSchema = z.enum([
  'carnes_aves',
  'pescados_mariscos',
  'lacteos_huevos',
  'frutas_verduras',
  'panaderia_cereales',
  'despensa_abarrotes',
  'congelados',
  'bebidas',
]);
export type CategoriaPasillo = z.infer<typeof CategoriaPasilloSchema>;

export const CategoriaComidaSchema = z.enum([
  'desayuno',
  'almuerzo',
  'colacion',
  'once',
  'cena',
]);
export type CategoriaComida = z.infer<typeof CategoriaComidaSchema>;

export const UnidadMedidaSchema = z.enum([
  'g',
  'kg',
  'ml',
  'l',
  'unidad',
  'cucharada',
  'cucharadita',
  'taza',
  'rebanada',
  'pizca',
]);
export type UnidadMedida = z.infer<typeof UnidadMedidaSchema>;

export const MacrosSchema = z.object({
  calorias: z.number().min(0),
  proteinas: z.number().min(0),
  carbohidratos: z.number().min(0),
  grasas: z.number().min(0),
  fibra: z.number().min(0),
});
export type Macros = z.infer<typeof MacrosSchema>;

export const IngredienteRecetaSchema = z.object({
  nombre: z.string().min(1),
  cantidad: z.number().positive(),
  unidad: UnidadMedidaSchema,
  categoriaPasillo: CategoriaPasilloSchema,
  opcional: z.boolean().default(false),
  terminoBusquedaLider: z.string().optional(),
});
export type IngredienteReceta = z.infer<typeof IngredienteRecetaSchema>;

export const RecetaSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
  categoria: CategoriaComidaSchema,
  tiempoMinutos: z.number().int().min(1),
  porciones: z.number().int().min(1).default(1),
  ingredientes: z.array(IngredienteRecetaSchema).min(1),
  macrosPorPorcion: MacrosSchema,
  instrucciones: z.array(z.string()).min(1),
  esFavorita: z.boolean().default(false),
  aptaPreEntreno: z.boolean().default(false),
  aptaPostEntreno: z.boolean().default(false),
  batchCooking: z.boolean().default(false),
  batchCookingRinde: z.number().int().min(1).optional(),
  fuenteProteinaPrincipal: z.enum([
    'pollo',
    'pavo',
    'vacuno',
    'pescado',
    'huevos',
    'lacteo',
    'mixto',
  ]).default('pollo'),
});

export type Receta = z.infer<typeof RecetaSchema>;
