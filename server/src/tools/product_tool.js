import sqlite3 from "sqlite3";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), "data/fashion_reviews.db");

function connectDb() {
  return new sqlite3.Database(DB_PATH);
}

export function getProductList(limit = 5) {
  return new Promise((resolve, reject) => {
    const db = connectDb();

    db.all(
      `
      SELECT
        product_id,
        product_name,
        brand_name,
        category,
        price,
        sale_price,
        product_url,
        image_url
      FROM products
      ORDER BY id ASC
      LIMIT ?
      `,
      [limit],
      (err, rows) => {
        db.close();

        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

export function searchProductsByKeyword(keyword, limit = 5) {
  return new Promise((resolve, reject) => {
    const db = connectDb();

    const likeKeyword = `%${keyword}%`;

    db.all(
      `
      SELECT
        product_id,
        product_name,
        brand_name,
        category,
        price,
        sale_price,
        product_url,
        image_url
      FROM products
      WHERE product_name LIKE ?
         OR brand_name LIKE ?
         OR category LIKE ?
      ORDER BY id ASC
      LIMIT ?
      `,
      [likeKeyword, likeKeyword, likeKeyword, limit],
      (err, rows) => {
        db.close();

        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}