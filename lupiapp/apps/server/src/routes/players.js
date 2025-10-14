const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');


// ejemplo: get players online
router.get('/online', async (req, res) => {
const { data, error } = await supabase.from('players').select('*').eq('online_status', true).limit(50);
if (error) return res.status(500).json({ error: error.message });
res.json(data);
});


module.exports = router;