import Papa from 'papaparse';
import features from '../../shared/features.json' with { type: 'json' };

export type Row = Record<string, number>;

/** Validate the whole batch before exposing any rows for inference. */
export function parseCsv(text: string): Row[] {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true, skipEmptyLines: 'greedy', transformHeader: header => header.trim(),
  });
  const headers = parsed.meta.fields ?? [];
  if (parsed.errors.length || headers.length !== features.length || features.some(f => !headers.includes(f.name))) {
    throw new Error('CSV cần đúng 7 cột như tệp mẫu; không kèm cột Class.');
  }
  if (!parsed.data.length || parsed.data.length > 1000) throw new Error('CSV cần từ 1 đến 1000 dòng.');
  return parsed.data.map((row, index) => {
    const result = Object.fromEntries(features.map(f => {
      const raw = row[f.name]?.trim();
      const value = Number(raw);
      if (!raw || !Number.isFinite(value) || !Number.isFinite(Math.fround(value)) ||
          (f.exclusiveMin ? value <= f.min : value < f.min) || (f.max !== null && value > f.max)) {
        throw new Error(`Dòng ${index + 1}: ${f.name} thiếu hoặc ngoài miền hợp lệ.`);
      }
      return [f.name, value];
    }));
    if (result.MajorAxisLength < result.MinorAxisLength) throw new Error(`Dòng ${index + 1}: MajorAxisLength phải ≥ MinorAxisLength.`);
    if (result.ConvexArea < result.Area) throw new Error(`Dòng ${index + 1}: ConvexArea phải ≥ Area.`);
    return result;
  });
}
