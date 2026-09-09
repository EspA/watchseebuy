export const consumerUserFields = {
  firstName: {
    type: "string" as const,
    required: false,
    input: false,
  },
  lastName: {
    type: "string" as const,
    required: false,
    input: false,
  },
  lastLoginAt: {
    type: "date" as const,
    required: false,
    input: false,
  },
  lastIp: {
    type: "string" as const,
    required: false,
    input: false,
  },
  lastCountry: {
    type: "string" as const,
    required: false,
    input: false,
  },
  loginCount: {
    type: "number" as const,
    required: false,
    defaultValue: 0,
    input: false,
  },
};
