import React, { useState } from "react";

export default function ChatBox({ onSend, loading }) {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    onSend(input.trim());
    setInput("");
  };

  return (
    <form className="chat-box" onSubmit={handleSubmit}>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="예: 반품은 어떻게 신청해요? / 저는 키 160cm, 몸무게 50kg이고 여름 셔츠를 아방방하고 입고싶은데 어떤 사이즈가 좋을까요?"
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? "답변 중..." : "질문하기"}
      </button>
    </form>
  );
}
