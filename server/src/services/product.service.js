import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const productsPath = path.join(__dirname, "../../data/products.json");

function getProducts() {
  const data = fs.readFileSync(productsPath, "utf-8");
  return JSON.parse(data);
}

export function findProductByCode(productCode) {
  const products = getProducts();

  return products.find((product) => product.product_code === productCode);
}
