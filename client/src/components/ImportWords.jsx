"use client";

import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, Save, Upload, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/errorMessage";
import { commitWordImport, getAdminToken, previewWordImport } from "@/lib/adminApi";

const expectedColumns = [
  "english",
  "somali",
  "type",
  "definitionEnglish",
  "definitionSomali",
  "exampleEnglish",
  "exampleSomali",
  "category",
  "letter"
];

export function ImportWords() {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [importComplete, setImportComplete] = useState(false);

  const validRows = useMemo(() => rows.filter((row) => row.status === "valid"), [rows]);

  useEffect(() => {
    setIsAuthenticated(Boolean(getAdminToken()));
    setAuthChecked(true);
  }, []);

  async function handlePreview(event) {
    event.preventDefault();
    if (!file) return;

    setLoading(true);
    setMessage(null);
    setRows([]);
    setSummary(null);

    try {
      const result = await previewWordImport(file);
      setRows(result.rows || []);
      setSummary(result.summary);
      setMessage({ type: "success", text: "File parsed. Review the rows before saving." });
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not preview the import file.") });
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    setSaving(true);
    setMessage(null);

    try {
      const result = await commitWordImport(rows.map((row) => row.raw));
      const insertedCount = result.insertedCount ?? result.importedCount ?? 0;
      const skippedCount = result.skippedCount ?? Math.max(rows.length - insertedCount, 0);
      const nextSummary = result.summary || {
        totalRows: result.parsedRows ?? rows.length,
        validRows: result.validRows ?? insertedCount,
        importedRows: insertedCount,
        skippedRows: skippedCount,
        duplicateRows: result.duplicateCount ?? 0,
        invalidRows: result.invalidRows?.length || 0
      };
      setSummary(nextSummary);
      setRows([]);
      setFile(null);
      setImportComplete(true);
      window.localStorage.setItem(
        "dictionary_import_success",
        JSON.stringify({
          importedRows: insertedCount,
          at: Date.now()
        })
      );
      setMessage({ type: "success", text: `Import complete. ${insertedCount} words were saved.` });
      window.setTimeout(() => {
        window.location.assign("/admin");
      }, 900);
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not save imported words.") });
    } finally {
      setSaving(false);
    }
  }

  if (!authChecked) {
    return (
      <main className="importPage">
        <section className="importAuthNotice">
          <Loader2 className="spin" size={34} />
          <h1>Checking admin session</h1>
          <p>Preparing the import workspace.</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="importPage">
        <section className="importAuthNotice">
          <FileSpreadsheet size={34} />
          <h1>Admin import requires sign in</h1>
          <p>Sign in to the admin dashboard before uploading CSV or Excel dictionary files.</p>
          <a className="primaryButton" href="/admin">
            Go to admin
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="importPage">
      <nav className="searchNav">
        <a className="brand darkBrand" href="/admin">
          Dictionary Admin
        </a>
        <div>
          <a href="/admin">Dashboard</a>
          <a href="/search">Search</a>
          <a href="/">Public site</a>
        </div>
      </nav>

      <header className="importHeader">
        <p className="eyebrow">Bulk import</p>
        <h1>Import English and Somali words from CSV or Excel.</h1>
        <p>Upload a file, review validation results, then save only valid rows to MongoDB.</p>
      </header>

      {message && <ImportNotice type={message.type} text={message.text} />}

      {importComplete && (
        <section className="importActionPanel">
          <div>
            <h2>Import saved</h2>
            <p>Open Words Management to see the newest imported entries at the top of the table.</p>
          </div>
          <a className="primaryButton" href="/admin">
            Go to Words Management
          </a>
        </section>
      )}

      <section className="importGrid">
        <form className="importPanel" onSubmit={handlePreview}>
          <div className="panelTitle">
            <Upload />
            <span>Upload file</span>
          </div>
          <label className="fileDrop">
            <FileSpreadsheet size={34} />
            <strong>{file ? file.name : "Choose CSV or Excel file"}</strong>
            <span>Accepted formats: .csv, .xlsx up to 5MB</span>
            <input
              accept=".csv,.xlsx"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>
          <button className="primaryButton" disabled={!file || loading} type="submit">
            {loading ? <Loader2 className="spin" size={18} /> : <Upload size={18} />}
            Preview import
          </button>
        </form>

        <section className="importPanel">
          <div className="panelTitle">
            <CheckCircle2 />
            <span>Expected columns</span>
          </div>
          <div className="columnList">
            {expectedColumns.map((column) => (
              <code key={column}>{column}</code>
            ))}
          </div>
        </section>
      </section>

      {summary && <ImportSummary summary={summary} />}

      {rows.length > 0 && (
        <section className="importPreviewPanel">
          <div className="surfaceHeader">
            <div>
              <h2>Preview rows</h2>
              <p>Invalid and duplicate rows are skipped automatically.</p>
            </div>
            <button className="primaryButton" disabled={validRows.length === 0 || saving} onClick={handleCommit} type="button">
              {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
              Save {validRows.length} valid rows
            </button>
          </div>

          <div className="importTable">
            <div className="importTableHead">
              <span>Row</span>
              <span>Status</span>
              <span>English</span>
              <span>Somali</span>
              <span>Type</span>
              <span>Category</span>
              <span>Issues</span>
            </div>
            {rows.map((row) => (
              <article className={`importTableRow import-${row.status}`} key={row.rowNumber}>
                <span>{row.rowNumber}</span>
                <span>
                  <ImportStatus status={row.status} />
                </span>
                <span>{row.raw.english}</span>
                <span>{row.raw.somali}</span>
                <span>{row.raw.type}</span>
                <span>{row.raw.category}</span>
                <span>{row.errors.length > 0 ? row.errors.join("; ") : "Ready to import"}</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ImportNotice({ type, text }) {
  return (
    <div className={`adminNotice ${type === "error" ? "noticeError" : "noticeSuccess"} importNotice`}>
      <span>{text}</span>
    </div>
  );
}

function ImportSummary({ summary }) {
  const items = [
    ["Total rows", summary.totalRows],
    ["Valid rows", summary.validRows ?? 0],
    ["Imported rows", summary.importedRows],
    ["Skipped rows", summary.skippedRows],
    ["Duplicate rows", summary.duplicateRows],
    ["Invalid rows", summary.invalidRows]
  ];

  return (
    <section className="importSummary">
      {items.map(([label, value]) => (
        <article key={label}>
          <span>{label}</span>
          <strong>{value ?? 0}</strong>
        </article>
      ))}
    </section>
  );
}

function ImportStatus({ status }) {
  const Icon = status === "valid" ? CheckCircle2 : status === "duplicate" ? AlertCircle : XCircle;

  return (
    <span className={`importStatus importStatus-${status}`}>
      <Icon size={14} />
      {status}
    </span>
  );
}
