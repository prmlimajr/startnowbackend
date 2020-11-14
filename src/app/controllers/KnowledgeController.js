const Yup = require('yup');

const connection = require('../../database/connection');
const Logger = require('../../lib/logger');

class KnowledgeController {
  async create(req, res) {
    Logger.header('controller - knowledge - create');

    const { marketing, finances, legislation, leadership, sales } = req.body;

    Logger.log(
      `[${marketing}][${finances}][${legislation}][${leadership}][${sales}]`
    );

    const schema = Yup.object().shape({
      marketing: Yup.number().positive().required(),
      finances: Yup.number().positive().required(),
      legislation: Yup.number().positive().required(),
      leadership: Yup.number().positive().required(),
      sales: Yup.number().positive().required(),
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }

    const knowledges = {
      userId: req.userId,
      marketing,
      finances,
      legislation,
      leadership,
      sales,
      created: new Date(),
      updated: new Date(),
    };

    const [id] = await connection('knowledge').insert(knowledges, 'id');

    if (!id) {
      Logger.error('Connection error');

      return res.status(400).json({ error: 'Connection error' });
    }

    Logger.success('[200]');
    return res.json({
      id,
      ...knowledges,
    });
  }
}

module.exports = new KnowledgeController();
