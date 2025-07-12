const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // URL do banco no .env
  ssl: {
    rejectUnauthorized: false, // necessário para alguns provedores na nuvem (ex: Heroku, Supabase)
  },
});

module.exports = pool;
