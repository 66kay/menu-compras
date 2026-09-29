import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Eye,
  ShoppingBag,
  RefreshCw,
  Edit2,
  Sparkles,
  Beef,
  Fish,
  Milk,
  Apple,
  Croissant,
  Package,
  Snowflake,
  Coffee,
  ExternalLink,
} from 'lucide-react';
import type { ItemCompra, CategoriaPasillo, PlanDia, Receta, ItemDespensa } from '../../types';
import { TITULOS_PASILLOS, generarListaCompras } from '../../logic/lista-compras';
import { db } from '../../db';
import { liderProvider } from '../../services/precios';

interface ComprasViewProps {
  itemsCompra: ItemCompra[];
  planesSemana?: PlanDia[];
  recetas?: Receta[];
  despensa?: ItemDespensa[];
  fechaLunesActual?: string;
  onActualizarItems: () => void;
}

/**
 * Calcula la cantidad de envases/packs que se deben comprar en Líder
 * y el costo subtotal real del alimento.
 */
export function calcularUnidadesYSubtotal(item: ItemCompra) {
  if (item.cantidadAComprar <= 0) return { unidades: 0, subtotal: 0, textoPresentacion: '' };
  const prod = item.productoSeleccionado;
  const precioUnitario = item.productoManual?.precio ?? prod?.precio ?? 0;

  let gramosEnvase = 0;
  if (prod?.cantidadPresentacion) {
    const gMatch = prod.cantidadPresentacion.match(/(\d+)\s*g/i);
    const kgMatch = prod.cantidadPresentacion.match(/(\d+(?:[.,]\d+)?)\s*kg/i);
    const lMatch = prod.cantidadPresentacion.match(/(\d+(?:[.,]\d+)?)\s*l/i);
    if (gMatch?.[1]) gramosEnvase = parseInt(gMatch[1], 10);
    else if (kgMatch?.[1]) gramosEnvase = Math.round(parseFloat(kgMatch[1].replace(',', '.')) * 1000);
    else if (lMatch?.[1]) gramosEnvase = Math.round(parseFloat(lMatch[1].replace(',', '.')) * 1000);
  }

  let unidades = 1;
  if (gramosEnvase > 0) {
    const gramosNecesarios =
      item.unidad === 'kg' || item.unidad === 'l'
        ? item.cantidadAComprar * 1000
        : item.cantidadAComprar;
    unidades = Math.max(1, Math.ceil(gramosNecesarios / gramosEnvase));
  } else if (item.unidad === 'unidad') {
    const unidadesPack = prod?.nombre.match(/(\d+)\s*Un/i);
    if (unidadesPack?.[1]) {
      const uEnPack = parseInt(unidadesPack[1], 10);
      unidades = Math.max(1, Math.ceil(item.cantidadAComprar / uEnPack));
    } else {
      unidades = Math.max(1, Math.ceil(item.cantidadAComprar));
    }
  } else {
    unidades = Math.max(1, Math.ceil(item.cantidadAComprar));
  }

  const subtotal = unidades * precioUnitario;
  const textoPresentacion =
    prod?.cantidadPresentacion && prod.cantidadPresentacion !== '1 un'
      ? `${unidades} ${unidades === 1 ? 'pack' : 'packs'} (${prod.cantidadPresentacion})`
      : `${unidades} ${unidades === 1 ? 'unidad' : 'unidades'}`;

  return { unidades, subtotal, textoPresentacion };
}

export const ComprasView: React.FC<ComprasViewProps> = ({
  itemsCompra,
  planesSemana,
  recetas,
  despensa,
  fechaLunesActual,
  onActualizarItems,
}) => {
  const [periodo, setPeriodo] = useState<'mes' | 'semana'>('mes');
  const [modoTienda, setModoTienda] = useState<boolean>(false);
  const [sincronizando, setSincronizando] = useState<boolean>(false);
  const [itemEditandoManual, setItemEditandoManual] = useState<ItemCompra | null>(null);
  const [precioManualInput, setPrecioManualInput] = useState<string>('');

  // Ítems mostrados según período (mes completo o semana actual)
  const itemsMostrados = React.useMemo(() => {
    if (periodo === 'semana' && planesSemana && recetas && despensa && fechaLunesActual) {
      const planes7 = planesSemana.slice(0, 7);
      return generarListaCompras(planes7, recetas, despensa, fechaLunesActual);
    }
    return itemsCompra; // Mes completo (28 días) por defecto
  }, [periodo, itemsCompra, planesSemana, recetas, despensa, fechaLunesActual]);

  // Iconos por pasillo
  const renderIconoPasillo = (pasillo: CategoriaPasillo) => {
    switch (pasillo) {
      case 'carnes_aves':
        return <Beef className="w-4 h-4 text-[var(--accent-carb)]" />;
      case 'pescados_mariscos':
        return <Fish className="w-4 h-4 text-sky-500" />;
      case 'lacteos_huevos':
        return <Milk className="w-4 h-4 text-[var(--accent-protein)]" />;
      case 'frutas_verduras':
        return <Apple className="w-4 h-4 text-emerald-500" />;
      case 'panaderia_cereales':
        return <Croissant className="w-4 h-4 text-amber-500" />;
      case 'despensa_abarrotes':
        return <Package className="w-4 h-4 text-stone-400" />;
      case 'congelados':
        return <Snowflake className="w-4 h-4 text-cyan-400" />;
      case 'bebidas':
        return <Coffee className="w-4 h-4 text-orange-400" />;
      default:
        return <ShoppingBag className="w-4 h-4 text-[var(--accent-protein)]" />;
    }
  };

  // Toggle comprado
  const handleToggleComprado = async (itemId: string) => {
    const item = itemsMostrados.find((i) => i.id === itemId);
    if (!item) return;

    item.comprado = !item.comprado;
    await db.compras.put(item);
    onActualizarItems();
  };

  // Sincronizar precios con Líder
  const handleSincronizarPrecios = async () => {
    setSincronizando(true);
    try {
      for (const item of itemsMostrados) {
        if (!item.productoSeleccionado && !item.productoManual) {
          const productos = await liderProvider.buscar(item.ingredienteNombre);
          if (productos.length > 0) {
            item.productoSeleccionado = productos[0];
            await db.compras.put(item);
          }
        }
      }
      onActualizarItems();
    } catch (err) {
      console.error('Error al sincronizar precios Líder:', err);
    } finally {
      setSincronizando(false);
    }
  };

  // Guardar precio manual
  const handleGuardarManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemEditandoManual) return;

    const precioNum = Number(precioManualInput.replace(/\D/g, ''));
    itemEditandoManual.productoManual = {
      nombre: itemEditandoManual.ingredienteNombre,
      precio: precioNum,
    };

    await db.compras.put(itemEditandoManual);
    setItemEditandoManual(null);
    setPrecioManualInput('');
    onActualizarItems();
  };

  // Agrupar items por pasillo
  const pasillosOrdenados: CategoriaPasillo[] = [
    'carnes_aves',
    'pescados_mariscos',
    'lacteos_huevos',
    'frutas_verduras',
    'panaderia_cereales',
    'despensa_abarrotes',
    'congelados',
    'bebidas',
  ];

  const itemsPorPasillo = pasillosOrdenados.map((pasillo) => ({
    pasillo,
    config: TITULOS_PASILLOS[pasillo],
    items: itemsMostrados.filter((i) => i.categoriaPasillo === pasillo),
  }));

  // Cálculo del total estimado del carro usando subtotales reales por envase
  const totalEstimado = itemsMostrados.reduce((sum, item) => {
    if (item.cantidadAComprar <= 0) return sum;
    const { subtotal } = calcularUnidadesYSubtotal(item);
    return sum + subtotal;
  }, 0);

  const conteoComprados = itemsMostrados.filter((i) => i.comprado).length;

  return (
    <div className={`space-y-6 max-w-4xl mx-auto pb-24 ${modoTienda ? 'text-lg' : ''}`}>
      {/* Selector de Período: Mes Completo vs Semana */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <button
            onClick={() => setPeriodo('mes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              periodo === 'mes'
                ? 'bg-[var(--accent-protein)] text-black font-extrabold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            📅 Mes Completo (4 Semanas)
          </button>
          <button
            onClick={() => setPeriodo('semana')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              periodo === 'semana'
                ? 'bg-[var(--accent-protein)] text-black font-extrabold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            📆 Semana Actual (7 Días)
          </button>
        </div>

        <span className="text-xs text-[var(--text-muted)] font-medium">
          {periodo === 'mes'
            ? 'Total de 28 días con rotación diaria de recetas'
            : 'Solo compras para los próximos 7 días'}
        </span>
      </div>

      {/* Barra Superior de Control y Total */}
      <div className="sticky top-[60px] z-30 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-md space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Líder Casona, Osorno
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-elevated)] text-[var(--text-secondary)] tabular-nums">
                {conteoComprados} de {itemsMostrados.length} comprados
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              ${totalEstimado.toLocaleString('es-CL')}{' '}
              <span className="text-xs font-medium text-[var(--text-muted)]">
                {periodo === 'mes' ? 'total estimado del mes' : 'total estimado semanal'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setModoTienda(!modoTienda)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                modoTienda
                  ? 'bg-[var(--accent-protein)] text-black font-extrabold shadow-sm'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{modoTienda ? 'Modo Normal' : 'Modo Tienda'}</span>
            </button>

            <button
              onClick={handleSincronizarPrecios}
              disabled={sincronizando}
              title="Actualizar cotización de precios Líder"
              className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin text-[var(--accent-protein)]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Barra de Progreso de Compra */}
        <div className="h-1.5 w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden">
          <div
            className="h-full bg-[var(--accent-protein)] transition-all duration-300"
            style={{
              width: `${itemsMostrados.length > 0 ? (conteoComprados / itemsMostrados.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Lista Agrupada por Pasillos */}
      <div className="space-y-6">
        {itemsPorPasillo.map(({ pasillo, config, items }) => {
          if (items.length === 0) return null;

          return (
            <div key={pasillo} className="space-y-2">
              {/* Encabezado de Pasillo */}
              <div className="sticky top-[152px] z-20 py-1.5 px-3 rounded-xl bg-[var(--bg-base)]/95 backdrop-blur-md border border-[var(--border-subtle)]/60 flex items-center justify-between text-xs font-bold text-[var(--text-primary)] shadow-2xs">
                <div className="flex items-center gap-2">
                  {renderIconoPasillo(pasillo)}
                  <span>{config.titulo}</span>
                </div>
                <span className="text-[11px] text-[var(--text-muted)] font-medium">
                  {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
                </span>
              </div>

              {/* Items del Pasillo */}
              <div className="space-y-2">
                {items.map((item) => {
                  const prod = item.productoSeleccionado;
                  const manual = item.productoManual;
                  const precio = manual?.precio ?? prod?.precio;
                  const { unidades, subtotal, textoPresentacion } = calcularUnidadesYSubtotal(item);

                  return (
                    <div
                      key={item.id}
                      className={`p-3 sm:p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                        item.comprado
                          ? 'bg-[var(--bg-elevated)]/40 border-[var(--border-subtle)] opacity-60'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] shadow-xs'
                      }`}
                    >
                      {/* Checkbox táctil grande (especialmente en modo tienda para el pulgar) */}
                      <button
                        onClick={() => handleToggleComprado(item.id)}
                        className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--accent-protein)] cursor-pointer active:scale-90 transition-transform shrink-0 ${
                          modoTienda ? 'order-last' : ''
                        }`}
                        aria-label={item.comprado ? 'Desmarcar' : 'Marcar comprado'}
                      >
                        {item.comprado ? (
                          <CheckCircle2 className="w-7 h-7 text-[var(--accent-protein)] fill-[var(--accent-protein)]/20" />
                        ) : (
                          <Circle className="w-7 h-7 text-[var(--text-muted)] hover:text-[var(--text-secondary)]" />
                        )}
                      </button>

                      {/* Foto Real de Líder */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden shrink-0 flex items-center justify-center p-1">
                        {prod?.urlFoto ? (
                          <img
                            src={prod.urlFoto}
                            alt={item.ingredienteNombre}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            onError={(e) => {
                              // Fallback si la imagen no carga
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-[var(--text-muted)]" />
                        )}
                      </div>

                      {/* Datos del Alimento */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          {prod?.esMejorLider && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[var(--accent-protein)]/15 text-[var(--accent-protein)] border border-[var(--accent-protein)]/30 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> Mejor Líder
                            </span>
                          )}
                          {prod?.vendedorTipo === 'marketplace' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-500/15 text-amber-500">
                              Marketplace
                            </span>
                          )}
                          {prod?.vendedorTipo === 'directo_lider' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                              Líder Directo
                            </span>
                          )}
                        </div>

                        <h4
                          className={`font-bold text-[var(--text-primary)] leading-snug truncate ${
                            modoTienda ? 'text-base sm:text-lg' : 'text-sm'
                          } ${item.comprado ? 'line-through text-[var(--text-muted)]' : ''}`}
                        >
                          {prod ? prod.nombre : item.ingredienteNombre}
                        </h4>

                        {/* Detalle de marca, ingrediente del plan y enlace a Líder */}
                        <div className="text-xs text-[var(--text-secondary)] tabular-nums flex items-center gap-2 mt-0.5 flex-wrap">
                          {prod?.marca && (
                            <span className="font-semibold text-[var(--text-primary)] text-[11px] px-1.5 py-0.2 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                              {prod.marca}
                            </span>
                          )}
                          <span className="font-semibold text-[var(--text-primary)]">
                            Comprar: {item.cantidadAComprar} {item.unidad}
                          </span>
                          {textoPresentacion && (
                            <span className="font-semibold text-[var(--accent-carb)] text-[11px] px-1.5 py-0.2 rounded bg-[var(--accent-carb)]/10">
                              Llevar: {textoPresentacion}
                            </span>
                          )}
                          {item.enDespensa > 0 && (
                            <span className="text-[var(--text-muted)] text-[11px]">
                              (Despensa: {item.enDespensa} {item.unidad})
                            </span>
                          )}
                          {prod?.urlProducto && (
                            <a
                              href={prod.urlProducto}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[var(--accent-protein)] hover:underline inline-flex items-center gap-0.5 text-[11px]"
                              title="Ver producto en super.lider.cl"
                            >
                              <span>Ver Líder</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Precio y Edición Manual */}
                      <div className="text-right shrink-0">
                        {subtotal > 0 ? (
                          <div className="tabular-nums">
                            <span
                              className={`font-bold text-[var(--text-primary)] ${
                                modoTienda ? 'text-base sm:text-xl' : 'text-sm'
                              }`}
                            >
                              ${subtotal.toLocaleString('es-CL')}
                            </span>
                            <span className="block text-[10px] text-[var(--text-muted)]">
                              {unidades > 1
                                ? `${unidades} x $${precio?.toLocaleString('es-CL')}`
                                : prod?.precioPorUnidadMedida || `$${precio?.toLocaleString('es-CL')}`}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setItemEditandoManual(item);
                              setPrecioManualInput('');
                            }}
                            className="text-[11px] font-medium text-[var(--accent-carb)] hover:underline flex items-center gap-1 justify-end"
                          >
                            <Edit2 className="w-3 h-3" /> Sin dato
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Ingreso Manual de Precio */}
      {itemEditandoManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Ingresar Precio Manual
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {itemEditandoManual.ingredienteNombre}
              </p>
            </div>

            <form onSubmit={handleGuardarManual} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Precio en Pesos Chilenos (CLP)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 3490"
                  value={precioManualInput}
                  onChange={(e) => setPrecioManualInput(e.target.value)}
                  className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] tabular-nums font-semibold"
                  autoFocus
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setItemEditandoManual(null)}
                  className="px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-base)] text-xs font-bold shadow-xs cursor-pointer"
                >
                  Guardar Precio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
