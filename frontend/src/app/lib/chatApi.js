import api from "./api";

export const startChat = async (runId) => {
  const res = await api.post(`/postmanai/v1/chatbot/${runId}/chat/start`);
  return res.data;
};

export const sendChatMessage = async (runId, message) => {
  const res = await api.post(`/postmanai/v1/chatbot/${runId}/chat/message`, {
    message,
  });
  return res.data;
};
