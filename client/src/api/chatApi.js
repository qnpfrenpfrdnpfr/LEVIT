const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function sendChatMessage(message) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error("서버 요청 실패");
  }

  return await response.json();
}