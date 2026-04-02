package com.fracturedearth.sync

import com.fracturedearth.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import timber.log.Timber

/**
 * Minimal Vercel KV (Upstash Redis) REST API client.
 *
 * Uses the pipeline endpoint so all commands share the same JSON-body format,
 * avoiding URL-encoding ambiguity for arbitrary key/value content.
 *
 * Docs: https://upstash.com/docs/redis/features/restapi
 */
class VercelKvClient(
    private val baseUrl: String = BuildConfig.LAN_ROOM_SERVER_URL,
) {
    private val http = OkHttpClient()
    private val json = Json { ignoreUnknownKeys = true }
    private val jsonMedia = "application/json; charset=utf-8".toMediaType()

    private suspend fun post(path: String, jsonString: String): Boolean = withContext(Dispatchers.IO) {
        if (baseUrl.isBlank()) return@withContext false
        try {
            val body = jsonString.toRequestBody(jsonMedia)
            val request = Request.Builder()
                .url("${baseUrl.trimEnd('/')}$path")
                .post(body)
                .build()
            val response = http.newCall(request).execute()
            response.isSuccessful
        } catch (e: Exception) {
            Timber.e(e, "API post failed: $path")
            false
        }
    }

    private suspend fun apiGet(path: String): String? = withContext(Dispatchers.IO) {
        if (baseUrl.isBlank()) return@withContext null
        try {
            val request = Request.Builder()
                .url("${baseUrl.trimEnd('/')}$path")
                .get()
                .build()
            val response = http.newCall(request).execute()
            if (!response.isSuccessful) return@withContext null
            response.body?.string()
        } catch (e: Exception) {
            Timber.e(e, "API get failed: $path")
            null
        }
    }

    // ── Refactored methods mapping to the new API ───────────────────────

    suspend fun setUserProfile(userId: String, displayName: String, email: String, theme: String): Boolean {
        val payload = """{"userId":"$userId","displayName":"$displayName","email":"$email","theme":"$theme"}"""
        return post("/api/user", payload)
    }

    suspend fun getUserProfile(userId: String): Map<String, String> = withContext(Dispatchers.IO) {
        val raw = apiGet("/api/user?userId=$userId") ?: return@withContext emptyMap()
        try {
            val element = json.parseToJsonElement(raw).jsonObject
            element.mapValues { it.value.jsonPrimitive.content }
        } catch (e: Exception) {
            emptyMap()
        }
    }

    suspend fun recordGameResult(userId: String, won: Boolean, points: Int): Boolean {
        val payload = """{"userId":"$userId","won":$won,"survivalPoints":$points}"""
        return post("/api/user/result", payload)
    }

    // ── Generic KV methods restored for compatibility ──────────────────

    suspend fun hset(key: String, field: String, value: String): Boolean {
        val payload = """{"cmd":"hset","key":"$key","field":"$field","value":"$value"}"""
        return post("/api/kv", payload)
    }

    suspend fun hgetall(key: String): Map<String, String> = withContext(Dispatchers.IO) {
        val raw = apiGet("/api/kv?cmd=hgetall&key=$key") ?: return@withContext emptyMap()
        try {
            val element = json.parseToJsonElement(raw).jsonObject
            element.mapValues { it.value.jsonPrimitive.content }
        } catch (e: Exception) {
            emptyMap()
        }
    }

    suspend fun hincrby(key: String, field: String, amount: Long): Long? = withContext(Dispatchers.IO) {
        val payload = """{"cmd":"hincrby","key":"$key","field":"$field","amount":$amount}"""
        try {
            if (baseUrl.isBlank()) return@withContext null
            val body = payload.toRequestBody(jsonMedia)
            val request = Request.Builder().url("${baseUrl.trimEnd('/')}/api/kv").post(body).build()
            val response = http.newCall(request).execute()
            if (!response.isSuccessful) return@withContext null
            val raw = response.body?.string() ?: return@withContext null
            json.parseToJsonElement(raw).jsonObject["value"]?.jsonPrimitive?.content?.toLongOrNull()
        } catch (e: Exception) {
            null
        }
    }

    suspend fun zadd(key: String, score: Double, member: String): Boolean {
        val payload = """{"cmd":"zadd","key":"$key","score":$score,"member":"$member"}"""
        return post("/api/kv", payload)
    }

    suspend fun set(key: String, value: String): Boolean {
        val payload = """{"cmd":"set","key":"$key","value":"$value"}"""
        return post("/api/kv", payload)
    }

    suspend fun get(key: String): String? = withContext(Dispatchers.IO) {
        val raw = apiGet("/api/kv?cmd=get&key=$key") ?: return@withContext null
        try {
            json.parseToJsonElement(raw).jsonObject["value"]?.jsonPrimitive?.content
        } catch (e: Exception) {
            null
        }
    }
}

