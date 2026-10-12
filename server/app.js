const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Assignment = require('./models/Assignment');

const app = express();
app.use(cors());
app.use(express.json());

let connectionPromise;
async function connectDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured. Add it to your environment.');
  if (mongoose.connection.readyState === 1) return;
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  }
  try { await connectionPromise; } catch (error) { connectionPromise = null; throw error; }
}

app.get('/api/health', async (_req, res) => {
  try {
    await connectDatabase();
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', message: error.message });
  }
});

app.get('/api/assignments', async (_req, res) => {
  try { await connectDatabase(); res.json(await Assignment.find().sort({ dueDate: 1, createdAt: -1 })); }
  catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/assignments', async (req, res) => {
  try {
    await connectDatabase();
    const assignment = await Assignment.create(req.body);
    res.status(201).json(assignment);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

app.patch('/api/assignments/:id', async (req, res) => {
  try {
    await connectDatabase();
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });
    res.json(assignment);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

app.delete('/api/assignments/:id', async (req, res) => {
  try {
    await connectDatabase();
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });
    res.status(204).end();
  } catch (error) { res.status(400).json({ message: error.message }); }
});

module.exports = app;
