package com.fracturedearth.ui.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.border
import androidx.compose.foundation.BorderStroke
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
    onShowPaywall: () -> Unit,
    onShowCustomerCenter: () -> Unit,
    onSubscribe: (SubscriptionTier) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(Spacing.x4),
        verticalArrangement = Arrangement.spacedBy(Spacing.x3),
    ) {
        Text("NEURAL ATLAS ACCESS", style = MaterialTheme.typography.headlineMedium)
        Text(
            "Manage your membership and access premium features across the Neural Atlas.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(Spacing.x2)
        ) {
            FeButton(
                label = "View Plans", 
                onClick = onShowPaywall,
                modifier = Modifier.weight(1f)
            )
            FeButton(
                label = "Member Center", 
                onClick = onShowCustomerCenter,
                modifier = Modifier.weight(1f)
            )
        }

        Text("Direct Selection", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)

        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(Spacing.x2)
        ) {
            SubscriptionTier.entries.forEach { tier ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(Spacing.x3),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(tier.name.lowercase().replaceFirstChar { it.uppercase() }, style = MaterialTheme.typography.titleMedium)
                            Text(tier.productId, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        }
                        FeButton(label = "Choose", onClick = { onSubscribe(tier) })
                    }
                }
            }
        }

        // Restore handled automatically on start
        FeButton(label = "Back", onClick = onBack)
    }
}
