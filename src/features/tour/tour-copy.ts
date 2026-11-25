/**
 * Every word the clinic tutorial shows, kept apart from the step structure (tour-chapters.ts) so
 * copy can change without touching the flow. The app is Spanish-only, like the rest of the UI.
 */

export interface TourStepCopy {
  title: string;
  body: string;
  /** A small aside under the body, e.g. why the camera is off. */
  note?: string;
  /** The aside's icon: a crossed-out camera for the scan page, an info sign otherwise. */
  noteIcon?: "camera";
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
  "home.qr": {
    title: "Tu QR de alta",
    body: "En «Ver QR» tienes siempre a mano el código con el que tus clientes se unen a tu club.",
  },
  "home.code": {
    title: "Que lo escaneen desde la pantalla",
    body: "El cliente apunta la cámara de su móvil a este código y se da de alta en segundos. Con «Descargar PDF» lo imprimes para tenerlo en recepción.",
  },
  "home.share": {
    title: "Compártelo por WhatsApp o redes",
    body: "«Copiar enlace» copia la dirección de alta. Pégala en WhatsApp, Instagram o un email: funciona igual que el QR.",
  },
  "home.club": {
    title: "Las ventajas del club",
    body: "Esta página enseña a tus clientes sus niveles, sus premios y lo que ganan al recomendarte. Compártela igual que la de alta. Tú ves las ventajas de cada nivel en Mi centro → Niveles.",
  },
  "home.referral": {
    title: "¿Le ha recomendado alguien?",
    body: "Al darse de alta, el cliente escribe el código de quien le recomendó en «Código de recomendación». Es opcional: si nadie le recomendó, lo deja vacío.",
  },
  "home.consent": {
    title: "Recibir comunicaciones es opcional",
    body: "Aceptar la política de privacidad es obligatorio; la casilla de notificaciones promocionales, no. Se puede unir al club sin marcarla.",
    note: "Tus mensajes a un segmento, o que llevan su nombre, solo llegan a quienes marcaron esta casilla.",
  },
  "welcome.help": {
    title: "Siempre a mano",
    body: "Desde aquí puedes volver a este tutorial cuando quieras.",
  },
  "scan.camera": {
    title: "Escanea la tarjeta del cliente",
    body: "Pide al cliente que muestre su tarjeta en el móvil y alinea el QR dentro de este marco. Voone encuentra al miembro solo.",
    note: "Durante el tutorial la cámara está apagada. Al salir, el navegador te pedirá permiso para usarla.",
    noteIcon: "camera",
  },
  "scan.search": {
    title: "¿No lleva la tarjeta?",
    body: "Busca al cliente por nombre, móvil o email y elígelo de la lista.",
  },
  "scan.lines": {
    title: "Después de elegir al miembro…",
    body: "Elige del catálogo lo que ha pagado. El importe se rellena solo y puedes cambiarlo si le haces un precio especial. Con «+ Añadir otro importe» sumas otro tratamiento o producto.",
  },
  "scan.extras": {
    title: "Descuentos y puntos extra",
    body: "En un producto de cosmética con descuento de nivel, marca «Con descuento de nivel» y escribe su precio de lista. En «Puntos extra» regalas puntos (de 10 en 10), o multiplica los de la visita de x2 a x10.",
  },
  "scan.bono": {
    title: "Sesiones de bono",
    body: "Si viene a una sesión de su bono, cambia a «Sesión de bono» y elige su bono: no se registra como un pago nuevo. Verás qué sesión es y cuántas le quedan.",
    note: "La sesión suma los puntos de su parte del precio del bono. Los puntos dobles pendientes se guardan para su próximo pago.",
  },
  "scan.rewards": {
    title: "Canjea sus premios",
    body: "Debajo aparecen los premios que tiene disponibles: elige uno y pulsa «Canjear». Los puntos dobles se aplican solos en la siguiente visita. Para terminar, «Registrar visita».",
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
  "members.card": {
    title: "¿Ha perdido su tarjeta?",
    body: "Abre su ficha (pulsa en su nombre) y, en «¿Ha perdido la tarjeta?», pulsa «Volver a añadir la tarjeta a Wallet». Aparecerá un QR: el cliente lo escanea y pulsa «Añadir a Wallet».",
    note: "Si la tarjeta de Apple no se actualiza, que la borre del iPhone antes de añadirla de nuevo.",
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
  "engage.personalise": {
    title: "Hazlo personal",
    body: "«Insertar nombre del cliente» pone el nombre de cada persona en el mensaje. «Insertar enlace» añade una dirección que empiece por https://, por ejemplo la de tus reservas.",
  },
  "engage.sendSetup": {
    title: "A quién y cuándo",
    body: "En «Configurar envío» eliges el segmento (todos, quienes tienen un bono activo o una de tus audiencias) y si se envía ahora o en la fecha y hora que programes.",
    note: "Los envíos a un segmento solo llegan a quienes aceptaron recibir comunicaciones.",
  },
  "engage.stats": {
    title: "De un vistazo",
    body: "Cuántos mensajes has enviado este mes y cuántas automatizaciones tienes activas.",
  },
  "engage.automations": {
    title: "Mensajes automáticos",
    body: "Se envían solos: cumpleaños, bonos sin usar, reseñas, referidos y subidas de nivel. En cada uno puedes cambiar el título y el texto, y en algunos también cuándo se envía: tras cuántos días sin usar el bono o a partir de qué visita pedir la reseña.",
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
  "inspire.navidad": {
    title: "Navidad: una fiesta, dos mensajes",
    body: "La misma fecha sirve para premiar a tus clientes fieles y para recuperar a quienes hace tiempo que no vienen.",
    note: "Crea cada segmento en Miembros → Audiencias. Luego pega el texto en «Mandar nueva comunicación» y ponle un título corto.",
  },
  "inspire.mujer": {
    title: "Día de la Mujer: personaliza tu mensaje",
    body: "Adapta el contenido a cada público en lugar de enviar el mismo mensaje a todos.",
  },
  "inspire.ultimaHora": {
    title: "Una cancelación de última hora",
    body: "Llena un hueco libre premiando a tus clientes VIP, sin ofrecer descuentos a todos tus clientes.",
  },
  "inspire.novedades": {
    title: "Novedades para perfiles concretos",
    body: "Presenta un tratamiento nuevo o invita a un evento solo a quien va dirigido, sin saturar al resto de tus clientes.",
  },
  "inspire.blackFriday": {
    title: "Black Friday: un incentivo para cada cliente",
    body: "Anima a volver a quien lleva tiempo sin venir y ofrece productos y experiencias complementarias a quien ya tiene un bono.",
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
  home: { title: "Inicio y altas", description: "Tu QR de alta, el enlace para compartir y las ventajas del club." },
  scan: { title: "Escanear y sumar puntos", description: "Registra una visita con el QR o buscando al cliente." },
  members: { title: "Tus miembros", description: "Busca, filtra y exporta a tus clientes, y crea audiencias." },
  center: { title: "Mi centro", description: "Tratamientos, recompensas, niveles y cómo pedir cambios." },
  engage: { title: "Comunicaciones", description: "Mensajes manuales y automáticos para tus clientes." },
  insights: { title: "Métricas y ajustes", description: "Cómo va tu club y cómo gestionar tu equipo." },
  inspire: { title: "Inspírate", description: "Ideas de campañas con segmentos y mensajes listos para usar." },
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
  copyMessage: "Copiar",
  copiedMessage: "Copiado",
  copyMessageLabel: (audience: string) => `Copiar el mensaje para ${audience}`,
  segment: "Segmento",
  oneSegmentEach: "Un segmento por nivel: envía el mensaje a cada uno.",
  tierNamesNote: "Los nombres de los niveles pueden ser otros en tu centro.",
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
