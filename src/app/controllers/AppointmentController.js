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
}

module.exports = new AppointmentController();
