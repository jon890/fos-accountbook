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

// 위아래 이동은 같은 열을 지킨다. 격자 끝을 넘으면 반대쪽 끝 줄의 같은 열로 간다.
// 마지막 줄이 덜 찼으면 그 열이 있는 가장 아래 줄로 간다.
// 항목이 한 줄도 안 차면 WAI-ARIA 라디오 그룹처럼 위는 이전, 아래는 다음 항목이다.
function getVerticalIndex(currentIndex: number, direction: 1 | -1, valuesLength: number, columns: number): number {
  if (valuesLength <= columns) {
    return (currentIndex + direction + valuesLength) % valuesLength;
  }

  const target = currentIndex + direction * columns;
  if (target >= 0 && target < valuesLength) {
    return target;
  }

  const column = currentIndex % columns;
  if (direction === 1) {
    return column;
  }

  const lastRowStart = Math.floor((valuesLength - 1) / columns) * columns;
  const lastInColumn = lastRowStart + column;
  return lastInColumn < valuesLength ? lastInColumn : lastInColumn - columns;
}

function getNextIndex(currentIndex: number, key: string, valuesLength: number, columns: number): number | null {
  switch (key) {
    case "ArrowLeft":
      return (currentIndex - 1 + valuesLength) % valuesLength;
    case "ArrowRight":
      return (currentIndex + 1) % valuesLength;
    case "ArrowUp":
      return getVerticalIndex(currentIndex, -1, valuesLength, columns);
    case "ArrowDown":
      return getVerticalIndex(currentIndex, 1, valuesLength, columns);
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
