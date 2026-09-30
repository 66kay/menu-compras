/**
 * Utilidades de fecha libres de desface de zona horaria (Local-First).
 * Previene que después de las 20:00 / 21:00 hrs en Chile (UTC-3 / UTC-4),
 * el método nativo toISOString() salte al día siguiente y cause un reseteo visual de comidas.
 */

export function fechaALocalISO(fecha: Date = new Date()): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export function getLunesDeEstaSemana(fecha: Date = new Date()): string {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return fechaALocalISO(d);
}

export function sumarDiasISO(fechaISO: string, dias: number): string {
  const partes = fechaISO.split('-');
  const y = Number(partes[0]) || 2026;
  const m = Number(partes[1]) || 1;
  const d = Number(partes[2]) || 1;
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + dias);
  return fechaALocalISO(date);
}
