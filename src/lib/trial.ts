const TRIAL_DAYS = 30;

export function getTrialStatus(orgCreatedAt: string) {
  const created = new Date(orgCreatedAt);
  const now = new Date();
  const msElapsed = now.getTime() - created.getTime();
  const daysElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, TRIAL_DAYS - daysElapsed);
  const expired = daysElapsed >= TRIAL_DAYS;

  return { daysElapsed, daysRemaining, expired };
}
