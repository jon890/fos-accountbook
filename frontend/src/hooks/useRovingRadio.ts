"use client";

import { useCallback, useRef } from "react";
import type { KeyboardEvent } from "react";

interface UseRovingRadioOptions {
  values: string[];
  selectedValue: string | null;
  onChange: (value: string) => void;
  columns: number;
  disabled?: boolean;
}

interface RovingRadioItemProps {
  ref: (element: HTMLButtonElement | null) => void;
  tabIndex: 0 | -1;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

function getNextIndex(currentIndex: number, key: string, valuesLength: number, columns: number): number | null {
  switch (key) {
    case "ArrowLeft":
      return (currentIndex - 1 + valuesLength) % valuesLength;
    case "ArrowRight":
      return (currentIndex + 1) % valuesLength;
    case "ArrowUp":
      return ((currentIndex - columns) % valuesLength + valuesLength) % valuesLength;
    case "ArrowDown":
      return (currentIndex + columns) % valuesLength;
    case "Home":
      return 0;
    case "End":
      return valuesLength - 1;
    default:
      return null;
  }
}

export function useRovingRadio({
  values,
  selectedValue,
  onChange,
  columns,
  disabled = false,
}: UseRovingRadioOptions) {
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const selectedIndex = values.indexOf(selectedValue ?? "");
  const tabStopIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const columnCount = Math.max(columns, 1);

  const getItemProps = useCallback(
    (value: string): RovingRadioItemProps => {
      const itemIndex = values.indexOf(value);

      return {
        ref: (element) => {
          if (element) {
            itemRefs.current.set(value, element);
          } else {
            itemRefs.current.delete(value);
          }
        },
        tabIndex: itemIndex === tabStopIndex ? 0 : -1,
        onKeyDown: (event) => {
          if (disabled || values.length === 0 || itemIndex < 0) {
            return;
          }

          const nextIndex = getNextIndex(itemIndex, event.key, values.length, columnCount);
          if (nextIndex === null) {
            return;
          }

          event.preventDefault();
          const nextValue = values[nextIndex];
          onChange(nextValue);
          itemRefs.current.get(nextValue)?.focus();
        },
      };
    },
    [columnCount, disabled, onChange, tabStopIndex, values],
  );

  return { getItemProps };
}
