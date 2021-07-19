require("dotenv").config();

module.exports = {
  development: {
    client: "mssql",
    connection: {
      server: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
    },
    debug: false,
  },
  production: {
    client: "mssql",
    connection: {
      server: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
    },
  },
};
