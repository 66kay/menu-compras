import React, { useEffect, useState, useCallback } from 'react';
import type {
  PerfilUsuario,
  Receta,
  PlanDia,
  ItemCompra,
  RegistroProgreso,
  ItemDespensa,
} from './types';
import { db, inicializarBaseDatos } from './db';
import { Header } from './components/layout/Header';
import { NavigationBar, type TabId } from './components/layout/NavigationBar';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { HoyView } from './components/hoy/HoyView';
import { SemanaView } from './components/semana/SemanaView';
import { ComprasView } from './components/compras/ComprasView';
import { RecetasView } from './components/recetas/RecetasView';
import { MetasView } from './components/metas/MetasView';
import { ChatbotNutricionalModal } from './components/ia/ChatbotNutricionalModal';
import { ModalDetalleReceta } from './components/recetas/ModalDetalleReceta';
import { generarMes } from './logic/generador';
import { generarListaCompras } from './logic/lista-compras';
import { obtenerMejorOpcionBase } from './services/catalogo-lider-base';
import { Sparkles } from 'lucide-react';

function getLunesDeEstaSemana(fecha: Date = new Date()): string {
  const d = new Date(fecha);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0] || '';
}

export const App: React.FC = () => {
  const [cargando, setCargando] = useState<boolean>(true);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [planesSemana, setPlanesSemana] = useState<PlanDia[]>([]);
  const [itemsCompra, setItemsCompra] = useState<ItemCompra[]>([]);
  const [registrosProgreso, setRegistrosProgreso] = useState<RegistroProgreso[]>([]);
  const [despensa, setDespensa] = useState<ItemDespensa[]>([]);

  const [tabActiva, setTabActiva] = useState<TabId>('hoy');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(
    () => new Date().toISOString().split('T')[0] || ''
  );
  const [recetaDetalle, setRecetaDetalle] = useState<Receta | null>(null);
  const [modalChatbotAbierto, setModalChatbotAbierto] = useState<boolean>(false);
  const [ingredienteChatbot, setIngredienteChatbot] = useState<string | undefined>(undefined);

  const handleAbrirChatbot = (ingrediente?: string) => {
    setIngredienteChatbot(ingrediente);
    setModalChatbotAbierto(true);
  };

  const fechaLunesActual = getLunesDeEstaSemana();

  // 1. Cargar datos desde IndexedDB
  const cargarDatos = useCallback(async () => {
    try {
      await inicializarBaseDatos();

      const p = await db.perfil.get('usuario_principal');
      if (p) setPerfil(p);

      const r = await db.recetas.toArray();
      setRecetas(r);

      const desp = await db.despensa.toArray();
      setDespensa(desp);

      const regs = await db.registros.toArray();
      setRegistrosProgreso(regs);

      // Cargar planes del mes completo (28 días / 4 semanas)
      let planes = await db.plan
        .filter((plan) => {
          const d = new Date(plan.fecha + 'T00:00:00');
          const lunes = new Date(fechaLunesActual + 'T00:00:00');
          const diffDays = (d.getTime() - lunes.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays >= 0 && diffDays < 28;
        })
        .toArray();

      // Si no hay 28 días completos generados o si venían con recetas repetidas, generamos el mes completo
      const debeRegenerarMes = planes.length < 28;
      if (p && r.length > 0 && debeRegenerarMes) {
        const nuevosPlanes = generarMes(fechaLunesActual, p, r, planes);
        await db.plan.bulkPut(nuevosPlanes);
        planes = nuevosPlanes;
      }
      setPlanesSemana(planes);

      // Cargar o generar lista de compras para el mes completo
      let compras = await db.compras
        .filter((c) => c.fechaSemana === fechaLunesActual)
        .toArray();

      const tieneItemsObsoletos = compras.some(
        (c) =>
          c.ingredienteNombre.toLowerCase().includes('sal') ||
          c.ingredienteNombre.toLowerCase().includes('pimienta') ||
          c.ingredienteNombre.toLowerCase().includes('orégano') ||
          c.ingredienteNombre.toLowerCase().includes('oregano') ||
          (c.ingredienteNombre.toLowerCase().includes('pollo') && c.cantidadNecesaria > 5) ||
          c.ingredienteNombre.toLowerCase().includes('leche descremada natural')
      );

      if ((compras.length === 0 || compras.length < 15 || tieneItemsObsoletos) && planes.length > 0 && r.length > 0) {
        const nuevaLista = generarListaCompras(planes, r, desp, fechaLunesActual);
        if (nuevaLista.length > 0) {
          await db.compras.clear();
          await db.compras.bulkPut(nuevaLista);
          compras = nuevaLista;
        }
      } else if (compras.length > 0) {
        // Asegurar que cada ítem tenga su producto real de Líder con foto y precio vigente
        let cambio = false;
        for (const item of compras) {
          if (!item.productoSeleccionado || !item.productoSeleccionado.urlFoto.includes('walmartimages.cl')) {
            const mejor = obtenerMejorOpcionBase(item.ingredienteNombre, item.categoriaPasillo);
            if (mejor) {
              item.productoSeleccionado = mejor;
              cambio = true;
            }
          }
        }
        if (cambio) {
          await db.compras.bulkPut(compras);
        }
      }
      setItemsCompra(compras);
    } catch (err) {
      console.error('Error cargando datos de IndexedDB:', err);
    } finally {
      setCargando(false);
    }
  }, [fechaLunesActual]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Si no hay perfil, mostramos el modal de Onboarding
  const handleOnboardingCompletado = async (nuevoPerfil: PerfilUsuario) => {
    setPerfil(nuevoPerfil);
    await cargarDatos();
  };

  // Plan del día seleccionado
  const planDiaActual = planesSemana.find((p) => p.fecha === fechaSeleccionada) ?? null;

  // Macros consumidos del día actual
  const comidasHoy = planDiaActual
    ? [
        planDiaActual.comidas.desayuno,
        planDiaActual.comidas.almuerzo,
        planDiaActual.comidas.colacion,
        planDiaActual.comidas.once,
        planDiaActual.comidas.cena,
      ].filter((c) => c && c.consumida)
    : [];

  const caloriasConsumidasHoy = comidasHoy.reduce((sum, c) => sum + (c?.macros.calorias ?? 0), 0);
  const proteinaConsumidaHoy = comidasHoy.reduce((sum, c) => sum + (c?.macros.proteinas ?? 0), 0);

  // Recargar planes tras modificación
  const handleActualizarPlan = async () => {
    const planes = await db.plan.toArray();
    setPlanesSemana(planes);
  };

  // Recargar tras regenerar plan
  const handleSemanaGenerada = async () => {
    if (!perfil) return;
    const nuevosPlanes = generarMes(fechaLunesActual, perfil, recetas, []);
    await db.plan.bulkPut(nuevosPlanes);
    setPlanesSemana(nuevosPlanes);

    // Regenerar lista de compras del mes automáticamente
    const nuevaLista = generarListaCompras(nuevosPlanes, recetas, despensa, fechaLunesActual);
    await db.compras.clear();
    await db.compras.bulkPut(nuevaLista);
    setItemsCompra(nuevaLista);
  };

  // Recargar compras
  const handleActualizarCompras = async () => {
    const compras = await db.compras.toArray();
    setItemsCompra(compras);
  };

  // Recargar recetas
  const handleActualizarRecetas = async () => {
    const r = await db.recetas.toArray();
    setRecetas(r);
  };

  // Recargar registros progreso
  const handleActualizarRegistros = async () => {
    const regs = await db.registros.toArray();
    setRegistrosProgreso(regs);
  };

  if (cargando) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-secondary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-protein)]/20 border border-[var(--accent-protein)] flex items-center justify-center text-[var(--accent-protein)] animate-pulse">
            <span className="font-bold text-sm">M&amp;C</span>
          </div>
          <span className="text-xs font-semibold tracking-wide">Cargando base de datos local...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-100dvh flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] antialiased">
      {/* Onboarding de Primera Vez si no existe perfil */}
      {!perfil && <OnboardingModal onCompletado={handleOnboardingCompletado} />}

      {/* Cabecera Superior Fija */}
      <Header
        perfil={perfil}
        esDiaGym={planDiaActual?.esDiaGym}
        caloriasConsumidas={caloriasConsumidasHoy}
        caloriasMeta={planDiaActual?.metaDia.calorias ?? 3200}
        proteinaConsumida={proteinaConsumidaHoy}
        proteinaMeta={planDiaActual?.metaDia.proteinas ?? 219}
        onAbrirChatbot={() => handleAbrirChatbot()}
      />

      {/* Contenedor Principal (con margen lateral en escritorio para barra fija) */}
      <div className="flex-1 lg:pl-64">
        <main className="max-w-4xl mx-auto px-4 pt-5 pb-8">
          {tabActiva === 'hoy' && perfil && (
            <HoyView
              planDia={planDiaActual}
              perfil={perfil}
              todasLasRecetas={recetas}
              fechaSeleccionada={fechaSeleccionada}
              onCambiarFecha={(f) => setFechaSeleccionada(f)}
              onActualizarPlan={handleActualizarPlan}
              onVerRecetaDetalle={(r) => setRecetaDetalle(r)}
            />
          )}

          {tabActiva === 'semana' && perfil && (
            <SemanaView
              planSemana={planesSemana}
              perfil={perfil}
              todasLasRecetas={recetas}
              fechaInicioLunes={fechaLunesActual}
              onSeleccionarDia={(f) => {
                setFechaSeleccionada(f);
                setTabActiva('hoy');
              }}
              onSemanaGenerada={handleSemanaGenerada}
            />
          )}

          {tabActiva === 'compras' && (
            <ComprasView
              itemsCompra={itemsCompra}
              planesSemana={planesSemana}
              recetas={recetas}
              despensa={despensa}
              fechaLunesActual={fechaLunesActual}
              onActualizarItems={handleActualizarCompras}
              onAbrirChatbot={handleAbrirChatbot}
            />
          )}

          {tabActiva === 'recetas' && perfil && (
            <RecetasView
              recetas={recetas}
              perfil={perfil}
              onActualizarRecetas={handleActualizarRecetas}
              recetaSeleccionada={recetaDetalle}
              onCerrarDetalleReceta={() => setRecetaDetalle(null)}
              onVerRecetaDetalle={(r) => setRecetaDetalle(r)}
            />
          )}

          {tabActiva === 'metas' && perfil && (
            <MetasView
              perfil={perfil}
              registrosProgreso={registrosProgreso}
              onActualizarPerfil={(p) => setPerfil(p)}
              onActualizarRegistros={handleActualizarRegistros}
            />
          )}
        </main>
      </div>

      {/* Botón Flotante para Asistente & Escáner IA de Pasillo en Líder */}
      <button
        onClick={() => handleAbrirChatbot()}
        title="Escáner IA: Lee la tabla nutricional de cualquier producto o consulta reemplazos recomendados"
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 px-4 py-3 rounded-2xl bg-[var(--accent-protein)] text-black font-extrabold text-xs sm:text-sm shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-black/10"
      >
        <Sparkles className="w-4 h-4 fill-black" />
        <span className="hidden sm:inline">Escáner IA Líder</span>
        <span className="sm:hidden">Escáner IA</span>
      </button>

      {/* Modal de Asistente IA y Escáner de Tabla Nutricional OCR */}
      <ChatbotNutricionalModal
        abierto={modalChatbotAbierto}
        onCerrar={() => {
          setModalChatbotAbierto(false);
          setIngredienteChatbot(undefined);
        }}
        ingredienteInicial={ingredienteChatbot}
      />

      {/* Modal Global de Detalle de Receta, Ingredientes y Gramajes */}
      <ModalDetalleReceta
        receta={recetaDetalle}
        onCerrar={() => setRecetaDetalle(null)}
      />

      {/* Barra de Navegación Fija (Móvil inferior + Desktop lateral) */}
      <NavigationBar
        tabActiva={tabActiva}
        onCambiarTab={(tab) => setTabActiva(tab)}
        conteoComprasPendientes={itemsCompra.filter((i) => !i.comprado).length}
      />
    </div>
  );
};

export default App;
