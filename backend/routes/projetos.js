const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// Listar projetos por usuário
router.get('/', async (req, res) => {
  const { user_id } = req.query;
  try {
    const result = await pool.query(
      'SELECT id, user_id, nome, custo, status FROM projetos WHERE user_id = $1',
      [user_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    res.status(500).json({ error: 'Erro ao buscar projetos' });
  }
});

// Criar projeto para usuário
router.post('/', async (req, res) => {
  const { nome, custo, status, user_id } = req.body;

  if (!nome || !custo || !status || !user_id) {
    return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO projetos (nome, custo, status, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, custo, status, user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar projeto:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Atualizar projeto existente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, custo, status } = req.body;

  if (!nome || !custo || !status) {
    return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
  }

  try {
    const result = await pool.query(
      'UPDATE projetos SET nome = $1, custo = $2, status = $3 WHERE id = $4 RETURNING *',
      [nome, custo, status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    res.status(500).json({ error: 'Erro ao atualizar projeto' });
  }
});

module.exports = router;
