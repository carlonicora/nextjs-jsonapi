/**
 * The currency the token-usage surfaces render monetary values in.
 *
 * The package cannot infer this: the figures come from whatever per-million-token
 * rates the consuming app configured, and those are denominated in whatever
 * currency that app buys inference in — EUR for one consumer, USD for another
 * whose rates are OpenRouter list prices. So the app declares it once at
 * bootstrap, next to configureJsonApi().
 *
 * EUR is the default purely for backward compatibility: the previous
 * implementation hard-coded a euro sign, so an app that never calls this keeps
 * rendering exactly what it rendered before.
 */
let currency = "EUR";

export function configureTokenUsage(config: { currency: string }): void {
  currency = config.currency;
}

export function getTokenUsageCurrency(): string {
  return currency;
}
