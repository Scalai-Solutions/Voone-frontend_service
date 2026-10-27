"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A searchable dropdown, built in-house rather than imported: the visit form needs
 * type-to-filter over the catalogue and the bono list, and nothing else does.
 *
 * Keyboard: ArrowDown/ArrowUp move, Enter picks, Escape closes, typing filters and reopens.
 * ARIA follows the combobox pattern (combobox input + listbox options).
 */

export interface ComboboxOption {
  value: string;
  label: string;
  /** Second line, e.g. the price. Filtered along with the label. */
  hint?: string;
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  emptyMessage = "Nada coincide con esa búsqueda.",
  disabled = false,
  className,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const close = React.useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };

    document.addEventListener("mousedown", onPointerDown);

    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  const filtered = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return options;

    return options.filter((option) =>
      `${option.label} ${option.hint ?? ""}`.toLowerCase().includes(normalized),
    );
  }, [options, query]);

  const selected = options.find((option) => option.value === value) ?? null;

  const pick = (option: ComboboxOption) => {
    onChange(option.value);
    close();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();

      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);

        return;
      }
      if (filtered.length === 0) return;

      setActiveIndex((current) => {
        const delta = event.key === "ArrowDown" ? 1 : -1;

        return (current + delta + filtered.length) % filtered.length;
      });

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (open && filtered[activeIndex]) pick(filtered[activeIndex]);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (open) {
            close();

            return;
          }
          setActiveIndex(0);
          setOpen(true);
        }}
        className="mt-1 flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-left text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={selected ? "" : "text-muted-foreground"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </button>

      {open ? (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls={id ? `${id}-listbox` : undefined}
            aria-autocomplete="list"
            placeholder="Buscar…"
            // Autofocus on mount: the click that opened this panel has already happened.
            autoFocus
            className="h-9 w-full rounded-t-md border-b border-border bg-background px-3 text-sm outline-none"
          />
          <ul
            role="listbox"
            id={id ? `${id}-listbox` : undefined}
            className="max-h-60 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(option)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm",
                    index === activeIndex ? "bg-secondary" : "",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.hint ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {option.hint}
                      </span>
                    ) : null}
                  </span>
                  {option.value === value ? (
                    <Check className="h-4 w-4 shrink-0" aria-hidden />
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
