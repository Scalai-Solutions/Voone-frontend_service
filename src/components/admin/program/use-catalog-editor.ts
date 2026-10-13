"use client";

import * as React from "react";

import { useReplaceCatalog } from "@/features/onboarding/api/useOnboarding";
import { ApiError } from "@/lib/api-client";
import type { CatalogInputRow, CatalogRow, CategoryCode } from "@/lib/onboarding-api";
import { parsePriceInput } from "./format";

/**
 * The catalogue as a person edits it.
 *
 * The server is the source of truth for what a row's category IS (the engine classifies by
 * name), but a person is typing in the meantime, so the editor owns the rows and the server's
 * answer is merged in around them. Three things make that safe:
 *
 *  - Saves are SERIALISED. Two PUTs in flight could land out of order and leave the older
 *    catalogue as the stored one, so each save waits for the one before it.
 *  - The server's reply updates only what the server decides (category, how it was chosen,
 *    whether it needs review). It never touches the name or price, so a keystroke made while a
 *    save was in flight is not overwritten by the reply to it.
 *  - A half-typed row is KEPT but not sent. Saving replaces the whole catalogue, so sending a
 *    row with no price would either fail or store a zero; leaving it out would delete nothing,
 *    because the row was never saved.
 */

export interface EditorRow {
  /** Stable for the life of the row. Becomes the engine's item id, which breaks every tie. */
  key: string;
  name: string;
  /** Text, because that is what an input holds. Parsed only when saving. */
  price: string;
  isProduct: boolean;
  /** The category the centre chose, or "" to let the engine decide. */
  categoryId: CategoryCode | "";
  /** What the engine decided, from the last save. */
  category: CategoryCode | null;
  classifiedBy: string | null;
  needsReview: boolean;
}

export type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

const DEBOUNCE_MS = 700;

const fromServer = (row: CatalogRow): EditorRow => ({
  key: row.externalId,
  name: row.name,
  price: String(row.priceEuro).replace(".", ","),
  isProduct: row.isProduct,
  categoryId: (row.categoryId as CategoryCode | null) ?? "",
  category: row.category,
  classifiedBy: row.classifiedBy,
  needsReview: row.needsReview,
});

const newKey = (): string => `m-${crypto.randomUUID().slice(0, 8)}`;

export const blankRow = (): EditorRow => ({
  key: newKey(),
  name: "",
  price: "",
  isProduct: false,
  categoryId: "",
  category: null,
  classifiedBy: null,
  needsReview: false,
});

/** Whether a row is complete enough to be sent. */
export const isSendable = (row: EditorRow): boolean =>
  row.name.trim().length > 0 && parsePriceInput(row.price) !== null;

const toPayload = (rows: EditorRow[]): CatalogInputRow[] =>
  rows.filter(isSendable).map((row) => ({
    externalId: row.key,
    name: row.name.trim(),
    priceEuro: parsePriceInput(row.price) as number,
    isProduct: row.isProduct,
    categoryId: row.categoryId === "" ? null : row.categoryId,
  }));

export function useCatalogEditor(clinicId: string, initial: CatalogRow[]) {
  const replace = useReplaceCatalog(clinicId);
  const [rows, setRows] = React.useState<EditorRow[]>(() =>
    initial.length ? initial.map(fromServer) : [blankRow()],
  );
  const [save, setSave] = React.useState<SaveState>({ kind: "idle" });

  // Refs hold what the async save needs to read at the moment it runs, not the render it was
  // created in: by then the rows may have moved on.
  const rowsRef = React.useRef(rows);
  const revision = React.useRef(0);
  const savedRevision = React.useRef(0);
  const chain = React.useRef<Promise<void>>(Promise.resolve());
  const lastError = React.useRef<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const saveNow = React.useCallback((): Promise<void> => {
    chain.current = chain.current.then(async () => {
      if (revision.current === savedRevision.current) return;

      const at = revision.current;

      setSave({ kind: "saving" });

      try {
        const items = await replace.mutateAsync(toPayload(rowsRef.current));
        const byKey = new Map(items.map((item) => [item.externalId, item]));

        savedRevision.current = at;
        lastError.current = null;

        // Only what the server decides. See the header comment.
        setRows((current) =>
          current.map((row) => {
            const server = byKey.get(row.key);

            return server
              ? {
                  ...row,
                  category: server.category,
                  classifiedBy: server.classifiedBy,
                  needsReview: server.needsReview,
                }
              : row;
          }),
        );
        setSave({ kind: "saved" });
      } catch (error) {
        const message =
          error instanceof ApiError && error.detail
            ? error.detail
            : "No se ha podido guardar el catálogo. Inténtalo de nuevo.";

        lastError.current = message;
        setSave({ kind: "error", message });
      }
    });

    return chain.current;
  }, [replace]);

  const touch = React.useCallback(() => {
    revision.current += 1;

    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(() => void saveNow(), DEBOUNCE_MS);
  }, [saveNow]);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const edit = React.useCallback(
    (key: string, patch: Partial<EditorRow>) => {
      setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
      touch();
    },
    [touch],
  );

  const add = React.useCallback(() => {
    // Adding a blank row changes nothing that needs saving until it is filled in.
    setRows((current) => [...current, blankRow()]);
  }, []);

  const remove = React.useCallback(
    (key: string) => {
      setRows((current) => {
        const next = current.filter((row) => row.key !== key);

        return next.length ? next : [blankRow()];
      });
      touch();
    },
    [touch],
  );

  /** Replaces everything, as after a CSV import: the server already holds these. */
  const replaceAll = React.useCallback((items: CatalogRow[]) => {
    if (timer.current) clearTimeout(timer.current);

    const next = items.length ? items.map(fromServer) : [blankRow()];

    rowsRef.current = next;
    setRows(next);
    // What the server holds IS what is shown, so nothing is pending.
    savedRevision.current = revision.current;
    lastError.current = null;
    setSave({ kind: "saved" });
  }, []);

  /**
   * Settles any pending edit and resolves true only if the catalogue is safely stored.
   * What "Continuar" waits on: moving on while a save is still in flight would estimate
   * against the catalogue from a moment ago.
   */
  const ensureSaved = React.useCallback(async (): Promise<boolean> => {
    if (timer.current) clearTimeout(timer.current);

    await saveNow();

    return lastError.current === null;
  }, [saveNow]);

  return { rows, save, edit, add, remove, replaceAll, ensureSaved };
}
