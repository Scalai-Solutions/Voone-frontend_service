import type { Metadata } from "next";

import { Bullets, H2, Ph } from "@/components/legal/legal-kit";
import { VOONE_ENTITY } from "@/components/legal/legal-placeholders";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Consentimiento de tratamiento de datos" };

/**
 * What a centre accepts when it is registered (the checkbox in the onboarding wizard links here).
 *
 * Two parts: the centre's own declarations as data controller, and the processing agreement
 * (art. 28 RGPD) with Voone as processor. A draft: Voone's lawyer owns the final wording. Every
 * value still missing is a `<Ph>` listed in legal-placeholders.ts.
 */
export default function DataProcessingPage() {
  return (
    <LegalPage title="Consentimiento y encargo de tratamiento de datos del centro" provisional>
      <p>
        Al marcar la casilla «Consentimiento de tratamiento de datos» en el alta, el centro acepta
        este documento. Tiene dos partes: <strong>A)</strong> las declaraciones y compromisos del
        centro como responsable del tratamiento, y <strong>B)</strong> el contrato de encargo de
        tratamiento (art. 28 del Reglamento (UE) 2016/679, RGPD) con Voone.
      </p>
      <p>
        <strong>Responsable:</strong> el centro, con los datos de razón social, NIF, dirección y
        correo que figuran en su alta. <strong>Encargado:</strong> {VOONE_ENTITY.name}, NIF{" "}
        {VOONE_ENTITY.taxId}, {VOONE_ENTITY.address} («Voone»). Este documento se anexa al contrato
        de servicio: <Ph k="CONTRATO_SERVICIO" />.
      </p>

      <H2>Parte A. Declaraciones y compromisos del centro</H2>
      <p>El centro, como responsable del tratamiento, declara y se compromete a lo siguiente:</p>
      <Bullets>
        <li>
          <strong>Legitimación.</strong> Está autorizado a tratar los datos de sus clientes en el
          programa de fidelización y responde de que esos datos se han obtenido de forma lícita.
        </li>
        <li>
          <strong>Información previa.</strong> Informará a cada cliente del tratamiento (art. 13
          RGPD) antes de emitir su tarjeta. La política de privacidad para clientes que Voone enlaza
          en el formulario de alta es la base de esa información; el centro la completa con sus
          propios datos y fines si los hay.
        </li>
        <li>
          <strong>Comunicaciones comerciales.</strong> Enviará promociones solo a clientes que
          hayan dado su consentimiento expreso (art. 21 LSSI), no condicionará el alta a ese
          consentimiento y atenderá de inmediato cualquier retirada.
        </li>
        <li>
          <strong>Datos de salud.</strong> Registrará descripciones de visitas que revelen
          información sobre la salud solo si cuenta con la base jurídica correspondiente (art. 9
          RGPD): <Ph k="BASE_DATOS_SALUD" />. No incluirá información sobre salud en los textos de
          la tarjeta, de las notificaciones ni de los mensajes.
        </li>
        <li>
          <strong>Menores.</strong> No dará de alta a personas menores de 16 años.
        </li>
        <li>
          <strong>Derechos de los clientes.</strong> Es el punto de contacto de sus clientes para
          el ejercicio de sus derechos y responde a ellos dentro de los plazos legales.
        </li>
        <li>
          <strong>Accesos.</strong> Cada persona de su equipo usará sus propias credenciales, no las
          compartirá y el centro dará de baja sin demora a quien deje de necesitarlas.
        </li>
        <li>
          <strong>Veracidad.</strong> Los datos que el centro o su personal introduzcan serán
          exactos y se mantendrán actualizados.
        </li>
      </Bullets>

      <H2>Parte B. Contrato de encargo de tratamiento</H2>

      <p>
        <strong>1. Objeto y duración.</strong> Voone trata datos personales por cuenta del centro
        únicamente para prestarle la plataforma de fidelización: tarjetas digitales en Apple Wallet
        y Google Wallet, puntos, niveles, recompensas, ventajas, ahorro, recomendaciones y
        notificaciones. Dura lo que dure el contrato de servicio.
      </p>

      <p>
        <strong>2. Datos y personas afectadas.</strong>
      </p>
      <Bullets>
        <li>
          <strong>Clientes del centro con tarjeta:</strong> nombre, teléfono, correo (opcional),
          fecha de nacimiento, sexo (opcional), código, nivel, puntos, recompensas, ahorro,
          recomendaciones, fecha e importe de las visitas, descripción de las visitas, datos técnicos
          de la tarjeta digital y su elección sobre comunicaciones comerciales.
        </li>
        <li>
          <strong>Personal del centro con acceso al panel:</strong> nombre, correo y registros de
          acceso.
        </li>
      </Bullets>
      <p>
        La descripción de las visitas puede revelar información sobre la salud (categoría especial
        de datos, art. 9 RGPD); por eso el centro asume los compromisos de la Parte A sobre ellos.
      </p>

      <p>
        <strong>3. Obligaciones de Voone como encargado.</strong> Voone se compromete a:
      </p>
      <Bullets>
        <li>
          Tratar los datos solo siguiendo las instrucciones documentadas del centro, que son este
          documento y el uso normal de la plataforma, e informarle si considera que una instrucción
          infringe la normativa.
        </li>
        <li>No usar los datos para fines propios ni comunicarlos a terceros salvo lo previsto aquí.</li>
        <li>Garantizar que las personas autorizadas a tratar los datos se han comprometido a la confidencialidad.</li>
        <li>
          Aplicar las medidas de seguridad del art. 32 RGPD descritas en el Anexo:{" "}
          <Ph k="ANEXO_MEDIDAS_SEGURIDAD" />.
        </li>
        <li>
          Ayudar al centro a atender los derechos de los clientes. Si un cliente se dirige a Voone,
          Voone le traslada la petición al centro sin demora y sin responderla por su cuenta.
        </li>
        <li>
          Avisar al centro de cualquier violación de seguridad de los datos sin dilación indebida y
          en un máximo de <Ph k="PLAZO_AVISO_BRECHA" /> desde que tenga conocimiento, con la
          información de que disponga.
        </li>
        <li>
          Ayudar al centro con las evaluaciones de impacto y consultas previas que le correspondan
          (arts. 35 y 36 RGPD).
        </li>
        <li>
          Al terminar el servicio, devolver o suprimir los datos del centro en un máximo de{" "}
          <Ph k="PLAZO_DEVOLUCION_SUPRESION" />, y suprimir las copias salvo que una ley obligue a
          conservarlas.
        </li>
        <li>
          Poner a disposición del centro la información necesaria para demostrar el cumplimiento y
          permitir auditorías con un preaviso de <Ph k="PREAVISO_AUDITORIA" />.
        </li>
      </Bullets>

      <p>
        <strong>4. Subencargados y transferencias.</strong> El centro autoriza de forma general a
        Voone a contratar subencargados, con las mismas obligaciones que este documento le impone.
        A la fecha son:
      </p>
      <Bullets>
        <li>Alojamiento de la aplicación y la base de datos: <Ph k="HOSTING_UBICACION" />.</li>
        <li>Envío de correo electrónico: SendGrid (Twilio).</li>
        <li>Almacenamiento y distribución de imágenes: Bunny.net.</li>
        <li>
          Apple Wallet y Google Wallet, que muestran la tarjeta en el teléfono del cliente. Estos
          servicios se rigen además por sus propias condiciones.
        </li>
      </Bullets>
      <p>
        Voone avisará al centro de cualquier alta o sustitución con <Ph k="PREAVISO_SUBENCARGADOS" />{" "}
        de antelación, y el centro podrá oponerse por motivos justificados. Las transferencias fuera
        del Espacio Económico Europeo se amparan en: <Ph k="TRANSFERENCIAS_INTERNACIONALES" />.
      </p>

      <p>
        <strong>5. Supresión de un cliente.</strong> Cuando el centro da de baja a un cliente, Voone
        borra su tarjeta digital y anonimiza sus datos personales (nombre, teléfono, correo, fecha
        de nacimiento, sexo, código y puntos). Los importes y las descripciones de las visitas se
        conservan sin ningún dato que identifique al cliente, para el registro contable del centro.
      </p>

      <p>
        <strong>6. Ley aplicable y jurisdicción.</strong> Este documento se rige por la legislación
        española. Para cualquier controversia: <Ph k="FUERO" />.
      </p>
    </LegalPage>
  );
}
