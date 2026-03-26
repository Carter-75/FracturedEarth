package com.fracturedearth.sync

import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import timber.log.Timber

data class RemoteUserProfile(
    val userId: String,
    val displayName: String,
    val email: String,
    val theme: String,
    val totalGamesPlayed: Int,
    val totalWins: Int,
)

class SyncRepository(private val kv: VercelKvClient = VercelKvClient()) {

    suspend fun syncUserOnSignIn(account: GoogleSignInAccount) = withContext(Dispatchers.IO) {
        val userId = account.id ?: return@withContext
        try {
            kv.hset("user:$userId", "displayName", account.displayName ?: "")
            kv.hset("user:$userId", "email", account.email ?: "")
        } catch (e: Exception) {
            Timber.e(e, "syncUserOnSignIn failed")
        }
    }

    suspend fun getUserProfile(userId: String): RemoteUserProfile? = withContext(Dispatchers.IO) {
        try {
            val data = kv.hgetall("user:$userId")
            if (data.isEmpty()) return@withContext null
            RemoteUserProfile(
                userId = userId,
                displayName = data["displayName"] ?: "",
                email = data["email"] ?: "",
                theme = data["theme"] ?: "Obsidian",
                totalGamesPlayed = data["totalGamesPlayed"]?.toIntOrNull() ?: 0,
                totalWins = data["totalWins"]?.toIntOrNull() ?: 0,
            )
        } catch (e: Exception) {
            Timber.e(e, "getUserProfile failed for $userId")
            null
        }
    }

    suspend fun recordGameResult(userId: String, won: Boolean, survivalPoints: Int) =
        withContext(Dispatchers.IO) {
            try {
                kv.hincrby("user:$userId", "totalGamesPlayed", 1)
                if (won) kv.hincrby("user:$userId", "totalWins", 1)
                kv.zadd("leaderboard", survivalPoints.toDouble(), userId)
            } catch (e: Exception) {
                Timber.e(e, "recordGameResult failed")
            }
        }

    suspend fun updateTheme(userId: String, theme: String) = withContext(Dispatchers.IO) {
        try {
            kv.hset("user:$userId", "theme", theme)
        } catch (e: Exception) {
            Timber.e(e, "updateTheme failed")
        }
    }
}
