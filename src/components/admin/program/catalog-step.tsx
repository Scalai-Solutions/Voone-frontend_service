"use client";

import * as React from "react";
import { AlertTriangle, Check, FileUp, Loader2, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useImportCatalog } from "@/features/onboarding/api/useOnboarding";
import { ApiError } from "@/lib/api-client";
import type { CatalogRow, CategoryCode, CsvImportResult } from "@/lib/onboarding-api";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  CLASSIFIED_BY_LABEL,
  EARNS_NOTHING,
  SELECTABLE_CATEGORIES,
} from "./categories";
import { isSendable, useCatalogEditor, type EditorRow } from "./use-catalog-editor";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-card px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Minimum retail products the guide recommends, because they are the first rewards. */
const RECOMMENDED_PRODUCTS = 5;

export function CatalogStep({
  clinicId,
  initial,
  onContinue,
}: {
  clinicId: string;
  initial: CatalogRow[];
  onContinue: () => void;
}) {
  const { rows, save, edit, add, remove, replaceAll, ensureSaved } = useCatalogEditor(
    clinicId,
    initial,
  );
  const [moving, setMoving] = React.useState(false);

  const sendable = rows.filter(isSendable);
  const needsReview = rows.filter((row) => row.needsReview);
  const products = rows.filter((row) => row.isProduct || row.category === "COS").length;
  const hasPresoterapia = rows.some((row) => row.category === "PRE");

  const blocked = sendable.length === 0 || needsReview.length > 0;

  const next = async () => {
    setMoving(true);

    // Whatever is still pending is saved, and the estimates are read from what was stored.
    const ok = await ensureSaved();

    setMoving(false);

    if (ok) onContinue();
  };

  return (
    <div className="grid gap-6">
      <div>
        <h3 className="font-serif text-2xl font-semibold">Qué ofrece el centro</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Sube la lista de precios o añade los tratamientos y productos a mano. Los premios del
          programa salen de aquí, y se valoran a lo que cuestan de verdad al centro.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="secondary">{sendable.length} servicios</Badge>
        <Hint ok={products >= RECOMMENDED_PRODUCTS}>
          {products} de {RECOMMENDED_PRODUCTS} productos de venta recomendados
        </Hint>
        <Hint ok={hasPresoterapia}>Presoterapia, si el centro la ofrece</Hint>
        <SaveIndicator state={save} />
      </div>

      {needsReview.length > 0 ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p>
            <strong>
              {needsReview.length} {needsReview.length === 1 ? "fila necesita" : "filas necesitan"}{" "}
              categoría.
            </strong>{" "}
            No hemos podido deducirla por el nombre: elígela en la lista para continuar.
          </p>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-secondary/60 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-3 py-3">Nombre</th>
              <th className="w-28 px-3 py-3">Precio</th>
              <th className="w-44 px-3 py-3">Tipo</th>
              <th className="w-72 px-3 py-3">Categoría</th>
              <th className="w-12 px-3 py-3">
                <span className="sr-only">Quitar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <CatalogRowEditor
                key={row.key}
                row={row}
                index={index}
                onEdit={(patch) => edit(row.key, patch)}
                onRemove={() => remove(row.key)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="mr-2 h-4 w-4" /> <span>Añadir fila</span>
        </Button>
      </div>

      <CsvImport clinicId={clinicId} onImported={replaceAll} />

      <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
        {blocked ? (
          <p className="text-xs text-muted-foreground">
            {sendable.length === 0
              ? "Añade al menos un tratamiento con precio."
              : "Clasifica las filas marcadas para continuar."}
          </p>
        ) : null}
        <Button type="button" onClick={next} disabled={blocked || moving}>
          {moving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          <span>Continuar a las preguntas</span>
        </Button>
      </div>
    </div>
  );
}

function CatalogRowEditor({
  row,
  index,
  onEdit,
  onRemove,
}: {
  row: EditorRow;
  index: number;
  onEdit: (patch: Partial<EditorRow>) => void;
  onRemove: () => void;
}) {
  const label = row.name.trim() || `fila ${index + 1}`;
  const incomplete = !isSendable(row) && (row.name.trim() !== "" || row.price.trim() !== "");
  const detected = row.category && row.categoryId === "" ? row.category : null;

  return (
    <tr className={cn("border-t border-border align-top", row.needsReview && "bg-destructive/5")}>
      <td className="px-3 py-2">
        <Input
          aria-label={`Nombre de ${label}`}
          value={row.name}
          placeholder="Higiene facial detox"
          onChange={(event) => onEdit({ name: event.target.value })}
        />
        {incomplete ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Fila incompleta: hace falta un nombre y un precio para guardarla.
          </p>
        ) : null}
      </td>
      <td className="px-3 py-2">
        <Input
          aria-label={`Precio de ${label}`}
          inputMode="decimal"
          value={row.price}
          placeholder="60"
          onChange={(event) => onEdit({ price: event.target.value })}
        />
      </td>
      <td className="px-3 py-2">
        <select
          aria-label={`Tipo de ${label}`}
          className={selectClass}
          value={row.isProduct ? "producto" : "tratamiento"}
          onChange={(event) => onEdit({ isProduct: event.target.value === "producto" })}
        >
          <option value="tratamiento">Tratamiento</option>
          <option value="producto">Producto de venta</option>
        </select>
      </td>
      <td className="px-3 py-2">
        <select
          aria-label={`Categoría de ${label}`}
          className={cn(selectClass, row.needsReview && "border-destructive")}
          value={row.categoryId}
          onChange={(event) => onEdit({ categoryId: event.target.value as CategoryCode | "" })}
        >
          <option value="">Automática</option>
          {SELECTABLE_CATEGORIES.map((code) => (
            <option key={code} value={code}>
              {CATEGORY_LABELS[code]}
            </option>
          ))}
        </select>
        {row.needsReview ? (
          <p className="mt-1 text-xs font-medium text-destructive">Sin categoría: elige una.</p>
        ) : detected ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {CATEGORY_LABELS[detected]}
            {row.classifiedBy ? ` · ${CLASSIFIED_BY_LABEL[row.classifiedBy] ?? row.classifiedBy}` : ""}
          </p>
        ) : null}
        {row.category && EARNS_NOTHING.has(row.category) ? (
          <p className="mt-1 text-xs text-muted-foreground">
            No suma puntos ni se regala: es medicina.
          </p>
        ) : null}
      </td>
      <td className="px-3 py-2 text-right">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Quitar ${label}`}
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}

function Hint({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        ok
          ? "border-success/40 bg-success/10 text-success"
          : "border-border bg-secondary/50 text-muted-foreground",
      )}
    >
      {ok ? <Check className="h-3 w-3" /> : null}
      <span>{children}</span>
    </span>
  );
}

function SaveIndicator({ state }: { state: ReturnType<typeof useCatalogEditor>["save"] }) {
  if (state.kind === "idle") return null;

  if (state.kind === "saving") {
    return (
      <span key="saving" className="ml-auto inline-flex items-center gap-1.5 text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> <span>Guardando…</span>
      </span>
    );
  }

  if (state.kind === "saved") {
    return (
      <span key="saved" className="ml-auto inline-flex items-center gap-1.5 text-success">
        <Check className="h-3 w-3" /> <span>Guardado</span>
      </span>
    );
  }

  return (
    <span key="failed" role="alert" className="ml-auto text-destructive">
      {state.message}
    </span>
  );
}

function CsvImport({
  clinicId,
  onImported,
}: {
  clinicId: string;
  onImported: (items: CatalogRow[]) => void;
}) {
  const importer = useImportCatalog(clinicId);
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [confirming, setConfirming] = React.useState(false);
  const [result, setResult] = React.useState<CsvImportResult | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);

  const readFile = async (file: File | undefined) => {
    if (!file) return;

    setText(await file.text());
    setConfirming(false);
  };

  const run = () => {
    // Importing REPLACES the catalogue, so it asks twice. An inline step rather than a browser
    // dialog: a dialog would block anything driving the page, and says nothing about what is
    // about to be lost.
    if (!confirming) {
      setConfirming(true);

      return;
    }

    setProblem(null);
    importer.mutate(text, {
      onSuccess: (imported) => {
        setResult(imported);
        setConfirming(false);
        setText("");
        onImported(imported.items);
      },
      onError: (error) => {
        setConfirming(false);
        setProblem(
          error instanceof ApiError && error.detail
            ? error.detail
            : "No se ha podido importar el archivo.",
        );
      },
    });
  };

  return (
    <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-4">
      <button
        type="button"
        className="flex w-full items-center gap-2 text-left text-sm font-semibold"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <FileUp className="h-4 w-4" /> <span>Importar desde un archivo CSV</span>
      </button>

      {open ? (
        <div className="mt-4 grid gap-3">
          <p className="text-xs leading-5 text-muted-foreground">
            Dos columnas como mínimo: nombre y precio, separadas por punto y coma o tabulador. Una
            tercera columna opcional puede decir &quot;producto&quot; o una categoría. Las filas que
            no se puedan leer se saltan y te las enseñamos.
          </p>

          <input
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            aria-label="Archivo CSV"
            className="text-sm"
            onChange={(event) => void readFile(event.target.files?.[0])}
          />

          <textarea
            aria-label="Contenido del CSV"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setConfirming(false);
            }}
            rows={6}
            placeholder={"Higiene facial;60\nMasaje relajante;45,50\nCrema hidratante;40;producto"}
            className="w-full rounded-md border border-input bg-card p-3 font-mono text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant={confirming ? "destructive" : "default"}
              disabled={!text.trim() || importer.isPending}
              onClick={run}
            >
              {importer.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              <span>{confirming ? "Confirmar: reemplaza el catálogo actual" : "Importar"}</span>
            </Button>
            {confirming ? (
              <button
                type="button"
                className="text-xs text-muted-foreground underline"
                onClick={() => setConfirming(false)}
              >
                Cancelar
              </button>
            ) : null}
          </div>

          {problem ? (
            <p role="alert" className="text-sm text-destructive">
              {problem}
            </p>
          ) : null}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 grid gap-2 text-sm">
          <p className="flex items-center gap-2 font-semibold text-success">
            <Check className="h-4 w-4" />{" "}
            <span>
              Se han importado {result.imported} {result.imported === 1 ? "fila" : "filas"}.
            </span>
          </p>
          {result.notes.map((note) => (
            <p key={note} className="text-xs text-muted-foreground">
              {note}
            </p>
          ))}
          {result.skipped.length > 0 ? (
            <div className="rounded-md border border-warning/40 bg-warning/10 p-3">
              <p className="text-xs font-semibold">
                {result.skipped.length}{" "}
                {result.skipped.length === 1 ? "fila no se pudo leer" : "filas no se pudieron leer"}:
              </p>
              <ul className="mt-2 grid gap-1 text-xs">
                {result.skipped.map((row) => (
                  <li key={row.line}>
                    <strong>Línea {row.line}:</strong> {row.reason}{" "}
                    <code className="text-muted-foreground">{row.raw}</code>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
