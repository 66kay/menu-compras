# Menú & Compras — Sistema de Diseño & Dirección de Arte

## 1. Filosofía Visual y Anti-Patrones
Este producto es una herramienta atlética, culinaria y práctica de uso personal diario. Su estética se aleja radicalmente de los clichés de plantillas generadas por IA:

### 🚫 Anti-Referencias Prohibidas
- **Sin degradados morado-azul estilo SaaS genérico**: Nada de fondos espaciales ni halos de neón violeta.
- **Sin glassmorphism difuso ilegible**: Cero fondos `backdrop-blur` con bordes blancos semi-transparentes que dificultan la lectura bajo la luz del sol en el supermercado.
- **Sin tarjetas idénticas repetidas**: La información jerárquica tiene ritmos visuales variados (listas compactas, filas densas con imagen y etiquetas de estado).
- **Sin emojis como iconos funcionales**: Toda la iconografía utiliza **Lucide Icons** en SVG con trazo consistente (1.75px–2px). Los emojis quedan reservados únicamente a detalles expresivos si el usuario los introduce.
- **Sin tipografías genéricas por defecto (Inter/Roboto)**: Selección tipográfica con carácter orgánico y atlético.

---

## 2. Tipografía y Números

### Familias Tipográficas
1. **Display & Títulos**: `Plus Jakarta Sans`, sans-serif geométrica humanista con proporciones enérgicas y excelente legibilidad.
2. **Cuerpo e Interfaz**: Pila nativa optimizada para iOS y pantallas Retina:
   ```css
   font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
   ```
3. **Métricas, Precios y Macros**: `tabular-nums` obligatorio para evitar bailoteo de cifras en conteos y tablas:
   ```css
   font-variant-numeric: tabular-nums lining-nums;
   ```

### Escala y Jerarquía
- **Display (Metas calóricas / Resumen)**: `2rem` (32px), `font-weight: 700`, `letter-spacing: -0.02em`.
- **H1 (Pantalla principal)**: `1.5rem` (24px), `font-weight: 700`, `letter-spacing: -0.015em`.
- **H2 (Secciones de pasillo / Días)**: `1.125rem` (18px), `font-weight: 600`.
- **H3 (Nombres de recetas / Productos)**: `0.9375rem` (15px), `font-weight: 600`.
- **Body Regular**: `0.875rem` (14px), `line-height: 1.45`.
- **Caption / Meta**: `0.75rem` (12px), `font-weight: 500`, `color: var(--text-muted)`.
- **Inputs táctiles**: Mínimo `16px` para impedir que iOS Safari haga zoom automático al enfocar el campo.

---

## 3. Paleta de Color (Cálida, Orgánica & Atlética)

Inspirada en ingredientes frescos, cocción noble, carbón vegetal y precisión deportiva.

### Modo Claro (Warm Bone & Olive)
- **Fondo General (`--bg-base`)**: `#F9F7F2` (hueso cálido, reduce fatiga visual frente al blanco puro).
- **Superficie / Tarjetas (`--bg-surface`)**: `#FFFFFF` (blanco cálido puro).
- **Superficie Elevada (`--bg-elevated`)**: `#F2EFE9`.
- **Bordes sutiles (`--border-subtle`)**: `#E6E2DA`.
- **Texto Principal (`--text-primary`)**: `#1C1917` (antracita cálido muy oscuro).
- **Texto Secundario (`--text-secondary`)**: `#57534E` (piedra medio).
- **Texto Atenuado (`--text-muted`)**: `#8C867E`.
- **Acento Nutrición / Proteína (`--accent-protein`)**: `#3F6212` (oliva profundo).
- **Acento Energía / Carbos (`--accent-carb`)**: `#C2410C` (terracota tostado).
- **Acento Grasas (`--accent-fat`)**: `#B45309` (ámbar cálido).
- **Acento Primario de Acción (`--accent-primary`)**: `#1C1917` (con estado hover `#292524`).
- **Éxito / Comprado (`--badge-success`)**: `#15803D` con fondo `#F0FDF4`.
- **Alerta / Desactualizado (`--badge-warning`)**: `#B45309` con fondo `#FFFBEB`.

### Modo Oscuro (Basalt, Warm Obsidian & Lime)
- **Fondo General (`--bg-base`)**: `#0C0A09` (obsidiana cálido profundo).
- **Superficie / Tarjetas (`--bg-surface`)**: `#171513` (piedra volcánica).
- **Superficie Elevada (`--bg-elevated`)**: `#211E1B`.
- **Bordes sutiles (`--border-subtle`)**: `#2E2A26`.
- **Texto Principal (`--text-primary`)**: `#F5F5F4` (blanco roto de alta pureza).
- **Texto Secundario (`--text-secondary`)**: `#A8A29E` (piedra claro).
- **Texto Atenuado (`--text-muted`)**: `#78716C`.
- **Acento Nutrición / Proteína (`--accent-protein`)**: `#84CC16` (lima vibrante de alta visibilidad).
- **Acento Energía / Carbos (`--accent-carb`)**: `#FB923C` (naranja fuego controlado).
- **Acento Grasas (`--accent-fat`)**: `#FBBF24` (dorado cálido).
- **Acento Primario de Acción (`--accent-primary`)**: `#FAFAFA` con texto `#0C0A09`.
- **Éxito / Comprado (`--badge-success`)**: `#4ADE80` con fondo `rgba(74, 222, 128, 0.12)`.

---

## 4. Arquitectura de Interfaz y Mobile-First (iPhone & PC)

### Adaptación a iPhone (PWA Standalone)
- **Viewport**:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  ```
- **Safe Area Insets**:
  - Cabecera: `padding-top: calc(0.75rem + env(safe-area-inset-top));`
  - Barra de navegación inferior: `padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));`
- **Altura de pantalla**: `height: 100dvh` para evitar saltos provocados por la barra de navegación de Safari.
- **Objetivos Táctiles**: Todo botón, checkbox o enlace interactivo mide como mínimo **44×44px** reales de área táctil.

### Navegación
- **Móvil (<1024px)**: Barra de 5 pestañas fija en el borde inferior con retroalimentación háptica visual:
  1. 🗓️ **Hoy** (Día en curso, progreso calórico/proteico, comidas pre/post entreno).
  2. 📅 **Semana** (Planificador lunes a domingo, generar semana, balance semanal).
  3. 🛒 **Compras** (Lista por pasillos, precios Líder, Modo Tienda).
  4. 🍳 **Recetas** (Biblioteca de 40 recetas chilenas/gym, filtros, agregar receta).
  5. 📊 **Metas** (Mifflin-St Jeor, objetivo recomposición, media móvil de peso y cintura).
- **Escritorio (≥1024px)**:
  - Barra lateral izquierda fija (260px) con navegación e indicador rápido de calorías del día.
  - Contenido central estructurado en dos columnas de ancho máximo 1280px con espaciado generoso.

### Modo Tienda (En Pasillos de Supermercado)
- Tipografía ampliada (`1.125rem`–`1.25rem` para nombres de ítem).
- Checkbox lateral grande en el pulgar derecho para tachar con una sola mano.
- Encabezados de pasillos pegajosos (*sticky*) para no perder el contexto al scrollear.
- Indicador nítido de precio y si es producto Líder directo o Marketplace.

---

## 5. Principios de Movimiento y Animación (Emil Kowalski)

Las animaciones comunican estado, física y causalidad; no son mero adorno.

### Reglas Técnicas
1. **Duración**:
   - Micro-estados (checkboxes, hover, toggles): **150–200 ms**.
   - Diálogos, hojas inferiores (*action sheets*), filtros: **220–280 ms**.
   - Transiciones entre pestañas principales: **250–300 ms**.
2. **Curva de Easing**:
   - Entrada fluida desacelerada: `cubic-bezier(0.16, 1, 0.3, 1)`.
   - Salidas rápidas: `cubic-bezier(0.7, 0, 0.84, 0)`.
3. **Propiedades Exclusivas**: Solo `transform` y `opacity` para garantizar 60/120 FPS sin repintado de capas.
4. **Respeto a Preferencias del Sistema**:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, ::before, ::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
5. **Casos de Uso Diseñados**:
   - **Cambio de pestaña**: Desplazamiento sutil con cross-fade lateral (`x: 8px -> 0`, `opacity: 0 -> 1`).
   - **Tachado de producto**: Animación de confirmación inmediata con cambio de opacidad y tachado sutil.
   - **Barras de calorías y proteína**: Relleno suave con efecto elástico amortiguado al cargar el día.
   - **Entrada de tarjetas de receta**: Entrada escalonada (*stagger*) de 35ms por elemento.
