const connection = require('../../database/connection');
const Logger = require('../../lib/logger');

class RankingController {
  async list(req, res) {
    Logger.header('controller - ranking - list');

    const ranking = await connection('user_points')
      .select(
        'user_points.*',

        'user.first_name as uFirst_name',
        'user.last_name as uLast_name',
        'user.lvl as uLvl',
        'user.avatarId as uAvatarId',

        'avatar.path as aPath'
      )
      .leftJoin('user', 'user_points.userId', 'user.id')
      .leftJoin('avatar', 'avatar.id', 'user.avatarId')
      .orderBy('user_points.amount', 'desc');

    if (ranking.length === 0) {
      Logger.error('Empty list');
      return res.status(400).json({ error: 'Empty list' });
    }

    const rankingList = ranking.map((row) => {
      return {
        id: row.userId,
        firstName: row.uFirst_name,
        lastName: row.uLast_name,
        lvl: row.uLvl,
        points: row.amount,
        avatar: row.aPath,
      };
    });

    Logger.success('[200]');
    return res.json(rankingList);
  }
}

module.exports = new RankingController();
