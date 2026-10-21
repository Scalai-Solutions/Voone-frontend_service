import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Política de privacidad" };

/** What a client accepts before a pass is issued. Wording pending legal review. */
export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad" provisional>
      <p>
        El centro con el que te registras trata tus datos personales (nombre, teléfono, fecha de
        nacimiento y las visitas que registre) para gestionar tu membresía y su programa de
        fidelización.
      </p>
      <p>
        Solo recibirás comunicaciones comerciales si lo has marcado de forma expresa, y puedes
        retirar ese permiso cuando quieras.
      </p>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y
        portabilidad escribiendo al centro.
      </p>
    </LegalPage>
  );
}
