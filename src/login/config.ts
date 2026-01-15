let _useDiscordAuth: boolean = false;
let _useGoogleAuth: boolean = false;
let _useInternalAuth: boolean = true;
let _allowRegistration: boolean = true;

export interface LoginConfig {
  discordClientId?: string;
  googleClientId?: string;
  useInternalAuth?: boolean;
  allowRegistration?: boolean;
}

export function configureLogin(params: LoginConfig): void {
  _useDiscordAuth = !!params.discordClientId;
  _useGoogleAuth = !!params.googleClientId;
  _useInternalAuth = params.useInternalAuth ?? true;
  _allowRegistration = params.allowRegistration ?? true;
}

export function isDiscordAuthEnabled(): boolean {
  return _useDiscordAuth;
}

export function isGoogleAuthEnabled(): boolean {
  return _useGoogleAuth;
}

export function isInternalAuthEnabled(): boolean {
  return _useInternalAuth;
}

export function isRegistrationAllowed(): boolean {
  return _allowRegistration;
}
