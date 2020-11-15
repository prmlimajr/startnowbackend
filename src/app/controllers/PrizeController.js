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

  async list(req, res) {
    Logger.header('controller - prize - list');

    const [userExists] = await connection('user')
      .select('user.*')
      .where('user.id', '=', req.userId);

    if (!userExists) {
      Logger.error('User not found');

      return res.status(400).json({ error: 'User not found' });
    }

    const transactions = await connection('transactions')
      .select(
        'transactions.*',

        'user.first_name as uFirst_name',
        'user.last_name as uLast_name',

        'points.description as pDescription',
        'points.amount as pAmount',

        'user_points.amount as upAmount'
      )
      .leftJoin('user', 'transactions.userId', 'user.id')
      .leftJoin('points', 'transactions.productId', 'points.id')
      .leftJoin('user_points', 'user.id', 'user_points.userId')
      .where('transactions.userId', '=', req.userId)
      .orderBy('transactions.shoppingTime', 'desc');

    if (transactions.length === 0) {
      Logger.error('Empty list');

      return res.status(400).json({ error: 'Empty list' });
    }

    const transactionsList = {
      user: {
        firstName: transactions[0].uFirst_name,
        lastName: transactions[0].uLast_name,
        wallet: transactions[0].upAmount,
      },
    };

    const productList = transactions.map((row) => {
      return {
        transaction: row.id,
        description: row.pDescription,
        amount: row.pAmount,
        shoppingTime: row.shoppingTime,
      };
    });

    transactionsList.products = productList;

    Logger.success('[200]');
    return res.json(transactionsList);
  }
}

module.exports = new PrizeController();
