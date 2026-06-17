// Generate a unique joiner ID based on session and browser fingerprint
// This ensures each browser/device joining a session gets a distinct ID

export const getSessionJoinerId = (sessionCode: string): string => {
  const storageKey = `livepulse_joiner_${sessionCode}`;
  
  let joinerId = localStorage.getItem(storageKey);
  
  if (!joinerId) {
    // Generate a unique ID combining session code, timestamp, and random value
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    joinerId = `joiner_${sessionCode}_${timestamp}_${random}`;
    localStorage.setItem(storageKey, joinerId);
  }
  
  return joinerId;
};

export const getJoinerDisplayName = (sessionCode: string): string => {
  const joinerId = getSessionJoinerId(sessionCode);
  // Extract a short readable identifier
  const parts = joinerId.split('_');
  return `Student ${parts[parts.length - 1].substring(0, 6).toUpperCase()}`;
};
