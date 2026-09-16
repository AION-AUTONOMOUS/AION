
!pip install groq -q

from groq import Groq
from datetime import datetime

client = Groq(api_key="ضع_المفتاح_هنا")

def ask_agent(role, task):
    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": "You are a " + role + " agent at AION AUTONOMOUS. Answer in Arabic, briefly."},
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
        ("Researcher-01", "ابحث وحلل: " + mission),
        ("Researcher-02", "ابحث عن معلومات إضافية عن: " + mission),
        ("Analyst-01", "حلل البيانات المتعلقة بـ: " + mission),
        ("Marketer-01", "اقترح خطة تسويقية لـ: " + mission),
        ("Sales-01", "اقترح استراتيجية مبيعات لـ: " + mission),
        ("Coder-01", "اقترح حل تقني لـ: " + mission),
        ("Designer-01", "اقترح تصور بصري لـ: " + mission),
        ("Auditor-01", "راجع الخطة وأعط ملاحظات على: " + mission),
        ("Legal-01", "اذكر الاعتبارات القانونية لـ: " + mission),
        ("Coordinator-01", "لخص كل ما سبق في تقرير نهائي عن: " + mission)
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
print("AION AUTONOMOUS - AI WORKFORCE v4.0")
print("The AI Company That Never Sleeps")
print("10 Real AI Agents")
print("=" * 60)
print()

result = execute_mission("إطلاق AION في السوق السعودي")

print("=" * 60)
print("MISSION COMPLETED")
print("Total agents: 10")
print("=" * 60)
