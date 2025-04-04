const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');
const mongoose = require('mongoose');
console.log(app.get('env'));
//CREATE A SERVER
//console.log(process.env);
mongoose.connect(process.env.CONN_STR).then((conn) => {
  //console.log(conn);
  console.log('db connection successfully');
});

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`server has started at port:  ${port}`);
});

// process.on('unhandledRejection', (err) => {
//   console.log(err.name, err.message);
//   console.log('Unhandle error occurs shuting down...');
//   server.close(() => {
//     process.exit(1);
//   });
// });

// process.on('uncaughtException', (err) => {
//   console.log(err.name, err.message);
//   console.log('Uncought Exception occurs shuting down...');
//   server.close(() => {
//     process.exit(1);
//   });
// });

//console.log(x);
