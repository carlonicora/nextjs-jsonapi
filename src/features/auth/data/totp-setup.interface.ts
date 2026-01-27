export interface TotpSetupInterface {
  get secret(): string;
  get qrCodeUri(): string;
  get authenticatorId(): string;
}
