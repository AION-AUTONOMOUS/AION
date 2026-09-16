!pip install groq -q

from groq import Groq

client = Groq(api_key="ضع_المفتاح_هنا")

def ask_agent(role, task):
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": "You are a " + role + " agent at AION. Answer in Arabic."},
            {"role": "user", "content": task}
        ]
    )
    return response.choices[0].message.content

print("=== AION AI WORKFORCE ===")
print()
print("[Researcher]:", ask_agent("researcher", "اذكر 3 فرص للذكاء الاصطناعي في النرويج"))
print()
print("[Marketer]:", ask_agent("marketer", "اقترح حملة تسويقية لـ AION"))
