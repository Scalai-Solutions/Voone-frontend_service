import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Consentimiento de tratamiento de datos" };

/** What a centre accepts when it is registered. Wording pending legal review. */
export default function DataProcessingPage() {
  return (
    <LegalPage title="Consentimiento de tratamiento de datos del centro" provisional>
      <p>
        Al registrarse, el centro confirma que está autorizado a tratar los datos de sus
        clientes en el programa de fidelización y que informará a cada cliente de ese
        tratamiento antes de emitir su tarjeta.
      </p>
      <p>
        Voone actúa como encargado del tratamiento de esos datos por cuenta del centro, que es el
        responsable.
      </p>
    </LegalPage>
  );
}
