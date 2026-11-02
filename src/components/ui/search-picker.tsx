"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatEuros } from "@/lib/euros";
import {
  filterItems,
  groupsOf,
  highlight,
  type PickerItem,
} from "@/lib/picker-search";
import { cn } from "@/lib/utils";

/**
 * One searchable picker for every long list: the clinic catalogue, bonos, categories.
 *
 * A trigger button shows the chosen label and price. Opening it shows a panel with a search box
 * (name or price, accent-insensitive), group chips when the items fall in two or more groups, the
 * list with the price on the right and the typed part highlighted, a bar with the highlighted
 * item and "Usar este", and, if `allowFreeText` is given, a "describe it in your own words"
 * footer. From `sm` up the panel hangs under the trigger; below it, it is a full-height sheet.
 *
 * The filtering, grouping and highlighting live in src/lib/picker-search.ts (tested). This file
 * is only the shell: state, keyboard, focus and markup.
 *
 * The panel is rendered in a portal and positioned from the trigger's rectangle, because the
 * pickers sit inside tables and `overflow-hidden` cards that would clip an absolute dropdown.
 */

export type { PickerItem } from "@/lib/picker-search";

/** The fixed words of the panel. Spanish by default; admin screens pass English. */
export interface SearchPickerLabels {
  all: string;
  chosen: string;
  use: string;
  clearSearch: string;
  close: string;
  groups: string;
}

const DEFAULT_LABELS: SearchPickerLabels = {
  all: "Todo",
  chosen: "Elegido",
  use: "Usar este",
  clearSearch: "Borrar búsqueda",
  close: "Cerrar",
  groups: "Filtrar por grupo",
};

const MOBILE_QUERY = "(max-width: 639px)";
const PANEL_MAX_HEIGHT = 448;
const PANEL_GAP = 4;

const FOCUSABLE = "button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])";

const priceOf = (item: PickerItem): string | null =>
  item.priceEuro == null ? null : formatEuros(item.priceEuro);

export function SearchPicker({
  items,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "Busca por nombre o precio…",
  emptyMessage = "Nada coincide con esa búsqueda.",
  allowFreeText,
  disabled = false,
  id,
  className,
  ariaLabel,
  labels: labelOverrides,
}: {
  items: PickerItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  allowFreeText?: { label: string; onChoose: () => void };
  disabled?: boolean;
  id?: string;
  className?: string;
  ariaLabel?: string;
  /** Overrides for the fixed words ("Todo", "Elegido", "Usar este"...), e.g. English in the admin. */
  labels?: Partial<SearchPickerLabels>;
}) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const uid = React.useId();
  const listboxId = `${uid}-listbox`;
  // Ids by position: item values ("bono:12") are not safe to use in an id.
  const indexByValue = React.useMemo(
    () => new Map(items.map((item, index) => [item.value, index])),
    [items],
  );
  const optionId = (itemValue: string) => `${uid}-option-${indexByValue.get(itemValue)}`;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [group, setGroup] = React.useState<string | null>(null);
  // The highlighted item: what the bar offers and what Enter picks.
  const [activeValue, setActiveValue] = React.useState<string | null>(null);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const groups = React.useMemo(() => groupsOf(items), [items]);
  const list = React.useMemo(
    () => filterItems(items, query, group),
    [items, query, group],
  );
  const selected = items.find((item) => item.value === value) ?? null;
  const active = list.find((item) => item.value === activeValue) ?? null;
  const activeIndex = active ? list.indexOf(active) : -1;

  const close = React.useCallback((returnFocus: boolean) => {
    setOpen(false);
    setQuery("");
    setGroup(null);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const openPanel = () => {
    setQuery("");
    setGroup(null);
    setActiveValue(selected ? selected.value : (items[0]?.value ?? null));
    setOpen(true);
  };

  const commit = (item: PickerItem) => {
    onChange(item.value);
    close(true);
  };

  /** Keeps the highlight on screen and valid after the filter changed. */
  const refilter = (nextQuery: string, nextGroup: string | null) => {
    const next = filterItems(items, nextQuery, nextGroup);

    setQuery(nextQuery);
    setGroup(nextGroup);
    if (!next.some((item) => item.value === activeValue)) {
      setActiveValue(next[0]?.value ?? null);
    }
  };

  // Focus the search box once the panel is there.
  React.useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Click outside closes. The panel is in a portal, so it is checked on its own.
  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close(false);
    };

    document.addEventListener("mousedown", onPointerDown);

    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  // From `sm` up, hang the panel under the trigger (or above it when there is no room below).
  // Written straight to the element: it follows scroll and resize without re-rendering.
  React.useLayoutEffect(() => {
    if (!open) return;

    const place = () => {
      const panel = panelRef.current;
      const trigger = triggerRef.current;

      if (!panel || !trigger) return;

      const rect = trigger.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - PANEL_GAP - 8;
      const above = rect.top - PANEL_GAP - 8;
      const placeAbove = below < 240 && above > below;
      const room = placeAbove ? above : below;

      panel.dataset.placement = placeAbove ? "above" : "below";
      panel.style.setProperty("--picker-left", `${Math.max(8, rect.left)}px`);
      panel.style.setProperty("--picker-width", `${Math.max(rect.width, 320)}px`);
      panel.style.setProperty("--picker-top", `${rect.bottom + PANEL_GAP}px`);
      panel.style.setProperty(
        "--picker-bottom",
        `${window.innerHeight - rect.top + PANEL_GAP}px`,
      );
      panel.style.setProperty(
        "--picker-max-h",
        `${Math.min(PANEL_MAX_HEIGHT, Math.max(room, 200))}px`,
      );
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);

    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  // The sheet covers the page on a phone: keep the page from scrolling behind it.
  React.useEffect(() => {
    if (!open || !window.matchMedia(MOBILE_QUERY).matches) return;

    const previous = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Keep the highlighted row visible while arrowing through a long list.
  React.useEffect(() => {
    if (!open || !activeValue) return;

    document
      .getElementById(optionId(activeValue))
      ?.scrollIntoView({ block: "nearest" });
    // optionId only depends on uid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeValue, uid, indexByValue]);

  const move = (delta: 1 | -1) => {
    if (list.length === 0) return;

    const from = activeIndex === -1 ? (delta === 1 ? -1 : 0) : activeIndex;

    setActiveValue(list[(from + delta + list.length) % list.length].value);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (active) commit(active);
    }
  };

  const onPanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);

      return;
    }

    // On a phone the sheet is modal: Tab wraps inside it instead of reaching the page behind.
    if (event.key === "Tab" && window.matchMedia(MOBILE_QUERY).matches) {
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  // Tabbing away on a desktop closes the popup. A null relatedTarget is a click on plain
  // content inside the panel, which must not close it.
  const onPanelBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;

    if (
      next &&
      !panelRef.current?.contains(next) &&
      !rootRef.current?.contains(next)
    ) {
      close(false);
    }
  };

  const activePrice = active ? priceOf(active) : null;
  const triggerPrice = selected ? priceOf(selected) : null;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={
          ariaLabel ? `${ariaLabel}: ${selected ? selected.label : placeholder}` : undefined
        }
        onClick={() => (open ? close(false) : openPanel())}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-left text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span
          className={cn("min-w-0 flex-1 truncate", selected ? "" : "text-muted-foreground")}
        >
          {selected ? selected.label : placeholder}
        </span>
        {triggerPrice ? (
          <span className="shrink-0 text-xs text-muted-foreground">{triggerPrice}</span>
        ) : null}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      {open
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label={ariaLabel ?? placeholder}
              onKeyDown={onPanelKeyDown}
              onBlur={onPanelBlur}
              data-placement="below"
              className={cn(
                "fixed inset-0 z-50 flex flex-col bg-card",
                "sm:inset-auto sm:left-[var(--picker-left)] sm:w-[var(--picker-width)] sm:max-h-[var(--picker-max-h)]",
                "sm:data-[placement=below]:top-[var(--picker-top)] sm:data-[placement=above]:bottom-[var(--picker-bottom)]",
                "sm:rounded-xl sm:border sm:border-border sm:shadow-lg",
              )}
            >
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <input
                  ref={inputRef}
                  type="text"
                  role="combobox"
                  aria-label={ariaLabel ?? searchPlaceholder}
                  aria-expanded="true"
                  aria-controls={listboxId}
                  aria-autocomplete="list"
                  aria-activedescendant={active ? optionId(active.value) : undefined}
                  autoComplete="off"
                  value={query}
                  placeholder={searchPlaceholder}
                  onChange={(event) => refilter(event.target.value, group)}
                  onKeyDown={onInputKeyDown}
                  className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
                {query ? (
                  <button
                    type="button"
                    aria-label={labels.clearSearch}
                    onClick={() => {
                      refilter("", group);
                      inputRef.current?.focus();
                    }}
                    className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label={labels.close}
                  onClick={() => close(true)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-secondary sm:hidden"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              {groups.length > 0 ? (
                <div
                  role="group"
                  aria-label={labels.groups}
                  className="flex gap-1.5 overflow-x-auto border-b border-border px-3 py-2 text-xs"
                >
                  {[null, ...groups].map((chip) => {
                    const on = group === chip;

                    return (
                      <button
                        key={chip ?? "__all"}
                        type="button"
                        aria-pressed={on}
                        onClick={() => refilter(query, chip)}
                        className={cn(
                          "shrink-0 rounded-full px-3 py-1",
                          on
                            ? "bg-primary font-semibold text-primary-foreground"
                            : "border border-border text-muted-foreground hover:bg-secondary",
                        )}
                      >
                        {chip ?? labels.all}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <ul
                role="listbox"
                id={listboxId}
                aria-label={ariaLabel ?? placeholder}
                className="min-h-0 flex-1 overflow-y-auto py-1"
              >
                {list.length === 0 ? (
                  <li className="px-3 py-3 text-sm text-muted-foreground">{emptyMessage}</li>
                ) : (
                  list.map((item) => {
                    const price = priceOf(item);

                    return (
                      <li
                        key={item.value}
                        id={optionId(item.value)}
                        role="option"
                        aria-selected={item.value === value}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => setActiveValue(item.value)}
                        onDoubleClick={() => commit(item)}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm",
                          item.value === activeValue ? "bg-secondary" : "hover:bg-secondary/50",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate">
                            {highlight(item.label, query).map((segment, index) =>
                              segment.match ? (
                                <mark
                                  key={index}
                                  className="bg-transparent font-bold text-foreground"
                                >
                                  {segment.text}
                                </mark>
                              ) : (
                                <React.Fragment key={index}>{segment.text}</React.Fragment>
                              ),
                            )}
                          </span>
                          {item.hint ? (
                            <span className="block truncate text-xs text-muted-foreground">
                              {item.hint}
                            </span>
                          ) : null}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {price ? (
                            <span className="text-muted-foreground">{price}</span>
                          ) : null}
                          {item.value === value ? (
                            <Check className="h-4 w-4" aria-hidden />
                          ) : null}
                        </span>
                      </li>
                    );
                  })
                )}
              </ul>

              <div className="flex items-center justify-between gap-3 border-t border-border bg-secondary/40 px-3 py-2 text-sm">
                <p className="min-w-0 truncate" aria-live="polite">
                  {active ? (
                    <>
                      <span className="text-muted-foreground">{labels.chosen}: </span>
                      <strong className="font-semibold">{active.label}</strong>
                      {activePrice ? ` · ${activePrice}` : ""}
                    </>
                  ) : null}
                </p>
                <Button
                  type="button"
                  size="sm"
                  disabled={!active}
                  onClick={() => active && commit(active)}
                >
                  {labels.use}
                </Button>
              </div>

              {allowFreeText ? (
                <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => {
                      allowFreeText.onChoose();
                      close(true);
                    }}
                    className="text-left underline underline-offset-2 hover:text-foreground"
                  >
                    {allowFreeText.label}
                  </button>
                </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
