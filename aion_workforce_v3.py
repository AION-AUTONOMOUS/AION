!pip install groq -q

from groq import Groq
from datetime import datetime

client = Groq(api_key="ضع_المفتاح_هنا")

def ask_agent(role, task):
    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": "You are a " + role + " agent at AION AUTONOMOUS. Answer in Arabic, briefly and professionally."},
                {"role": "user", "content": task}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        return "ERROR: " + str(e)


def execute_mission(mission):
    print("=" * 60)
    print("MISSION: " + mission)
    print("Time: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("=" * 60)
    print()

    agents = [
        ("Researcher", "ابحث وحلل: " + mission),
        ("Marketer", "اقترح خطة تسويقية لـ: " + mission),
        ("Sales", "اقترح استراتيجية مبيعات لـ: " + mission),
        ("Auditor", "راجع الخطة وأعطِ ملاحظات على: " + mission)
    ]

    results = {}
    for role, task in agents:
        print("[" + role + "]")
        print("-" * 40)
        result = ask_agent(role, task)
        print(result)
        print()
        results[role] = result

    return results


print("=" * 60)
print("AION AUTONOMOUS - AI WORKFORCE v3.0")
print("The AI Company That Never Sleeps")
print("=" * 60)
print()

result = execute_mission("إطلاق AION في السوق النرويجي")

print("=" * 60)
print("MISSION COMPLETED")
print("=" * 60)
