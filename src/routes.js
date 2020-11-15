const Router = require('express').Router;

const UserController = require('./app/controllers/UserController');
const SessionController = require('./app/controllers/SessionController');
const RankingController = require('./app/controllers/RankingController');
const KnowledgeController = require('./app/controllers/KnowledgeController');
const UserInterestController = require('./app/controllers/UserInterestController');
const TeacherController = require('./app/controllers/TeacherController');

const authMiddleware = require('./app/middlewares/auth');
const AppointmentController = require('./app/controllers/AppointmentController');

const routes = new Router();

routes.post('/users', UserController.store);
routes.get('/users', UserController.listAll);
routes.get('/users/:id', UserController.listOne);
routes.post('/sessions', SessionController.store);
routes.get('/ranking', RankingController.list);

routes.use(authMiddleware);

routes.put('/users', UserController.update);
routes.post('/knowledges', KnowledgeController.create);
routes.put('/knowledges', KnowledgeController.update);
routes.post('/interests', UserInterestController.create);
routes.delete('/interests/:id', UserInterestController.delete);
routes.post('/teacher', TeacherController.create);
routes.put('/teacher/:id', TeacherController.update);
routes.delete('/teacher/:id', TeacherController.delete);
routes.put('/mentoring/:id', AppointmentController.create);
routes.put('/mentoring/:id/cancel', AppointmentController.delete);
routes.get('/mentoring', AppointmentController.list);

module.exports = routes;
