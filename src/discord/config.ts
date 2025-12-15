let _useDiscord: boolean = false;
let _useInternalAuth: boolean = true;

export function configureDiscord(params: { useDiscord: boolean; useInternalAuth: boolean }): void {
  _useDiscord = params.useDiscord;
  _useInternalAuth = params.useInternalAuth;
}

export function isDiscordConfigured(): boolean {
  return _useDiscord;
}

export function isInternalAuthConfigured(): boolean {
  return _useInternalAuth;
}
