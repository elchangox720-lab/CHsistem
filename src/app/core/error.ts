import { HttpErrorResponse } from '@angular/common/http';

interface ApiErrorBody {
  error?: string;
  issues?: Array<{ message?: string } | string>;
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Revisa tu conexión.';
    }

    const body = error.error as ApiErrorBody | string | null;

    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    if (body && typeof body === 'object') {
      if (typeof body.error === 'string' && body.error.trim()) {
        return body.error;
      }

      if (Array.isArray(body.issues)) {
        const messages = body.issues
          .map((issue) => (typeof issue === 'string' ? issue : issue.message))
          .filter((message): message is string => Boolean(message));

        if (messages.length > 0) {
          return messages.join('. ');
        }
      }
    }

    if (error.status === 401) {
      return 'Tu sesión expiró. Inicia sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tienes permisos para esta acción.';
    }
  }

  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}
