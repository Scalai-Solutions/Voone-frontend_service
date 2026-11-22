/**
 * Turns a rendered QR code (the SVG from components/shared/qr-code.tsx) into the A4 sheet a
 * clinic prints for reception. Browser-only: it uses the DOM, a canvas and a lazy jsPDF import.
 */

export type QrTarget = "signup" | "club";

/** What each code is for: the wording on screen, the printed sheet and the file name. */
export const QR_TARGETS: Record<
  QrTarget,
  { tab: string; eyebrow: string; title: string; hint: string; sheetTitle: string; sheetHint: string; file: string }
> = {
  signup: {
    tab: "Alta de clientes",
    eyebrow: "Alta de clientes",
    title: "Código QR de alta",
    hint: "Imprímelo y colócalo en recepción. Al escanearlo, el cliente se da de alta en segundos.",
    sheetTitle: "Código QR de alta",
    sheetHint: "Escanea este código para registrarte y añadir tu pase Wallet.",
    file: "qr-alta-clientes.pdf",
  },
  club: {
    tab: "Ventajas del club",
    eyebrow: "Página del club",
    title: "Código QR de ventajas",
    hint: "Para folletos y recepción. Al escanearlo, el cliente ve sus niveles, premios y recomendaciones.",
    sheetTitle: "Descubre tus ventajas",
    sheetHint: "Escanea este código para ver tus niveles, tus premios y todo lo que ganas al recomendarnos.",
    file: "qr-ventajas-club.pdf",
  },
};

const qrPng = async (svg: SVGSVGElement): Promise<string> => {
  const source = new XMLSerializer().serializeToString(svg);
  const svgUrl = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = svgUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 720;
    const context = canvas.getContext("2d");

    if (!context) throw new Error("El lienzo no está disponible");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
};

/** Saves the printable A4 sheet for `target`, with the QR found inside `container`. */
export const downloadQrPdf = async (container: HTMLElement | null, target: QrTarget, url: string): Promise<void> => {
  const svg = container?.querySelector("svg");

  if (!svg) return;

  const text = QR_TARGETS[target];
  const [{ jsPDF }, qrImage] = await Promise.all([import("jspdf"), qrPng(svg)]);
  const pdf = new jsPDF({ unit: "mm", format: "a4" });

  pdf.setFillColor("#fffaf6");
  pdf.rect(0, 0, 210, 297, "F");
  pdf.setTextColor("#2e2421");
  pdf.setFont("times", "bold");
  pdf.setFontSize(26);
  pdf.text(text.sheetTitle, 105, 32, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text(text.sheetHint, 105, 43, { align: "center", maxWidth: 170 });
  pdf.addImage(qrImage, "PNG", 45, 58, 120, 120);
  pdf.setFontSize(9);
  const wrappedUrl = pdf.splitTextToSize(url, 160) as string[];
  pdf.text(wrappedUrl, 105, 192, { align: "center" });
  pdf.setDrawColor("#d6a979");
  pdf.line(35, 220, 175, 220);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Voone Wallet", 105, 233, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("Coloca este PDF en recepción para que los clientes se den de alta en segundos.", 105, 244, { align: "center" });
  pdf.save(text.file);
};
