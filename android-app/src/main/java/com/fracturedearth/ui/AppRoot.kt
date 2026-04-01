package com.fracturedearth.ui

import android.app.Activity
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.room.Room
import com.fracturedearth.ads.AdConfig
import com.fracturedearth.ads.AdsController
import com.fracturedearth.billing.BillingFacade
import com.fracturedearth.billing.SubscriptionTier
import com.fracturedearth.data.db.AppDatabase
import com.fracturedearth.data.db.SelectedThemeEntity
import com.fracturedearth.game.GameViewModel
import com.fracturedearth.ui.component.InterstitialOnEnter
import com.fracturedearth.ui.screen.GameOverScreen
import com.fracturedearth.ui.screen.GameScreen
import com.fracturedearth.ui.screen.MainMenuScreen
import com.fracturedearth.ui.screen.SettingsScreen
import com.fracturedearth.ui.screen.SubscriptionScreen
import com.fracturedearth.ui.theme.FracturedEarthTheme
import com.fracturedearth.ui.theme.ThemeOption
import kotlinx.coroutines.launch

private object Routes {
    const val MAIN = "main"
    const val GAME = "game"
    const val SETTINGS = "settings"
    const val SUBSCRIPTION = "subscription"
    const val GAME_OVER = "game_over"
}

@Composable
fun AppRoot() {
    val context = LocalContext.current
    val navController = rememberNavController()
    val coroutineScope = rememberCoroutineScope()
    val viewModel = remember { GameViewModel() }
    val billingFacade = remember { BillingFacade() }
    val adsController = remember { AdsController(AdConfig()) }
    val appDb = remember(context) {
        Room.databaseBuilder(context.applicationContext, AppDatabase::class.java, "fractured_earth.db")
            .fallbackToDestructiveMigration()
            .build()
    }
    val themeDao = remember(appDb) { appDb.themeDao() }
    var theme by rememberSaveable { androidx.compose.runtime.mutableStateOf(ThemeOption.OBSIDIAN) }
    var triggerInterstitial by rememberSaveable { androidx.compose.runtime.mutableStateOf(false) }
    val adFree by BillingFacade.adFreeState().collectAsState()

    LaunchedEffect(themeDao) {
        val saved = themeDao.getTheme()?.themeName ?: return@LaunchedEffect
        val parsed = ThemeOption.entries.firstOrNull { it.name == saved } ?: ThemeOption.OBSIDIAN
        theme = parsed
    }

    FracturedEarthTheme(theme = theme) {
        NavHost(
            navController = navController,
            startDestination = Routes.MAIN,
        ) {
            composable(Routes.MAIN) {
                MainMenuScreen(
                    onPlay = { config ->
                        viewModel.startMatch(
                            humanName = config.playerName,
                            botCount = config.botCount,
                            difficulty = config.difficulty,
                        )
                        navController.navigate(Routes.GAME) {
                            launchSingleTop = true
                        }
                    },
                    onSettings = {
                        navController.navigate(Routes.SETTINGS) {
                            launchSingleTop = true
                        }
                    },
                    onExit = {
                        (context as? Activity)?.finish()
                    },
                )
            }
            composable(Routes.GAME) {
                GameScreen(
                    state = viewModel.uiState,
                    onOpenSettings = {
                        navController.navigate(Routes.SETTINGS) {
                            launchSingleTop = true
                        }
                    },
                    onOpenMenu = {
                        navController.popBackStack(Routes.MAIN, inclusive = false)
                    },
                    onFinish = {
                        triggerInterstitial = adsController.canShowInterstitial(
                            isAdFree = adFree,
                            isBetweenMatches = true,
                        )
                        navController.navigate(Routes.GAME_OVER) {
                            launchSingleTop = true
                        }
                    },
                    onNextTurn = { viewModel.endTurn() },
                    onDraw = { viewModel.drawCard() },
                    onPlayCard = { card -> viewModel.playCard(card) },
                    showAds = adsController.canShowBanner(isAdFree = adFree),
                )
            }
            composable(Routes.SETTINGS) {
                SettingsScreen(
                    selectedTheme = theme,
                    onThemeSelected = {
                        theme = it
                        coroutineScope.launch {
                            themeDao.setTheme(SelectedThemeEntity(themeName = it.name))
                        }
                    },
                    onSubscription = {
                        navController.navigate(Routes.SUBSCRIPTION) {
                            launchSingleTop = true
                        }
                    },
                    onBack = { navController.popBackStack() },
                )
            }
            composable(Routes.SUBSCRIPTION) {
                val activity = context as? Activity
                SubscriptionScreen(
                    onBack = { navController.popBackStack() },
                    onShowPaywall = { if (activity != null) billingFacade.showPaywall(activity) },
                    onShowCustomerCenter = { if (activity != null) billingFacade.showCustomerCenter(activity) },
                    onSubscribe = { tier: SubscriptionTier ->
                        if (activity != null) {
                            billingFacade.purchase(activity, tier)
                        }
                    },
                )
            }
            composable(Routes.GAME_OVER) {
                InterstitialOnEnter(
                    adUnitId = AdConfig().interstitialAdUnit,
                    enabled = triggerInterstitial,
                    onDismissed = { triggerInterstitial = false },
                )

                GameOverScreen(
                    winnerLabel = viewModel.uiState.winnerLabel,
                    onPlayAgain = {
                        viewModel.reset()
                        navController.navigate(Routes.GAME) {
                            popUpTo(Routes.MAIN) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    onMainMenu = {
                        navController.popBackStack(Routes.MAIN, inclusive = false)
                    },
                )
            }
        }
    }
}
