const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// TODO: implement GPX elevation data parsing and grade-adjusted pace per segment
app.post('/api/gpx', (req, res) => {
  res.status(501).json({ error: 'GPX elevation support not yet implemented' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
