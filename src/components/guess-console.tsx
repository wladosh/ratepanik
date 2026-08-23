"use client";

import { useId, useState, type FormEvent } from "react";
import { parseGermanDecimal } from "@/lib/parse-german-decimal";
import styles from "./number-guess-screen.module.css";

export interface GuessConsoleProps {
  value: string;
  unit?: string;
  submitting?: boolean;
  submissionError?: string | null;
  onChange: (value: string) => void;
  onSubmit: (value: number) => void | Promise<void>;
}

const FORMAT_HELP = "Komma oder Punkt möglich";
const INVALID_GUESS = "Gib eine gültige Zahl ein, zum Beispiel 12,5.";

export function GuessConsole({
  value,
  unit,
  submitting = false,
  submissionError,
  onChange,
  onSubmit,
}: GuessConsoleProps) {
  const inputId = useId();
  const helpId = useId();
  const errorId = useId();
  const unitId = useId();
  const [showValidation, setShowValidation] = useState(false);
  const parsedGuess = parseGermanDecimal(value);
  const invalid = showValidation && value.trim() !== "" && parsedGuess === null;
  const visibleError = submissionError ?? (invalid ? INVALID_GUESS : null);
  const describedBy = [
    helpId,
    unit ? unitId : null,
    visibleError ? errorId : null,
  ]
    .filter(Boolean)
    .join(" ");

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
        <span className={styles.formatChip} id={helpId}>
          12,5 oder 12.5
        </span>
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
          autoFocus
          spellCheck={false}
          value={value}
          placeholder="Zahl eingeben"
          aria-invalid={visibleError ? "true" : "false"}
          aria-describedby={describedBy}
          onChange={(event) => {
            setShowValidation(false);
            onChange(event.target.value);
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

      <div
        className={[
          styles.message,
          visibleError ? styles.error : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {visibleError ? (
          <span id={errorId} role="alert">
            {visibleError}
          </span>
        ) : (
          <span>{FORMAT_HELP}</span>
        )}
      </div>

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
