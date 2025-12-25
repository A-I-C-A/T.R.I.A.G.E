require('dotenv').config();

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './triagelock.sqlite3'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  },

  production: {
    client: 'sqlite3',
    connection: {
      filename: './triagelock.sqlite3'
    },
    useNullAsDefault: true,
    pool: {
      min: 5,
      max: 30
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations',
      loadExtensions: ['.js']
    },
    seeds: {
      directory: './src/database/seeds'
    }
  }
};
