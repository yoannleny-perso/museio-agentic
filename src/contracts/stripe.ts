export const STRIPE_FUNCTIONS = {
  accountStatus: 'stripe-account-status',
  createAccountLink: 'stripe-create-account-link',
  dashboardLogin: 'stripe-dashboard-login',
  oauthConnect: 'stripe-oauth-connect',
  oauthCallback: 'stripe-oauth-callback',
} as const;

export type StripePlatform = 'web' | 'native';

export interface StripeAccountStatusResponse {
  has_account: boolean;
  onboarding_completed: boolean;
  account_id?: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
  };
}

export interface StripeCreateAccountLinkRequest {
  account_id: string;
}

export interface StripeLinkResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export type StripeLinkFunctionName =
  | (typeof STRIPE_FUNCTIONS.createAccountLink)
  | (typeof STRIPE_FUNCTIONS.dashboardLogin)
  | (typeof STRIPE_FUNCTIONS.oauthConnect);

export interface StripeOAuthConnectRequest {
  platform: StripePlatform;
}

export interface StripeOAuthCallbackRequest {
  code: string;
  state: string;
}

export interface StripeOAuthCallbackResponse {
  success: boolean;
  already_connected?: boolean;
  account_id?: string;
  onboarding_completed?: boolean;
  error?: string;
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const isStripeAccountStatusResponse = (
  value: unknown
): value is StripeAccountStatusResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const requirements = candidate.requirements as Record<string, unknown> | undefined;

  return (
    typeof candidate.has_account === 'boolean' &&
    typeof candidate.onboarding_completed === 'boolean' &&
    (candidate.account_id === undefined ||
      typeof candidate.account_id === 'string') &&
    (candidate.charges_enabled === undefined ||
      typeof candidate.charges_enabled === 'boolean') &&
    (candidate.payouts_enabled === undefined ||
      typeof candidate.payouts_enabled === 'boolean') &&
    (candidate.details_submitted === undefined ||
      typeof candidate.details_submitted === 'boolean') &&
    (requirements === undefined ||
      (isStringArray(requirements.currently_due) &&
        isStringArray(requirements.eventually_due) &&
        isStringArray(requirements.past_due)))
  );
};

export const isStripeLinkResponse = (
  value: unknown
): value is StripeLinkResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.success === 'boolean' &&
    (candidate.url === undefined || typeof candidate.url === 'string') &&
    (candidate.error === undefined || typeof candidate.error === 'string')
  );
};

export const isStripeOAuthCallbackResponse = (
  value: unknown
): value is StripeOAuthCallbackResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.success === 'boolean' &&
    (candidate.already_connected === undefined ||
      typeof candidate.already_connected === 'boolean') &&
    (candidate.account_id === undefined ||
      typeof candidate.account_id === 'string') &&
    (candidate.onboarding_completed === undefined ||
      typeof candidate.onboarding_completed === 'boolean') &&
    (candidate.error === undefined || typeof candidate.error === 'string')
  );
};
