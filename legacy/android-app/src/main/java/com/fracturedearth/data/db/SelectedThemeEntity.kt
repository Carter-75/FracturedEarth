package com.fracturedearth.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

/** Cached user theme selection; persisted locally so theme loads instantly without network. */
@Entity(tableName = "selected_theme")
data class SelectedThemeEntity(
    @PrimaryKey val id: Int = 0,   // single-row table
    val themeName: String,
)
