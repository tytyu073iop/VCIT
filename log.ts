const PROMPT_PREVIEW_LENGTH = 80;

export type ErrorFields = {
  errorName: string;
  error: string;
  stack?: string;
};

export function errorFields(error: unknown): ErrorFields {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      error: error.message,
      ...(error.stack !== undefined ? { stack: error.stack } : {}),
    };
  }
  return { errorName: "NonError", error: String(error) };
}

export function promptPreview(prompt: string): string {
  if (prompt.length <= PROMPT_PREVIEW_LENGTH) return prompt;
  return `${prompt.slice(0, PROMPT_PREVIEW_LENGTH - 1)}…`;
}

export function pathSiteId(path: string): string | undefined {
  const match = /^\/(?:isready|site)\/([^/]+)$/.exec(path);
  return match?.[1];
}
