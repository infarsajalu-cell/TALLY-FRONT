const express = require('express');
const router = express.Router();
const Tally = require('../models/Tally');

// POST /tally → Create new tally
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const newTally = new Tally({ name, count: 0 });
    const savedTally = await newTally.save();
    res.status(201).json(savedTally);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /tally → Get all tallies
router.get('/', async (req, res) => {
  try {
    const sortParams = {};
    if (req.query.sort === 'latest') sortParams.createdAt = -1;
    if (req.query.sort === 'highest') sortParams.count = -1;

    let query = {};
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    // Default sorting to newest first if no sort given
    if (!Object.keys(sortParams).length) sortParams.createdAt = -1;

    const tallies = await Tally.find(query).sort(sortParams);
    res.json(tallies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /tally/:id → Get single tally
router.get('/:id', async (req, res) => {
  try {
    const tally = await Tally.findById(req.params.id);
    if (!tally) return res.status(404).json({ message: 'Tally not found' });
    res.json(tally);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /tally/:id → Update tally (name/count)
router.put('/:id', async (req, res) => {
  try {
    const { name, count } = req.body;
    const tally = await Tally.findById(req.params.id);
    if (!tally) return res.status(404).json({ message: 'Tally not found' });

    if (name !== undefined) tally.name = name;
    if (count !== undefined) tally.count = count;

    const updatedTally = await tally.save();
    res.json(updatedTally);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /tally/:id → Delete tally
router.delete('/:id', async (req, res) => {
  try {
    const tally = await Tally.findByIdAndDelete(req.params.id);
    if (!tally) return res.status(404).json({ message: 'Tally not found' });
    res.json({ message: 'Tally deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
