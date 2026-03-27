package com.fracturedearth.ui.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.border
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.fracturedearth.billing.SubscriptionTier
import com.fracturedearth.ui.component.FeButton
import com.fracturedearth.ui.theme.Spacing

@Composable
fun SubscriptionScreen(
    onBack: () -> Unit,
    onRestorePurchases: () -> Unit,
    onSubscribe: (SubscriptionTier) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(Spacing.x4),
        verticalArrangement = Arrangement.spacedBy(Spacing.x3),
    ) {
        Text("Ad-Free Mode", style = MaterialTheme.typography.headlineMedium)
        Text(
            "Remove banner and interstitial ads on all gameplay screens.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
        )

        // AI prompt: premium ad-free membership badge carved in brass, survival emblem, warm tungsten highlights, dramatic tabletop scene, polished game key art
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(140.dp)
                .clip(RoundedCornerShape(16.dp))
                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(16.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Text("AI Image Slot: Subscription Hero Badge", style = MaterialTheme.typography.titleMedium)
        }

        // AI prompt: side-by-side ad-on versus ad-free gameplay screens on tabletop, clean comparison composition, premium product marketing art
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp)
                .clip(RoundedCornerShape(16.dp))
                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(16.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Text("AI Image Slot: Ads Comparison Panel", style = MaterialTheme.typography.titleMedium)
        }

        // AI prompt: premium subscriber kit with coin token, card sleeve, and emblem card, warm dramatic tabletop lighting, cinematic product shot
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp)
                .clip(RoundedCornerShape(16.dp))
                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(16.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Text("AI Image Slot: Premium Kit Visual", style = MaterialTheme.typography.titleMedium)
        }

        SubscriptionTier.entries.forEach { tier ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(Spacing.x3),
                    verticalArrangement = Arrangement.spacedBy(Spacing.x2),
                ) {
                    Text(tier.name.lowercase().replaceFirstChar { it.uppercase() }, style = MaterialTheme.typography.titleLarge)
                    Text(tier.productId, style = MaterialTheme.typography.bodySmall)
                    FeButton(label = "Choose", onClick = { onSubscribe(tier) })
                }
            }
        }

        FeButton(label = "Restore Purchases", onClick = onRestorePurchases)
        FeButton(label = "Back", onClick = onBack)
    }
}
