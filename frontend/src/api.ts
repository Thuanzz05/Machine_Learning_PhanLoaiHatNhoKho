export class ApiFailure extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiFailure';
    this.status = status;
  }
}

/** Keep useful validation details while handling non-JSON gateway responses. */
export async function requestJson<T>(url: string, options: RequestInit, fetcher: typeof fetch = fetch): Promise<T> {
  const response = await fetcher(url, options);
  let body;
  try { body = await response.json(); }
  catch {
    throw new ApiFailure(response.status, response.ok
      ? 'Phản hồi máy chủ không hợp lệ. Vui lòng thử lại.'
      : `Máy chủ chưa trả được kết quả (HTTP ${response.status}). Vui lòng thử lại.`);
  }
  if (!response.ok) {
    const details = Array.isArray(body?.errors) ? body.errors.filter((error: unknown) => typeof error === 'string').slice(0, 5) : [];
    const message = typeof body?.message === 'string' ? body.message : `Không xử lý được yêu cầu (HTTP ${response.status}).`;
    throw new ApiFailure(response.status, [message, ...details].join('\n'));
  }
  return body as T;
}
