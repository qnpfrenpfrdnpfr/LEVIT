import OpenAI from "openai";

import {
  getProductList,
  searchProductsByKeyword,
} from "./product_tool.js";

import {
  searchReviewsByKeyword,
} from "./review_search_tool.js";

import {
  extractBodyInfoFromText,
  searchReviewsByBody,
} from "./body_review_tool.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function classifyIntentWithLLM(message) {
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
너는 온라인 패션 쇼핑 AI Agent의 tool selector야.

사용자 질문을 분석해서 아래 tool 중 하나만 선택해.

선택 가능한 tool:
1. FAQ
- 배송, 반품, 교환, 환불, 결제, 쿠폰, 회원가입, 로그인, 주문취소, 고객센터 등 정책/사용법 질문

2. PRODUCT_SEARCH
- 상품 목록, 상품 추천, 셔츠/상의/여름옷 등 상품 자체를 묻는 질문

3. REVIEW_SEARCH
- 후기, 리뷰, 핏, 사이즈감, 소재, 비침, 두께, 기장, 팔뚝, 어깨 등 착용 후기를 묻는 질문

4. BODY_REVIEW_SEARCH
- 사용자가 키/몸무게를 말하고 비슷한 체형의 후기를 요청하는 질문
- 예: "160cm 54kg인데 비슷한 후기 찾아줘"

5. GENERAL
- 위 어디에도 해당하지 않는 일반 질문

반드시 JSON만 출력해.
마크다운, 설명, 코드블럭은 쓰지 마.

출력 형식:
{
  "tool": "FAQ | PRODUCT_SEARCH | REVIEW_SEARCH | BODY_REVIEW_SEARCH | GENERAL",
  "keyword": "검색에 사용할 핵심 키워드",
  "height": 숫자 또는 null,
  "weight": 숫자 또는 null,
  "reason": "선택 이유"
}
        `,
      },
      {
        role: "user",
        content: message,
      },
    ],
    temperature: 0,
  });

  const content = response.choices[0].message.content;

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("LLM intent JSON 파싱 실패:", content);

    return {
      tool: "GENERAL",
      keyword: message,
      height: null,
      weight: null,
      reason: "LLM 응답 파싱 실패",
    };
  }
}

function uniqueProductsFromReviews(reviews) {
  const map = new Map();

  for (const review of reviews) {
    if (!map.has(review.product_id)) {
      map.set(review.product_id, {
        product_id: review.product_id,
        product_name: review.product_name,
        brand_name: review.brand_name,
        price: review.price,
        sale_price: review.sale_price,
        product_url: review.product_url,
        image_url: review.image_url,
      });
    }
  }

  return Array.from(map.values());
}

export async function runFashionReviewTool(message) {
  const intent = await classifyIntentWithLLM(message);

  console.log("LLM이 선택한 tool:", intent);

  if (intent.tool === "FAQ" || intent.tool === "GENERAL") {
    return null;
  }

  let products = [];
  let reviews = [];

  if (intent.tool === "BODY_REVIEW_SEARCH") {
    let height = intent.height;
    let weight = intent.weight;

    if (!height || !weight) {
      const extracted = extractBodyInfoFromText(message);
      height = extracted.height;
      weight = extracted.weight;
    }

    if (!height || !weight) {
      return {
        type: "fashion_review",
        intent: intent.tool,
        answer:
          "비슷한 체형 후기를 찾으려면 키와 몸무게가 필요해요. 예: 160cm 54kg",
        usedData: {
          products: [],
          reviews: [],
        },
        selectedTool: intent,
      };
    }

    reviews = await searchReviewsByBody({
      height,
      weight,
      limit: 10,
    });

    products = uniqueProductsFromReviews(reviews);
  } else if (intent.tool === "REVIEW_SEARCH") {
    const keyword = intent.keyword || message;

    reviews = await searchReviewsByKeyword(keyword, 10);
    products = uniqueProductsFromReviews(reviews);
  } else if (intent.tool === "PRODUCT_SEARCH") {
    const keyword = intent.keyword || "셔츠";

    products = await searchProductsByKeyword(keyword, 5);

    if (products.length === 0) {
      products = await getProductList(5);
    }
  }

  const answer = await generateFashionAnswer({
    message,
    intent,
    products,
    reviews,
  });

  return {
    type: "fashion_review",
    intent: intent.tool,
    answer,
    usedData: {
      products,
      reviews,
    },
    selectedTool: intent,
  };
}

async function generateFashionAnswer({ message, intent, products, reviews }) {
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
너는 35~50세 여성 소비자를 위한 온라인 의류 쇼핑 상담 AI Agent야.

너는 tool이 가져온 상품 데이터와 리뷰 데이터를 바탕으로 답변해야 해.

규칙:
1. 제공된 상품 데이터와 리뷰 데이터만 근거로 답변해.
2. 데이터에 없는 정보는 확정적으로 말하지 마.
3. 사용자가 키/몸무게를 말한 경우, 비슷한 체형 리뷰를 중심으로 답변해.
4. 사이즈, 핏, 소재, 기장, 비침 여부를 우선적으로 설명해.
5. "무조건 구매하세요"처럼 과장하지 마.
6. 답변 마지막에 참고한 상품 수와 리뷰 수를 알려줘.
7. 답변은 친절하고 쉬운 한국어로 해.
        `,
      },
      {
        role: "user",
        content: `
사용자 질문:
${message}

LLM이 선택한 tool:
${JSON.stringify(intent, null, 2)}

상품 데이터:
${JSON.stringify(products, null, 2)}

리뷰 데이터:
${JSON.stringify(reviews, null, 2)}
        `,
      },
    ],
    temperature: 0.3,
  });

  return response.choices[0].message.content;
}