require('dotenv/config');
const Logger = require('./lib/logger');
const cors = require('cors');

const app = require('./app');

const PORT = process.env.PORT || 3333;

app.use(cors());

app.listen(PORT, () => {
  Logger.success(`Conectado na porta ${PORT}`);
});
