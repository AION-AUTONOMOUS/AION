package com.aion.autonomous.mobile

import android.app.Activity
import android.os.Bundle
import android.graphics.Color
import android.graphics.Typeface
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import kotlin.concurrent.thread

class MainActivity : Activity() {
    private lateinit var status: TextView
    private lateinit var output: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        render()
        refresh()
    }

    private fun render() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(28, 28, 28, 28)
            setBackgroundColor(Color.rgb(2, 8, 23))
        }
        root.addView(TextView(this).apply {
            text = "AION"
            textSize = 32f
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
        }, LinearLayout.LayoutParams(-1, -2))
        root.addView(TextView(this).apply {
            text = "AUTONOMOUS • MOBILE CORE"
            textSize = 11f
            setTextColor(Color.rgb(0, 200, 255))
            gravity = Gravity.CENTER
            setPadding(0, 4, 0, 24)
        }, LinearLayout.LayoutParams(-1, -2))
        status = TextView(this).apply {
            text = "جاري الاتصال بخدمات AION…"
            textSize = 15f
            setTextColor(Color.rgb(245, 197, 66))
            setPadding(16, 16, 16, 16)
        }
        root.addView(status)
        val buttons = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER }
        buttons.addView(button("تحديث", Color.rgb(0, 153, 255)) { refresh() })
        buttons.addView(button("الوكلاء", Color.rgb(122, 75, 255)) { loadAgents() })
        root.addView(buttons)
        output = TextView(this).apply {
            textSize = 13f
            setTextColor(Color.rgb(210, 225, 240))
            setPadding(16, 22, 16, 22)
            setTextIsSelectable(true)
        }
        ScrollView(this).also { scroll ->
            scroll.addView(output)
            root.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f))
        }
        setContentView(root)
    }

    private fun button(label: String, color: Int, action: () -> Unit) =
        Button(this).apply { text = label; setTextColor(Color.WHITE); setBackgroundColor(color); setOnClickListener { action() } }

    private fun refresh() {
        thread {
            try {
                val result = AionApi.health()
                runOnUiThread {
                    status.text = "● الخدمة متصلة"
                    status.setTextColor(Color.rgb(74, 222, 128))
                    output.text = result
                }
            } catch (e: Exception) {
                runOnUiThread {
                    status.text = "● تعذر الاتصال بالخدمة"
                    status.setTextColor(Color.rgb(248, 113, 113))
                    output.text = e.message ?: "Unknown error"
                }
            }
        }
    }

    private fun loadAgents() {
        thread {
            try {
                val result = AionApi.agents()
                runOnUiThread { output.text = result }
            } catch (e: Exception) {
                runOnUiThread { output.text = e.message ?: "Unknown error" }
            }
        }
    }
}
