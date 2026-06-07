import { searchFaq } from "../services/faq.service.js";
import { generateAnswer, isOpenAIConfigured } from "../services/openai.service.js";
import { buildPrompt } from "../utils/promptBuilder.js";
import { runAgent } from "../services/agent.service.js";
import { runFashionReviewTool } from "../tools/tool_runner.js";

function buildFaqFallbackAnswer(faqs) {
  if (faqs.length === 0) {
    return [
      "검색된 FAQ 데이터에서 바로 연결되는 답변을 찾지 못했습니다.",
      "정확한 확인이 필요합니다.",
      "구매 전 최신 안내를 한 번 더 확인해 주세요.",
    ].join("\n");
  }

  const mainFaq = faqs[0];

  return [
    `${mainFaq.service || "쇼핑몰"} FAQ 기준으로 안내드릴게요.`,
    mainFaq.answer,
    "구매 전 최신 안내를 한 번 더 확인해 주세요.",
  ].join("\n\n");
}

export async function chatWithAgent(req, res) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "message는 필수입니다.",
      });
    }

    const fashionResult = await runFashionReviewTool(message);

    if (fashionResult) {
      return res.json(fashionResult);
    }

    /**
     * 1. 먼저 Agent가 처리할 수 있는 요청인지 확인
     * 예:
     * - QNT-001 더 싸게 파는 곳 찾아줘
     * - QNT-001 상품 정보 알려줘
     */
    const agentResult = await runAgent(message);

    if (agentResult.handled) {
      return res.json({
        answer: agentResult.answer,
        type: agentResult.type,
        sources: agentResult.sources || [],
      });
    }

    /**
     * 2. Agent가 처리하지 못한 일반 질문은 기존 FAQ + OpenAI 흐름 사용
     */
    const faqs = await searchFaq(message, 5);

    const prompt = buildPrompt({
      userMessage: message,
      faqs,
    });

    const answer = isOpenAIConfigured()
      ? await generateAnswer(prompt)
      : buildFaqFallbackAnswer(faqs);

    return res.json({
      answer,
      type: "faq",
      sources: faqs,
    });
  } catch (error) {
    console.error("chatWithAgent error:", error);

    return res.status(500).json({
      error: "서버에서 답변 생성 중 오류가 발생했습니다.",
    });
  }
}
