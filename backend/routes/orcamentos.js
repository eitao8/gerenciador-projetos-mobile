const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// Listar orçamentos
router.get('/', async (req, res) => {
  const { usuario_id } = req.query;
  try {
    const result = await pool.query('SELECT * FROM orcamentos WHERE usuario_id = $1 ORDER BY criado_em DESC', [usuario_id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar orçamentos' });
  }
});

// Criar orçamento
router.post('/', async (req, res) => {
  const { consumo_kwh, placas, economia } = req.body;
  try {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO orcamentos (id, consumo_kwh, placas, economia) VALUES ($1, $2, $3, $4)',
      [id, consumo_kwh, placas, economia]
    );
    res.status(201).json({ message: 'Orçamento criado', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar orçamento' });
  }
});

module.exports = router;
