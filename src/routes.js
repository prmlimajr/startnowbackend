const Router = require('express').Router;

const UserController = require('./app/controllers/UserController');
const SessionController = require('./app/controllers/SessionController');
const RankingController = require('./app/controllers/RankingController');
const KnowledgeController = require('./app/controllers/KnowledgeController');
const UserInterestController = require('./app/controllers/UserInterestController');

const authMiddleware = require('./app/middlewares/auth');

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

module.exports = routes;
