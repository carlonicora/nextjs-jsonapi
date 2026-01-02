let _useDiscordAuth: boolean = false;
let _useInternalAuth: boolean = true;
let _allowRegistration: boolean = true;

export interface LoginConfig {
  useDiscordAuth: boolean;
  useInternalAuth: boolean;
  allowRegistration?: boolean;
}

export function configureLogin(params: LoginConfig): void {
  _useDiscordAuth = params.useDiscordAuth;
  _useInternalAuth = params.useInternalAuth;
  _allowRegistration = params.allowRegistration ?? true;
}

export function isDiscordAuthEnabled(): boolean {
  return _useDiscordAuth;
}

export function isInternalAuthEnabled(): boolean {
  return _useInternalAuth;
}

export function isRegistrationAllowed(): boolean {
  return _allowRegistration;
}
