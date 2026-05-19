const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export async function getSummary() {
  const response = await fetch(`${API_BASE_URL}/api/summary`);

  if (!response.ok) {
    throw new Error("Unable to load dashboard summary");
  }

  return response.json();
}

export async function sendContactMessage(payload) {
  const response = await fetch(`${API_BASE_URL}/api/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Unable to send message");
  }

  return response.json();
}
