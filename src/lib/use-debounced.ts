import * as React from "react";

/** The value, once it has stopped changing for `ms`. The first value is returned at once. */
export function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);

    return () => clearTimeout(id);
  }, [value, ms]);

  return debounced;
}
