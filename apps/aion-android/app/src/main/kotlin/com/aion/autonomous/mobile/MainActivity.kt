package com.aion.autonomous.mobile

import android.app.Activity
import android.os.Bundle
import android.graphics.Color
import android.graphics.Typeface
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import kotlin.concurrent.thread

class MainActivity : Activity() {
    private lateinit var status: TextView
    private lateinit var output: TextView
    private lateinit var message: EditText
    private val cyan = Color.rgb(0, 200, 255)
    private val gold = Color.rgb(245, 197, 66)
    private val green = Color.rgb(74, 222, 128)
    private val purple = Color.rgb(122, 75, 255)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        render()
        refresh()
    }

    private fun render() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 24, 24, 24)
            setBackgroundColor(Color.rgb(2, 8, 23))
        }
        root.addView(label("AION", 32f, Color.WHITE, true))
        root.addView(label("AUTONOMOUS • MOBILE CORE", 11f, cyan, false))
        status = label("جاري الاتصال بخدمات AION…", 14f, gold, true)
        root.addView(status)
        val actions = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER }
        actions.addView(button("الخدمات", cyan) { loadServices() })
        actions.addView(button("الوكلاء", purple) { loadAgents() })
        actions.addView(button("تحديث", green) { refresh() })
        root.addView(actions)
        root.addView(label("AION CORE", 20f, gold, true))
        message = EditText(this).apply {
            hint = "اكتب طلبك إلى AION…"
            setHintTextColor(Color.rgb(130, 150, 175))
            setTextColor(Color.WHITE)
            setSingleLine(false)
            minLines = 2
            setPadding(16, 12, 16, 12)
        }
        root.addView(message, LinearLayout.LayoutParams(-1, -2))
        root.addView(button("إرسال إلى AION", cyan) {
            val text = message.text.toString().trim()
            if (text.isNotEmpty()) {
                output.text = "جاري تنفيذ الطلب…"
                thread {
                    try {
                        val result = AionApi.chat(text)
                        runOnUiThread { output.text = result }
                    } catch (e: Exception) {
                        runOnUiThread { output.text = e.message ?: "تعذر الاتصال" }
                    }
                }
            }
        })
        output = label("جاهز.", 13f, Color.rgb(210, 225, 240), false)
        output.setPadding(16, 18, 16, 18)
        ScrollView(this).also { scroll -> scroll.addView(output); root.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f)) }
        setContentView(root)
    }

    private fun refresh() = load { AionApi.health() } { result ->
        status.text = "● AION Mobile Core متصل"
        status.setTextColor(green)
        output.text = result
    }
    private fun loadAgents() = load { AionApi.agents() }
    private fun loadServices() = load { AionApi.services() }
    private fun load(action: () -> String, success: ((String) -> Unit)? = null) {
        thread {
            try {
                val result = action()
                runOnUiThread {
                    if (success != null) success(result) else output.text = result
                }
            } catch (e: Exception) {
                runOnUiThread {
                    status.text = "● تعذر الاتصال"
                    status.setTextColor(Color.rgb(248, 113, 113))
                    output.text = e.message ?: "Unknown error"
                }
            }
        }
    }
    private fun label(text: String, size: Float, color: Int, bold: Boolean) =
        TextView(this).apply {
            this.text = text
            textSize = size
            setTextColor(color)
            gravity = Gravity.CENTER
            if (bold) setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            setPadding(0, 6, 0, 10)
        }
    private fun button(text: String, color: Int, action: () -> Unit) =
        Button(this).apply {
            this.text = text
            setTextColor(Color.WHITE)
            setBackgroundColor(color)
            setOnClickListener { action() }
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply { setMargins(4, 8, 4, 8) }
        }
}
