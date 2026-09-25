import os
from datetime import datetime
from groq import Groq

def get_client():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is required")
    return Groq(api_key=api_key)

def ask_agent(role, task):
    try:
        response = get_client().chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": f"You are a {role} agent at AION AUTONOMOUS. Answer in Arabic, briefly and professionally."},
                {"role": "user", "content": task},
            ],
        )
        return response.choices[0].message.content
    except Exception as exc:
        return "ERROR: " + str(exc)

def execute_mission(mission):
    print("=" * 60)
    print("MISSION:", mission)
    print("Time:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("=" * 60)
    agents = [
        ("Researcher", "ابحث وحلل: " + mission),
        ("Marketer", "اقترح خطة تسويقية لـ: " + mission),
        ("Sales", "اقترح استراتيجية مبيعات لـ: " + mission),
        ("Auditor", "راجع الخطة وأعطِ ملاحظات على: " + mission),
    ]
    results = {}
    for role, task in agents:
        print(f"[{role}]")
        result = ask_agent(role, task)
        print(result)
        results[role] = result
    return results

if __name__ == "__main__":
    execute_mission("إطلاق AION في السوق النرويجي")
