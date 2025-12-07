const express = require('express');
const cors = require('cors');
// const morgan = require('morgan');
const apiRouter = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));
// app.use(morgan('dev'));

app.use('/api', apiRouter);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
