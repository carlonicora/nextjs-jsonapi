let _useDiscord: boolean = false;
let _useInternalAuth: boolean = true;
let _allowRegistration: boolean = true;

export function configureDiscord(params: {
  useDiscord: boolean;
  useInternalAuth: boolean;
  allowRegistration?: boolean;
}): void {
  _useDiscord = params.useDiscord;
  _useInternalAuth = params.useInternalAuth;
  _allowRegistration = params.allowRegistration ?? true;
}

export function isDiscordConfigured(): boolean {
  return _useDiscord;
}

export function isInternalAuthConfigured(): boolean {
  return _useInternalAuth;
}

export function isRegistrationAllowed(): boolean {
  return _allowRegistration;
}
