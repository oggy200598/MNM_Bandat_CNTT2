const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use('/media', express.static(path.join(__dirname, '..', '..', 'media')));
  app.use('/api', apiRoutes);

  return app;
}

module.exports = createApp;
