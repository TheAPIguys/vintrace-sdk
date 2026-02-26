import { VintraceResult } from '../types/result';
import { VintraceError, VintraceAggregateError } from './errors';

/**
 * Fetch multiple items by id in parallel (all at once), collecting errors.
 * Returns VintraceAggregateError if any individual request fails.
 */
export async function batchFetch<T>(
  ids: string[],
  fetchFn: (id: string) => Promise<VintraceResult<T>>
): Promise<VintraceResult<T[]>> {
  const results = await Promise.allSettled(ids.map((id) => fetchFn(id)));
  const errors: VintraceError[] = [];
  const data: T[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const [item, error] = result.value;
      if (error) {
        errors.push(error);
      } else if (item !== null) {
        data.push(item);
      }
    } else {
      errors.push(new VintraceError(result.reason?.message ?? 'Unknown error', 0));
    }
  }

  if (errors.length > 0) {
    return [null, new VintraceAggregateError(errors)];
  }

  return [data, null];
}
