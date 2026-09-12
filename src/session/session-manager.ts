type UserSession = {
  sessionId: string;
  userId?: string;
};

const GenerateSessionId = (): string => {
  return crypto.randomUUID();
}

export default {
  GenerateSessionId,
};