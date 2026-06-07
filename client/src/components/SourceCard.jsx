import React from "react";

export default function SourceCard({ source }) {
  return (
    <div className="source-card">
      <div className="source-meta">
        <span>{source.service}</span>
        <span>{source.question_type}</span>
      </div>

      <div className="source-question">
        <strong>FAQ 질문:</strong> {source.question}
      </div>

      <div className="source-answer">
        <strong>FAQ 답변:</strong> {source.answer}
      </div>

      {source.source_url && (
        <a href={source.source_url} target="_blank" rel="noreferrer">
          원문 보기
        </a>
      )}
    </div>
  );
}
