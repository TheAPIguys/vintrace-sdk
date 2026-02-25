import { VintraceError } from '../client/errors';

export type VintraceResult<T> =
  | [data: T, error: null]
  | [data: null, error: VintraceError]
  | [data: null, error: null];
