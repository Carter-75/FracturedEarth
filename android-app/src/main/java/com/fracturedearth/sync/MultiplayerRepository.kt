package com.fracturedearth.sync

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import timber.log.Timber
import kotlin.random.Random

enum class LobbyMode {
    CLOUD,
    LOCAL_WIFI,
}

enum class LobbyStatus {
    OPEN,
    IN_GAME,
    CLOSED,
}

@Serializable
data class LobbyMember(
    val userId: String,
    val displayName: String,
    val joinedAtEpochMs: Long,
)

@Serializable
data class LobbySnapshot(
    val code: String,
    val hostUserId: String,
    val hostDisplayName: String,
    val mode: String,
    val status: String,
    val maxPlayers: Int,
    val members: List<LobbyMember>,
    val createdAtEpochMs: Long,
    val updatedAtEpochMs: Long,
)

/**
 * KV-backed multiplayer lobby repository.
 *
 * Key design:
 * - lobby:{code}:meta    (hash)
 * - lobby:{code}:members (JSON array string)
 */
class MultiplayerRepository(
    private val kv: VercelKvClient = VercelKvClient(),
    private val random: Random = Random.Default,
) {
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun createLobby(
        hostUserId: String,
        hostDisplayName: String,
        mode: LobbyMode,
        maxPlayers: Int,
    ): LobbySnapshot? = withContext(Dispatchers.IO) {
        val clampedPlayers = maxPlayers.coerceIn(2, 4)
        val now = System.currentTimeMillis()
        val code = generateLobbyCode()
        val members = listOf(
            LobbyMember(
                userId = hostUserId,
                displayName = hostDisplayName.ifBlank { "Host" },
                joinedAtEpochMs = now,
            )
        )

        try {
            upsertMeta(
                code = code,
                hostUserId = hostUserId,
                hostDisplayName = hostDisplayName,
                mode = mode,
                status = LobbyStatus.OPEN,
                maxPlayers = clampedPlayers,
                createdAtEpochMs = now,
                updatedAtEpochMs = now,
            )
            kv.set("lobby:$code:members", json.encodeToString(members))
            getLobby(code)
        } catch (e: Exception) {
            Timber.e(e, "createLobby failed")
            null
        }
    }

    suspend fun joinLobby(
        code: String,
        userId: String,
        displayName: String,
    ): LobbySnapshot? = withContext(Dispatchers.IO) {
        val normalized = code.trim().uppercase()
        val current = getLobby(normalized) ?: return@withContext null
        if (current.status != LobbyStatus.OPEN.name) return@withContext null

        val existing = current.members.firstOrNull { it.userId == userId }
        val nextMembers = if (existing != null) {
            current.members
        } else {
            if (current.members.size >= current.maxPlayers) return@withContext null
            current.members + LobbyMember(
                userId = userId,
                displayName = displayName.ifBlank { "Player" },
                joinedAtEpochMs = System.currentTimeMillis(),
            )
        }

        try {
            kv.set("lobby:$normalized:members", json.encodeToString(nextMembers))
            kv.hset("lobby:$normalized:meta", "updatedAtEpochMs", System.currentTimeMillis().toString())
            getLobby(normalized)
        } catch (e: Exception) {
            Timber.e(e, "joinLobby failed")
            null
        }
    }

    suspend fun leaveLobby(code: String, userId: String): LobbySnapshot? = withContext(Dispatchers.IO) {
        val normalized = code.trim().uppercase()
        val current = getLobby(normalized) ?: return@withContext null
        val remaining = current.members.filterNot { it.userId == userId }

        return@withContext try {
            if (remaining.isEmpty()) {
                kv.hset("lobby:$normalized:meta", "status", LobbyStatus.CLOSED.name)
                kv.hset("lobby:$normalized:meta", "updatedAtEpochMs", System.currentTimeMillis().toString())
                getLobby(normalized)
            } else {
                kv.set("lobby:$normalized:members", json.encodeToString(remaining))
                kv.hset("lobby:$normalized:meta", "updatedAtEpochMs", System.currentTimeMillis().toString())
                getLobby(normalized)
            }
        } catch (e: Exception) {
            Timber.e(e, "leaveLobby failed")
            null
        }
    }

    suspend fun getLobby(code: String): LobbySnapshot? = withContext(Dispatchers.IO) {
        val normalized = code.trim().uppercase()
        try {
            val meta = kv.hgetall("lobby:$normalized:meta")
            if (meta.isEmpty()) return@withContext null

            val membersRaw = kv.get("lobby:$normalized:members") ?: "[]"
            val members = runCatching {
                json.decodeFromString<List<LobbyMember>>(membersRaw)
            }.getOrElse { emptyList() }

            LobbySnapshot(
                code = normalized,
                hostUserId = meta["hostUserId"].orEmpty(),
                hostDisplayName = meta["hostDisplayName"].orEmpty(),
                mode = meta["mode"] ?: LobbyMode.CLOUD.name,
                status = meta["status"] ?: LobbyStatus.OPEN.name,
                maxPlayers = meta["maxPlayers"]?.toIntOrNull() ?: 4,
                members = members,
                createdAtEpochMs = meta["createdAtEpochMs"]?.toLongOrNull() ?: 0L,
                updatedAtEpochMs = meta["updatedAtEpochMs"]?.toLongOrNull() ?: 0L,
            )
        } catch (e: Exception) {
            Timber.e(e, "getLobby failed for $normalized")
            null
        }
    }

    suspend fun startMatch(code: String, hostUserId: String): LobbySnapshot? = withContext(Dispatchers.IO) {
        val normalized = code.trim().uppercase()
        val lobby = getLobby(normalized) ?: return@withContext null
        if (lobby.hostUserId != hostUserId) return@withContext null
        if (lobby.members.size !in 2..4) return@withContext null

        try {
            kv.hset("lobby:$normalized:meta", "status", LobbyStatus.IN_GAME.name)
            kv.hset("lobby:$normalized:meta", "updatedAtEpochMs", System.currentTimeMillis().toString())
            getLobby(normalized)
        } catch (e: Exception) {
            Timber.e(e, "startMatch failed")
            null
        }
    }

    private suspend fun upsertMeta(
        code: String,
        hostUserId: String,
        hostDisplayName: String,
        mode: LobbyMode,
        status: LobbyStatus,
        maxPlayers: Int,
        createdAtEpochMs: Long,
        updatedAtEpochMs: Long,
    ) {
        kv.hset("lobby:$code:meta", "hostUserId", hostUserId)
        kv.hset("lobby:$code:meta", "hostDisplayName", hostDisplayName.ifBlank { "Host" })
        kv.hset("lobby:$code:meta", "mode", mode.name)
        kv.hset("lobby:$code:meta", "status", status.name)
        kv.hset("lobby:$code:meta", "maxPlayers", maxPlayers.toString())
        kv.hset("lobby:$code:meta", "createdAtEpochMs", createdAtEpochMs.toString())
        kv.hset("lobby:$code:meta", "updatedAtEpochMs", updatedAtEpochMs.toString())
    }

    private fun generateLobbyCode(): String {
        val alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        return buildString {
            repeat(6) {
                append(alphabet[random.nextInt(alphabet.length)])
            }
        }
    }
}
