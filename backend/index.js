const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projetos', require('./routes/projetos'));

app.get('/', (req, res) => res.send('API funcionando'));

app.listen(3000, '0.0.0.0', () => {
  console.log('Servidor rodando em 0.0.0.0:3000');
});
