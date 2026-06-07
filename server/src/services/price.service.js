import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pricePath = path.join(__dirname, "../../data/price_compare.json");

function getPriceData() {
  const data = fs.readFileSync(pricePath, "utf-8");
  return JSON.parse(data);
}

export function findCheaperStores(productCode) {
  const priceData = getPriceData();

  return priceData
    .filter((item) => item.product_code === productCode)
    .map((item) => ({
      ...item,
      total_price: item.price + item.shipping_fee,
    }))
    .sort((a, b) => a.total_price - b.total_price);
}
