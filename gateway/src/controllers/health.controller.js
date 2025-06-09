class HealthController {
  static healthCheck(_req, res) {
    res.json({ status: 'ok' });
  }
}

module.exports = HealthController;
