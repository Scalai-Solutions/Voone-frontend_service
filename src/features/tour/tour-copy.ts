/**
 * Every word the clinic tutorial shows, kept apart from the step structure (tour-chapters.ts) so
 * copy can change without touching the flow. The app is Spanish-only, like the rest of the UI.
 */

export interface TourStepCopy {
  title: string;
  body: string;
  /** A small aside under the body, e.g. why the camera is off. */
  note?: string;
}

export const TOUR_STEP_COPY = {
  "welcome.intro": {
    title: "Te damos la bienvenida a Voone",
    body: "En unos segundos verás dónde está cada cosa de tu panel. Puedes salir cuando quieras con Esc.",
  },
  "welcome.nav": {
    title: "Tu menú principal",
    body: "Todo tu día a día está a un clic.",
  },
  "welcome.help": {
    title: "Siempre a mano",
    body: "Desde aquí puedes volver a este tutorial cuando quieras.",
  },
  "scan.camera": {
    title: "Escanea la tarjeta del cliente",
    body: "Pide al cliente que muestre su tarjeta en el móvil y alinea el QR dentro de este marco. Voone encuentra al miembro solo.",
    note: "Durante el tutorial la cámara está apagada. Al salir, el navegador te pedirá permiso para usarla.",
  },
  "scan.search": {
    title: "¿No lleva la tarjeta?",
    body: "Busca al cliente por nombre, móvil o email y elígelo de la lista.",
  },
  "scan.visit": {
    title: "Después de elegir al miembro…",
    body: "Marca lo que se ha hecho en la visita y confirma. Los puntos se suman a su tarjeta.",
  },
  "members.toolbar": {
    title: "Encuentra a cualquier cliente",
    body: "Busca por nombre, ID, teléfono o email, y usa «Filtros» para ver solo un nivel.",
  },
  "members.export": {
    title: "Exporta tu lista",
    body: "Descarga en CSV todos los miembros que coinciden con tu búsqueda y tu filtro. Se activa en cuanto tengas miembros.",
  },
  "members.list": {
    title: "Tu lista de miembros",
    body: "Cada fila es una persona con su nivel, sus puntos y su última visita. Haz clic en ella para ver su historial.",
  },
  "members.list.empty": {
    title: "Aquí aparecerán tus miembros",
    body: "Cuando alguien se dé de alta en tu club, aparecerá en esta lista. Con «Añadir persona» le enseñas el QR de alta.",
  },
  "members.audiences": {
    title: "Audiencias",
    body: "Agrupa a tus clientes por nivel, edad, actividad o bono para enviarles comunicaciones a medida.",
  },
  "center.tabs": {
    title: "Toda tu configuración",
    body: "Tratamientos, recompensas, niveles y referidos, cada uno en su pestaña.",
  },
  "center.addTreatment": {
    title: "Añade tratamientos",
    body: "Crea servicios, productos y bonos. El cambio se aplica al momento y queda registrado en Mis solicitudes.",
  },
  "center.requestChange": {
    title: "¿Quieres cambiar tu programa?",
    body: "Recompensas, niveles y referidos se cambian con una solicitud: la envías desde aquí y el equipo de Voone la revisa.",
  },
  "center.requests": {
    title: "Sigue tus solicitudes",
    body: "Aquí ves el estado de cada cambio que pidas y puedes hablar con el equipo de Voone.",
  },
  "engage.compose": {
    title: "Envía un mensaje",
    body: "Escribe una comunicación, elige a quién va dirigida y mándala ahora o prográmala.",
  },
  "engage.stats": {
    title: "De un vistazo",
    body: "Cuántos mensajes has enviado este mes y cuántas automatizaciones tienes activas.",
  },
  "engage.automations": {
    title: "Mensajes automáticos",
    body: "Se envían solos: por ejemplo, cuando un cliente consigue un premio. Aquí eliges cuáles están activos.",
  },
  "insights.cards": {
    title: "Tus números clave",
    body: "Miembros, niveles, dinero gastado y canjes del mes. Si acabas de empezar verás ceros: se llenan con cada visita.",
  },
  "insights.breakdown": {
    title: "Conoce a tu club",
    body: "Cómo se reparten tus miembros por edad y nivel, y quiénes son tus mejores clientes del mes y de siempre.",
  },
  "insights.team": {
    title: "Tu equipo",
    body: "Da acceso a las personas de tu centro y decide qué puede hacer cada una.",
  },
  "insights.notifications": {
    title: "El interruptor de marketing",
    body: "Activa o pausa a la vez todos tus envíos: mensajes manuales, segmentos y automatizaciones.",
  },
} as const satisfies Record<string, TourStepCopy>;

export type TourCopyKey = keyof typeof TOUR_STEP_COPY;

/** One line per stop of a sweep; the label is what the spotlight is on. */
export const TOUR_STOP_COPY = {
  "nav.templates": { label: "Mi centro", body: "Tus tratamientos, recompensas, niveles y la tarjeta." },
  "nav.members": { label: "Miembros", body: "Todos tus clientes, sus puntos y su historial." },
  "nav.scan": { label: "Escanear", body: "Registra visitas y suma puntos en segundos." },
  "nav.engage": { label: "Comunicaciones", body: "Mensajes que llegan a la tarjeta de tus clientes." },
} as const satisfies Record<string, { label: string; body: string }>;

export type TourStopCopyKey = keyof typeof TOUR_STOP_COPY;

export const TOUR_CHAPTER_COPY = {
  welcome: { title: "Bienvenida", description: "Un paseo rápido por tu panel y su menú." },
  scan: { title: "Escanear y sumar puntos", description: "Registra una visita con el QR o buscando al cliente." },
  members: { title: "Tus miembros", description: "Busca, filtra y exporta a tus clientes, y crea audiencias." },
  center: { title: "Mi centro", description: "Tratamientos, recompensas, niveles y cómo pedir cambios." },
  engage: { title: "Comunicaciones", description: "Mensajes manuales y automáticos para tus clientes." },
  insights: { title: "Métricas y ajustes", description: "Cómo va tu club y cómo gestionar tu equipo." },
} as const satisfies Record<string, { title: string; description: string }>;

export const TOUR_UI = {
  menuItem: "Tutorial",
  openTutorial: "Abrir tutorial",
  next: "Siguiente",
  back: "Atrás",
  exit: "Salir del tutorial",
  finish: "Terminar",
  nextChapter: "Siguiente capítulo",
  tryIt: "Pruébalo ahora",
  tryItHere: "Pruébalo aquí",
  loading: "Cargando…",
  stepOf: (step: number, total: number) => `${step} de ${total}`,
  paused: "Tutorial en pausa",
  resume: "Continuar",
  leave: "Salir",
  hubEyebrow: "Tutorial",
  hubTitle: "Aprende Voone a tu ritmo",
  hubTitleDone: "¡Ya dominas lo esencial!",
  hubIntro: "Capítulos cortos sobre tu panel real.",
  completedCount: (done: number, total: number) => `${done} de ${total} completados`,
  completed: "Completado",
  recommended: "Recomendado",
  comingSoon: "Próximamente",
  optionalTitle: "Opcional",
  optionalIntro: (duration: string) => `Para cuando quieras profundizar · ${duration} en total`,
  replay: "Repetir",
  start: "Empezar",
  resetProgress: "Reiniciar progreso",
  close: "Cerrar",
  offerTitle: "¿Te enseñamos el panel?",
  offerBody: (seconds: string) => `Empieza por un capítulo de ${seconds}. Puedes salir cuando quieras.`,
  offerLater: "Ahora no",
} as const;

/** "≈ 25 s" or "≈ 2 min", for the hub cards. */
export function formatChapterDuration(seconds: number): string {
  if (seconds < 60) return `≈ ${seconds} s`;

  return `≈ ${Math.round(seconds / 60)} min`;
}

/** The whole tutorial's length, for the hub header. */
export function formatTotalDuration(seconds: number): string {
  if (seconds < 60) return "Menos de 1 minuto en total.";

  const minutes = Math.round(seconds / 60);

  return minutes === 1 ? "Alrededor de 1 minuto en total." : `Unos ${minutes} minutos en total.`;
}

/** "25 segundos" or "2 minutos", for running text. */
export function formatDurationWords(seconds: number): string {
  if (seconds < 60) return `${seconds} segundos`;

  const minutes = Math.round(seconds / 60);

  return minutes === 1 ? "1 minuto" : `${minutes} minutos`;
}
