/**
 * Reads a request's body as text without ever holding more than `maxBytes` of it.
 *
 * `request.text()` buffers the whole body before anything can check its length, so a client
 * could make the server hold an arbitrarily large payload only to be told it is too big. Here a
 * declared Content-Length over the cap is refused without reading, and a body that declares
 * nothing (or lies) is read chunk by chunk and abandoned the moment it passes the cap.
 */
export const readCappedText = async (
  request: Request,
  maxBytes: number,
): Promise<{ text: string } | { tooLarge: true }> => {
  const declared = request.headers.get("content-length");

  if (declared !== null && Number(declared) > maxBytes) {
    return { tooLarge: true };
  }

  if (!request.body) return { text: "" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();

    if (done) break;

    total += value.byteLength;

    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);

      return { tooLarge: true };
    }

    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { text: new TextDecoder().decode(bytes) };
};
