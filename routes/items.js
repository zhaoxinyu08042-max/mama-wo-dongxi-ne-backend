import express from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { q } = req.query;
  let query = 'SELECT * FROM items WHERE user_id=$1';
  const params = [req.user.userId];
  if (q) { query += ' AND (name ILIKE $2 OR location ILIKE $2 OR caption ILIKE $2)'; params.push(`%${q}%`); }
  query += ' ORDER BY updated_at DESC';
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

router.post('/', async (req, res) => {
  try {
    const { name, location, caption, image_url, category } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO items (user_id, name, location, caption, image_url, category) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user.userId, name, location, caption, image_url, category]
    );
    await pool.query(
      'INSERT INTO activity_logs (user_id, item_id, action, item_name, category, location) VALUES ($1,$2,$3,$4,$5,$6)',
      [req.user.userId, rows[0].id, 'add', name, category, location]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, location, caption, image_url, category } = req.body;
    const { rows } = await pool.query(
      `UPDATE items SET name=$1, location=$2, caption=$3, image_url=$4, category=$5, updated_at=NOW()
       WHERE id=$6 AND user_id=$7 RETURNING *`,
      [name, location, caption, image_url, category, req.params.id, req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'not_found' });
    await pool.query(
      'INSERT INTO activity_logs (user_id, item_id, action, item_name, category, location) VALUES ($1,$2,$3,$4,$5,$6)',
      [req.user.userId, rows[0].id, 'update', name, category, location]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM items WHERE id=$1 AND user_id=$2', [req.params.id, req.user.userId]);
  res.json({ ok: true });
});

export default router;
