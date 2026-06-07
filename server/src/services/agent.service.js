import { analyzeIntentAndSelectTool } from "./openai.service.js";
import { findProductByCode } from "./product.service.js";
import { findCheaperStores } from "./price.service.js";

function extractProductCodeFallback(message) {
  const match = message.match(/[A-Z]{2,5}-\d{3,5}/);
  return match ? match[0] : null;
}

export async function runAgent(message) {
  const analysis = await analyzeIntentAndSelectTool(message);

  const tool = analysis.tool;
  const productCode =
    analysis.product_code || extractProductCodeFallback(message);

  if (tool === "price_compare_tool") {
    if (!productCode) {
      return {
        handled: true,
        type: "price_compare",
        tool,
        analysis,
        answer:
          "가격 비교를 위해 상품 코드가 필요합니다. 예: QNT-001 더 싸게 파는 곳 찾아줘",
        sources: [],
      };
    }

    const product = findProductByCode(productCode);

    if (!product) {
      return {
        handled: true,
        type: "price_compare",
        tool,
        analysis,
        answer: `${productCode} 상품 정보를 찾을 수 없습니다.`,
        sources: [],
      };
    }

    const stores = findCheaperStores(productCode);

    if (stores.length === 0) {
      return {
        handled: true,
        type: "price_compare",
        tool,
        analysis,
        answer: `${product.product_name}의 가격 비교 결과를 찾을 수 없습니다.`,
        sources: [],
      };
    }

    const cheapest = stores[0];

    const storeList = stores
      .map((store, index) => {
        return `${index + 1}. ${store.mall}
- 상품가: ${store.price.toLocaleString()}원
- 배송비: ${store.shipping_fee.toLocaleString()}원
- 총 가격: ${store.total_price.toLocaleString()}원
- 링크: ${store.url}`;
      })
      .join("\n\n");

    return {
      handled: true,
      type: "price_compare",
      tool,
      analysis,
      answer: `${product.product_name} 기준으로 배송비 포함 최저가는 ${cheapest.mall}입니다.

${storeList}`,
      sources: stores,
    };
  }

  if (tool === "product_lookup_tool") {
    if (!productCode) {
      return {
        handled: true,
        type: "product_lookup",
        tool,
        analysis,
        answer:
          "상품 정보를 조회하려면 상품 코드를 입력해주세요. 예: QNT-001 상품 정보 알려줘",
        sources: [],
      };
    }

    const product = findProductByCode(productCode);

    if (!product) {
      return {
        handled: true,
        type: "product_lookup",
        tool,
        analysis,
        answer: `${productCode} 상품 정보를 찾을 수 없습니다.`,
        sources: [],
      };
    }

    return {
      handled: true,
      type: "product_lookup",
      tool,
      analysis,
      answer: `상품명: ${product.product_name}
브랜드: ${product.brand}
가격: ${product.price.toLocaleString()}원
링크: ${product.url}`,
      sources: [product],
    };
  }

  if (tool === "faq_search_tool") {
    return {
      handled: false,
      type: "faq",
      tool,
      analysis,
    };
  }

  return {
    handled: false,
    type: "faq",
    tool: "none",
    analysis,
  };
}