"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Save, Send, Trash2, X } from "lucide-react";

import { catalogPickerItems } from "@/components/admin/program/picker-items";
import { ChangeFlagMarks, ChangeFlagSignal } from "@/components/dashboard/change-flag";
import { Field } from "@/components/ui/field";
import { SearchPicker } from "@/components/ui/search-picker";
import { useChangeFlag } from "@/features/change-requests/api/useChangeFlag";
import { useCreateChangeRequest } from "@/features/change-requests/api/useChangeRequests";
import { useStaffCatalog } from "@/features/program/api/useStaffProgram";
import type { ChangeRequest } from "@/lib/staff-change-requests-api";
import { ApiError, type TreatmentCategory } from "@/lib/api-client";
import {
  buildChangeRequest,
  buildFlagRequest,
  categoryChoices,
  initialValues,
  isDirectChange,
  isUnpricedReward,
  withRewardMode,
  type FormErrors,
  type FormValues,
  type RewardMode,
  type RequestContext,
} from "@/lib/change-request-form";
import {
  REASON_MAX,
  SHORT_TEXT_MAX,
  TITLE_MAX,
} from "@/lib/staff-change-requests";
import { formatEuros } from "@/lib/euros";
import { cn } from "@/lib/utils";

const inputClass =
  "h-11 w-full rounded-xl border border-[#ded1c8] bg-white px-3 text-sm outline-none focus:border-[#b8864b] disabled:opacity-60";
const textareaClass =
  "min-h-24 w-full rounded-xl border border-[#ded1c8] bg-white px-3 py-2 text-sm outline-none focus:border-[#b8864b] disabled:opacity-60";

const quoted = (text: string) => `«${text}»`;

const headingFor = (context: RequestContext): string => {
  switch (context.kind) {
    // Treatments and bonos the centre changes itself: the change is applied when it is saved.
    case "service-edit":
      return `Editar ${quoted(context.treatment.name)}`;
    case "service-add":
      return "Añadir un tratamiento";
    case "service-remove":
      return `Eliminar ${quoted(context.treatment.name)}`;
    case "bono-add":
      return "Añadir un bono";
    case "bono-edit":
      return `Editar el bono ${quoted(context.plan.name)}`;
    case "bono-remove":
      return `Eliminar el bono ${quoted(context.plan.name)}`;
    case "reward":
      return context.label
        ? `Solicitar un cambio en ${quoted(context.label)}`
        : "Solicitar un cambio en las recompensas";
    case "level":
      return context.label
        ? `Solicitar un cambio en el nivel ${quoted(context.label)}`
        : "Solicitar un cambio en los niveles";
    case "other":
      return context.label
        ? `Solicitar un cambio en ${quoted(context.label)}`
        : "Solicitar otro cambio";
  }
};

/** What the server said, when it said something worth showing; otherwise a generic line. */
export function submitErrorMessage(error: unknown, direct = false): string {
  if (error instanceof ApiError) {
    // 409 carries the cap on open requests; 400 and 422 are Spanish validation copy, and a direct
    // change that the catalogue refuses (404: it is already gone) says so in its own words.
    if ([400, 404, 409, 422].includes(error.status) && error.detail) return error.detail;
    if (error.status === 403) {
      return (
        error.detail ??
        (direct ? "No tienes permiso para hacer este cambio." : "No tienes permiso para solicitar cambios.")
      );
    }
  }

  return direct
    ? "No se pudo guardar el cambio. Inténtalo de nuevo."
    : "No se pudo enviar la solicitud. Inténtalo de nuevo.";
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
      ...(context.kind === "service-edit" && context.usesPrize
        ? [["Premio", treatment.prize === true ? "Sí" : "No"] as [string, string]]
        : []),
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
  } else if (context.kind === "other" && context.label && context.detail) {
    lines = [[context.label, context.detail]];
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
 * An inline panel for changing something in the centre. Treatments and bonos the centre edits
 * itself: saving applies the change at once and the backend keeps it as a resolved ticket, so it
 * ends in "Cambio aplicado" (with anything the centre should know) and a link to Mis solicitudes.
 * Rewards and levels are still a request to Voone: it ends in "Solicitud enviada". It renders where
 * the parent puts it (under a row, or at the top of a list), opens with its own context and
 * validates with the backend's limits. No browser dialogs.
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
  const [typed, setValues] = React.useState<FormValues>(() => initialValues(context));
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<ChangeRequest | null>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const pending = create.isPending;
  const direct = isDirectChange(context);
  const isReward = context.kind === "reward";
  const catalog = useStaffCatalog(isReward);
  const giftableItems = React.useMemo(
    () => catalogPickerItems((catalog.data ?? []).filter((item) => item.giftable)),
    [catalog.data],
  );
  // Without a catalogue to choose from (it failed, or nothing in it can be a reward) the
  // reward is described in words, so the form never depends on the picker.
  const catalogUnavailable =
    isReward && (catalog.isError || (catalog.isSuccess && giftableItems.length === 0));
  const values = React.useMemo(
    () =>
      catalogUnavailable && typed.rewardMode === "item" && !typed.itemId
        ? withRewardMode(typed, "text")
        : typed,
    [catalogUnavailable, typed],
  );
  const flag = useChangeFlag(buildFlagRequest(context, values));
  const shownFlag = isUnpricedReward(context, values) ? ({ status: "unpriced" } as const) : flag;
  const categoryItems = React.useMemo(
    () => categoryChoices(context, categories),
    [context, categories],
  );
  const textRef = React.useRef<HTMLInputElement>(null);
  const pickerBoxRef = React.useRef<HTMLDivElement>(null);
  // The control that had focus unmounts when the mode switches: remember which one to focus.
  const focusAfterSwitch = React.useRef<RewardMode | null>(null);

  React.useEffect(() => {
    headingRef.current?.focus();
  }, []);

  React.useEffect(() => {
    const mode = focusAfterSwitch.current;

    if (mode === null) return;

    focusAfterSwitch.current = null;

    if (mode === "text") textRef.current?.focus();
    else pickerBoxRef.current?.querySelector<HTMLElement>("button[aria-haspopup]")?.focus();
  }, [typed.rewardMode]);

  const switchMode = (mode: RewardMode) => {
    focusAfterSwitch.current = mode;
    setValues((current) => withRewardMode(current, mode));
  };

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
      onSuccess: (ticket) => setDone(ticket),
      onError: (failure) => setServerError(submitErrorMessage(failure, direct)),
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
      ? `Quiero eliminar ${quoted(context.treatment.name)}.`
      : context.kind === "bono-remove"
        ? `Quiero eliminar el bono ${quoted(context.plan.name)}.`
        : "";

  if (done && direct) {
    return (
      <section role="status" className={cn("bg-[#fffaf6] p-5", className)}>
        <p className="flex items-center gap-2 font-serif text-xl font-semibold">
          <CheckCircle2 size={20} className="text-[#4f8a5b]" aria-hidden="true" />
          Cambio aplicado
        </p>
        <p className="mt-2 max-w-xl text-sm text-[#927e72]">
          El cambio ya está hecho en tu centro. Queda registrado en Mis solicitudes.
        </p>
        {done.warnings && done.warnings.length > 0 ? (
          <div className="mt-3 max-w-xl rounded-2xl bg-white/70 px-4 py-3 text-sm">
            <p className="font-semibold text-[#8a5a2b]">Ten en cuenta</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-[#6f5b50]">
              {done.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#2d211e] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Cerrar
          </button>
          <Link
            href="/dashboard/requests"
            className="rounded-full border border-[#cdb9aa] px-5 py-2.5 text-sm font-semibold text-[#754b36]"
          >
            Ver el registro
          </Link>
        </div>
      </section>
    );
  }

  if (done) {
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
          Verás la respuesta en Mis solicitudes (y el propietario la recibe por
          email). Hasta entonces, nada cambia en tu centro.
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
        {direct
          ? "El cambio se aplica al guardar y queda registrado en Mis solicitudes."
          : "Voone revisará tu solicitud y te responderá. No se cambia nada hasta que Voone lo aplique."}
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
              <SearchPicker
                value={values.categoryId}
                onChange={(value) => set("categoryId", value)}
                items={categoryItems}
                placeholder="Elige una categoría"
                className="[&>button]:h-11 [&>button]:rounded-xl [&>button]:border-[#ded1c8] [&>button]:bg-white"
              />
            </Field>
          ) : null}

          {(context.kind === "service-add" || context.kind === "service-edit") &&
          context.usesPrize ? (
            <div className="md:col-span-2">
              <label className="flex items-start gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={values.prize}
                  onChange={(event) => set("prize", event.target.checked)}
                  className="mt-0.5 h-4 w-4"
                />
                <span>Puede darse como premio del programa</span>
              </label>
              <p className="mt-1 text-xs text-[#927e72]">
                Solo los tratamientos marcados así entran en los premios cuando se
                genera un programa nuevo. El programa activo no cambia.
              </p>
            </div>
          ) : null}

          {isReward && values.rewardMode === "item" ? (
            <div ref={pickerBoxRef} className="md:col-span-2">
              <Field
                label={context.milestone !== undefined ? "Sustituir por" : "Qué quieres que sea (opcional)"}
                hint={
                  context.milestone !== undefined
                    ? "Elige un artículo de tu catálogo y verás qué supondría para tu plan."
                    : "Elige un artículo de tu catálogo."
                }
              >
                <SearchPicker
                  value={values.itemId}
                  onChange={(value) => set("itemId", value)}
                  items={giftableItems}
                  placeholder={catalog.isPending ? "Cargando el catálogo…" : "Elige un artículo"}
                  disabled={catalog.isPending}
                  allowFreeText={{
                    label: "¿No lo encuentras? Descríbelo con tus palabras",
                    onChoose: () => switchMode("text"),
                  }}
                  className="[&>button]:h-11 [&>button]:rounded-xl [&>button]:border-[#ded1c8] [&>button]:bg-white"
                />
              </Field>
            </div>
          ) : null}

          {showText && !(isReward && values.rewardMode === "item") ? (
            <div className="md:col-span-2">
              <Field
                label="Qué quieres que sea (opcional)"
                error={errors.text}
                hint={`Hasta ${SHORT_TEXT_MAX} caracteres. Puedes explicarlo con más detalle abajo.`}
              >
                <input
                  ref={textRef}
                  value={values.text}
                  maxLength={SHORT_TEXT_MAX}
                  onChange={(event) => set("text", event.target.value)}
                  placeholder={
                    context.kind === "reward"
                      ? "Por ejemplo: un masaje relajante"
                      : "Por ejemplo: un 10 % de descuento fijo"
                  }
                  className={inputClass}
                />
              </Field>
              {isReward && !catalogUnavailable ? (
                <button
                  type="button"
                  onClick={() => switchMode("item")}
                  className="mt-1 text-xs text-[#754b36] underline underline-offset-2"
                >
                  Elegir un artículo del catálogo
                </button>
              ) : null}
            </div>
          ) : null}

          {isReward || context.kind === "service-edit" ? (
            // The live region is always mounted (empty without a flag) so a new answer is
            // announced; only the signal line is inside it, the marks table is static. Without
            // a flag the whole block is out of the layout (sr-only is absolutely positioned).
            <div
              className={cn(
                "md:col-span-2",
                shownFlag.status === "none"
                  ? "sr-only"
                  : "rounded-2xl bg-white/70 px-4 py-3 text-sm",
              )}
            >
              <div aria-live="polite">
                <ChangeFlagSignal flag={shownFlag} />
              </div>
              <ChangeFlagMarks flag={shownFlag} />
            </div>
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

          {direct ? null : (
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
          )}
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
            {direct ? (
              isRemoval ? (
                <Trash2 size={15} className="mr-2" aria-hidden="true" />
              ) : (
                <Save size={15} className="mr-2" aria-hidden="true" />
              )
            ) : (
              <Send size={15} className="mr-2" aria-hidden="true" />
            )}
            {direct
              ? pending
                ? isRemoval
                  ? "Eliminando..."
                  : "Guardando..."
                : isRemoval
                  ? "Eliminar"
                  : "Guardar"
              : pending
                ? "Enviando..."
                : "Enviar solicitud"}
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
