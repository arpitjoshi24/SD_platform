const ACCOUNT_STATUS = Object.freeze({
  ACTIVE: "active",
  SUSPENDED: "suspended",
});

const USER_ROLE = Object.freeze({
  USER: "user",
  ADMIN: "admin",
});

const toSafeUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    account_status: row.account_status,
    timezone: row.timezone,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

module.exports = {
  ACCOUNT_STATUS,
  USER_ROLE,
  toSafeUser,
};