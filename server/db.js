const pg = require("pg");
const uuid = require('uuid');
const bcrypt = require("bcrypt");

const client = new pg.Client(
    process.env.DATABASE_URL || { database: "acme_store_db" }
);

const createTables = async () => {
    const SQL = `
          DROP TABLE IF EXISTS favorites;
          DROP TABLE IF EXISTS products;
          DROP TABLE IF EXISTS users;
  
          CREATE TABLE users (
              id UUID PRIMARY KEY,
              username VARCHAR(100) NOT NULL UNIQUE,
              password VARCHAR(255) NOT NULL
          );
          CREATE TABLE products (
              id UUID PRIMARY KEY,
              name VARCHAR(100) UNIQUE NOT NULL
          );
          CREATE TABLE favorites (
              id UUID PRIMARY KEY,
              product_id UUID REFERENCES products(id) NOT NULL,
              user_id UUID REFERENCES users(id) NOT NULL,
              CONSTRAINT favorite_user_product UNIQUE (user_id, product_id)
              )
          `;
    await client.query(SQL);
};

const createUser = async ({ username, password }) => {
    const SQL = `
          INSERT INTO users (id, username, password)
          VALUES ($1, $2, $3) 
          RETURNING *
      `;
    const response = await client.query(SQL, [uuid.v4(), username, await bcrypt.hash(password, 5)]);
    return response.rows[0];
};

const createProduct = async ({ name }) => {
    const SQL = `
          INSERT INTO products (id, name)
          VALUES ($1, $2) 
          RETURNING *
      `;
    const response = await client.query(SQL, [uuid.v4(), name]);
    return response.rows[0];
};

const createFavorite = async ({ user_id, product_id }) => {
    const SQL = `
          INSERT INTO favorites (id, user_id, product_id)
          VALUES ($1, $2, $3) 
          RETURNING *
      `;
    const response = await client.query(SQL, [uuid.v4(), user_id, product_id]);
    return response.rows[0];
};

const fetchUsers = async () => {
    const SQL = `
    SELECT id, username FROM users;
    `;

    const results = await client.query(SQL);
    return results.rows;
};

const fetchProducts = async () => {
    const SQL = `
    SELECT * FROM products
    `;

    const results = await client.query(SQL);
    return results.rows;
};

const fetchFavorites = async (userId) => {
    const SQL = `
    SELECT favorites.id, users.username, products.name AS product
    FROM favorites
    JOIN users ON favorites.user_id = users.id
    JOIN products ON favorites.product_id = products.id
    WHERE user_id = $1;
`;
    const results = await client.query(SQL, [userId]);
    return results.rows;
};

const deleteFavorite = async (id, user_id) => {
    const SQL = ` 
    DELETE 
    FROM favorites
    WHERE id = $1 AND user_id = $2;
`;
    await client.query(SQL, [id, user_id]);
};

module.exports = {
    client,
    createTables,
    createUser,
    createProduct,
    createFavorite,
    fetchUsers,
    fetchProducts,
    fetchFavorites,
    deleteFavorite,
};