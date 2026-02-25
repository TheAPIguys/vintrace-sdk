export interface VintraceClientOptions {
  timeout?: number;
  maxRetries?: number;
  parallelLimit?: number;
  validateRequests?: boolean;
  validateResponses?: boolean;
}

export interface VintraceClientConfig {
  baseUrl: string;
  organization: string;
  token: string;
  options?: VintraceClientOptions;
}

export const DEFAULT_OPTIONS: Required<VintraceClientOptions> = {
  timeout: 30000,
  maxRetries: 3,
  parallelLimit: 5,
  validateRequests: true,
  validateResponses: true,
};
