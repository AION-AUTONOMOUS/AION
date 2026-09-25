import os
from groq import Groq

def get_client():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is required")
    return Groq(api_key=api_key)

def ask_agent(role, task):
    response = get_client().chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": f"You are a {role} agent at AION. Answer in Arabic."},
            {"role": "user", "content": task},
        ],
    )
    return response.choices[0].message.content

def main():
    print("=== AION AI WORKFORCE ===")
    print("[Researcher]:", ask_agent("researcher", "اذكر 3 فرص للذكاء الاصطناعي في النرويج"))
    print("[Marketer]:", ask_agent("marketer", "اقترح حملة تسويقية لـ AION"))

if __name__ == "__main__":
    main()
