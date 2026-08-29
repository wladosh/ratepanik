"use client";

import { useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import {
  caretAfterContentChars,
  countContentChars,
  formatGermanGroupedInput,
  parseGermanDecimal,
} from "@/lib/parse-german-decimal";
import styles from "./number-guess-screen.module.css";

export interface GuessConsoleProps {
  value: string;
  unit?: string;
  submitting?: boolean;
  submissionError?: string | null;
  onChange: (value: string) => void;
  onSubmit: (value: number) => void | Promise<void>;
}

const INVALID_GUESS = "Gib eine gültige Zahl ein, zum Beispiel 12,5 oder 10.000.";

export function GuessConsole({
  value,
  unit,
  submitting = false,
  submissionError,
  onChange,
  onSubmit,
}: GuessConsoleProps) {
  const inputId = useId();
  const errorId = useId();
  const unitId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const parsedGuess = parseGermanDecimal(value);
  const invalid = showValidation && value.trim() !== "" && parsedGuess === null;
  const visibleError = submissionError ?? (invalid ? INVALID_GUESS : null);
  const describedBy = [
    unit ? unitId : null,
    visibleError ? errorId : null,
  ]
    .filter(Boolean)
    .join(" ");

  useLayoutEffect(() => {
    const caret = caretRef.current;
    const input = inputRef.current;
    if (caret == null || !input) return;
    input.setSelectionRange(caret, caret);
    caretRef.current = null;
  }, [value]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowValidation(true);
    if (parsedGuess === null || submitting) return;
    void onSubmit(parsedGuess);
  }

  return (
    <form className={styles.console} onSubmit={handleSubmit} noValidate>
      <div className={styles.consoleHeader}>
        <label className={styles.label} htmlFor={inputId}>
          Deine Schätzung
        </label>
      </div>

      <div
        className={[
          styles.field,
          visibleError ? styles.fieldInvalid : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          id={inputId}
          ref={inputRef}
          className={[
            styles.input,
            unit ? styles.inputWithUnit : null,
          ]
            .filter(Boolean)
            .join(" ")}
          type="text"
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          spellCheck={false}
          value={value}
          placeholder="Zahl eingeben"
          aria-invalid={visibleError ? "true" : "false"}
          aria-describedby={describedBy || undefined}
          onChange={(event) => {
            const next = formatGermanGroupedInput(event.target.value);
            const contentBefore = countContentChars(
              event.target.value,
              event.target.selectionStart ?? event.target.value.length,
            );
            caretRef.current = caretAfterContentChars(next, contentBefore);
            setShowValidation(false);
            onChange(next);
          }}
          onBlur={() => setShowValidation(true)}
        />
        {unit ? (
          <span
            className={styles.unit}
            id={unitId}
            title={unit}
            aria-label={`Einheit: ${unit}`}
          >
            {unit}
          </span>
        ) : null}
      </div>

      {visibleError ? (
        <div
          className={[styles.message, styles.error].filter(Boolean).join(" ")}
        >
          <span id={errorId} role="alert">
            {visibleError}
          </span>
        </div>
      ) : null}

      <button
        className={styles.submit}
        type="submit"
        disabled={value.trim() === "" || submitting}
      >
        <span aria-hidden="true">✓</span>
        {submitting ? "Schätzung wird gespeichert…" : "Schätzung verbindlich abgeben"}
      </button>
    </form>
  );
}
