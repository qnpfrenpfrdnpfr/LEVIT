import React, { useState } from "react";
import ChatBox from "./components/ChatBox";
import MessageList from "./components/MessageList";
import { sendChatMessage } from "./api/chatApi";
import "./style.css";

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "안녕하세요. 온라인 의류 쇼핑 중 궁금한 주문, 결제, 배송, 교환, 반품, 환불, 사이즈 관련 질문을 물어보세요.",
    },
  ]);

  const [loading, setLoading] = useState(false);

  const handleSend = async (userMessage) => {
    const nextMessages = [
      ...messages,
      {
        role: "user",
        content: userMessage,
      },
    ];

    setMessages(nextMessages);
    setLoading(true);

    try {
      const data = await sendChatMessage(userMessage);

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "죄송합니다. 답변 생성 중 오류가 발생했습니다.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app">
      <section className="hero">
        <h1>온라인 의류 쇼핑 상담 AI Agent</h1>
        <p>
          크롤링한 FAQ 데이터와 리뷰 데이터를 기반으로 주문, 결제, 배송, 교환, 반품,
          환불, 사이즈 관련 질문에 답변합니다.
        </p>
      </section>

      <section className="chat-panel">
        <MessageList messages={messages} />
        <ChatBox onSend={handleSend} loading={loading} />
      </section>
    </main>
  );
}
