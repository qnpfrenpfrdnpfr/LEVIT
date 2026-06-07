export function buildPrompt({ userMessage, faqs }) {
  const faqContext =
    faqs.length > 0
      ? faqs
          .map((faq, index) => {
            return `
[FAQ ${index + 1}]
서비스: ${faq.service || "알 수 없음"}
카테고리: ${faq.category || "없음"}
질문 유형: ${faq.question_type || "없음"}
질문: ${faq.question}
답변: ${faq.answer}
출처: ${faq.source_url || "없음"}
`;
          })
          .join("\n")
      : "검색된 FAQ 데이터가 없습니다.";

  return `
너는 35~50세 여성 소비자를 위한 온라인 의류 쇼핑 상담 AI Agent야.

사용자의 질문에 대해 아래 [크롤링된 FAQ 데이터]를 우선 근거로 답변해.
반드시 지켜야 할 규칙:
1. 제공된 FAQ 데이터에 근거해서 답변해.
2. FAQ 데이터에 없는 내용은 확정적으로 말하지 말고 "정확한 확인이 필요합니다"라고 말해.
3. 답변은 친절하고 쉬운 한국어로 해.
4. 주문/결제/배송/교환/반품/환불 관련 질문이면 절차와 주의사항을 함께 알려줘.
5. 마지막에 "구매 전 최신 안내를 한 번 더 확인해 주세요."라고 안내해.

[크롤링된 FAQ 데이터]
${faqContext}

[사용자 질문]
${userMessage}

[답변]
`;
}