// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://31.56.21.98:20421/socialPanel', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const SettingSchema = new mongoose.Schema({
  name: String,
  avatar: String,
  links: [{ label: String, url: String }]
});
const ClickSchema = new mongoose.Schema({
  ip: String,
  label: String,
  timestamp: { type: Date, default: Date.now }
});

const Setting = mongoose.model('Setting', SettingSchema);
const Click = mongoose.model('Click', ClickSchema);

app.get('/api/settings', async (req, res) => {
  const settings = await Setting.findOne();
  res.json(settings || { name: '', avatar: '', links: [] });
});

app.post('/api/settings', async (req, res) => {
  await Setting.deleteMany({});
  const setting = new Setting(req.body);
  await setting.save();
  res.sendStatus(200);
});

app.get('/api/logs', async (req, res) => {
  const logs = await Click.find().sort({ timestamp: -1 }).limit(100);
  res.json(logs);
});

// Redirect + track
app.get('/go/:label', async (req, res) => {
  const settings = await Setting.findOne();
  const link = settings.links.find(l => l.label === req.params.label);
  if (link) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await new Click({ ip, label: link.label }).save();
    res.redirect(link.url);
  } else {
    res.status(404).send("Link not found.");
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:20421'));
