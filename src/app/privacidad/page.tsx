import type { Metadata } from "next";

import { Bullets, H2, Ph } from "@/components/legal/legal-kit";
import { VOONE_ENTITY } from "@/components/legal/legal-placeholders";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Política de privacidad" };

/**
 * What a client accepts before a pass is issued (linked from the sign-up checkbox).
 *
 * A draft: Voone's lawyer owns the final wording. Every value still missing is a `<Ph>` listed in
 * legal-placeholders.ts. When the final text replaces this one, move `privacyPolicyVersion` so a
 * member's stored version describes the notice they were actually shown.
 */
export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad para clientes" provisional>
      <p>
        Esta política explica cómo se tratan tus datos cuando te registras en el programa de
        fidelización de un centro y recibes su tarjeta en Apple Wallet o Google Wallet.
      </p>

      <H2>1. Quién es el responsable de tus datos</H2>
      <p>
        El responsable es el <strong>centro con el que te registras</strong>, cuyo nombre aparece
        en el formulario de alta y en tu tarjeta. Es quien decide para qué se usan tus datos y a
        quien debes dirigirte para ejercer tus derechos.
      </p>
      <p>
        El centro utiliza la plataforma de <strong>{VOONE_ENTITY.name}</strong> (NIF{" "}
        {VOONE_ENTITY.taxId}, {VOONE_ENTITY.address}), que actúa como{" "}
        <strong>encargado del tratamiento</strong>: trata tus datos solo por cuenta del centro y
        siguiendo sus instrucciones. Para asuntos de privacidad de la plataforma puedes escribir a{" "}
        <Ph k="CONTACTO_PRIVACIDAD" />. Delegado de protección de datos: <Ph k="DPO" />.
      </p>

      <H2>2. Qué datos se tratan</H2>
      <Bullets>
        <li>
          <strong>Identificación y contacto:</strong> nombre, teléfono móvil y, si lo indicas,
          correo electrónico.
        </li>
        <li>
          <strong>Fecha de nacimiento</strong> (solo se admiten personas de 16 años o más) y, si
          quieres, <strong>sexo</strong>. Este último es opcional.
        </li>
        <li>
          <strong>Datos de tu membresía:</strong> código de miembro, nivel, puntos, recompensas,
          ventajas, ahorro acumulado y recomendaciones que hayas hecho o recibido.
        </li>
        <li>
          <strong>Datos de tus visitas:</strong> fecha, importe pagado y la descripción de la visita
          que registre el centro. Esa descripción puede referirse a un tratamiento y, por tanto,{" "}
          <strong>revelar información sobre tu salud</strong>.
        </li>
        <li>
          <strong>Datos técnicos de tu tarjeta digital:</strong> los identificadores necesarios para
          mantenerla actualizada en tu teléfono.
        </li>
        <li>
          <strong>Tus elecciones:</strong> si aceptaste esta política, si quieres recibir
          comunicaciones comerciales, y cuándo y con qué versión de este texto lo hiciste.
        </li>
      </Bullets>

      <H2>3. Para qué y con qué base jurídica</H2>
      <Bullets>
        <li>
          <strong>Gestionar tu membresía y el programa de fidelización</strong> (puntos, niveles,
          recompensas, ventajas): es necesario para darte el servicio que has pedido (art. 6.1.b
          RGPD).
        </li>
        <li>
          <strong>Mantener tu tarjeta al día</strong> y avisarte de movimientos de tu cuenta, como
          puntos recibidos o una recompensa disponible: mismo fundamento.
        </li>
        <li>
          <strong>Comunicaciones comerciales</strong> del centro (promociones, novedades): solo si
          marcas la casilla correspondiente. Tu consentimiento (art. 6.1.a RGPD y art. 21 LSSI) es
          libre y <strong>no es condición para registrarte</strong>.
        </li>
        <li>
          <strong>Datos de salud</strong> que puedan derivarse de la descripción de tus visitas: se
          tratan sobre la base de <Ph k="BASE_DATOS_SALUD" />.
        </li>
        <li>
          <strong>Cumplir obligaciones legales</strong> del centro, por ejemplo las fiscales y
          contables sobre los importes cobrados.
        </li>
      </Bullets>

      <H2>4. Comunicaciones comerciales</H2>
      <p>
        Solo recibirás notificaciones promocionales si lo marcas de forma expresa al registrarte. La
        casilla nunca viene marcada de antemano. Puedes retirar ese permiso cuando quieras, sin que
        afecte al resto del programa, pidiéndolo al centro.
      </p>

      <H2>5. Quién más accede a tus datos</H2>
      <Bullets>
        <li>
          <strong>Voone</strong>, como encargado del tratamiento, y los proveedores que esta
          contrata para prestar la plataforma: alojamiento (<Ph k="HOSTING_UBICACION" />), envío de
          correo electrónico y almacenamiento de imágenes.
        </li>
        <li>
          <strong>Apple y Google</strong>, porque tu tarjeta vive en Apple Wallet o Google Wallet.
          Estos servicios se rigen por sus propias políticas de privacidad.
        </li>
        <li>
          <strong>Autoridades</strong>, cuando una ley lo exija.
        </li>
      </Bullets>
      <p>
        Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo. En ese
        caso se aplican las garantías siguientes: <Ph k="TRANSFERENCIAS_INTERNACIONALES" />.
      </p>
      <p>No vendemos tus datos ni los cedemos a otros centros.</p>

      <H2>6. Cuánto tiempo se conservan</H2>
      <p>
        Mientras seas miembro del programa y, después de tu última visita, durante{" "}
        <Ph k="PLAZO_CONSERVACION_CLIENTE" />. Si pides la supresión, tus datos personales se
        anonimizan: se borran tu nombre, teléfono, correo, fecha de nacimiento, sexo y tu tarjeta
        digital. Los importes y las descripciones de las visitas se conservan sin ningún dato que
        te identifique, porque el centro debe mantener su registro contable durante los plazos
        legales.
      </p>

      <H2>7. Tus derechos</H2>
      <p>
        Puedes ejercer tus derechos de <strong>acceso, rectificación, supresión, oposición,
        limitación del tratamiento y portabilidad</strong>, y retirar tu consentimiento, escribiendo
        al centro. Si lo prefieres, también puedes escribir a <Ph k="CONTACTO_PRIVACIDAD" />, y
        trasladaremos tu petición al centro.
      </p>
      <p>
        Si crees que tus datos no se tratan correctamente, puedes presentar una reclamación ante la
        Agencia Española de Protección de Datos (www.aepd.es).
      </p>
    </LegalPage>
  );
}
