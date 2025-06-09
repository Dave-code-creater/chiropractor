class HealthController {
  static async healthCheck(req, res) {
    res.status(200).json({ status: 'ok' });
  }
}

module.exports = HealthController;
