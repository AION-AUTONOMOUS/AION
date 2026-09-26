package com.aion.autonomous.mobile

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets

object AionApi {
    fun health(): String = request("GET", "/health")
    fun agents(): String = request("GET", "/agents")
    fun services(): String = request("GET", "/services")
    fun chat(message: String, agent: String = "mobile-orchestrator"): String {
        val payload = JSONObject().put("message", message).put("agent", agent).toString()
        return request("POST", "/chat", payload)
    }
    private fun request(method: String, path: String, body: String? = null): String {
        val connection = (URL(BuildConfig.AION_API_BASE_URL + path).openConnection() as HttpURLConnection)
        connection.requestMethod = method
        connection.connectTimeout = 10000
        connection.readTimeout = 20000
        connection.setRequestProperty("Accept", "application/json")
        if (body != null) {
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json; charset=utf-8")
            connection.outputStream.use { it.write(body.toByteArray(StandardCharsets.UTF_8)) }
        }
        return try {
            val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
            stream.bufferedReader(StandardCharsets.UTF_8).use { it.readText() }
        } finally { connection.disconnect() }
    }
}
