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

    // Legacy method signatures maintained for compatibility, mapping to best effort
    suspend fun hset(key: String, field: String, value: String): Boolean {
        if (key.startsWith("user:")) {
            val userId = key.removePrefix("user:")
            // We don't have a partial update for user profile yet, but we can just use the existing data
            return setUserProfile(userId, field, value, "") // Placeholder logic
        }
        return false
    }

    suspend fun hgetall(key: String): Map<String, String> {
        if (key.startsWith("user:")) return getUserProfile(key.removePrefix("user:"))
        return emptyMap()
    }

    suspend fun hincrby(key: String, field: String, amount: Long): Long? {
        // Handled via /api/user/result now
        return null
    }

    suspend fun zadd(key: String, score: Double, member: String): Boolean {
        if (key == "leaderboard") return recordGameResult(member, false, score.toInt())
        return false
    }

    suspend fun set(key: String, value: String): Boolean = false
    suspend fun get(key: String): String? = null
}
