import type { Metadata } from "next";
import { SiteLegalPage as LegalPage } from "@/components/legal/site-legal-page";

export const metadata: Metadata = {
  title: "Política de privacidad · Voone",
  description: "Cómo Voone trata los datos personales conforme al RGPD y la LOPDGDD.",
  alternates: { canonical: "/privacidad-web" },
};

export default function PrivacidadWeb() {
  return (
    <LegalPage title="Política de privacidad" updated="noviembre de 2026">
      <p>
        Esta política explica cómo tratamos los datos personales de quienes usan este sitio y los servicios
        de Voone, conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        <strong>Voone Digital SL</strong>, con NIF <strong>B05593223</strong> y domicilio en{" "}
        <strong>Calle Arrianza nº 8, Planta 6, Puerta D, 28008 Madrid</strong>. Contacto: <a href="mailto:business@voone.ai">business@voone.ai</a>.
      </p>

      <h2>2. Datos que tratamos</h2>
      <ul>
        <li>Datos de contacto que nos facilitas al solicitar una demostración (nombre, email, teléfono, centro).</li>
        <li>Datos de navegación y uso del sitio (de forma agregada y, cuando aplica, mediante cookies).</li>
      </ul>

      <h2>3. Finalidad y legitimación</h2>
      <ul>
        <li>Atender tu solicitud de demostración o información: ejecución de medidas precontractuales.</li>
        <li>Enviarte comunicaciones sobre el servicio: tu consentimiento, que puedes retirar cuando quieras.</li>
        <li>Mejorar y mantener el sitio: interés legítimo.</li>
      </ul>

      <h2>4. Conservación</h2>
      <p>
        Conservamos los datos mientras dure la relación y, después, durante los plazos legales aplicables.
        Cuando dejan de ser necesarios, se suprimen de forma segura.
      </p>

      <h2>5. Destinatarios</h2>
      <p>
        No cedemos tus datos a terceros salvo obligación legal. Podemos usar proveedores que los tratan por
        cuenta nuestra (por ejemplo, alojamiento o agenda de citas) con las garantías exigidas por el RGPD.
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad
        escribiendo a <a href="mailto:business@voone.ai">business@voone.ai</a>. También puedes reclamar ante la Agencia
        Española de Protección de Datos (aepd.es).
      </p>
    </LegalPage>
  );
}
