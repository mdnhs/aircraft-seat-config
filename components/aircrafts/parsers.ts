import { createParser } from "nuqs";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

export function parseAsCompressedJson<T>(
  validator: (value: unknown) => T | null = (v) => v as T,
) {
  return createParser<T>({
    parse: (raw) => {
      if (!raw) return null;
      try {
        const json = decompressFromEncodedURIComponent(raw);
        if (!json) return null;
        return validator(JSON.parse(json));
      } catch {
        return null;
      }
    },
    serialize: (value) =>
      compressToEncodedURIComponent(JSON.stringify(value)),
    eq: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  });
}
