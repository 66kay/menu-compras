import React, { useState } from 'react';
import {
  Search,
  Plus,
  Clock,
  Heart,
  Layers,
  AlertTriangle,
  X,
} from 'lucide-react';
import type { Receta, CategoriaComida, PerfilUsuario } from '../../types';
import { RecetaSchema } from '../../types';
import { esRecetaPermitida } from '../../logic/generador';
import { db } from '../../db';

interface RecetasViewProps {
  recetas: Receta[];
  perfil: PerfilUsuario;
  onActualizarRecetas: () => void;
  onVerRecetaDetalle: (receta: Receta) => void;
}

export const RecetasView: React.FC<RecetasViewProps> = ({
  recetas,
  perfil,
  onActualizarRecetas,
  onVerRecetaDetalle,
}) => {
  const [busqueda, setBusqueda] = useState<string>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [proteinaFiltro, setProteinaFiltro] = useState<string>('todas');
  const [soloBatch, setSoloBatch] = useState<boolean>(false);
  const [soloFavoritas, setSoloFavoritas] = useState<boolean>(false);
  const [modalNuevaReceta, setModalNuevaReceta] = useState<boolean>(false);

  // Formulario nueva receta
  const [nombreNueva, setNombreNueva] = useState('');
  const [catNueva, setCatNueva] = useState<CategoriaComida>('almuerzo');
  const [tiempoNueva, setTiempoNueva] = useState(25);
  const [calsNueva, setCalsNueva] = useState(600);
  const [protNueva, setProtNueva] = useState(50);
  const [carbsNueva, setCarbsNueva] = useState(60);
  const [grasasNueva, setGrasasNueva] = useState(15);
  const [ingredientesTexto, setIngredientesTexto] = useState('');
  const [instruccionesTexto, setInstruccionesTexto] = useState('');
  const [errorLegumbres, setErrorLegumbres] = useState<string | null>(null);

  // Filtrado
  const recetasFiltradas = recetas.filter((r) => {
    if (categoriaFiltro !== 'todas' && r.categoria !== categoriaFiltro) return false;
    if (proteinaFiltro !== 'todas' && r.fuenteProteinaPrincipal !== proteinaFiltro) return false;
    if (soloBatch && !r.batchCooking) return false;
    if (soloFavoritas && !r.esFavorita) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const coincide =
        r.nombre.toLowerCase().includes(q) ||
        r.descripcion?.toLowerCase().includes(q) ||
        r.ingredientes.some((i) => i.nombre.toLowerCase().includes(q));
      if (!coincide) return false;
    }
    return true;
  });

  // Toggle Favorita
  const handleToggleFavorita = async (receta: Receta, e: React.MouseEvent) => {
    e.stopPropagation();
    receta.esFavorita = !receta.esFavorita;
    await db.recetas.put(receta);
    onActualizarRecetas();
  };

  // Crear receta personalizada
  const handleCrearReceta = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLegumbres(null);

    const textoGeneral = `${nombreNueva} ${ingredientesTexto} ${instruccionesTexto}`.toLowerCase();
    const prohibidas = [
      'lenteja',
      'lentejas',
      'poroto',
      'porotos',
      'garbanzo',
      'garbanzos',
      'arveja seca',
      'haba seca',
      'hummus',
    ];

    for (const p of prohibidas) {
      if (textoGeneral.includes(p)) {
        setErrorLegumbres(`No se puede guardar: contiene "${p}". Tu perfil excluye estrictamente las legumbres.`);
        return;
      }
    }

    const lineasIngredientes = ingredientesTexto
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const ingredientes = lineasIngredientes.map((linea) => ({
      nombre: linea,
      cantidad: 1,
      unidad: 'unidad' as const,
      categoriaPasillo: 'despensa_abarrotes' as const,
      opcional: false,
    }));

    if (ingredientes.length === 0) {
      setErrorLegumbres('Ingresa al menos un ingrediente.');
      return;
    }

    const nuevaReceta: Receta = {
      id: `custom_${Date.now()}`,
      nombre: nombreNueva,
      categoria: catNueva,
      tiempoMinutos: tiempoNueva,
      porciones: 1,
      ingredientes,
      macrosPorPorcion: {
        calorias: calsNueva,
        proteinas: protNueva,
        carbohidratos: carbsNueva,
        grasas: grasasNueva,
        fibra: 5,
      },
      instrucciones: instruccionesTexto
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      fuenteProteinaPrincipal: 'pollo',
      esFavorita: true,
      batchCooking: false,
      aptaPreEntreno: false,
      aptaPostEntreno: true,
    };

    if (!esRecetaPermitida(nuevaReceta, perfil)) {
      setErrorLegumbres('No se puede guardar: contiene ingredientes restringidos por tu perfil.');
      return;
    }

    try {
      RecetaSchema.parse(nuevaReceta);
      await db.recetas.put(nuevaReceta);
      setModalNuevaReceta(false);
      setNombreNueva('');
      setIngredientesTexto('');
      setInstruccionesTexto('');
      onActualizarRecetas();
    } catch {
      setErrorLegumbres('Error de validación: revisa que todos los campos sean válidos.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar entre las 40 recetas chilenas & gym..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-protein)] outline-none"
            />
          </div>

          <button
            onClick={() => setModalNuevaReceta(true)}
            className="px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-base)] text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Receta</span>
          </button>
        </div>

        {/* Chips de Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'todas', label: 'Todas las Recetas' },
            { id: 'desayuno', label: 'Desayunos' },
            { id: 'almuerzo', label: 'Almuerzos' },
            { id: 'colacion', label: 'Colaciones' },
            { id: 'once', label: 'Once Chilena' },
            { id: 'cena', label: 'Cenas' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaFiltro(cat.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium cursor-pointer ${
                categoriaFiltro === cat.id
                  ? 'bg-[var(--accent-protein)] text-black font-bold'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filtros secundarios: Proteína y Batch */}
        <div className="flex items-center gap-3 pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex-wrap">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={soloBatch}
              onChange={(e) => setSoloBatch(e.target.checked)}
              className="rounded accent-[var(--accent-protein)]"
            />
            <span>Batch Cooking</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={soloFavoritas}
              onChange={(e) => setSoloFavoritas(e.target.checked)}
              className="rounded accent-[var(--accent-protein)]"
            />
            <span>Solo Favoritas</span>
          </label>
          <select
            value={proteinaFiltro}
            onChange={(e) => setProteinaFiltro(e.target.value)}
            className="px-2 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-[11px]"
          >
            <option value="todas">Todas las proteínas</option>
            <option value="pollo">Pollo</option>
            <option value="vacuno">Vacuno</option>
            <option value="pavo">Pavo</option>
            <option value="pescado">Pescado</option>
            <option value="huevos">Huevos</option>
            <option value="lacteo">Lácteos</option>
          </select>
          <span className="text-[var(--text-muted)] ml-auto">
            {recetasFiltradas.length} {recetasFiltradas.length === 1 ? 'receta' : 'recetas'} (sin legumbres)
          </span>
        </div>
      </div>

      {/* Grid de Recetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {recetasFiltradas.map((receta) => (
          <div
            key={receta.id}
            onClick={() => onVerRecetaDetalle(receta)}
            className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-protein)]/50 transition-all cursor-pointer shadow-xs flex flex-col justify-between space-y-3 group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                  {receta.categoria}
                </span>

                <button
                  onClick={(e) => handleToggleFavorita(receta, e)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    receta.esFavorita
                      ? 'text-red-500 fill-red-500'
                      : 'text-[var(--text-muted)] hover:text-red-400'
                  }`}
                  aria-label="Marcar como favorita"
                >
                  <Heart className={`w-4 h-4 ${receta.esFavorita ? 'fill-current' : ''}`} />
                </button>
              </div>

              <h4 className="font-bold text-sm sm:text-base text-[var(--text-primary)] group-hover:text-[var(--accent-protein)] transition-colors leading-snug">
                {receta.nombre}
              </h4>

              {receta.descripcion && (
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1 leading-relaxed">
                  {receta.descripcion}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs tabular-nums">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {receta.tiempoMinutos} min
                </span>
                {receta.batchCooking && (
                  <span className="flex items-center gap-1 text-[var(--accent-protein)] font-medium">
                    <Layers className="w-3 h-3" /> Rinde {receta.batchCookingRinde}p
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--text-primary)]">
                  {receta.macrosPorPorcion.calorias} kcal
                </span>
                <span className="font-bold text-[var(--accent-protein)]">
                  {receta.macrosPorPorcion.proteinas}g P
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nueva Receta Personalizada */}
      {modalNuevaReceta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg max-h-[90vh] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Crear Receta Personalizada
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Fórmula deportiva propia (Validación estricta sin legumbres)
                </p>
              </div>
              <button
                onClick={() => setModalNuevaReceta(false)}
                className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorLegumbres && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorLegumbres}</span>
              </div>
            )}

            <form onSubmit={handleCrearReceta} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  Nombre del Plato
                </label>
                <input
                  type="text"
                  placeholder="Ej: Salmón con papas rústicas al eneldo"
                  value={nombreNueva}
                  onChange={(e) => setNombreNueva(e.target.value)}
                  className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Categoría
                  </label>
                  <select
                    value={catNueva}
                    onChange={(e) => setCatNueva(e.target.value as CategoriaComida)}
                    className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                  >
                    <option value="desayuno">Desayuno</option>
                    <option value="almuerzo">Almuerzo</option>
                    <option value="colacion">Colación</option>
                    <option value="once">Once</option>
                    <option value="cena">Cena</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Tiempo de Cocina (min)
                  </label>
                  <input
                    type="number"
                    value={tiempoNueva}
                    onChange={(e) => setTiempoNueva(Number(e.target.value))}
                    className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                    required
                  />
                </div>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Calorías
                  </label>
                  <input
                    type="number"
                    value={calsNueva}
                    onChange={(e) => setCalsNueva(Number(e.target.value))}
                    className="w-full px-2 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--accent-protein)] mb-1">
                    Proteína (g)
                  </label>
                  <input
                    type="number"
                    value={protNueva}
                    onChange={(e) => setProtNueva(Number(e.target.value))}
                    className="w-full px-2 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--accent-protein)] font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Carbos (g)
                  </label>
                  <input
                    type="number"
                    value={carbsNueva}
                    onChange={(e) => setCarbsNueva(Number(e.target.value))}
                    className="w-full px-2 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Grasas (g)
                  </label>
                  <input
                    type="number"
                    value={grasasNueva}
                    onChange={(e) => setGrasasNueva(Number(e.target.value))}
                    className="w-full px-2 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  Ingredientes (uno por línea)
                </label>
                <textarea
                  rows={3}
                  placeholder="250g Pechuga de pollo&#10;200g Papas granel&#10;1 Tomate chileno"
                  value={ingredientesTexto}
                  onChange={(e) => setIngredientesTexto(e.target.value)}
                  className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  Instrucciones de Cocina
                </label>
                <textarea
                  rows={3}
                  placeholder="Sellar el pollo a la plancha...&#10;Hervir las papas..."
                  value={instruccionesTexto}
                  onChange={(e) => setInstruccionesTexto(e.target.value)}
                  className="w-full px-3 py-2 text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-base)] text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                Guardar Receta en Mi Biblioteca
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
