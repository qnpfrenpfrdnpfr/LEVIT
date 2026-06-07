import sqlite3 from "sqlite3";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), "data/fashion_reviews.db");

function connectDb() {
  return new sqlite3.Database(DB_PATH);
}

export function extractBodyInfoFromText(message) {
  let height = null;
  let weight = null;

  const heightMatch =
    message.match(/키\s*(\d{3})/) ||
    message.match(/(\d{3})\s*(cm|센치|센티)/);

  const weightMatch =
    message.match(/몸무게\s*(\d{2,3})/) ||
    message.match(/(\d{2,3})\s*(kg|킬로)/);

  if (heightMatch) height = Number(heightMatch[1]);
  if (weightMatch) weight = Number(weightMatch[1]);

  // 예: "160 54인데"처럼 단위 없이 들어온 경우 보완
  if (!height || !weight) {
    const numbers = message.match(/\d+/g)?.map(Number) || [];

    if (numbers.length >= 2) {
      const possibleHeight = numbers.find((n) => n >= 140 && n <= 180);
      const possibleWeight = numbers.find(
        (n) => n >= 35 && n <= 90 && n !== possibleHeight
      );

      if (!height && possibleHeight) height = possibleHeight;
      if (!weight && possibleWeight) weight = possibleWeight;
    }
  }

  return { height, weight };
}

export function searchReviewsByBody({
  height,
  weight,
  heightRange = 3,
  weightRange = 5,
  limit = 10,
}) {
  return new Promise((resolve, reject) => {
    const db = connectDb();

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
      WHERE r.user_height BETWEEN ? AND ?
        AND r.user_weight BETWEEN ? AND ?
      ORDER BY
        ABS(r.user_height - ?) ASC,
        ABS(r.user_weight - ?) ASC,
        r.id ASC
      LIMIT ?
      `,
      [
        height - heightRange,
        height + heightRange,
        weight - weightRange,
        weight + weightRange,
        height,
        weight,
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