const Yup = require('yup');
const dateFns = require('date-fns');
const connection = require('../../database/connection');
const Logger = require('../../lib/logger');

class RateController {
  async create(req, res) {
    Logger.header('controller - rate - create');

    const { rating } = req.body;
    Logger.header(`[${req.params.id}][${rating}]`);

    const schema = Yup.object().shape({
      rating: Yup.number().positive().required(),
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');

      return res.status(400).json({ error: 'Validation failed' });
    }

    const [mentoringExists] = await connection('mentoring_relationship')
      .select('mentoring_relationship.*')
      .where({
        'mentoring_relationship.id': req.params.id,
        'mentoring_relationship.clientId': req.userId,
      });

    if (!mentoringExists) {
      Logger.error('Not found');

      return res.status(400).json({ error: 'Not found' });
    }

    if (mentoringExists.rating) {
      Logger.error('Already rated this mentoring');

      return res.status(400).json({ error: 'Already rated this mentoring' });
    }

    if (
      dateFns.isAfter(dateFns.parseISO(mentoringExists.appointment), new Date())
    ) {
      Logger.error('Can not rate a mentoring that did not happened yet');

      return res
        .status(400)
        .json({ error: 'Can not rate a mentoring that did not happend yet' });
    }

    const mentoring = {
      rating,
      updated: new Date(),
    };

    await connection('mentoring_relationship')
      .update(mentoring)
      .where('mentoring_relationship.id', '=', req.params.id);

    Logger.success('[200]');
    return res.json(mentoring);
  }
}

module.exports = new RateController();
