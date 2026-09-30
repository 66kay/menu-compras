import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  MessageSquare,
  Repeat,
  Send,
  Loader2,
  ShieldCheck,
  Dumbbell,
} from 'lucide-react';
import {
  escanearTablaNutricionalOCR,
  evaluarProductoNutricional,
  responderDudaSupermercado,
  SUSTITUCIONES_LIDER,
  type MetricasTablaNutricional,
  type VeredictoNutricional,
} from '../../services/ia-nutricion';

interface ChatbotNutricionalModalProps {
  abierto: boolean;
  onCerrar: () => void;
  ingredienteInicial?: string;
}

interface MensajeChat {
  id: string;
  remitente: 'usuario' | 'ia';
  texto: string;
  veredicto?: VeredictoNutricional;
  imagenUrl?: string;
  fecha: string;
}

export const ChatbotNutricionalModal: React.FC<ChatbotNutricionalModalProps> = ({
  abierto,
  onCerrar,
  ingredienteInicial,
}) => {
  const [tabActiva, setTabActiva] = useState<'escaner' | 'chat' | 'sugerencias'>('escaner');

  // Estado del Escáner OCR
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [escaneando, setEscaneando] = useState<boolean>(false);
  const [progresoTexto, setProgresoTexto] = useState<string>('');
  const [progresoPct, setProgresoPct] = useState<number>(0);
  const [veredictoActual, setVeredictoActual] = useState<VeredictoNutricional | null>(null);

  // Campos editables tras OCR
  const [proteinaInput, setProteinaInput] = useState<string>('');
  const [caloriasInput, setCaloriasInput] = useState<string>('');
  const [grasasInput, setGrasasInput] = useState<string>('');
  const [carbosInput, setCarbosInput] = useState<string>('');

  // Estado del Chatbot
  const [mensajes, setMensajes] = useState<MensajeChat[]>([
    {
      id: 'm-init',
      remitente: 'ia',
      texto:
        '¡Hola! Soy tu Asistente Nutricional Deportivo de Líder 🤖💪. Si no encuentras exactamente el producto de tu lista, súbeme una foto de la tabla nutricional de la alternativa y te daré el visto bueno o malo al instante según tu meta de recomposición corporal.',
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputChat, setInputChat] = useState<string>('');
  const [procesandoFotoChat, setProcesandoFotoChat] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatCameraInputRef = useRef<HTMLInputElement>(null);
  const chatGalleryInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  if (!abierto) return null;

  // Procesar archivo de imagen seleccionado
  const procesarImagen = async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setImagenPreview(objectUrl);
    setEscaneando(true);
    setVeredictoActual(null);
    setProgresoPct(10);
    setProgresoTexto('Cargando imagen...');

    try {
      const metricas = await escanearTablaNutricionalOCR(file, (pct, msg) => {
        setProgresoPct(pct);
        setProgresoTexto(msg);
      });

      // Rellenar estados editables
      if (metricas.proteinasGramos !== undefined) setProteinaInput(metricas.proteinasGramos.toString());
      if (metricas.caloriasPor100g !== undefined) setCaloriasInput(metricas.caloriasPor100g.toString());
      if (metricas.grasasTotalesGramos !== undefined) setGrasasInput(metricas.grasasTotalesGramos.toString());
      if (metricas.carbohidratosGramos !== undefined) setCarbosInput(metricas.carbohidratosGramos.toString());

      // Generar veredicto automático
      const veredicto = evaluarProductoNutricional(metricas, ingredienteInicial || 'general');
      setVeredictoActual(veredicto);

      // Agregar al historial del chat
      setMensajes((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          remitente: 'usuario',
          texto: '📸 Analicé la tabla nutricional de este producto.',
          imagenUrl: objectUrl,
          fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: `m-ia-${Date.now()}`,
          remitente: 'ia',
          texto: veredicto.mensaje,
          veredicto,
          fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('Error al escanear imagen:', err);
      setProgresoTexto('No se pudo leer con suficiente claridad. Puedes ingresar los números manualmente.');
    } finally {
      setEscaneando(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      procesarImagen(file);
    }
  };

  // Re-evaluar si el usuario corrige algún número manualmente
  const handleRecalcularManual = () => {
    const metricasManuales: MetricasTablaNutricional = {
      proteinasGramos: Number(proteinaInput) || 0,
      caloriasPor100g: Number(caloriasInput) || 0,
      grasasTotalesGramos: Number(grasasInput) || 0,
      carbohidratosGramos: Number(carbosInput) || 0,
      sellosDetectados: [],
    };
    const v = evaluarProductoNutricional(metricasManuales, ingredienteInicial || 'general');
    setVeredictoActual(v);
  };

  // Enviar mensaje en el chat
  const handleEnviarMensaje = (textoPersonalizado?: string) => {
    const textoAEnviar = textoPersonalizado || inputChat.trim();
    if (!textoAEnviar) return;

    const nuevoUsuario: MensajeChat = {
      id: `u-${Date.now()}`,
      remitente: 'usuario',
      texto: textoAEnviar,
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const respuestaTexto = responderDudaSupermercado(textoAEnviar);

    const nuevaIA: MensajeChat = {
      id: `ia-${Date.now()}`,
      remitente: 'ia',
      texto: respuestaTexto,
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMensajes((prev) => [...prev, nuevoUsuario, nuevaIA]);
    if (!textoPersonalizado) setInputChat('');
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // Procesar imagen subida directamente desde el chat
  const handleChatImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const mensajeUsuarioId = `u-${Date.now()}`;
    const mensajeIaId = `ia-${Date.now()}`;

    // 1. Mostrar mensaje del usuario con la foto y mensaje de espera de la IA
    setMensajes((prev) => [
      ...prev,
      {
        id: mensajeUsuarioId,
        remitente: 'usuario',
        texto: '📸 Analiza esta tabla nutricional y dame un resumen rápido.',
        imagenUrl: objectUrl,
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: mensajeIaId,
        remitente: 'ia',
        texto: '🤖 Leyendo tabla nutricional con OCR e identificando macros...',
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setProcesandoFotoChat(true);
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    try {
      const metricas = await escanearTablaNutricionalOCR(file);
      const veredicto = evaluarProductoNutricional(metricas, ingredienteInicial || 'general');

      const cals = metricas.caloriasPor100g !== undefined ? `${metricas.caloriasPor100g} kcal` : 'N/D';
      const prot = metricas.proteinasGramos !== undefined ? `${metricas.proteinasGramos}g` : '0g';
      const carbs = metricas.carbohidratosGramos !== undefined ? `${metricas.carbohidratosGramos}g` : '0g';
      const grasas = metricas.grasasTotalesGramos !== undefined ? `${metricas.grasasTotalesGramos}g` : '0g';

      const iconoVeredicto =
        veredicto.tipo === 'visto_bueno'
          ? '✅ APROBADO'
          : veredicto.tipo === 'aceptable'
          ? '⚠️ ACEPTABLE'
          : '❌ NO RECOMENDADO';

      const resumenConciso = `🔍 RESUMEN RÁPIDO NUTRICIONAL:
• Veredicto: ${iconoVeredicto} (${veredicto.calificacion}/10)
• Macros por 100g: ${cals} | ${prot} Prot | ${carbs} Carb | ${grasas} Grasa
• Visto Bueno: ${
        veredicto.tipo === 'visto_bueno'
          ? 'Excelente opción para tu recomposición corporal.'
          : veredicto.tipo === 'aceptable'
          ? 'Salva el apuro si no hay otra opción. Modera la porción.'
          : 'No recomendado para tu meta (bajo en proteína o alto en grasa/azúcar).'
      }
• Porción sugerida: ${veredicto.porcionRecomendada}`;

      // Actualizar mensaje de la IA con la respuesta definitiva concisa
      setMensajes((prev) =>
        prev.map((m) =>
          m.id === mensajeIaId
            ? {
                ...m,
                texto: resumenConciso,
                veredicto,
              }
            : m
        )
      );
    } catch (err) {
      console.error('Error al procesar foto en chat:', err);
      setMensajes((prev) =>
        prev.map((m) =>
          m.id === mensajeIaId
            ? {
                ...m,
                texto:
                  '⚠️ No se pudo leer con total nitidez la tabla. Asegúrate de enfocar bien la columna "Por 100g" con buena luz, o usa la pestaña "Escáner de Tabla".',
              }
            : m
        )
      );
    } finally {
      setProcesandoFotoChat(false);
      if (chatCameraInputRef.current) chatCameraInputRef.current.value = '';
      if (chatGalleryInputRef.current) chatGalleryInputRef.current.value = '';
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera del Asistente */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--accent-protein)] to-emerald-400 text-black flex items-center justify-center font-bold shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                Asistente &amp; Escáner IA
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--accent-protein)]/20 text-[var(--accent-protein)]">
                  Líder Osorno
                </span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Visto bueno instantáneo para productos de supermercado
              </p>
            </div>
          </div>

          <button
            onClick={onCerrar}
            className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setTabActiva('escaner')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tabActiva === 'escaner'
                ? 'bg-[var(--accent-protein)] text-black font-extrabold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)]'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>📸 Escáner de Tabla</span>
          </button>

          <button
            onClick={() => setTabActiva('sugerencias')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tabActiva === 'sugerencias'
                ? 'bg-[var(--accent-protein)] text-black font-extrabold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)]'
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span>🔄 Reemplazos si no hay</span>
          </button>

          <button
            onClick={() => setTabActiva('chat')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tabActiva === 'chat'
                ? 'bg-[var(--accent-protein)] text-black font-extrabold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>💬 Chat de Pasillo</span>
          </button>
        </div>

        {/* Contenido según pestaña */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* ======================================================== */}
          {/* TAB 1: ESCÁNER DE TABLA NUTRICIONAL CON CÁMARA/ARCHIVO   */}
          {/* ======================================================== */}
          {tabActiva === 'escaner' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[var(--accent-protein)] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[var(--text-primary)] block mb-0.5">
                    ¿Encontraste otra marca o corte en Líder?
                  </span>
                  Toma una foto clara a la <strong>Información Nutricional</strong> en el envase. La IA extraerá los gramos de proteína, calorías y grasas, y te dará el <strong>Visto Bueno</strong> de inmediato para tu meta de recomposición corporal.
                </div>
              </div>

              {/* Botones de Captura (Cámara directa o Galería) */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-4 rounded-2xl border-2 border-dashed border-[var(--accent-protein)]/50 hover:border-[var(--accent-protein)] bg-[var(--accent-protein)]/5 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <Camera className="w-6 h-6 text-[var(--accent-protein)]" />
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    Tomar Foto con Cámara
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Directo en el pasillo
                  </span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--text-primary)] bg-[var(--bg-elevated)] flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <Upload className="w-6 h-6 text-[var(--text-secondary)]" />
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    Subir desde Galería
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    PNG, JPG o captura
                  </span>
                </button>
              </div>

              {/* Estado de escaneo en progreso */}
              {escaneando && (
                <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--accent-protein)]/30 text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent-protein)]/10 text-[var(--accent-protein)] animate-pulse">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">
                      {progresoTexto}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Analizando tabla nutricional con OCR local...
                    </p>
                  </div>
                  <div className="w-full bg-[var(--bg-surface)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
                    <div
                      className="bg-[var(--accent-protein)] h-full transition-all duration-300"
                      style={{ width: `${progresoPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Vista previa de imagen + resultado */}
              {imagenPreview && !escaneando && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                    <img
                      src={imagenPreview}
                      alt="Tabla nutricional escaneada"
                      className="w-16 h-16 object-cover rounded-lg border border-[var(--border-subtle)]"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-[var(--text-primary)] block truncate">
                        Imagen de tabla nutricional cargada
                      </span>
                      <span className="text-[10px] text-[var(--accent-protein)] font-semibold">
                        ✓ Lectura completada
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setImagenPreview(null);
                        setVeredictoActual(null);
                      }}
                      className="text-xs text-[var(--text-muted)] hover:text-red-400 cursor-pointer"
                    >
                      Cambiar
                    </button>
                  </div>

                  {/* Veredicto Nutricional Destacado */}
                  {veredictoActual && (
                    <div
                      className={`p-5 rounded-2xl border shadow-lg space-y-3.5 transition-all ${
                        veredictoActual.tipo === 'visto_bueno'
                          ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300'
                          : veredictoActual.tipo === 'aceptable'
                          ? 'bg-amber-950/20 border-amber-500/50 text-amber-300'
                          : 'bg-red-950/20 border-red-500/50 text-red-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          {veredictoActual.tipo === 'visto_bueno' && (
                            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                          )}
                          {veredictoActual.tipo === 'aceptable' && (
                            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                          )}
                          {veredictoActual.tipo === 'no_recomendado' && (
                            <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                          )}
                          <div>
                            <h3 className="font-extrabold text-base sm:text-lg">
                              {veredictoActual.titulo}
                            </h3>
                            <span className="text-xs font-semibold opacity-90">
                              Calificación deportiva: {veredictoActual.calificacion}/10
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs leading-relaxed text-[var(--text-primary)]">
                        {veredictoActual.mensaje}
                      </p>

                      <div className="p-3 rounded-xl bg-[var(--bg-surface)]/80 border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] space-y-1.5">
                        <div className="font-bold flex items-center gap-1.5 text-[var(--accent-protein)]">
                          <Dumbbell className="w-4 h-4" />
                          <span>Recomendación de porción:</span>
                        </div>
                        <p className="text-[var(--text-secondary)]">
                          {veredictoActual.porcionRecomendada}
                        </p>
                      </div>

                      {/* Puntos destacados */}
                      {veredictoActual.puntosPositivos.length > 0 && (
                        <div className="space-y-1 text-xs">
                          {veredictoActual.puntosPositivos.map((pos, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-emerald-400">
                              <span className="text-[10px]">✓</span>
                              <span>{pos}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {veredictoActual.puntosAtencion.length > 0 && (
                        <div className="space-y-1 text-xs">
                          {veredictoActual.puntosAtencion.map((aten, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-amber-400">
                              <span className="text-[10px]">⚠️</span>
                              <span>{aten}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Editor manual / confirmación de macronutrientes leídos */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        Valores Detectados (puedes ajustar si la foto estaba borrosa):
                      </span>
                      <button
                        onClick={handleRecalcularManual}
                        className="text-xs font-bold text-[var(--accent-protein)] hover:underline cursor-pointer"
                      >
                        Recalcular
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                          Proteína (g)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={proteinaInput}
                          onChange={(e) => setProteinaInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-bold tabular-nums"
                          placeholder="ej: 22"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                          Calorías (kcal)
                        </label>
                        <input
                          type="number"
                          value={caloriasInput}
                          onChange={(e) => setCaloriasInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-bold tabular-nums"
                          placeholder="ej: 120"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                          Grasas (g)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={grasasInput}
                          onChange={(e) => setGrasasInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-bold tabular-nums"
                          placeholder="ej: 2"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                          Carbos (g)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={carbosInput}
                          onChange={(e) => setCarbosInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-bold tabular-nums"
                          placeholder="ej: 1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: RECUADRO DE SUGERENCIAS RÁPIDAS DE REEMPLAZO      */}
          {/* ======================================================== */}
          {tabActiva === 'sugerencias' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                <span className="font-bold text-[var(--text-primary)] block mb-0.5">
                  Guía de Reemplazo Rápido en Líder Casona
                </span>
                Si el supermercado se quedó sin stock de algún alimento clave, estos son los mejores sustitutos nutricionales exactos:
              </div>

              <div className="space-y-3">
                {Object.entries(SUSTITUCIONES_LIDER).map(([key, item]) => (
                  <div
                    key={key}
                    className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2.5"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                      <span className="font-extrabold text-sm text-[var(--text-primary)]">
                        {item.ingredientePrincipal}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-protein)]/15 text-[var(--accent-protein)] uppercase">
                        {key}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {item.sustitutos.map((sust, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1"
                        >
                          <div className="font-bold text-[var(--text-primary)] flex items-center justify-between">
                            <span>👉 {sust.nombre}</span>
                            <span className="text-[10px] font-semibold text-[var(--accent-protein)]">
                              {sust.equivalencia}
                            </span>
                          </div>
                          <p className="text-[var(--text-secondary)] text-[11px]">
                            {sust.ventaja}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: CHATBOT INTERACTIVO PARA PREGUNTAS DE PASILLO     */}
          {/* ======================================================== */}
          {tabActiva === 'chat' && (
            <div className="space-y-4">
              {/* Sugerencias de preguntas rápidas */}
              <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => handleEnviarMensaje('¿Qué hago si no hay pechuga deshuesada?')}
                  className="px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] whitespace-nowrap cursor-pointer"
                >
                  🍗 Si no hay pechuga
                </button>
                <button
                  onClick={() => handleEnviarMensaje('¿Qué corte de vacuno barato y magro reemplaza la posta?')}
                  className="px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] whitespace-nowrap cursor-pointer"
                >
                  🥩 Vacuno magro barato
                </button>
                <button
                  onClick={() => handleEnviarMensaje('¿Qué marca de atún al agua conviene comprar en Líder?')}
                  className="px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] whitespace-nowrap cursor-pointer"
                >
                  🐟 Mejor atún
                </button>
                <button
                  onClick={() => handleEnviarMensaje('¿Puedo usar leche protein en vez de proteína en polvo?')}
                  className="px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] whitespace-nowrap cursor-pointer"
                >
                  💪 Leche protein vs whey
                </button>
              </div>

              {/* Feed de mensajes */}
              <div className="space-y-3 min-h-[220px]">
                {mensajes.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.remitente === 'usuario' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                        m.remitente === 'usuario'
                          ? 'bg-[var(--accent-protein)] text-black font-semibold rounded-br-xs'
                          : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-bl-xs'
                      }`}
                    >
                      {m.imagenUrl && (
                        <img
                          src={m.imagenUrl}
                          alt="Foto subida"
                          className="w-full max-h-40 object-cover rounded-xl border border-black/10"
                        />
                      )}
                      <p className="whitespace-pre-line">{m.texto}</p>

                      {m.veredicto && (
                        <div className="pt-2 border-t border-[var(--border-subtle)] font-bold flex items-center justify-between text-[11px]">
                          <span>Calificación: {m.veredicto.calificacion}/10</span>
                          <span>{m.veredicto.tipo === 'visto_bueno' ? '✅ Aprobado' : '⚠️ Revisar'}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] mt-1 px-1">
                      {m.fecha}
                    </span>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>
            </div>
          )}
        </div>

        {/* Input para el chat (visible cuando tabActiva === 'chat') */}
        {tabActiva === 'chat' && (
          <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center gap-2">
            {/* Input oculto para cámara directa */}
            <input
              type="file"
              ref={chatCameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleChatImageUpload}
              className="hidden"
            />
            {/* Input oculto para galería / archivos */}
            <input
              type="file"
              ref={chatGalleryInputRef}
              accept="image/*"
              onChange={handleChatImageUpload}
              className="hidden"
            />

            <input
              type="text"
              value={inputChat}
              onChange={(e) => setInputChat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnviarMensaje()}
              placeholder="Pregúntame sobre un producto o sustituto..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-protein)]"
              disabled={procesandoFotoChat}
            />

            {/* Botón Tomar Foto con Cámara */}
            <button
              type="button"
              onClick={() => chatCameraInputRef.current?.click()}
              disabled={procesandoFotoChat}
              title="Tomar foto con la cámara del celular"
              className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--accent-protein)] hover:text-white hover:bg-[var(--accent-protein)]/20 active:scale-95 flex items-center justify-center cursor-pointer transition-all shrink-0"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Botón Subir Foto desde Galería */}
            <button
              type="button"
              onClick={() => chatGalleryInputRef.current?.click()}
              disabled={procesandoFotoChat}
              title="Subir foto desde la galería o archivos"
              className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--accent-protein)] hover:text-white hover:bg-[var(--accent-protein)]/20 active:scale-95 flex items-center justify-center cursor-pointer transition-all shrink-0"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Botón Enviar Mensaje */}
            <button
              type="button"
              onClick={() => handleEnviarMensaje()}
              disabled={procesandoFotoChat}
              className="w-10 h-10 rounded-xl bg-[var(--accent-protein)] text-black flex items-center justify-center cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-xs shrink-0 font-bold"
            >
              {procesandoFotoChat ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
