const { getPlatformDashboardStats } = require("../repositories/admin.repository");

const getAdminDashboardStatistics = async () => getPlatformDashboardStats();

module.exports = {
  getAdminDashboardStatistics,
};