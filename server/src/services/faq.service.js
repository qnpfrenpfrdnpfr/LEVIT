import { getDb } from "../db/sqlite.js";

function extractKeywords(message) {
  const keywords = [
    "반품",
    "교환",
    "환불",
    "취소",
    "배송",
    "결제",
    "주문",
    "입금",
    "무통장",
    "쿠폰",
    "포인트",
    "사이즈",
    "상품",
    "리뷰",
    "후기",
    "로그인",
    "회원",
    "앱",
  ];

  const matched = keywords.filter((keyword) => message.includes(keyword));

  // 아무 키워드도 안 잡히면 전체 문장으로 검색
  return matched.length > 0 ? matched : [message];
}

export async function searchFaq(message, limit = 5) {
  const db = await getDb();
  const keywords = extractKeywords(message);

  const conditions = [];
  const params = [];

  for (const keyword of keywords) {
    conditions.push(`
      question LIKE ?
      OR answer LIKE ?
      OR question_type LIKE ?
      OR category LIKE ?
    `);

    const likeKeyword = `%${keyword}%`;
    params.push(likeKeyword, likeKeyword, likeKeyword, likeKeyword);
  }

  const whereClause = conditions.map((c) => `(${c})`).join(" OR ");

  const rows = await db.all(
    `
    SELECT
      id,
      service,
      category,
      question_type,
      question,
      answer,
      source_url
    FROM faq
    WHERE ${whereClause}
    LIMIT ?
    `,
    [...params, limit]
  );

  await db.close();

  return rows;
}