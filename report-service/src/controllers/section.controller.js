const sections = require('../constants/sections.js');
const { OK } = require('../utils/httpResponses.js');

class SectionController {
  static async list(_req, res) {
    return new OK({ metadata: sections }).send(res);
  }
}

module.exports = SectionController;
