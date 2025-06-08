export default class HealthController {
  static healthCheck(_req, res) {
    res.json({ status: 'ok' });
  }
}
