"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Send, X } from "lucide-react";

import { Field } from "@/components/ui/field";
import { useCreateChangeRequest } from "@/features/change-requests/api/useChangeRequests";
import { ApiError, type TreatmentCategory } from "@/lib/api-client";
import {
  buildChangeRequest,
  initialValues,
  type FormErrors,
  type FormValues,
  type RequestContext,
} from "@/lib/change-request-form";
import {
  REASON_MAX,
  SHORT_TEXT_MAX,
  TITLE_MAX,
} from "@/lib/change-requests";
import { formatEuros } from "@/lib/euros";
import { cn } from "@/lib/utils";

const inputClass =
  "h-11 w-full rounded-xl border border-[#ded1c8] bg-white px-3 text-sm outline-none focus:border-[#b8864b] disabled:opacity-60";
const textareaClass =
  "min-h-24 w-full rounded-xl border border-[#ded1c8] bg-white px-3 py-2 text-sm outline-none focus:border-[#b8864b] disabled:opacity-60";

const quoted = (text: string) => `«${text}»`;

const headingFor = (context: RequestContext): string => {
  switch (context.kind) {
    case "service-edit":
      return `Solicitar un cambio en ${quoted(context.treatment.name)}`;
    case "service-add":
      return "Solicitar un nuevo servicio";
    case "service-remove":
      return `Solicitar la baja de ${quoted(context.treatment.name)}`;
    case "bono-add":
      return "Solicitar un nuevo bono";
    case "bono-edit":
      return `Solicitar un cambio en el bono ${quoted(context.plan.name)}`;
    case "bono-remove":
      return `Solicitar la baja del bono ${quoted(context.plan.name)}`;
    case "reward":
      return context.label
        ? `Solicitar un cambio en ${quoted(context.label)}`
        : "Solicitar un cambio en las recompensas";
    case "level":
      return context.label
        ? `Solicitar un cambio en el nivel ${quoted(context.label)}`
        : "Solicitar un cambio en los niveles";
    case "other":
      return "Solicitar otro cambio";
  }
};

/** What the server said, when it said something worth showing; otherwise a generic line. */
export function submitErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // 409 carries the cap on open requests; 400 and 422 are Spanish validation copy.
    if ([400, 409, 422].includes(error.status) && error.detail) return error.detail;
    if (error.status === 403) {
      return error.detail ?? "No tienes permiso para solicitar cambios.";
    }
  }

  return "No se pudo enviar la solicitud. Inténtalo de nuevo.";
}

/** The current values the request is about, so the person sees what she is asking to change. */
function CurrentValues({ context }: { context: RequestContext }) {
  let lines: Array<[label: string, value: string]> = [];

  if (context.kind === "service-edit" || context.kind === "service-remove") {
    const { treatment } = context;

    lines = [
      ["Nombre", treatment.name],
      [
        "Precio",
        typeof treatment.priceEuro === "number"
          ? formatEuros(treatment.priceEuro)
          : "sin precio",
      ],
    ];
  } else if (context.kind === "bono-edit" || context.kind === "bono-remove") {
    const { plan } = context;

    lines = [
      ["Nombre", plan.name],
      ["Precio del bono", formatEuros(plan.totalEuro)],
      ["Sesiones", String(plan.totalSessions)],
    ];
  } else if (
    (context.kind === "reward" || context.kind === "level") &&
    context.label
  ) {
    lines = [[context.kind === "reward" ? "Recompensa" : "Nivel", context.label]];

    if (context.detail) lines.push(["Ahora", context.detail]);
  }

  if (lines.length === 0) return null;

  return (
    <dl className="mt-3 grid gap-1 rounded-2xl bg-white/70 px-4 py-3 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
      {lines.map(([label, value]) => (
        <React.Fragment key={label}>
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#b7874a]">
            {label}
          </dt>
          <dd className="break-words font-medium">{value}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

/**
 * An inline panel for asking Voone to change something the centre no longer edits itself:
 * services, bonos, rewards and levels. It renders where the parent puts it (under a row, or at
 * the top of a list), opens with the request's own context, validates with the backend's
 * limits, and ends in "Solicitud enviada" with a link to Mis solicitudes. No browser dialogs.
 */
export function ChangeRequestPanel({
  context,
  categories = [],
  categoriesFailed = false,
  onClose,
  className,
}: {
  context: RequestContext;
  /** Treatment categories, for a service request on a centre that prices from the catalogue. */
  categories?: TreatmentCategory[];
  categoriesFailed?: boolean;
  onClose: () => void;
  className?: string;
}) {
  const create = useCreateChangeRequest();
  const [values, setValues] = React.useState<FormValues>(() => initialValues(context));
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const pending = create.isPending;

  React.useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  };

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending) return;

    const built = buildChangeRequest(context, values);

    if (!built.ok) {
      setErrors(built.errors);

      return;
    }

    setErrors({});
    setServerError(null);
    create.mutate(built.body, {
      onSuccess: () => setSent(true),
      onError: (failure) => setServerError(submitErrorMessage(failure)),
    });
  }

  const usesCatalogue =
    (context.kind === "service-edit" || context.kind === "service-add") &&
    context.usesCatalogue;
  const isRemoval =
    context.kind === "service-remove" || context.kind === "bono-remove";
  const showName =
    context.kind === "service-edit" ||
    context.kind === "service-add" ||
    context.kind === "bono-add" ||
    context.kind === "bono-edit";
  const showPrice = showName;
  const showSessions = context.kind === "bono-add" || context.kind === "bono-edit";
  const isBono = context.kind === "bono-add" || context.kind === "bono-edit";
  const isEdit = context.kind === "service-edit" || context.kind === "bono-edit";
  const showText = context.kind === "reward" || context.kind === "level";
  const idPrefix = React.useId();
  const removalLabel =
    context.kind === "service-remove"
      ? `Quiero solicitar la baja de ${quoted(context.treatment.name)}.`
      : context.kind === "bono-remove"
        ? `Quiero solicitar la baja del bono ${quoted(context.plan.name)}.`
        : "";

  if (sent) {
    return (
      <section
        role="status"
        className={cn("bg-[#fffaf6] p-5", className)}
      >
        <p className="flex items-center gap-2 font-serif text-xl font-semibold">
          <CheckCircle2 size={20} className="text-[#4f8a5b]" aria-hidden="true" />
          Solicitud enviada
        </p>
        <p className="mt-2 max-w-xl text-sm text-[#927e72]">
          Voone la revisará y te responderá por email y en Mis solicitudes. Hasta
          entonces, nada cambia en tu centro.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/requests"
            className="rounded-full bg-[#2d211e] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Ver mis solicitudes
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#cdb9aa] px-5 py-2.5 text-sm font-semibold text-[#754b36]"
          >
            Cerrar
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={`${idPrefix}-heading`}
      className={cn("bg-[#fffaf6] p-5", className)}
    >
      <h3
        id={`${idPrefix}-heading`}
        ref={headingRef}
        tabIndex={-1}
        className="font-serif text-xl font-semibold outline-none"
      >
        {headingFor(context)}
      </h3>
      <p className="mt-1 max-w-xl text-sm text-[#927e72]">
        Voone revisará tu solicitud y te responderá. No se cambia nada hasta que
        Voone lo aplique.
      </p>
      <CurrentValues context={context} />

      <form onSubmit={submit} noValidate className="mt-4">
        <fieldset disabled={pending} className="grid gap-3 md:grid-cols-2">
          {context.kind === "other" ? (
            <Field label="Título" error={errors.title} className="md:col-span-2">
              <input
                value={values.title}
                maxLength={TITLE_MAX}
                onChange={(event) => set("title", event.target.value)}
                placeholder="¿Qué quieres cambiar?"
                className={inputClass}
              />
            </Field>
          ) : null}

          {showName ? (
            <Field
              label={isBono ? "Nombre del bono" : "Nombre"}
              error={errors.name}
              className={isBono ? "md:col-span-2" : undefined}
            >
              <input
                value={values.name}
                maxLength={120}
                onChange={(event) => set("name", event.target.value)}
                placeholder={isBono ? "Bono facial" : "Hydrafacial"}
                className={inputClass}
              />
            </Field>
          ) : null}

          {showPrice ? (
            <Field
              label={isBono ? "Precio del bono (€)" : "Precio (€)"}
              error={errors.price}
              hint={isEdit ? "Déjalo como está si no cambia." : undefined}
            >
              <input
                inputMode="decimal"
                value={values.price}
                onChange={(event) => set("price", event.target.value)}
                placeholder={isBono ? "199,50" : "60,00"}
                className={inputClass}
              />
            </Field>
          ) : null}

          {showSessions ? (
            <Field label="Sesiones" error={errors.sessions}>
              <input
                inputMode="numeric"
                value={values.sessions}
                onChange={(event) => set("sessions", event.target.value)}
                placeholder="5"
                className={inputClass}
              />
            </Field>
          ) : null}

          {usesCatalogue ? (
            <Field
              label="Categoría"
              error={
                errors.categoryId ??
                (categoriesFailed
                  ? "No se pudieron cargar las categorías."
                  : undefined)
              }
            >
              <select
                value={values.categoryId}
                onChange={(event) => set("categoryId", event.target.value)}
                className={inputClass}
              >
                <option value="">Elige una categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          {showText ? (
            <Field
              label="Qué quieres que sea (opcional)"
              error={errors.text}
              hint={`Hasta ${SHORT_TEXT_MAX} caracteres. Puedes explicarlo con más detalle abajo.`}
              className="md:col-span-2"
            >
              <input
                value={values.text}
                onChange={(event) => set("text", event.target.value)}
                placeholder={
                  context.kind === "reward"
                    ? "Por ejemplo: un masaje relajante"
                    : "Por ejemplo: un 10 % de descuento fijo"
                }
                className={inputClass}
              />
            </Field>
          ) : null}

          {isRemoval ? (
            <div className="md:col-span-2">
              <label className="flex items-start gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={values.confirm}
                  onChange={(event) => set("confirm", event.target.checked)}
                  className="mt-0.5 h-4 w-4"
                />
                <span>
                  {removalLabel}
                </span>
              </label>
              {errors.confirm ? (
                <p role="alert" className="mt-1 text-sm text-destructive">
                  {errors.confirm}
                </p>
              ) : null}
            </div>
          ) : null}

          <Field
            label="Motivo"
            error={errors.reason}
            hint={`${values.reason.trim().length}/${REASON_MAX}`}
            className="md:col-span-2"
          >
            <textarea
              value={values.reason}
              onChange={(event) => set("reason", event.target.value)}
              maxLength={REASON_MAX + 200}
              rows={4}
              placeholder="Cuéntanos por qué quieres este cambio."
              className={textareaClass}
            />
          </Field>
        </fieldset>

        {errors.form ? (
          <p role="alert" className="mt-3 text-sm font-semibold text-[#b94135]">
            {errors.form}
          </p>
        ) : null}
        {serverError ? (
          <p role="alert" className="mt-3 text-sm font-semibold text-[#b94135]">
            {serverError}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center rounded-xl bg-[#2d211e] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Send size={15} className="mr-2" aria-hidden="true" />
            {pending ? "Enviando..." : "Enviar solicitud"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="inline-flex h-11 items-center rounded-xl border border-[#cdb9aa] px-3 text-sm font-semibold text-[#754b36] disabled:opacity-60"
          >
            <X size={15} className="mr-1" aria-hidden="true" />
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}
