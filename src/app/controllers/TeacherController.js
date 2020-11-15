const Yup = require('yup');
const dateFns = require('date-fns');
const connection = require('../../database/connection');
const Logger = require('../../lib/logger');

class TeacherController {
  async create(req, res) {
    Logger.header('controller - teacher controller - create');

    const { interestId, appointment } = req.body;

    Logger.header(`[${interestId}][${appointment}]`);

    const schema = Yup.object().shape({
      interestId: Yup.number().positive().required(),
      appointment: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');
      return res.status(400).json({ error: 'Validation failed' });
    }

    if (dateFns.isBefore(dateFns.parseISO(appointment), new Date())) {
      Logger.error('Can not schedule a past hour');

      return res.status(400).json({ error: 'Can not schedule a past hour' });
    }

    const [mentor] = await connection('user')
      .select('user.*')
      .where('user.id', '=', req.userId);

    if (!mentor.isMentor) {
      Logger.error('User can not create a mentoring lesson');
      return res
        .status(400)
        .json({ error: 'User can not create a mentoring lesson' });
    }

    const [mentoringExists] = await connection('mentoring_relationship')
      .select('mentoring_relationship.*')
      .where({
        'mentoring_relationship.providerId': req.userId,
        'mentoring_relationship.appointment': appointment,
      });

    if (mentoringExists) {
      Logger.error('You already have an appointment scheduled for this time');

      return res.status(400).json({
        error: 'You already have an appointment scheduled for this time',
      });
    }

    const mentoring = {
      providerId: req.userId,
      interestId,
      appointment,
      created: new Date(),
      updated: new Date(),
    };

    const [id] = await connection('mentoring_relationship').insert(
      mentoring,
      'id'
    );

    if (!id) {
      Logger.error('Connection failed');

      return res.status(400).json({ error: 'Connection failed' });
    }

    Logger.success('[200]');
    return res.json({
      id,
      ...mentoring,
    });
  }

  async update(req, res) {
    Logger.header('controller - teacher - update');
    Logger.header(`[${req.params.id}]`);

    const { interestId, appointment, newAppointment } = req.body;

    Logger.header(`[${interestId}][${appointment}][${newAppointment}]`);

    const schema = Yup.object().shape({
      interestId: Yup.number().positive(),
      appointment: Yup.date(),
      newAppointment: Yup.date().when('appointment', (appointment, field) =>
        appointment ? field.required() : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      Logger.error('Validation failed');

      return res.status(400).json({ error: 'Validation failed' });
    }

    const [appointmentExists] = await connection('mentoring_relationship')
      .select('mentoring_relationship.*')
      .where({
        'mentoring_relationship.providerId': req.userId,
        'mentoring_relationship.appointment': appointment,
      });

    console.log(appointmentExists);
    if (!appointmentExists) {
      Logger.error('Appointment not found');

      return res.status(400).json({ error: 'Appointment not found' });
    }

    if (appointmentExists.clientId) {
      Logger.error(
        'You can not update an appointment scheduled with other user. Please cancel'
      );

      return res.status(400).json({
        error:
          'You can not update an appointment scheduled with other user. Please cancel',
      });
    }

    if (dateFns.isBefore(dateFns.parseISO(appointment), new Date())) {
      Logger.error('Can not schedule a past hour');

      return res.status(400).json({ error: 'Can not schedule a past hour' });
    }
    console.log(newAppointment, appointmentExists.appointment);
    const mentoring = {
      id: appointmentExists.id,
      providerId: req.userId,
      clientId: appointmentExists.clientId,
      interestId: interestId || appointmentExists.interestId,
      appointment: newAppointment || appointmentExists.appointment,
      rating: appointmentExists.rating,
      created: appointmentExists.created,
      updated: new Date(),
    };

    await connection('mentoring_relationship')
      .update(mentoring)
      .where('mentoring_relationship.id', '=', appointmentExists.id);

    Logger.success('[200]');
    return res.json({
      id: appointmentExists.id,
      ...mentoring,
    });
  }

  async delete(req, res) {
    Logger.header('controller - teacher - delete');
    Logger.header(`[${req.params.id}]`);

    const [appointment] = await connection('mentoring_relationship')
      .select('mentoring_relationship.*')
      .where('mentoring_relationship.id', '=', req.params.id);

    if (!appointment) {
      Logger.error('Appointment does not exists');

      return res.status(400).json({ error: 'Appointment does not exists' });
    }

    await connection('mentoring_relationship')
      .del()
      .where('mentoring_relationship.id', '=', req.params.id);

    Logger.success('[200]');
    return res.json({ ok: true });
  }
}

module.exports = new TeacherController();
