const fs = require('fs').promises;

const LIVE_STATUS_FILE = "LIVE_STATUS.json";

const liveManager = {
  async setStatus(status) {
    const data = { onLive: status };
    try {
      await fs.writeFile(LIVE_STATUS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error setting live status:', error);
    }
  },

  async getStatus() {
    try {
      const data = JSON.parse(await fs.readFile(LIVE_STATUS_FILE));
      return data.onLive;
    } catch (error) {
      console.error('Error getting live status:', error);
      return false;
    }
  }
};

module.exports = { liveManager };
