const connection = require('../../database/connection');
const Logger = require('../../lib/logger');

class PrizeController {
  async create(req, res) {
    Logger.header('controller - prize - create');

    const pointsId = req.params.id;

    const [userExists] = await connection('user')
      .select('user.*')
      .where('user.id', '=', req.userId);

    if (!userExists) {
      Logger.error('User not found');

      return res.status(400).json({ error: 'User not found' });
    }

    const [userPoints] = await connection('user_points')
      .select('user_points.*')
      .where('user_points.userId', '=', req.userId);

    const [points] = await connection('points')
      .select('points.*')
      .where('points.id', '=', pointsId);

    if (points.amount < 0 && userPoints.amount + points.amount < 0) {
      Logger.error('Does not have necessary points');

      return res.status(400).json({ error: 'Does not have necessary points' });
    }

    const amount = userPoints.amount + points.amount;

    await connection('user_points')
      .update({ amount })
      .where('user_points.userId', '=', req.userId);

    const transaction = {
      userId: req.userId,
      productId: pointsId,
      shoppingTime: new Date(),
    };

    await connection('transactions').insert(transaction);

    Logger.success('[200]');
    return res.json({
      userId: req.userId,
      wallet: amount,
    });
  }
}

module.exports = new PrizeController();
