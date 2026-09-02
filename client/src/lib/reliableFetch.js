const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);
const SAFE_METHODS = new Set(["GET", "HEAD"]);

export async function reliableFetch(url, options = {}) {
  const { timeoutMs = 10000, retries = 0, ...fetchOptions } = options;
  const method = (fetchOptions.method || "GET").toUpperCase();
  const maxRetries = SAFE_METHODS.has(method) ? Math.max(0, Math.min(retries, 1)) : 0;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const attemptSignal = createAttemptSignal(fetchOptions.signal, timeoutMs);
    let response;
    let requestError;

    try {
      response = await fetch(url, {
        ...fetchOptions,
        signal: attemptSignal.signal
      });
    } catch (error) {
      requestError = error;
    } finally {
      attemptSignal.cleanup();
    }

    if (requestError) {
      if (fetchOptions.signal?.aborted) throw requestError;
      if (attempt < maxRetries) {
        await waitBeforeRetry(attempt, fetchOptions.signal);
        continue;
      }
      throw createConnectionError(requestError, attemptSignal.didTimeout());
    }

    if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < maxRetries) {
      await response.body?.cancel().catch(() => {});
      await waitBeforeRetry(attempt, fetchOptions.signal);
      continue;
    }

    return response;
  }

  throw new Error("Request failed");
}

export async function readJsonResponse(response, fallbackMessage = "API request failed") {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(getResponseErrorMessage(response.status, body.message, fallbackMessage));
    error.name = "ApiRequestError";
    error.status = response.status;
    error.details = body.details;
    error.requestId = body.requestId || response.headers.get("x-request-id") || undefined;
    throw error;
  }

  return response.status === 204 ? null : body;
}

function createAttemptSignal(externalSignal, timeoutMs) {
  const controller = new AbortController();
  let timedOut = false;
  let timeoutId;

  const abortFromCaller = () => controller.abort(externalSignal.reason);

  if (externalSignal?.aborted) {
    abortFromCaller();
  } else {
    externalSignal?.addEventListener("abort", abortFromCaller, { once: true });
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup() {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener("abort", abortFromCaller);
    }
  };
}

function createConnectionError(error, timedOut) {
  const connectionError = new Error(
    timedOut
      ? "The dictionary service is taking longer than expected. Please try again."
      : "The dictionary service is temporarily unavailable. Please try again in a moment."
  );
  connectionError.name = "ApiRequestError";
  connectionError.code = timedOut ? "API_TIMEOUT" : "API_UNAVAILABLE";
  connectionError.cause = error;
  return connectionError;
}

function getResponseErrorMessage(status, serverMessage, fallbackMessage) {
  if ([502, 503, 504].includes(status)) {
    return "The dictionary service is temporarily unavailable. Please try again in a moment.";
  }
  if (status === 429) {
    return serverMessage || "Too many requests. Please wait a moment and try again.";
  }
  return serverMessage || `${fallbackMessage}: ${status}`;
}

function waitBeforeRetry(attempt, signal) {
  const delayMs = 300 * (attempt + 1);

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);
    const onAbort = () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);
      reject(signal.reason || createAbortError());
    };

    if (signal?.aborted) {
      onAbort();
      return;
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function createAbortError() {
  if (typeof DOMException !== "undefined") return new DOMException("The request was aborted", "AbortError");
  const error = new Error("The request was aborted");
  error.name = "AbortError";
  return error;
}
