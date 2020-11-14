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

  async update(req, res) {
    Logger.header('controller - knowledge - update');

    const { marketing, finances, legislation, leadership, sales } = req.body;

    Logger.log(
      `[${marketing}][${finances}][${legislation}][${leadership}][${sales}]`
    );

    const schema = Yup.object().shape({
      marketing: Yup.number().positive(),
      finances: Yup.number().positive(),
      legislation: Yup.number().positive(),
      leadership: Yup.number().positive(),
      sales: Yup.number().positive(),
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }

    const [userExists] = await connection('user')
      .select('user.*')
      .where('user.id', '=', req.userId);

    if (!userExists) {
      Logger.error('User not found');

      return res.status(400).json({ error: 'User not found' });
    }

    const knowledges = {
      userId: req.userId,
      marketing: marketing || userExists.marketing,
      finances: finances || userExists.finances,
      legislation: legislation || userExists.legislation,
      leadership: leadership || userExists.leadership,
      sales: sales || userExists.sales,
      created: userExists.created,
      updated: new Date(),
    };

    await connection('knowledge')
      .update(knowledges)
      .where('knowledge.userId', '=', req.userId);

    Logger.success('[200]');
    return res.json(knowledges);
  }
}

module.exports = new KnowledgeController();
