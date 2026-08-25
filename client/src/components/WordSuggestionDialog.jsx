"use client";

import { CheckCircle2, Loader2, MessageSquarePlus, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { submitWordSuggestion } from "@/lib/api";
import { getErrorMessage } from "@/lib/errorMessage";

const suggestionTypes = ["noun", "verb", "adjective", "adverb", "phrase", "other"];

export function WordSuggestionDialog({ query, direction = "auto" }) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const englishInputRef = useRef(null);
  const somaliInputRef = useRef(null);
  const successButtonRef = useRef(null);
  const submittingRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => getInitialForm(query, direction));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) return undefined;

    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    const focusTimer = window.setTimeout(() => englishInputRef.current?.focus(), 0);

    function handleEscape(event) {
      if (event.key !== "Escape" || submittingRef.current) return;
      event.preventDefault();
      dialog?.close();
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (status !== "success") return undefined;
    const focusTimer = window.setTimeout(() => successButtonRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [status]);

  function openDialog() {
    setForm(getInitialForm(query, direction));
    setErrors({});
    setFormError("");
    setStatus("idle");
    setOpen(true);
  }

  function closeDialog() {
    if (submittingRef.current) return;
    dialogRef.current?.close();
  }

  function handleDialogClose() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submittingRef.current) return;

    const cleanedForm = cleanForm(form);
    const nextErrors = validateForm(cleanedForm);
    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.english) englishInputRef.current?.focus();
      else if (nextErrors.somali) somaliInputRef.current?.focus();
      return;
    }

    submittingRef.current = true;
    setStatus("submitting");

    try {
      await submitWordSuggestion({
        english: cleanedForm.english,
        somali: cleanedForm.somali,
        ...(cleanedForm.type ? { type: cleanedForm.type } : {}),
        ...(cleanedForm.note ? { note: cleanedForm.note } : {})
      });

      setForm({ ...getInitialForm(query, direction), somali: "", type: "", note: "" });
      setStatus("success");
    } catch (error) {
      const fieldErrors = getServerFieldErrors(error);
      setErrors(fieldErrors);
      setFormError(getErrorMessage(error, "Could not submit this suggestion. Please try again."));
      setStatus("error");
    } finally {
      submittingRef.current = false;
    }
  }

  const submitting = status === "submitting";

  return (
    <>
      <button className="wordSuggestionTrigger" onClick={openDialog} ref={triggerRef} type="button">
        <MessageSquarePlus size={18} aria-hidden="true" />
        Turjumaad Soo Jeedi
      </button>

      <dialog
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="wordSuggestionDialog"
        onCancel={(event) => submitting && event.preventDefault()}
        onClose={handleDialogClose}
        ref={dialogRef}
      >
        <div className="wordSuggestionShell">
          <header className="wordSuggestionHeader">
            <div>
              <span className="wordSuggestionEyebrow">Community suggestion</span>
              <h2 id={titleId}>Suggest a translation</h2>
              <p id={descriptionId}>Share an English and Somali word pair for review.</p>
            </div>
            <button
              aria-label="Close suggestion form"
              className="wordSuggestionClose"
              disabled={submitting}
              onClick={closeDialog}
              type="button"
            >
              <X size={20} />
            </button>
          </header>

          {status === "success" ? (
            <div className="wordSuggestionSuccess" role="status" aria-live="polite">
              <span aria-hidden="true">
                <CheckCircle2 size={28} />
              </span>
              <strong>Mahadsanid</strong>
              <p>Mahadsanid. Soo jeedintaada waxaa loo diray dib-u-eegis.</p>
              <button className="primaryButton" onClick={closeDialog} ref={successButtonRef} type="button">
                Xir
              </button>
            </div>
          ) : (
            <form aria-busy={submitting} className="wordSuggestionForm" noValidate onSubmit={handleSubmit}>
              {formError && (
                <p className="wordSuggestionFormError" role="alert">
                  {formError}
                </p>
              )}

              <SuggestionField
                error={errors.english}
                inputRef={englishInputRef}
                label="English word"
                maxLength={120}
                name="english"
                onChange={updateField}
                required
                value={form.english}
              />

              <SuggestionField
                error={errors.somali}
                inputRef={somaliInputRef}
                label="Somali translation"
                maxLength={120}
                name="somali"
                onChange={updateField}
                required
                value={form.somali}
              />

              <label className="wordSuggestionField">
                <span>Part of speech <small>Optional</small></span>
                <select
                  aria-label="Part of speech"
                  aria-describedby={errors.type ? `${titleId}-type-error` : undefined}
                  aria-invalid={Boolean(errors.type)}
                  value={form.type}
                  onChange={(event) => updateField("type", event.target.value)}
                >
                  <option value="">Not sure</option>
                  {suggestionTypes.map((type) => (
                    <option key={type} value={type}>
                      {capitalize(type)}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <small className="wordSuggestionFieldError" id={`${titleId}-type-error`}>
                    {errors.type}
                  </small>
                )}
              </label>

              <label className="wordSuggestionField wordSuggestionNote">
                <span>Note <small>Optional</small></span>
                <textarea
                  aria-label="Note"
                  aria-describedby={errors.note ? `${titleId}-note-error` : undefined}
                  aria-invalid={Boolean(errors.note)}
                  maxLength={500}
                  onChange={(event) => updateField("note", event.target.value)}
                  placeholder="Add helpful context for the reviewer"
                  rows={4}
                  value={form.note}
                />
                <small className="wordSuggestionCount">{form.note.length}/500</small>
                {errors.note && (
                  <small className="wordSuggestionFieldError" id={`${titleId}-note-error`}>
                    {errors.note}
                  </small>
                )}
              </label>

              <div className="wordSuggestionActions">
                <button className="ghostButton" disabled={submitting} onClick={closeDialog} type="button">
                  Cancel
                </button>
                <button className="primaryButton" disabled={submitting} type="submit">
                  {submitting ? <Loader2 className="spin" size={18} /> : <MessageSquarePlus size={18} />}
                  {submitting ? "Submitting" : "Submit suggestion"}
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}

function SuggestionField({ error, inputRef, label, maxLength, name, onChange, required, value }) {
  const errorId = `suggestion-${name}-error`;

  return (
    <label className="wordSuggestionField">
      <span>{label} {required && <small>Required</small>}</span>
      <input
        aria-label={label}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        maxLength={maxLength}
        onChange={(event) => onChange(name, event.target.value)}
        ref={inputRef}
        required={required}
        type="text"
        value={value}
      />
      {error && (
        <small className="wordSuggestionFieldError" id={errorId}>
          {error}
        </small>
      )}
    </label>
  );
}

function getInitialForm(query, direction) {
  const cleanedQuery = cleanValue(query);
  return {
    english: direction === "somali-to-english" ? "" : cleanedQuery,
    somali: direction === "somali-to-english" ? cleanedQuery : "",
    type: "",
    note: ""
  };
}

function cleanForm(form) {
  return Object.fromEntries(Object.entries(form).map(([key, value]) => [key, cleanValue(value)]));
}

function cleanValue(value = "") {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

function validateForm(form) {
  const errors = {};
  validateRequiredWord(form.english, "English word", "english", errors);
  validateRequiredWord(form.somali, "Somali translation", "somali", errors);

  if (form.type && !suggestionTypes.includes(form.type)) errors.type = "Select a supported part of speech.";
  if (form.note.length > 500) errors.note = "Note cannot exceed 500 characters.";
  if (/[<>]/.test(form.note)) errors.note = "Note cannot contain HTML.";
  return errors;
}

function validateRequiredWord(value, label, field, errors) {
  if (!value) errors[field] = `${label} is required.`;
  else if (value.length < 2) errors[field] = `${label} must contain at least 2 characters.`;
  else if (value.length > 120) errors[field] = `${label} cannot exceed 120 characters.`;
  else if (!/\p{L}/u.test(value)) errors[field] = `${label} must contain at least one letter.`;
  else if (/[<>]/.test(value)) errors[field] = `${label} cannot contain HTML.`;
}

function getServerFieldErrors(error) {
  const fieldErrors = error?.details?.fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== "object") return {};

  return Object.fromEntries(
    Object.entries(fieldErrors)
      .map(([field, messages]) => [field, Array.isArray(messages) ? messages[0] : ""])
      .filter(([, message]) => Boolean(message))
  );
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
