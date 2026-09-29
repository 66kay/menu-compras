# Convenciones y Reglas de Desarrollo — Menú & Compras

## 1. Principios de Arquitectura
- **Local-First & Privacidad**:
  - Los datos personales (edad, peso, estatura, entrenamientos, registros) **NUNCA** se almacenan en el código, ni en commits de Git, ni se envían a APIs remotas.
  - La base de datos local principal es **IndexedDB** gestionada a través de **Dexie**. No utilizar `localStorage` para estructuras de datos críticas ni colecciones.
- **Validación con Zod**:
  - Todo dato que provenga de fuentes externas (APIs de precios, importación de JSON, formularios) debe validarse con un esquema Zod antes de ingresar a la lógica del sistema.
- **Nutrición Deportiva**:
  - Fórmula base: Mifflin-St Jeor (hombre).
  - La meta calórica diaria bajo ninguna circunstancia puede ser inferior a la TMB basal.
  - Exclusión terminante de legumbres (lentejas, porotos, garbanzos, habas secas, arvejas secas, harinas de legumbre y hummus).
- **Diseño & UI**:
  - Respetar `DESIGN.md`. Cero gradientes violetas/azules genéricos, cero glassmorphism borroso, cero emojis como iconos (usar Lucide Icons).
  - Escala móvil estricta para iPhone (inputs con font-size ≥ 16px, targets táctiles ≥ 44×44px, safe area insets).
- **Animaciones**:
  - Micro-transiciones basadas en principios de Emil Kowalski (150–250ms, `cubic-bezier(0.16, 1, 0.3, 1)`, solo `transform` y `opacity`).
  - Respetar `prefers-reduced-motion`.

## 2. Comandos Clave
- `npm run dev`: Inicia el servidor de desarrollo local.
- `npm run build`: Compilación de TypeScript y bundle de producción Vite.
- `npm run test`: Ejecuta los tests unitarios con Vitest.
