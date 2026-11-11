import type { Metadata } from "next";
import { SiteLegalPage as LegalPage } from "@/components/legal/site-legal-page";

export const metadata: Metadata = {
  title: "Aviso legal · Voone",
  description: "Información legal y condiciones de uso del sitio web de Voone.",
  alternates: { canonical: "/aviso-legal" },
};

export default function AvisoLegal() {
  return (
    <LegalPage title="Aviso legal" updated="noviembre de 2026">
      <h2>1. Datos identificativos</h2>
      <p>
        Titular: <strong>Voone Digital SL</strong>. NIF: <strong>B05593223</strong>. Domicilio:{" "}
        <strong>Calle Arrianza nº 8, Planta 6, Puerta D, 28008 Madrid</strong>. Correo: <a href="mailto:business@voone.ai">business@voone.ai</a>. Sitio web:{" "}
        <a href="https://voone.ai">voone.ai</a>.
      </p>

      <h2>2. Objeto</h2>
      <p>
        Este aviso regula el acceso y uso del sitio web de Voone. Al navegar por él, aceptas estas
        condiciones. El sitio presenta información sobre el servicio de fidelización de Voone para centros de
        estética.
      </p>

      <h2>3. Propiedad intelectual e industrial</h2>
      <p>
        La marca Voone, los textos, el diseño y el resto de contenidos del sitio son titularidad del Titular o
        de sus licenciantes y están protegidos. No se permite su reproducción o uso sin autorización.
      </p>

      <h2>4. Responsabilidad</h2>
      <p>
        El Titular procura mantener la información actualizada y libre de errores, pero no garantiza la
        disponibilidad continua del sitio ni se responsabiliza de los daños derivados de su uso o de enlaces a
        sitios de terceros.
      </p>

      <h2>5. Legislación aplicable</h2>
      <p>
        Estas condiciones se rigen por la legislación española. Para cualquier controversia, las partes se
        someten a los juzgados y tribunales que correspondan conforme a derecho.
      </p>
    </LegalPage>
  );
}
