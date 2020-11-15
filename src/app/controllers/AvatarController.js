const connection = require('../../database/connection');
const Logger = require('../../lib/logger');

class AvatarController {
  async create(req, res) {
    Logger.header('controller - avatar - create');
    Logger.header(`[${req.userId}]`);

    const [userExists] = await connection('user')
      .select('user.*')
      .where('user.id', '=', req.userId);

    if (!userExists) {
      Logger.error('User not found');

      return res.status(400).json({ error: 'User not found' });
    }

    const { originalname: name, filename: path } = req.file;

    const file = {
      name,
      path,
    };

    const [id] = await connection('avatar').insert(file, 'id');

    await connection('user').update({ avatarId: id }).where({ id: req.userId });

    return res.json({ ok: true, id });
  }

  async delete(req, res) {
    Logger.header('controller - avatar - delete');

    const [userExists] = await connection('user')
      .select('user.*')
      .where('user.id', '=', req.userId);

    if (!userExists.avatarId) {
      Logger.error('User does not have an avatar');

      return res.status(400).json({ error: 'User does not have an avatar' });
    }

    const user = {
      id: userExists.id,
      first_name: userExists.first_name,
      last_name: userExists.last_name,
      password_hash: userExists.password_hash,
      birthday: userExists.birthday,
      email: userExists.email,
      phone: userExists.phone,
      state: userExists.state,
      city: userExists.city,
      lvl: userExists.lvl,
      avatarId: null,
      created: userExists.created,
      updated: new Date(),
      short_bio: userExists.short_bio,
    };

    await connection('user').update(user).where('user.id', '=', req.userId);

    await connection('avatar')
      .del()
      .where('avatar.id', '=', userExists.avatarId);

    Logger.success('[200]');
    return res.json(user);
  }
}

module.exports = new AvatarController();
