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
    private val baseUrl: String = BuildConfig.VERCEL_KV_REST_URL,
    private val token: String = BuildConfig.VERCEL_KV_REST_TOKEN,
) {
    private val http = OkHttpClient()
    private val json = Json { ignoreUnknownKeys = true }
    private val jsonMedia = "application/json; charset=utf-8".toMediaType()

    // ── internal helpers ────────────────────────────────────────────────

    private fun String.jsonEscape() = replace("\\", "\\\\").replace("\"", "\\\"")

    /** Send a single command via the pipeline endpoint; returns the first result element. */
    private suspend fun exec(vararg args: String): JsonElement? = withContext(Dispatchers.IO) {
        if (baseUrl.isBlank() || token.isBlank()) return@withContext null
        try {
            val body = buildString {
                append("[[")
                args.forEachIndexed { i, arg ->
                    if (i > 0) append(",")
                    append("\"${arg.jsonEscape()}\"")
                }
                append("]]")
            }.toRequestBody(jsonMedia)

            val request = Request.Builder()
                .url("$baseUrl/pipeline")
                .header("Authorization", "Bearer $token")
                .post(body)
                .build()

            val response = http.newCall(request).execute()
            if (!response.isSuccessful) {
                Timber.w("KV ${args.first()} failed: HTTP ${response.code}")
                return@withContext null
            }
            val raw = response.body?.string() ?: return@withContext null
            // Response: [{"result": <value>}, ...]
            json.parseToJsonElement(raw).jsonArray
                .firstOrNull()?.jsonObject?.get("result")
        } catch (e: Exception) {
            Timber.e(e, "KV exec error: ${args.firstOrNull()}")
            null
        }
    }

    // ── public API ──────────────────────────────────────────────────────

    suspend fun set(key: String, value: String): Boolean =
        exec("SET", key, value)?.jsonPrimitive?.content == "OK"

    suspend fun get(key: String): String? =
        exec("GET", key)?.jsonPrimitive?.content

    suspend fun hset(key: String, field: String, value: String): Boolean =
        exec("HSET", key, field, value) != null

    suspend fun hgetall(key: String): Map<String, String> = withContext(Dispatchers.IO) {
        if (baseUrl.isBlank() || token.isBlank()) return@withContext emptyMap()
        try {
            val body = """[["HGETALL","${key.jsonEscape()}"]]""".toRequestBody(jsonMedia)
            val request = Request.Builder()
                .url("$baseUrl/pipeline")
                .header("Authorization", "Bearer $token")
                .post(body)
                .build()
            val response = http.newCall(request).execute()
            if (!response.isSuccessful) return@withContext emptyMap()
            val raw = response.body?.string() ?: return@withContext emptyMap()
            val arr: JsonArray = json.parseToJsonElement(raw).jsonArray
                .firstOrNull()?.jsonObject?.get("result")?.jsonArray
                ?: return@withContext emptyMap()
            // Flat array [field1, val1, field2, val2, ...]
            val map = mutableMapOf<String, String>()
            var i = 0
            while (i + 1 < arr.size) {
                map[arr[i].jsonPrimitive.content] = arr[i + 1].jsonPrimitive.content
                i += 2
            }
            map
        } catch (e: Exception) {
            Timber.e(e, "KV hgetall error for $key")
            emptyMap()
        }
    }

    suspend fun hincrby(key: String, field: String, amount: Long): Long? =
        exec("HINCRBY", key, field, amount.toString())?.jsonPrimitive?.content?.toLongOrNull()

    suspend fun zadd(key: String, score: Double, member: String): Boolean =
        exec("ZADD", key, score.toString(), member) != null
}
