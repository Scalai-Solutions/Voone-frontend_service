import type { Metadata } from "next";
import { SiteLegalPage as LegalPage } from "@/components/legal/site-legal-page";

export const metadata: Metadata = {
  title: "Nosotros · Voone",
  description:
    "Voone nace para que los centros de estética conviertan cada primera visita en una relación duradera, con una tarjeta de fidelización en el móvil de cada cliente.",
  alternates: { canonical: "/nosotros" },
};

export default function Nosotros() {
  return (
    <LegalPage title="Nosotros">
      <p>
        Voone nace de una idea simple: un buen servicio en cabina merece una relación que dure. En los
        centros de estética cuesta mucho ganar un cliente y muy poco perderlo, casi siempre por falta de
        presencia en el momento adecuado, no por falta de calidad.
      </p>
      <h2>Lo que hacemos</h2>
      <p>
        Creamos un club de fidelización que vive en el móvil de cada cliente: una tarjeta con la marca del
        centro en Apple Wallet y Google Wallet, un programa de puntos y niveles, y avisos personalizados que
        llegan cuando cada tratamiento lo pide. Sin apps, sin fricción y sin trabajo añadido para el equipo.
      </p>
      <h2>Para quién</h2>
      <p>
        Para centros de estética y aparatología independientes que quieren que sus clientes vuelvan y sentir
        que su reputación online está a la altura de su trabajo.
      </p>
      <h2>Nuestro compromiso</h2>
      <p>
        La confianza de tus clientes es tuya: solo mostramos tu marca, guardamos lo imprescindible, pedimos
        permiso para cada mensaje y nunca premiamos una reseña. Presencia, nunca insistencia.
      </p>
      <p>
        ¿Hablamos? Escríbenos a <a href="mailto:business@voone.ai">business@voone.ai</a>.
      </p>
    </LegalPage>
  );
}
