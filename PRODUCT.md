# Menú & Compras — Especificación de Producto

## 1. Visión y Propósito
**Menú & Compras** es una aplicación web progresiva (PWA) de uso personal diario, diseñada para resolver integralmente la nutrición deportiva aplicada y la logística de abastecimiento en Osorno, Chile.

La app calcula requerimientos energéticos y macronutrientes basados en entrenamiento de fuerza y recomposición corporal, programa comidas semanales con recetas chilenas cotidianas y de gym (estrictamente sin legumbres), consolida la lista del supermercado y cotiza con precios reales y fotos de **Líder (Sucursal Casona, Osorno)** recomendando siempre la mejor opción nutricional y económica de cada alimento.

---

## 2. Usuario y Contexto de Uso
- **Usuario único**: Hombre, 21 años, 191 cm, 137 kg.
- **Rutina deportiva**: Entrenamiento de fuerza 4–5 días por semana, ~2 horas por sesión.
- **Objetivo**: Recomposición corporal (pérdida de tejido graso preservando y aumentando masa muscular magra).
- **Entorno principal**: Instalada como PWA en la pantalla de inicio de iPhone (Safari → Compartir → Agregar a inicio), con soporte de escritorio en PC (pantallas ≥1024px).
- **Filosofía**: Cero fricción, sin login obligatorio en la nube, privacidad local absoluta, tono cálido y directo, sin sermones ni culpas.

---

## 3. Pilares de Privacidad
1. **Local-First (IndexedDB con Dexie)**: La información antropométrica (edad, peso, altura, días de gimnasio, historial de peso y cintura) reside **exclusivamente** en el navegador del dispositivo.
2. **Cero fugas en repositorio**: Ni código fuente, ni commits de Git, ni respuestas de servidor almacenan datos biométricos.
3. **Desarrollo**: Soporte de precarga opcional desde `perfil.local.json` ignorado explícitamente en `.gitignore`.
4. **Tráfico de red**: A las funciones serverless (`/api/precios`) únicamente viajan cadenas de búsqueda de productos alimentarios y código de sucursal. Los tokens de API externos jamás se exponen en el cliente.

---

## 4. Módulos y Funcionalidades Principales

### A. Onboarding y Perfil Dinámico
- Asistente de bienvenida en el primer inicio para configurar métricas corporales y objetivo nutricional.
- Fórmula Mifflin-St Jeor transparente y editable:
  $$\text{TMB} = 10 \cdot \text{peso (kg)} + 6.25 \cdot \text{altura (cm)} - 5 \cdot \text{edad} + 5$$
  - Ejemplo base (137 kg, 191 cm, 21 años):
    $$\text{TMB} = 1370 + 1193.75 - 105 + 5 = 2463.75 \text{ kcal}$$
- Factor de actividad editable (por defecto: 4 días gym = 1.55, 5 días = 1.65).
- Objetivos seleccionables:
  - **Recomposición (por defecto)**: Déficit leve de ~250 kcal/día con proteína alta.
  - **Bajar grasa**: Déficit moderado (300–500 kcal/día).
  - **Subir músculo**: Superávit moderado (200–300 kcal/día).
  - **Mantener**: Calorías de mantenimiento.
- **Piso de seguridad estricto**: La meta diaria calculada NUNCA desciende por debajo de la TMB basal.
- **Proteína**: Rango 1.6–2.2 g/kg sobre un "peso de referencia" editable (por defecto peso actual y 1.6 g/kg).
- **Carbohidratos ciclados**: Más altos en días de entrenamiento de fuerza vs días de descanso, equilibrando el promedio semanal.
- **Fibra y Grasas**: Grasas completan el requerimiento calórico respetando un aporte mínimo saludable (~0.7–1.0 g/kg) y meta visible de fibra (≥30–35 g/día).

### B. Planificador Inteligente (Hoy y Semana)
- **Vistas**:
  - **Hoy (predeterminada)**: Vista cronológica de las 5 comidas (Desayuno, Almuerzo, Colación, Once, Cena) con barras de progreso de calorías y proteína vs meta del día. En días de gym, badges claros para comida pre-entreno y post-entreno.
  - **Semana**: Matriz lunes a domingo con distribución de días de gym vs descanso, calorías diarias y botón "Generar semana".
- **Generador Semanal**:
  - Respeta días de entrenamiento y días de descanso.
  - Asegura variedad de fuentes proteicas (pollo, pavo, vacuno magro, pescados, huevos, lácteos).
  - Evita repetir la misma receta en la misma semana.
  - Soporte de "Cocinar en lote" (Batch Cooking dominical): agrupa platos que se cocinan una vez y rinden múltiples porciones, optimizando la lista de compras.
- **Interacciones**: Reemplazo de recetas al vuelo, bloqueo/fijado de comida para no ser alterada al re-generar, y marcado de recetas favoritas.

### C. Recetario Chileno & Gym (Sin Legumbres)
- Semilla de 40 recetas chilenas cotidianas y de gimnasio adaptadas con foco proteico, escritas en lenguaje natural, con ingredientes normalizados y validadas con Zod.
- **Regla estricta de exclusión**: Cero lentejas, porotos, garbanzos, arvejas secas, habas secas y derivados (hummus, harinas de legumbre). Toggles de exclusión para casos ambiguos (arvejas verdes, porotos verdes, maní, soya/tofu), excluidos por defecto.
- Posibilidad de crear, editar y guardar recetas personalizadas.

### D. Lista de Compras y Modo Tienda
- Agregación automática de ingredientes del plan semanal con conversión inteligente de unidades (ej. 500g + 1kg = 1.5 kg).
- Resta automática de productos ya presentes en la despensa personal.
- Agrupación por pasillos/secciones reales de supermercado (Carnes y Aves, Lácteos y Huevos, Frutas y Verduras, Panadería y Cereales, Despensa y Abarrotes, Congelados, Bebidas).
- Ficha por producto: foto real de Líder, nombre, marca, precio actual, fecha de actualización y procedencia (directo Líder vs marketplace de terceros).
- **Modo Tienda**: Interfaz de alto contraste, tipografía agrandada, optimizada para uso con una sola mano en el pasillo del supermercado.

### E. Integración de Precios Líder (Sucursal Casona, Osorno)
- Arquitectura desacoplada `PriceProvider`:
  1. `LiderApifyProvider`: consulta a `/api/precios` (serverless Vercel) ejecutando scraper/actor con token protegido.
  2. `ManualProvider`: interfaz de ingreso rápido de precio y foto para contingencia o productos locales de carnicería/feria.
- Sucursal configurable: *"Líder Casona, Osorno"*. Si la API externa no soporta filtro por sucursal, se marca explícitamente *"precio referencial lider.cl"*.
- Caché local en IndexedDB con caducidad de 24 horas y botón de actualización manual con feedback de progreso. Degradación elegante con último precio conocido si no hay conexión o falla la API.
- Cero invención de datos: si no hay precio o foto, se muestra "sin dato" con botón para ingreso manual.

### F. Comparador y Sistema de Recomendación Nutricional
- Evaluación multi-criterio transparente con puntaje 0–100 (`criterios.ts`):
  - Densidad proteica (g proteína por 100g y por 100 kcal).
  - Azúcares totales y cantidad de sellos negros "ALTO EN" (penalización).
  - Contenido de fibra y longitud de lista de ingredientes (menos aditivos ultraprocesados).
  - Costo por 100g de producto y costo por gramo de proteína neta.
- Foco en categorías clave: yogurt (proteína/sin azúcar), granola (fibra/sin sellos), avena, leche, quesos, panes integrales y carnes.
- Salida clara:
  - **Mejor opción nutricional general**.
  - **Mejor opción disponible en Líder** (en caso de que la ideal esté agotada o sea de otra tienda).
- Diferenciación visible de productos vendidos directamente por Líder vs vendedores terceros (marketplace).

### G. Gustos del Mes (Sin Culpa)
- Cupos mensuales asignables para Coca-Cola Zero y dulces/antojos.
- Selección en la lista del formato con mejor precio por litro para Coca-Cola Zero (pack vs individual).
- Registro libre de culpas, integrado a los macros del día.

### H. Progreso y Ajuste Adaptativo
- Registro semanal de peso corporal y medida de cintura opcional.
- Cálculo de media móvil de 7 días para amortiguar fluctuaciones de agua/glucógeno.
- Motor de sugerencias que **siempre requiere confirmación explícita del usuario**:
  - Alerta de pérdida acelerada (>1% del peso corporal/semana): sugerir +150–200 kcal para blindar masa muscular.
  - Alerta de estancamiento (3–4 semanas sin variación de peso ni cintura): sugerir ajuste de −150–200 kcal.
