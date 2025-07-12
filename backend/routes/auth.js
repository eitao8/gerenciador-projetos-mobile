const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// Registro
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const id = uuidv4();
    await pool.query('INSERT INTO users (id, email, senha) VALUES ($1, $2, $3)', [id, email, senha]);
    res.status(201).json({ message: 'Usuário registrado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log(result.rows); // 👈 Adicione isso para debug
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
    if (user.password !== password) return res.status(401).json({ error: 'Senha incorreta' });

    res.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no login' });
  }
});

module.exports = router;
