import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function isOpenAIConfigured() {
  const apiKey = process.env.OPENAI_API_KEY;

  return Boolean(
    apiKey &&
      apiKey.trim() &&
      apiKey !== "여기에_본인_API_KEY" &&
      apiKey.startsWith("sk-")
  );
}

export async function generateAnswer(prompt) {
  if (!isOpenAIConfigured()) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "너는 온라인 의류 쇼핑 상담 AI Agent다. 크롤링된 FAQ 데이터를 바탕으로 사용자 질문에 답변한다.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
  });

  return response.choices[0].message.content;
}

export async function analyzeIntentAndSelectTool(message) {
  if (!isOpenAIConfigured()) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
너는 온라인 의류 쇼핑몰 AI Agent의 라우터다.
사용자 요청을 분석해서 어떤 Tool을 사용해야 하는지 결정한다.

사용 가능한 tool은 다음과 같다.

1. faq_search_tool
- 배송, 반품, 교환, 환불, 결제, 쿠폰, 회원가입 등 FAQ성 질문에 사용한다.

2. product_lookup_tool
- 상품 코드나 상품명을 기반으로 상품 정보를 조회할 때 사용한다.
- 예: "QNT-001 상품 정보 알려줘", "이 상품 가격 알려줘"

3. price_compare_tool
- 최저가, 더 싸게 파는 곳, 가격 비교, 다른 쇼핑몰 링크 요청에 사용한다.
- 예: "QNT-001 더 싸게 파는 곳 찾아줘", "이거 최저가 찾아줘"

반드시 JSON만 출력해.
설명 문장, 마크다운, 코드블록은 출력하지 마.

출력 형식:
{
  "intent": "faq | product_lookup | price_compare | unknown",
  "tool": "faq_search_tool | product_lookup_tool | price_compare_tool | none",
  "product_code": "상품 코드가 있으면 입력, 없으면 빈 문자열",
  "reason": "짧은 판단 이유"
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
    console.error("Intent JSON parse error:", content);

    return {
      intent: "unknown",
      tool: "none",
      product_code: "",
      reason: "LLM 의도 분석 결과를 JSON으로 파싱하지 못했습니다.",
    };
  }
}