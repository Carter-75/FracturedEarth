package com.fracturedearth.sync

import com.fracturedearth.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import timber.log.Timber

@Serializable
private data class CreateLanRoomRequest(
    val hostUserId: String,
    val hostDisplayName: String,
    val maxPlayers: Int,
)

@Serializable
private data class JoinLanRoomRequest(
    val userId: String,
    val displayName: String,
)

@Serializable
private data class LeaveLanRoomRequest(
    val userId: String,
)

@Serializable
private data class StartLanMatchRequest(
    val hostUserId: String,
)

@Serializable
data class RoomStateSnapshot(
    val roomCode: String,
    val revision: Long,
    val updatedAtEpochMs: Long,
    val updatedByUserId: String,
    val payload: JsonElement,
)

@Serializable
private data class PutRoomStateRequest(
    val userId: String,
    val payload: JsonElement,
    val expectedRevision: Long? = null,
)

@Serializable
private data class RoomActionRequest(
    val userId: String,
    val action: JsonElement,
    val expectedRevision: Long? = null,
)

@Serializable
private data class HeartbeatRequest(
    val userId: String,
)

/**
 * Local Wi-Fi room client for cross-platform play (Android + web host).
 *
 * Example LAN base URL:
 * http://192.168.1.42:3000
 */
class LanRoomClient(
    private val baseUrl: String = BuildConfig.LAN_ROOM_SERVER_URL,
) {
    private val http = OkHttpClient()
    private val json = Json { ignoreUnknownKeys = true }
    private val jsonMedia = "application/json; charset=utf-8".toMediaType()

    suspend fun createRoom(hostUserId: String, hostDisplayName: String, maxPlayers: Int): LobbySnapshot? {
        val body = CreateLanRoomRequest(hostUserId, hostDisplayName, maxPlayers)
        return post("/api/rooms", body)
    }

    suspend fun joinRoom(code: String, userId: String, displayName: String): LobbySnapshot? {
        val body = JoinLanRoomRequest(userId, displayName)
        return post("/api/rooms/${code.trim().uppercase()}/join", body)
    }

    suspend fun leaveRoom(code: String, userId: String): LobbySnapshot? {
        val body = LeaveLanRoomRequest(userId)
        return post("/api/rooms/${code.trim().uppercase()}/leave", body)
    }

    suspend fun startMatch(code: String, hostUserId: String): LobbySnapshot? {
        val body = StartLanMatchRequest(hostUserId)
        return post("/api/rooms/${code.trim().uppercase()}/start", body)
    }

    suspend fun getRoom(code: String): LobbySnapshot? = withContext(Dispatchers.IO) {
        if (baseUrl.isBlank()) return@withContext null
        try {
            val request = Request.Builder()
                .url("${baseUrl.trimEnd('/')}/api/rooms/${code.trim().uppercase()}")
                .get()
                .build()
            val response = http.newCall(request).execute()
            if (!response.isSuccessful) return@withContext null
            val raw = response.body?.string() ?: return@withContext null
            json.decodeFromString<LobbySnapshot>(raw)
        } catch (e: Exception) {
            Timber.e(e, "getRoom failed")
            null
        }
    }

    suspend fun getRoomState(code: String): RoomStateSnapshot? = withContext(Dispatchers.IO) {
        if (baseUrl.isBlank()) return@withContext null
        try {
            val request = Request.Builder()
                .url("${baseUrl.trimEnd('/')}/api/rooms/${code.trim().uppercase()}/state")
                .get()
                .build()
            val response = http.newCall(request).execute()
            if (!response.isSuccessful) return@withContext null
            val raw = response.body?.string() ?: return@withContext null
            json.decodeFromString<RoomStateSnapshot>(raw)
        } catch (e: Exception) {
            Timber.e(e, "getRoomState failed")
            null
        }
    }

    suspend fun putRoomState(
        code: String,
        userId: String,
        payload: JsonElement,
        expectedRevision: Long? = null,
    ): RoomStateSnapshot? {
        val body = PutRoomStateRequest(userId = userId, payload = payload, expectedRevision = expectedRevision)
        return postState("/api/rooms/${code.trim().uppercase()}/state", body)
    }

    suspend fun postRoomAction(
        code: String,
        userId: String,
        action: JsonElement,
        expectedRevision: Long? = null,
    ): RoomStateSnapshot? {
        val body = RoomActionRequest(userId = userId, action = action, expectedRevision = expectedRevision)
        return postState("/api/rooms/${code.trim().uppercase()}/action", body, method = "POST")
    }

    suspend fun heartbeatRoom(code: String, userId: String): LobbySnapshot? {
        val body = HeartbeatRequest(userId = userId)
        return post("/api/rooms/${code.trim().uppercase()}/heartbeat", body)
    }

    private suspend inline fun <reified T> post(path: String, payload: T): LobbySnapshot? = withContext(Dispatchers.IO) {
        if (baseUrl.isBlank()) return@withContext null
        try {
            val body = json.encodeToString(payload).toRequestBody(jsonMedia)
            val request = Request.Builder()
                .url("${baseUrl.trimEnd('/')}$path")
                .post(body)
                .build()
            val response = http.newCall(request).execute()
            if (!response.isSuccessful) return@withContext null
            val raw = response.body?.string() ?: return@withContext null
            json.decodeFromString<LobbySnapshot>(raw)
        } catch (e: Exception) {
            Timber.e(e, "LAN room post failed for $path")
            null
        }
    }

    private suspend inline fun <reified T> postState(
        path: String,
        payload: T,
        method: String = "PUT",
    ): RoomStateSnapshot? = withContext(Dispatchers.IO) {
        if (baseUrl.isBlank()) return@withContext null
        try {
            val body = json.encodeToString(payload).toRequestBody(jsonMedia)
            val builder = Request.Builder()
                .url("${baseUrl.trimEnd('/')}" + path)
            val request = when (method.uppercase()) {
                "POST" -> builder.post(body).build()
                else -> builder.put(body).build()
            }
            val response = http.newCall(request).execute()
            if (!response.isSuccessful) return@withContext null
            val raw = response.body?.string() ?: return@withContext null
            json.decodeFromString<RoomStateSnapshot>(raw)
        } catch (e: Exception) {
            Timber.e(e, "LAN room state write failed for $path")
            null
        }
    }
}
