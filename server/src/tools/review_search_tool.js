import sqlite3 from "sqlite3";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), "data/fashion_reviews.db");

function connectDb() {
  return new sqlite3.Database(DB_PATH);
}

export function searchReviewsByKeyword(keyword, limit = 10) {
  return new Promise((resolve, reject) => {
    const db = connectDb();

    const likeKeyword = `%${keyword}%`;

    db.all(
      `
      SELECT
        r.review_id,
        r.product_id,
        p.product_name,
        p.brand_name,
        p.price,
        p.sale_price,
        p.product_url,
        p.image_url,

        r.rating,
        r.review_text,
        r.user_height,
        r.user_weight,
        r.usual_size,
        r.purchased_size,
        r.size_feel,
        r.fit_feel,
        r.length_feel,
        r.material_feel
      FROM reviews r
      LEFT JOIN products p
        ON r.product_id = p.product_id
      WHERE r.review_text LIKE ?
         OR r.size_feel LIKE ?
         OR r.fit_feel LIKE ?
         OR r.length_feel LIKE ?
         OR r.material_feel LIKE ?
      ORDER BY r.id ASC
      LIMIT ?
      `,
      [
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        limit,
      ],
      (err, rows) => {
        db.close();

        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}