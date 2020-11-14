const Yup = require('yup');

const connection = require('../../database/connection');
const Logger = require('../../lib/logger');

class UserInterestController {
  async create(req, res) {
    Logger.header('controller - user interest - create');

    const { interests } = req.body;

    if (!interests) {
      Logger.error('Empty list');

      return res.status(400).json({ error: 'Empty list' });
    }

    for (let i of interests) {
      await connection('user_interest').insert({
        userId: req.userId,
        interestId: i,
        created: new Date(),
        updated: new Date(),
      });
    }

    Logger.success('[200]');
    return res.json({ ok: true });
  }

  async delete(req, res) {
    Logger.header('controller - user interest - delete');
    Logger.header(`[${req.params.id}]`);

    const [interestExists] = await connection('user_interest')
      .select('user_interest.*')
      .where('user_interest.id', '=', req.params.id);

    if (!interestExists) {
      Logger.error('Interest does not exists');

      return res.status(400).json({ error: 'Interest does not exists' });
    }

    await connection('user_interest')
      .del()
      .where('user_interest.id', '=', req.params.id);

    Logger.success('[200]');
    return res.json({ ok: true });
  }
}

module.exports = new UserInterestController();
