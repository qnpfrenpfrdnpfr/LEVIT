import React from "react";
import SourceCard from "./SourceCard";

export default function MessageList({ messages }) {
  return (
    <div className="message-list">
      {messages.map((message, index) => (
        <div key={index} className={`message ${message.role}`}>
          <div className="message-role">
            {message.role === "user" ? "나" : "AI Agent"}
          </div>

          <div className="message-content">{message.content}</div>

          {message.sources && message.sources.length > 0 && (
            <div className="sources">
              <h4>참고한 크롤링 FAQ 데이터</h4>
              {message.sources.map((source) => (
                <SourceCard key={source.id} source={source} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
