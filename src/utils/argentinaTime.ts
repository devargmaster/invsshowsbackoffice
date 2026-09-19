// INVS solo opera en Argentina, que no tiene horario de verano (offset fijo
// UTC-3 desde 2009) — por eso alcanza con un offset constante acá, sin
// necesitar una librería de zonas horarias.
//
// El bug que esto reemplaza: `new Date(inputDatetimeLocalValue)` interpreta
// el string según la zona horaria del navegador/sistema de quien carga el
// dato, no la de Argentina. Si esa máquina no está en horario argentino
// (ej. un navegador configurado en UTC), la fecha/hora guardada queda
// desfasada respecto a lo que la persona realmente escribió — un evento
// cargado como "18:00" puede terminar guardado como 18:00 UTC (15:00 ART).
const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const ARGENTINA_FIXED_OFFSET = '-03:00';

// Convierte el valor de un <input type="datetime-local"> (ej. "2026-09-19T18:00",
// sin zona horaria) al ISO string en UTC que corresponde a esa hora en
// Argentina — para mandar al backend.
export function argentinaLocalInputToISOString(datetimeLocalValue: string): string {
  return new Date(`${datetimeLocalValue}:00${ARGENTINA_FIXED_OFFSET}`).toISOString();
}

// Convierte un instante ISO/Date (como viene del backend, en UTC) al string
// "YYYY-MM-DDTHH:mm" que hay que ponerle a un <input type="datetime-local">
// para que muestre la hora de Argentina correspondiente — sin depender de
// en qué zona horaria esté la máquina de quien lo está editando.
export function isoToArgentinaLocalInput(isoValue: string | Date): string {
  const date = new Date(isoValue);
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: ARGENTINA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

// Hora actual de Argentina, lista para precargar un <input type="datetime-local">.
export function nowAsArgentinaLocalInput(): string {
  return isoToArgentinaLocalInput(new Date());
}
