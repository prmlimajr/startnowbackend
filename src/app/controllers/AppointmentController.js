const Yup = require('yup');
const dateFns = require('date-fns');
const connection = require('../../database/connection');
const Logger = require('../../lib/logger');

class AppointmentController {
  async create(req, res) {
    Logger.header('controller - appointment - create');
    Logger.header(`[${req.params.id}]`);

    const [appointmentExists] = await connection('mentoring_relationship')
      .select('mentoring_relationship.*')
      .where('mentoring_relationship.id', '=', req.params.id);

    if (!appointmentExists) {
      Logger.error('Appointment does not exists');

      return res.status(400).json({ error: 'Appointment does not exists' });
    }

    if (appointmentExists.clientId) {
      Logger.error('Already taken');

      return res.status(400).json({ error: 'Already taken' });
    }

    if (
      dateFns.isBefore(
        dateFns.parseISO(appointmentExists.appointment),
        new Date()
      )
    ) {
      Logger.error('Can not schedule a past appointment');

      return res
        .status(400)
        .json({ error: 'Can not schedule a past appointment' });
    }

    if (appointmentExists.providerId === req.userId) {
      Logger.error('Can not schedule an appointment with yourself');

      return res
        .status(400)
        .json({ error: 'Can not schedule an appointment with yourself' });
    }

    const appointment = {
      providerId: appointmentExists.providerId,
      clientId: req.userId,
      interestId: appointmentExists.interestId,
      appointment: appointmentExists.appointment,
      rating: appointmentExists.rating,
      created: appointmentExists.created,
      updated: new Date(),
    };

    await connection('mentoring_relationship')
      .update(appointment)
      .where('mentoring_relationship.id', '=', req.params.id);

    Logger.success('[200]');

    return res.json({
      id: appointmentExists.id,
      ...appointment,
    });
  }

  async delete(req, res) {
    Logger.header('controller - appointment - delete');
    Logger.header(`[${req.params.id}]`);

    const [appointmentExists] = await connection('mentoring_relationship')
      .select('mentoring_relationship.*')
      .where({
        'mentoring_relationship.id': req.params.id,
        'mentoring_relationship.clientId': req.userId,
      });

    if (!appointmentExists) {
      Logger.error('Appointment does not exists');

      return res.status(400).json({ error: 'Appointment does not exists' });
    }

    if (
      dateFns.isBefore(
        dateFns.parseISO(appointmentExists.appointment),
        new Date()
      )
    ) {
      Logger.error('Can not cancel a past appointment');

      return res
        .status(400)
        .json({ error: 'Can not cancel a past appointment' });
    }

    const appointment = {
      providerId: appointmentExists.providerId,
      clientId: null,
      interestId: appointmentExists.interestId,
      appointment: appointmentExists.appointment,
      rating: appointmentExists.rating,
      created: appointmentExists.created,
      updated: new Date(),
    };

    await connection('mentoring_relationship')
      .update(appointment)
      .where('mentoring_relationship.id', '=', req.params.id);

    Logger.success('[200]');
    return res.json({
      id: appointmentExists.id,
      ...appointment,
    });
  }

  async list(req, res) {
    Logger.header('controller - appointment - list');

    const appointmentAsTeacher = await connection('mentoring_relationship')
      .select(
        'mentoring_relationship.*',

        'user.first_name as uFirst_name',
        'user.last_name as uLast_name',

        'avatar.path as aPath',

        'interest.description as iDescription'
      )
      .leftJoin('user', 'user.id', 'mentoring_relationship.clientId')
      .leftJoin('avatar', 'user.avatarId', 'avatar.id')
      .leftJoin('interest', 'interest.id', 'mentoring_relationship.interestId')
      .where('mentoring_relationship.providerId', '=', req.userId)
      .orderBy('mentoring_relationship.appointment', 'desc');

    const appointmentsAsStudent = await connection('mentoring_relationship')
      .select(
        'mentoring_relationship.*',

        'user.first_name as uFirst_name',
        'user.last_name as uLast_name',

        'avatar.path as aPath',

        'interest.description as iDescription'
      )
      .leftJoin('user', 'user.id', 'mentoring_relationship.providerId')
      .leftJoin('avatar', 'user.avatarId', 'avatar.id')
      .leftJoin('interest', 'interest.id', 'mentoring_relationship.interestId')
      .where('mentoring_relationship.clientId', '=', req.userId)
      .orderBy('mentoring_relationship.appointment', 'desc');

    if (
      appointmentAsTeacher.length === 0 &&
      appointmentsAsStudent.length === 0
    ) {
      Logger.error('Empty list');

      return res.status(400).json({ error: 'Empty list' });
    }

    const teaching = appointmentAsTeacher.map((row) => {
      return {
        id: row.id,
        interesting: row.iDescription,
        appointment: row.appointment,
        user: {
          firstName: row.uFirst_name,
          lastName: row.uLast_name,
          avatar: {
            path: row.aPath,
          },
        },
      };
    });

    const learning = appointmentsAsStudent.map((row) => {
      return {
        id: row.id,
        interesting: row.iDescription,
        appointment: row.appointment,
        user: {
          firstName: row.uFirst_name,
          lastName: row.uLast_name,
          avatar: {
            path: row.aPath,
          },
        },
      };
    });

    const fullList = [...teaching, ...learning];

    Logger.success('[200]');
    return res.json(fullList);
  }
}

module.exports = new AppointmentController();
