const bcrypt = require('bcryptjs');
const Yup = require('yup');

const connection = require('../../database/connection');
const Logger = require('../../lib/logger');

class UserController {
  async store(req, res) {
    Logger.header('controller - user - store');
    const {
      firstName,
      lastName,
      password,
      birthday,
      email,
      phone,
      city,
      state,
      shortBio,
    } = req.body;
    Logger.log(
      `[${firstName}][${lastName}][${password}][${birthday}][${email}][${phone}][${city}][${state}][${shortBio}]`
    );

    const schema = Yup.object().shape({
      firstName: Yup.string().required(),
      lastName: Yup.string().required(),
      birthday: Yup.date().required(),
      city: Yup.string().required(),
      state: Yup.string().required(),
      email: Yup.string().email().required(),
      phone: Yup.string().required(),
      password: Yup.string().required().min(6),
      shortBio: Yup.string(),
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }

    /**
     * Verifies if the user already exists.
     */
    const [emailExists] = await connection('user')
      .select('user.*')
      .where({ 'user.email': email });

    if (emailExists) {
      Logger.error('User already exists');
      return res.status(403).json({ error: 'User already exists' });
    }

    /**
     * encrypts the password.
     */
    const hashedPassword = await bcrypt.hash(password, 8);

    const isNotMentor = 0;

    const user = {
      first_name: firstName,
      last_name: lastName,
      email,
      birthday,
      city,
      state,
      phone,
      lvl: 1,
      password_hash: hashedPassword,
      short_bio: shortBio,
      isMentor: isNotMentor,
      created: new Date(),
      updated: new Date(),
    };

    /**
     * Inserts into database and returns user
     */
    const [userId] = await connection('user').insert(user, 'id');

    const initialPoints = {
      userId,
      amount: 300,
      created: new Date(),
      updated: new Date(),
    };
    await connection('user_points').insert(initialPoints);

    Logger.success('[200]');
    return res.json({
      id: userId,
      ...user,
    });
  }

  async update(req, res) {
    Logger.header('controller - user - update');

    const {
      firstName,
      lastName,
      birthday,
      email,
      phone,
      city,
      state,
      oldPassword,
      newPassword,
      confirmPassword,
      shortBio,
    } = req.body;

    Logger.header(
      `[${firstName}][${lastName}][${birthday}][${email}][${phone}][${city}][${state}][${oldPassword}][${newPassword}][${confirmPassword}][${shortBio}]`
    );

    /**
     * Inputs validator
     */
    const schema = Yup.object().shape({
      firstName: Yup.string(),
      lastName: Yup.string(),
      birthday: Yup.date(),
      city: Yup.string(),
      state: Yup.string(),
      email: Yup.string().email(),
      phone: Yup.string(),
      shortBio: Yup.string(),
      oldPassword: Yup.string().min(6),
      newPassword: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (newPassword, field) =>
        newPassword ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }

    const [userExists] = await connection('user')
      .select('user.*')
      .where({ 'user.id': req.userId });

    /**
     * Checks if the email is already in the database
     */
    if (email) {
      if (userExists.email === email) {
        Logger.error('Email already in use');
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    /**
     * Validates if the inputed password is the same as stored password
     */
    const checkPassword = (password) => {
      return bcrypt.compare(password, userExists.password_hash);
    };

    const hashedPassword = newPassword
      ? await bcrypt.hash(newPassword, 8)
      : userExists.password_hash;

    if (oldPassword && !(await checkPassword(oldPassword))) {
      Logger.error('Password does not match');
      return res.status(401).json({ error: 'Password does not match' });
    }

    const user = {
      first_name: firstName || userExists.first_name,
      last_name: lastName || userExists.last_name,
      email: email || userExists.email,
      birthday: birthday || userExists.birthday,
      city: city || userExists.city,
      state: state || userExists.state,
      phone: phone || userExists.phone,
      lvl: userExists.lvl,
      password_hash: hashedPassword,
      short_bio: shortBio || userExists.shortBio,
      isMentor: userExists.isMentor,
      avatarId: userExists.avatarId,
      created: userExists.created,
      updated: new Date(),
    };

    await connection('user').update(user).where({ id: req.userId });

    Logger.success('[200]');
    return res.json({
      id: req.userId,
      ...user,
    });
  }

  async listAll(req, res) {
    Logger.header('controller - user - list');

    const users = await connection('user')
      .select(
        'user.*',

        'avatar.path as aPath',

        'user_points.amount as upAmount',

        'knowledge.marketing as kMarketing',
        'knowledge.finances as kFinances',
        'knowledge.legislation as kLegislation',
        'knowledge.leadership as kLeadership',
        'knowledge.sales as kSales'
      )
      .leftJoin('avatar', 'user.avatarId', 'avatar.id')
      .leftJoin('user_points', 'user_points.userId', 'user.id')
      .leftJoin('knowledge', 'knowledge.userId', 'user.id')
      .orderBy('user.first_name', 'asc');

    if (users.length === 0) {
      Logger.error('Empty list');

      res.status(400).json({ error: 'Empty list' });
    }

    const userList = users.map((row) => {
      return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        shortBio: row.short_bio,
        birthday: row.birthday,
        email: row.email,
        phone: row.phone,
        city: row.city,
        state: row.state,
        lvl: row.lvl,
        isMentor: row.isMentor,
        avatarId: row.avatarId,
        created: row.created,
        updated: row.updated,

        avatar: {
          path: row.aPath,
        },

        points: {
          amount: row.upAmount,
        },

        knowledge: {
          marketing: row.kMarketing,
          finances: row.kFinances,
          leadership: row.kLeadership,
          legislation: row.kLegislation,
          sales: row.kSales,
        },
      };
    });

    Logger.success('[200]');
    return res.json(userList);
  }

  async listOne(req, res) {
    Logger.header('controller - user - list one');
    Logger.header(`[${req.params.id}]`);

    const userExists = await connection('user')
      .select(
        'user.*',

        'avatar.path as aPath',

        'user_points.amount as upAmount',

        'knowledge.marketing as kMarketing',
        'knowledge.finances as kFinances',
        'knowledge.legislation as kLegislation',
        'knowledge.leadership as kLeadership',
        'knowledge.sales as kSales'
      )
      .leftJoin('avatar', 'user.avatarId', 'avatar.id')
      .leftJoin('user_points', 'user_points.userId', 'user.id')
      .leftJoin('knowledge', 'knowledge.userId', 'user.id')
      .where('user.id', '=', req.params.id);

    if (userExists.length === 0) {
      Logger.error('Empty list');
      return res.status(400).json({ error: 'Empty list' });
    }

    const [user] = userExists.map((row) => {
      return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        shortBio: row.short_bio,
        birthday: row.birthday,
        email: row.email,
        phone: row.phone,
        city: row.city,
        state: row.state,
        lvl: row.lvl,
        isMentor: row.isMentor,
        avatarId: row.avatarId,
        created: row.created,
        updated: row.updated,

        avatar: {
          path: row.aPath,
        },

        points: {
          amount: row.upAmount,
        },

        knowledge: {
          marketing: row.kMarketing,
          finances: row.kFinances,
          leadership: row.kLeadership,
          legislation: row.kLegislation,
          sales: row.kSales,
        },
      };
    });

    const userInterests = await connection('user_interest')
      .select(
        'user_interest.*',

        'interest.description as iDescription'
      )
      .leftJoin('interest', 'interest.id', 'user_interest.interestId')
      .leftJoin('user', 'user.id', 'user_interest.userId')
      .where('user_interest.userId', '=', req.params.id);

    const interests = [];
    for (let i of userInterests) {
      interests.push(i.iDescription);
    }

    user.interests = interests;

    Logger.success('[200]');
    return res.json(user);
  }
}

module.exports = new UserController();
