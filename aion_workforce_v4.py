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
                {"role": "system", "content": f"You are a {role} agent at AION AUTONOMOUS. Answer in Arabic, briefly."},
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
        ("Researcher-01", "ابحث وحلل: " + mission),
        ("Researcher-02", "ابحث عن معلومات إضافية عن: " + mission),
        ("Analyst-01", "حلل البيانات المتعلقة بـ: " + mission),
        ("Marketer-01", "اقترح خطة تسويقية لـ: " + mission),
        ("Sales-01", "اقترح استراتيجية مبيعات لـ: " + mission),
        ("Coder-01", "اقترح حل تقني لـ: " + mission),
        ("Designer-01", "اقترح تصور بصري لـ: " + mission),
        ("Auditor-01", "راجع الخطة وأعط ملاحظات على: " + mission),
        ("Legal-01", "اذكر الاعتبارات القانونية لـ: " + mission),
        ("Coordinator-01", "لخص كل ما سبق في تقرير نهائي عن: " + mission),
    ]
    results = {}
    for role, task in agents:
        print(f"[{role}]")
        result = ask_agent(role, task)
        print(result)
        results[role] = result
    return results

if __name__ == "__main__":
    execute_mission("إطلاق AION في السوق السعودي")
