import express from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { category, name } = req.query;
    const userId = req.user.userId;
    let rows;
    if (category) {
      ({ rows } = await pool.query(
        `SELECT location, COUNT(*) as cnt FROM activity_logs
         WHERE user_id=$1 AND category=$2 AND location IS NOT NULL
         GROUP BY location ORDER BY cnt DESC LIMIT 3`,
        [userId, category]
      ));
    } else if (name) {
      ({ rows } = await pool.query(
        `SELECT location, COUNT(*) as cnt FROM activity_logs
         WHERE user_id=$1 AND item_name ILIKE $2 AND location IS NOT NULL
         GROUP BY location ORDER BY cnt DESC LIMIT 3`,
        [userId, `%${name}%`]
      ));
    } else {
      ({ rows } = await pool.query(
        `SELECT location, COUNT(*) as cnt FROM activity_logs
         WHERE user_id=$1 AND location IS NOT NULL
         GROUP BY location ORDER BY cnt DESC LIMIT 5`,
        [userId]
      ));
    }
    res.json({ recommendations: rows.map(r => ({ location: r.location, count: parseInt(r.cnt) })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
