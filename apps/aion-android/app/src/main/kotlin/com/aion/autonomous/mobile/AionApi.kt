package com.aion.autonomous.mobile

import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets

object AionApi {
    fun health(): String = request("/health")
    fun agents(): String = request("/agents")
    private fun request(path: String): String {
        val connection = (URL(BuildConfig.AION_API_BASE_URL + path).openConnection() as HttpURLConnection)
        connection.requestMethod = "GET"
        connection.connectTimeout = 8000
        connection.readTimeout = 8000
        connection.setRequestProperty("Accept", "application/json")
        return try {
            val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
            stream.bufferedReader(StandardCharsets.UTF_8).use { it.readText() }
        } finally { connection.disconnect() }
    }
}
