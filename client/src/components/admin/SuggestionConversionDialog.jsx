"use client";

import { ArrowLeft, BookPlus, CheckCircle2, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/errorMessage";

const partsOfSpeech = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "pronoun",
  "conjunction",
  "interjection",
  "phrase",
  "other"
];

const emptyForm = { english: "", somali: "", type: "other", category: "" };

export function SuggestionConversionDialog({
  busy,
  categories,
  onClose,
  onConfirm,
  open,
  suggestion
}) {
  const dialogRef = useRef(null);
  const firstInputRef = useRef(null);
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState("edit");
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && suggestion && !dialog.open) {
      setForm({
        english: suggestion.english || "",
        somali: suggestion.somali || "",
        type: suggestion.type || "other",
        category: ""
      });
      setStep("edit");
      setError("");
      dialog.showModal();
      window.setTimeout(() => firstInputRef.current?.focus(), 0);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, suggestion]);

  function requestClose() {
    if (!busy) onClose();
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function reviewConversion(event) {
    event.preventDefault();
    const cleaned = {
      english: form.english.trim(),
      somali: form.somali.trim(),
      type: form.type,
      category: form.category
    };

    if (!cleaned.english || !cleaned.somali || !cleaned.type || !cleaned.category) {
      setError("English, Somali, type, and category are required.");
      return;
    }

    setForm(cleaned);
    setStep("confirm");
  }

  async function confirmConversion() {
    setError("");
    try {
      await onConfirm(form);
    } catch (conversionError) {
      setError(getErrorMessage(conversionError, "Could not add this word to the dictionary."));
    }
  }

  const selectedCategory = categories.find((category) => category._id === form.category);

  return (
    <dialog
      aria-labelledby="suggestion-conversion-title"
      className="suggestionConversionDialog"
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        requestClose();
      }}
      ref={dialogRef}
    >
      <div className="suggestionConversionShell">
        <header className="suggestionReviewHeader">
          <div>
            <span>Dictionary publication</span>
            <h2 id="suggestion-conversion-title">
              {step === "confirm" ? "Confirm dictionary entry" : "Add to Dictionary"}
            </h2>
          </div>
          <button aria-label="Close conversion form" disabled={busy} onClick={requestClose} type="button">
            <X size={20} />
          </button>
        </header>

        {error && <p className="conversionError" role="alert">{error}</p>}

        {step === "edit" ? (
          <form className="conversionForm" onSubmit={reviewConversion}>
            <label className="adminField">
              <span>English word</span>
              <input
                maxLength={160}
                onChange={(event) => updateForm("english", event.target.value)}
                ref={firstInputRef}
                required
                value={form.english}
              />
            </label>
            <label className="adminField">
              <span>Somali translation</span>
              <input
                maxLength={160}
                onChange={(event) => updateForm("somali", event.target.value)}
                required
                value={form.somali}
              />
            </label>
            <label className="adminField">
              <span>Type</span>
              <select onChange={(event) => updateForm("type", event.target.value)} required value={form.type}>
                {partsOfSpeech.map((type) => <option key={type} value={type}>{capitalize(type)}</option>)}
              </select>
            </label>
            <label className="adminField">
              <span>Category</span>
              <select
                onChange={(event) => updateForm("category", event.target.value)}
                required
                value={form.category}
              >
                <option disabled value="">Select category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
            </label>

            {suggestion?.note && (
              <aside className="conversionNote">
                <strong>Suggestion note</strong>
                <p>{suggestion.note}</p>
              </aside>
            )}

            {categories.length === 0 && (
              <p className="conversionCategoryWarning" role="status">
                No stored active categories are available. Create a category in the dashboard first.
              </p>
            )}

            <div className="conversionActions">
              <button className="ghostButton" onClick={requestClose} type="button">Cancel</button>
              <button className="primaryButton" disabled={categories.length === 0} type="submit">
                Review entry
                <BookPlus size={18} />
              </button>
            </div>
          </form>
        ) : (
          <section className="conversionConfirmation">
            <p>Confirm the exact entry that will become publicly searchable.</p>
            <dl>
              <ConversionItem label="English" value={form.english} />
              <ConversionItem label="Somali" value={form.somali} />
              <ConversionItem label="Type" value={capitalize(form.type)} />
              <ConversionItem label="Category" value={selectedCategory?.name || "-"} />
            </dl>
            <div className="conversionActions">
              <button className="ghostButton" disabled={busy} onClick={() => setStep("edit")} type="button">
                <ArrowLeft size={18} />
                Edit
              </button>
              <button className="primaryButton" disabled={busy} onClick={confirmConversion} type="button">
                {busy ? <Loader2 className="spin" size={18} /> : <CheckCircle2 size={18} />}
                Confirm & Add to Dictionary
              </button>
            </div>
          </section>
        )}
      </div>
    </dialog>
  );
}

function ConversionItem({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function capitalize(value = "") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
