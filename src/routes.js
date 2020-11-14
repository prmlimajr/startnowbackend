const Router = require('express').Router;

const UserController = require('./app/controllers/UserController');
const SessionController = require('./app/controllers/SessionController');
const RankingController = require('./app/controllers/RankingController');

const authMiddleware = require('./app/middlewares/auth');

const routes = new Router();

routes.post('/users', UserController.store);
routes.get('/users', UserController.listAll);
routes.get('/users/:id', UserController.listOne);
routes.post('/sessions', SessionController.store);
routes.get('/ranking', RankingController.list);

routes.use(authMiddleware);
routes.put('/users', UserController.update);

module.exports = routes;
