const express = require('express');
const morgan = require('morgan');

const movieRouter = require('./Routes/moviesRoutes');
const authRouter = require('./Routes/authRouter');
const userRouter = require('./Routes/userRouter');
const CustomError = require('./Utils/CustomError');

const globalErrorHandler = require('./Controllers/errorController');

let app = express();

//custom middele ware for test purpose
const logger = function (req, res, next) {
  console.log('cuttom middle ware');
  next();
};

app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.static('./public'));
app.use(logger);
app.use((req, res, next) => {
  req.requestedAt = new Date().toISOString();
  next();
});

// creating router and passing to router middle ware
app.use('/api/v1/movies', movieRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);

//default route , when route is not defined
app.use('*', (req, res, next) => {
  const err = new CustomError(
    `Canot find ${req.originalUrl} on the server`,
    404
  );
  next(err);
});

//Global Error Handling middle ware in express js

app.use(globalErrorHandler);

module.exports = app;
