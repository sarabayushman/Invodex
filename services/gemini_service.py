import os

import google.generativeai as genai


def ask_gemini(summary: dict, message: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "Gemini API key is not configured. Add GEMINI_API_KEY in the backend environment to enable AI analytics."
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
    prompt = (
        "You are an Indian SMB sales analyst for a GST-compliant sales app. "
        "Use the supplied business summary, answer concisely, and mention currency in INR.\n\n"
        f"Business summary: {summary}\n\nUser question: {message}"
    )
    response = model.generate_content(prompt)
    return getattr(response, "text", "") or "I could not generate a response."

