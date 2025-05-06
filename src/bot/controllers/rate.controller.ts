// Bun-compatible global usage tracker
type UserStat = {
    count: number;
    lastReset: number;
  };
  
  const GLOBAL_LIMIT = 200;  // Pexels free tier
  const USER_LIMIT = {
    private: 6,
    group: 3,
    bonus: 3, // for subscribers
  };
  
  const userUsage = new Map<number, UserStat>();
  let globalUsage = { count: 0, lastReset: Date.now() };
  
  function resetIfExpired(stat: UserStat | typeof globalUsage, ttlMs: number) {
    const now = Date.now();
    if (now - stat.lastReset >= ttlMs) {
      stat.count = 0;
      stat.lastReset = now;
    }
  }
  
  // Called before making a request
  export function canUserRequest(userId: number, isPrivate: boolean, isSubscribed: boolean): boolean {
    resetIfExpired(globalUsage, 60 * 60 * 1000); // reset hourly
    const globalLeft = GLOBAL_LIMIT - globalUsage.count;
    if (globalLeft <= 0) return false;
  
    const userStat = userUsage.get(userId) || { count: 0, lastReset: Date.now() };
    resetIfExpired(userStat, 60 * 60 * 1000);
  
    const userMax = (isPrivate ? USER_LIMIT.private : USER_LIMIT.group) + (isSubscribed ? USER_LIMIT.bonus : 0);
  
    if (userStat.count >= userMax) return false;
  
    return true;
  }
  
  // Called after making a request
  export function recordUsage(userId: number) {
    globalUsage.count += 1;
  
    const userStat = userUsage.get(userId) || { count: 0, lastReset: Date.now() };
    userStat.count += 1;
    userUsage.set(userId, userStat);
  }
  