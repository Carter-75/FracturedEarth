package com.fracturedearth.core.model

import kotlinx.serialization.json.*

object CardCatalog {
    fun starterDeck(): List<Card> = listOf(
        Card(
            id = "survival_hydroponic_bay",
            name = "Hydroponic Bay",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+4 Points; maximizes yield when Health is 5.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(4), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_HEALTH"), "params" to JsonObject(mapOf("op" to JsonPrimitive("=="), "amount" to JsonPrimitive(5), "target" to JsonPrimitive("self"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_deep_core_drill",
            name = "Deep Core Drill",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Points; doubles output (6) if Health ≤3.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_HEALTH"), "params" to JsonObject(mapOf("op" to JsonPrimitive("<="), "amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_bunker_shelter",
            name = "Bunker Shelter",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Health.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_biodome",
            name = "Bio-Dome",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Health if first card played this turn.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_FIRST_CARD"), "params" to JsonObject(mapOf()), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_energy_siphon",
            name = "Energy Siphon",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+5 Points; +1 Pt for each pinned Power card.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(5), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS_SCALED"), "params" to JsonObject(mapOf("scaleBy" to JsonPrimitive("pinned_powers"), "multiplier" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_scavenged_tech",
            name = "Scavenged Tech",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Draw 2 cards.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_archive_01",
            name = "Archive 01",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Draw 3 cards.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_nanoforge",
            name = "Nano-Forge",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Upgrade one pinned Power card (temporarily doubles effect).",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("TEMP_DOUBLE_POWER_EFFECT"), "duration" to JsonPrimitive("turn"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_solar_collector",
            name = "Solar Collector",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Points; if next card is Chaos, negate effect.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_NEGATIVE_EFFECT"), "duration" to JsonPrimitive("next_event"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_medic_drone",
            name = "Medic Drone",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Heal 1 Health and prevent next point loss.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("PREVENT_NEXT_POINT_LOSS"), "duration" to JsonPrimitive("next_event"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_hydro_filter",
            name = "Hydro Filter",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Block first Disaster damage this turn.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_DISASTER"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_quantum_harvester",
            name = "Quantum Harvester",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+4 Points; discard one card to double points.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_HAND_SIZE"), "params" to JsonObject(mapOf("op" to JsonPrimitive(">="), "amount" to JsonPrimitive(1))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))), JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("DOUBLE_NEXT_POINTS"), "duration" to JsonPrimitive("next_event"), "target" to JsonPrimitive("self"))))), JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(4), "target" to JsonPrimitive("self"))))))), "else" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(4), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_oasis_reservoir",
            name = "Oasis Reservoir",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Health; draw 1 card.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_terraform_rig",
            name = "Terraform Rig",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Points; if hand <3 cards, draw 1.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_HAND_SIZE"), "params" to JsonObject(mapOf("op" to JsonPrimitive("<"), "amount" to JsonPrimitive(3))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_bioreactor",
            name = "Bio-Reactor",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+5 Points; reduce incoming Disaster effect by 1.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(5), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("REDUCE_INCOMING_DISASTER_1"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_nutrient_mixer",
            name = "Nutrient Mixer",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Points; discard 1 to draw 2.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_HAND_SIZE"), "params" to JsonObject(mapOf("op" to JsonPrimitive(">="), "amount" to JsonPrimitive(1))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))), JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_automated_farm",
            name = "Automated Farm",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Health if no other Survival card played.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_NO_OTHER_SURVIVAL"), "params" to JsonObject(mapOf()), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_energy_nexus",
            name = "Energy Nexus",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Points; +1 if Chaos card played previously.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_CHAOS_PLAYED"), "params" to JsonObject(mapOf()), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_lifesupport_array",
            name = "Lifesupport Array",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+1 Health per pinned Adapt card.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH_SCALED"), "params" to JsonObject(mapOf("scaleBy" to JsonPrimitive("pinned_adapt"), "multiplier" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_nanomed_kit",
            name = "Nano-Med Kit",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Heal 2 Health; discard after use.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_neural_interface",
            name = "Neural Interface",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Draw 1; gain 1 point.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_micro_reactor",
            name = "Micro Reactor",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Points; prevent next negative card effect.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("prevent_negative"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_data_uplink",
            name = "Data Uplink",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Draw 2; opponent discards 1.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("target_opponent")))))
            )
        ),
        Card(
            id = "survival_pulse_generator",
            name = "Pulse Generator",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Points; can redirect next Disaster.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("REDIRECT_NEXT_DISASTER"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_gravity_well",
            name = "Gravity Well",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Prevent opponent from drawing next card.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("PREVENT_OPPONENT_DRAW_1"), "duration" to JsonPrimitive("next_event"), "target" to JsonPrimitive("target_opponent")))))
            )
        ),
        Card(
            id = "survival_subsurface_driller",
            name = "Subsurface Driller",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Points; can steal 1 point from target.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("STEAL_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("target_opponent")))))
            )
        ),
        Card(
            id = "survival_power_conduit",
            name = "Power Conduit",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Points; hand limit temporarily +1.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("HAND_LIMIT_TEMP_1"), "duration" to JsonPrimitive("turn"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_shielded_habitat",
            name = "Shielded Habitat",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Health; protects next turn.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_DISASTER"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_rescue_beacon",
            name = "Rescue Beacon",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Draw 1; revive 1 Health if needed.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_life_pod",
            name = "Life Pod",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+1 Health; next Disaster negated.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_DISASTER"), "duration" to JsonPrimitive("next_event"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_hydroponic_lab",
            name = "Hydroponic Lab",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Points; discard 1 to draw 2.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_HAND_SIZE"), "params" to JsonObject(mapOf("op" to JsonPrimitive(">="), "amount" to JsonPrimitive(1))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))), JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_thermal_plant",
            name = "Thermal Plant",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Points; block Chaos effect once.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_NEGATIVE_EFFECT"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_solar_panel_array",
            name = "Solar Panel Array",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Points; draw 1 card if hand <5.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_HAND_SIZE"), "params" to JsonObject(mapOf("op" to JsonPrimitive("<"), "amount" to JsonPrimitive(5))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_wind_turbine",
            name = "Wind Turbine",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Points; temporary hand +1.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("HAND_LIMIT_TEMP_1"), "duration" to JsonPrimitive("turn"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_water_purifier",
            name = "Water Purifier",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Heal 1 Health; prevent next Catac effect.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_CATAC_EFFECT"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_emergency_shelter",
            name = "Emergency Shelter",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Health; can block next Disaster.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_DISASTER"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_micro_greenhouse",
            name = "Micro Greenhouse",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Points; discard 1 to draw 1.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_AND_DRAW"), "params" to JsonObject(mapOf("discardAmount" to JsonPrimitive(1), "drawAmount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_energy_core",
            name = "Energy Core",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+5 Points; reset hand to 5 if lower.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(5), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ENSURE_HAND_SIZE"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(5), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_repair_drone",
            name = "Repair Drone",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Heal 1 Health; discard after use.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_life_support_matrix",
            name = "Life Support Matrix",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Health; prevent first Disaster next turn.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_DISASTER"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_nano_farm",
            name = "Nano Farm",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Points; +1 if hand ≤3.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_HAND_SIZE"), "params" to JsonObject(mapOf("op" to JsonPrimitive("<="), "amount" to JsonPrimitive(3))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_resource_cache",
            name = "Resource Cache",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Draw 1; +2 Points.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_hydro_plant",
            name = "Hydro Plant",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Points; block next Disaster.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_DISASTER"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_oxygen_generator",
            name = "Oxygen Generator",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Health; discard 1 to draw 1.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_HAND_SIZE"), "params" to JsonObject(mapOf("op" to JsonPrimitive(">="), "amount" to JsonPrimitive(1))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))), JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_automated_medic",
            name = "Automated Medic",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+1 Health; prevent next Catac effect.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_CATAC_EFFECT"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_fusion_reactor",
            name = "Fusion Reactor",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+4 Points; discard 1 card to gain +2 Points.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(4), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_HAND_SIZE"), "params" to JsonObject(mapOf("op" to JsonPrimitive(">="), "amount" to JsonPrimitive(1))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))), JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_subsurface_lab",
            name = "Subsurface Lab",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Draw 2; +1 Health.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_energy_collector",
            name = "Energy Collector",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Points; can negate one Chaos card.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_NEGATIVE_EFFECT"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_water_reservoir",
            name = "Water Reservoir",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Heal 2 Health; discard after use.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_mineral_extractor",
            name = "Mineral Extractor",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Points; next Catac effect negated.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_CATAC_EFFECT"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_biorecovery_pod",
            name = "Bio-Recovery Pod",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+1 Health; draw 1 card.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_ai_med_bay",
            name = "AI Med Bay",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Health; prevent one negative effect.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_NEGATIVE_EFFECT"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_resource_drone",
            name = "Resource Drone",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Draw 2; discard 1 if hand >5.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_HAND_SIZE"), "params" to JsonObject(mapOf("op" to JsonPrimitive(">="), "amount" to JsonPrimitive(6))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_solar_array",
            name = "Solar Array",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Points; block one disaster.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_DISASTER"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_energy_field",
            name = "Energy Field",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Points; redirect next negative card.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("REDIRECT_NEXT_NEGATIVE"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_life_support_hub",
            name = "Life Support Hub",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+1 Health; +1 if Chaos played last turn.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_CHAOS_PLAYED"), "params" to JsonObject(mapOf()), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_nano_repair_kit",
            name = "Nano Repair Kit",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Heal 1; discard 1.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_HAND_SIZE"), "params" to JsonObject(mapOf("op" to JsonPrimitive(">="), "amount" to JsonPrimitive(1))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))), JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_hydro_farm",
            name = "Hydro Farm",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Points; draw 1 if hand ≤4.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_HAND_SIZE"), "params" to JsonObject(mapOf("op" to JsonPrimitive("<="), "amount" to JsonPrimitive(4))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_power_booster",
            name = "Power Booster",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Points; block first Catac.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_CATAC_EFFECT"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_emergency_reactor",
            name = "Emergency Reactor",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+4 Points; discard 1 to draw 2.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(4), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_HAND_SIZE"), "params" to JsonObject(mapOf("op" to JsonPrimitive(">="), "amount" to JsonPrimitive(1))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))), JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_medic_pod",
            name = "Medic Pod",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Heal 2 Health; prevent one negative effect.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_NEGATIVE_EFFECT"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_resource_array",
            name = "Resource Array",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Points; discard 1 to draw 1.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_HAND_SIZE"), "params" to JsonObject(mapOf("op" to JsonPrimitive(">="), "amount" to JsonPrimitive(1))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))), JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_bio_lab",
            name = "Bio Lab",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Health; draw 1 if hand ≤3.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_HAND_SIZE"), "params" to JsonObject(mapOf("op" to JsonPrimitive("<="), "amount" to JsonPrimitive(3))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_solar_reactor",
            name = "Solar Reactor",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+4 Points; temporary hand +1.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(4), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("HAND_LIMIT_TEMP_1"), "duration" to JsonPrimitive("turn"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_oxygen_pod",
            name = "Oxygen Pod",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+1 Health; redirect next negative card.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("REDIRECT_NEXT_NEGATIVE"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_repair_hub",
            name = "Repair Hub",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Heal 1 Health; discard 1 card.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_HAND_SIZE"), "params" to JsonObject(mapOf("op" to JsonPrimitive(">="), "amount" to JsonPrimitive(1))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_nano_shield",
            name = "Nano Shield",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Points; block first Catac.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_CATAC_EFFECT"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_hydration_station",
            name = "Hydration Station",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Health; draw 1 card.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_energy_grid",
            name = "Energy Grid",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Points; discard 1 to draw 1.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_HAND_SIZE"), "params" to JsonObject(mapOf("op" to JsonPrimitive(">="), "amount" to JsonPrimitive(1))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))), JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_micro_medbay",
            name = "Micro Medbay",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Heal 1; prevent next Disaster.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_DISASTER"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_bio_reactor_core",
            name = "Bio Reactor Core",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+4 Points; discard 1 to gain +1 Health.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(4), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_HAND_SIZE"), "params" to JsonObject(mapOf("op" to JsonPrimitive(">="), "amount" to JsonPrimitive(1))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))), JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "survival_ai_field_med",
            name = "AI Field Med",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Health; block one Catac.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_CATAC_EFFECT"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_hydro_nexus",
            name = "Hydro Nexus",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Points; discard 1 to draw 1.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_resource_depot",
            name = "Resource Depot",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Draw 2; +1 Point.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_fusion_plant",
            name = "Fusion Plant",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+5 Points; hand temporary +1.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(5), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("HAND_LIMIT_TEMP_1"), "duration" to JsonPrimitive("turn"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "survival_life_hub",
            name = "Life Hub",
            type = CardType.SURVIVAL,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Heal 1 Health; prevent next Disaster.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_DISASTER"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "disaster_megaquake",
            name = "Mega-Quake",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.EARTHQUAKE,
            blocksDisaster = null,
            tier = null,
            description = "All opponents lose 3 Health; can be blocked by Kinetic Dampener.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("all_opponents"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-3), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_solar_scorch",
            name = "Solar Scorch",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.WILDFIRE,
            blocksDisaster = null,
            tier = null,
            description = "Target loses 4 Points; blocked by Thermal Layer.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("inherited"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-4), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_viral_strain",
            name = "Viral Strain",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.PLAGUE,
            blocksDisaster = null,
            tier = null,
            description = "Target cannot regain Health next turn; blocked by Stasis Field.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("inherited"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("PREVENT_HEALTH_REGAIN"), "duration" to JsonPrimitive("turn"), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_abyssal_surge",
            name = "Abyssal Surge",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.FLOOD,
            blocksDisaster = null,
            tier = null,
            description = "All opponents lose 2 Health; blocked by Hydro-Gate.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("all_opponents"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-2), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_void_meteor",
            name = "Void Meteor",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.GLOBAL,
            blocksDisaster = null,
            tier = null,
            description = "All opponents lose 5 Points; cannot be blocked.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-5), "target" to JsonPrimitive("all_opponents")))))
            )
        ),
        Card(
            id = "disaster_shatter_vault",
            name = "Shatter Vault",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Destroy one pinned Power card of target.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DESTROY_PINNED"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("target_player")))))
            )
        ),
        Card(
            id = "disaster_acid_rain",
            name = "Acid Rain",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.FLOOD,
            blocksDisaster = null,
            tier = null,
            description = "Target loses 1 Point per turn for 3 turns; blocked by Hydro-Gate.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("inherited"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("LOSE_1_PT_PER_TURN_3"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_absolute_zero",
            name = "Absolute Zero",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.GLOBAL,
            blocksDisaster = null,
            tier = null,
            description = "Target loses 5 Health; cannot be blocked.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-5), "target" to JsonPrimitive("target_player")))))
            )
        ),
        Card(
            id = "disaster_plasma_blast",
            name = "Plasma Blast",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.WILDFIRE,
            blocksDisaster = null,
            tier = null,
            description = "Target loses 3 Points; blocked by Thermal Layer.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("inherited"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-3), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_toxic_cloud",
            name = "Toxic Cloud",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.PLAGUE,
            blocksDisaster = null,
            tier = null,
            description = "Target discards 2 cards; blocked by Stasis Field.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("inherited"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_sandstorm",
            name = "Sandstorm",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.EARTHQUAKE,
            blocksDisaster = null,
            tier = null,
            description = "Skip target’s next turn; blocked by Kinetic Dampener.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("inherited"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("skip_next"), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_electromagnetic_pulse",
            name = "Electromagnetic Pulse",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "All pinned Power cards disabled for 1 turn.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("disable_powers_1_turn"), "target" to JsonPrimitive("all")))))
            )
        ),
        Card(
            id = "disaster_gravity_collapse",
            name = "Gravity Collapse",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.GLOBAL,
            blocksDisaster = null,
            tier = null,
            description = "All opponents discard 1 card; cannot be blocked.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("all_opponents")))))
            )
        ),
        Card(
            id = "disaster_radiation_leak",
            name = "Radiation Leak",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.FLOOD,
            blocksDisaster = null,
            tier = null,
            description = "Target loses 2 Health; next Catac effect negated.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("inherited"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-2), "target" to JsonPrimitive("target_player"))))), JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_NEXT_CATAC_EFFECT"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_storm_surge",
            name = "Storm Surge",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.FLOOD,
            blocksDisaster = null,
            tier = null,
            description = "All players lose 2 Points; blocked by Hydro-Gate.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("all"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-2), "target" to JsonPrimitive("inherited")))))))))
            )
        ),
        Card(
            id = "disaster_magnetic_rift",
            name = "Magnetic Rift",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.EARTHQUAKE,
            blocksDisaster = null,
            tier = null,
            description = "Swap target’s hand with discard pile; blocked by Kinetic Dampener.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("inherited"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("SWAP_HAND_WITH_DISCARD"), "params" to JsonObject(mapOf("target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_firestorm",
            name = "Firestorm",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.WILDFIRE,
            blocksDisaster = null,
            tier = null,
            description = "Target loses 3 Health; blocked by Thermal Layer.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("inherited"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-3), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_contamination",
            name = "Contamination",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.PLAGUE,
            blocksDisaster = null,
            tier = null,
            description = "Target cannot play Survival cards next turn; blocked by Stasis Field.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("inherited"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("DISABLE_SURVIVAL_NEXT_TURN"), "duration" to JsonPrimitive("turn"), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_volcanic_eruption",
            name = "Volcanic Eruption",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.GLOBAL,
            blocksDisaster = null,
            tier = null,
            description = "All opponents lose 3 Health; cannot be blocked.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-3), "target" to JsonPrimitive("all_opponents")))))
            )
        ),
        Card(
            id = "disaster_ice_barrage",
            name = "Ice Barrage",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.PLAGUE,
            blocksDisaster = null,
            tier = null,
            description = "Target loses 2 Health; blocked by Stasis Field.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("inherited"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-2), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_quicksand",
            name = "Quicksand",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.EARTHQUAKE,
            blocksDisaster = null,
            tier = null,
            description = "Target skips next draw; blocked by Kinetic Dampener.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("inherited"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("SKIP_NEXT_DRAW"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_lightning_strike",
            name = "Lightning Strike",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.WILDFIRE,
            blocksDisaster = null,
            tier = null,
            description = "Target loses 3 Points; blocked by Thermal Layer.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("inherited"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-3), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_biohazard",
            name = "Biohazard",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.PLAGUE,
            blocksDisaster = null,
            tier = null,
            description = "Target discards 1 card; blocked by Stasis Field.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("inherited"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_tidal_wave",
            name = "Tidal Wave",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.FLOOD,
            blocksDisaster = null,
            tier = null,
            description = "All opponents discard 1 card; blocked by Hydro-Gate.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("all_opponents"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_sand_trap",
            name = "Sand Trap",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.EARTHQUAKE,
            blocksDisaster = null,
            tier = null,
            description = "Target loses 2 Points; blocked by Kinetic Dampener.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("inherited"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-2), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_acid_fog",
            name = "Acid Fog",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.PLAGUE,
            blocksDisaster = null,
            tier = null,
            description = "Target loses 1 Health each turn for 2 turns; blocked by Stasis Field.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("inherited"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("LOSE_1_HEALTH_PER_TURN_2"), "duration" to JsonPrimitive("round"), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_corrosive_gas",
            name = "Corrosive Gas",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.GLOBAL,
            blocksDisaster = null,
            tier = null,
            description = "Target discards 2 cards; cannot be blocked.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("target_player")))))
            )
        ),
        Card(
            id = "disaster_earth_collapse",
            name = "Earth Collapse",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.EARTHQUAKE,
            blocksDisaster = null,
            tier = null,
            description = "All opponents lose 2 Health; blocked by Kinetic Dampener.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("all_opponents"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-2), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_firestorm_flare",
            name = "Firestorm Flare",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.WILDFIRE,
            blocksDisaster = null,
            tier = null,
            description = "Target loses 4 Points; blocked by Thermal Layer.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("inherited"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-4), "target" to JsonPrimitive("target_player")))))))))
            )
        ),
        Card(
            id = "disaster_plasma_surge",
            name = "Plasma Surge",
            type = CardType.DISASTER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = DisasterKind.FLOOD,
            blocksDisaster = null,
            tier = null,
            description = "Target discards 1 card; all Survival cards negated this turn.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("IF_UNBLOCKED"), "params" to JsonObject(mapOf("target" to JsonPrimitive("inherited"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("target_player"))))), JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("NEGATE_ALL_SURVIVAL_THIS_TURN"), "duration" to JsonPrimitive("turn"), "target" to JsonPrimitive("all")))))))))
            )
        ),
        Card(
            id = "power_kinetic_dampener",
            name = "Kinetic Dampener",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Blocks first Earth Disaster; pinned until destroyed.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("block_first_disaster"), "kind" to JsonPrimitive("earth"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "power_thermal_layer",
            name = "Thermal Layer",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Blocks first Fire Disaster; pinned until destroyed.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("block_first_disaster"), "kind" to JsonPrimitive("fire"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "power_stasis_field",
            name = "Stasis Field",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Blocks first Bio Disaster; pinned until destroyed.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("block_first_disaster"), "kind" to JsonPrimitive("bio"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "power_hydrogate",
            name = "Hydro-Gate",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Blocks first Hydro Disaster; pinned until destroyed.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("block_first_disaster"), "kind" to JsonPrimitive("hydro"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "power_magnetic_shield",
            name = "Magnetic Shield",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Redirects first Chaos or Disaster card; pinned.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("redirect_chaos_disaster"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "power_energy_amplifier",
            name = "Energy Amplifier",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+1 Point each turn while pinned.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("POINTS_PER_TURN_1"), "duration" to JsonPrimitive("permanent"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "power_structural_matrix",
            name = "Structural Matrix",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Prevent 1 Health loss per turn.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("REDUCE_INCOMING_DISASTER_1"), "duration" to JsonPrimitive("permanent"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "power_defense_node",
            name = "Defense Node",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Blocks one Catac effect; discarded if used.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("block_catac"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "power_gravity_stabilizer",
            name = "Gravity Stabilizer",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Prevent turn skip effects.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("prevent_turn_skip"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "power_fire_containment",
            name = "Fire Containment",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Blocks next Fire Disaster; pinned.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("block_next_disaster"), "kind" to JsonPrimitive("fire"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "power_biocontainment",
            name = "Bio-Containment",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Blocks next Bio Disaster; pinned.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("block_next_disaster"), "kind" to JsonPrimitive("bio"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "power_aqua_barrier",
            name = "Aqua Barrier",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Blocks next Hydro Disaster; pinned.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("block_next_disaster"), "kind" to JsonPrimitive("hydro"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "power_energy_buffer",
            name = "Energy Buffer",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+1 Point per Survival card played.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("points_per_survival_1"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "power_shield_generator",
            name = "Shield Generator",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Prevents next Catac negative effect.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("prevent_catac_effect"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "power_nano_barrier",
            name = "Nano Barrier",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Redirect one Disaster to another target.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("redirect_disaster"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "power_reflex_array",
            name = "Reflex Array",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Draw 1 card when pinned.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("draw_when_pinned_1"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "power_resource_stabilizer",
            name = "Resource Stabilizer",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Block next point loss.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("block_point_loss"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "power_temporal_anchor",
            name = "Temporal Anchor",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Prevents next turn order change.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("prevent_turn_reverse"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "power_power_grid",
            name = "Power Grid",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Points if hand ≤3.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_HAND_SIZE"), "params" to JsonObject(mapOf("op" to JsonPrimitive("<="), "amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "power_vital_core",
            name = "Vital Core",
            type = CardType.POWER,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Heal 1 Health each turn.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("HEAL_1_PER_TURN"), "duration" to JsonPrimitive("permanent"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_reflex_coil",
            name = "Reflex Coil",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Blocks Earthquake; draw 1 card.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("BLOCK_EARTHQUAKE_DRAW_1"), "duration" to JsonPrimitive("permanent"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_shadow_step",
            name = "Shadow Step",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Blocks Wildfire; draw 1 card.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("ADD_TRIGGER"), "params" to JsonObject(mapOf("triggerKind" to JsonPrimitive("BLOCK_WILDFIRE_DRAW_1"), "duration" to JsonPrimitive("permanent"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_phase_shift",
            name = "Phase Shift",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Evade next high-tier disaster.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("evade_hightier_disaster"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_emergency_override",
            name = "Emergency Override",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Cancel one Disaster card targeting you.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("cancel_disaster_target"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_nano_patch",
            name = "Nano Patch",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Heal 1 Health; discarded after use.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("discard_after_use"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_temporal_shift",
            name = "Temporal Shift",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Skip your turn to negate Catac effect.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("SKIP_TURN"), "params" to JsonObject(mapOf("target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("negate_catac"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_surge_capacitor",
            name = "Surge Capacitor",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+2 Points if used immediately after Survival card.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("IF_PREVIOUS_CARD_TYPE"), "params" to JsonObject(mapOf("cardType" to JsonPrimitive("SURVIVAL"))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "adapt_shield_patch",
            name = "Shield Patch",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Blocks next negative card effect; discarded after use.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("block_negative_effect"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_repair_module",
            name = "Repair Module",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Restore 1 Health; discard after use.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("discard_after_use"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_energy_flux",
            name = "Energy Flux",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Convert Disaster loss into Points.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("convert_disaster_to_points"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_quantum_dodge",
            name = "Quantum Dodge",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Evade next Chaos effect.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("evade_chaos"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_bio_shield",
            name = "Bio Shield",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Block 1 Health loss from Disaster.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("block_health_loss"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_chaos_repeater",
            name = "Chaos Repeater",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Redirect Chaos effect to another player.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("redirect_chaos"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_protective_field",
            name = "Protective Field",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Block next negative effect; discarded.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("block_negative_effect"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_emergency_medkit",
            name = "Emergency Medkit",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Heal 2 Health; discard after use.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_resource_stabilizer",
            name = "Resource Stabilizer",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+1 Point for each Survival card pinned.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("points_per_pinned_survival_1"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_safety_override",
            name = "Safety Override",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Cancel one Catac card.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("cancel_catac"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_nano_barrier",
            name = "Nano Barrier",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Redirect next negative card.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("redirect_negative"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_temporal_shield",
            name = "Temporal Shield",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Prevent turn skip or reverse.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("prevent_turn_skip_reverse"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "adapt_evacuation_protocol",
            name = "Evacuation Protocol",
            type = CardType.ADAPT,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Avoid next Disaster effect.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("avoid_disaster"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "chaos_orbital_strike",
            name = "Orbital Strike",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Points; all others lose 1 Health.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-1), "target" to JsonPrimitive("all_opponents")))))
            )
        ),
        Card(
            id = "chaos_scavenger_raid",
            name = "Scavenger Raid",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Take 1 card from discard pile.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("RETURN_FROM_DISCARD"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "chaos_grand_theft",
            name = "Grand Theft",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Steal 5 Points from a target.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(5), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("STEAL_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(5), "target" to JsonPrimitive("target_player")))))
            )
        ),
        Card(
            id = "chaos_health_for_points",
            name = "Health for Points",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Lose 1 Health for +10 Points.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(10), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "chaos_neural_spike",
            name = "Neural Spike",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Confuse opponent; skip their next turn.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("skip_next"), "target" to JsonPrimitive("target_player")))))
            )
        ),
        Card(
            id = "chaos_temporal_distortion",
            name = "Temporal Distortion",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Reverse turn order until end of round.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("REVERSE_TURN_ORDER"), "params" to JsonObject(mapOf("duration" to JsonPrimitive("round")))))
            )
        ),
        Card(
            id = "chaos_point_flux",
            name = "Point Flux",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Randomly add/remove 1–5 Points from each player.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS_RANDOM"), "params" to JsonObject(mapOf("min" to JsonPrimitive(-5), "max" to JsonPrimitive(5), "target" to JsonPrimitive("all")))))
            )
        ),
        Card(
            id = "chaos_card_storm",
            name = "Card Storm",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Shuffle all piles into deck.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("SHUFFLE_ALL_PILES")))
            )
        ),
        Card(
            id = "chaos_resource_surge",
            name = "Resource Surge",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Draw 3 cards; discard 1.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "chaos_energy_collapse",
            name = "Energy Collapse",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Lose 2 Points; opponents gain 1 each.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("all_opponents")))))
            )
        ),
        Card(
            id = "chaos_rule_break",
            name = "Rule Break",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Ignore next rule of your choice.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("ignore_rule"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "chaos_global_shakeup",
            name = "Global Shakeup",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Redistribute all Points equally.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("REDISTRIBUTE_POINTS"), "params" to JsonObject(mapOf("format" to JsonPrimitive("equal")))))
            )
        ),
        Card(
            id = "chaos_health_gamble",
            name = "Health Gamble",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Roll dice; gain/lose 1–3 Health.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH_RANDOM"), "params" to JsonObject(mapOf("min" to JsonPrimitive(-3), "max" to JsonPrimitive(3), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "chaos_instant_swap",
            name = "Instant Swap",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Swap hands with a target player.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("SWAP_HANDS"), "params" to JsonObject(mapOf("targetA" to JsonPrimitive("self"), "targetB" to JsonPrimitive("target_player")))))
            )
        ),
        Card(
            id = "chaos_wild_mutation",
            name = "Wild Mutation",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Randomly swap pinned Power or Adapt cards.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("SWAP_POWERS_RANDOM"), "params" to JsonObject(mapOf("target" to JsonPrimitive("all")))))
            )
        ),
        Card(
            id = "chaos_cataclysm_redirect",
            name = "Cataclysm Redirect",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Redirect one Catac card.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("redirect_catac"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "chaos_draw_flux",
            name = "Draw Flux",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Everyone draws 1 card.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("all")))))
            )
        ),
        Card(
            id = "chaos_survival_override",
            name = "Survival Override",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "All Survival cards +1 Point this turn.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("survival_plus_1_pt"), "target" to JsonPrimitive("all")))))
            )
        ),
        Card(
            id = "chaos_catac_amplifier",
            name = "Catac Amplifier",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Next Catac card effect doubled.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("double_next_catac"), "target" to JsonPrimitive("global")))))
            )
        ),
        Card(
            id = "chaos_temporal_shuffle",
            name = "Temporal Shuffle",
            type = CardType.CHAOS,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Reshuffle next turn order randomly.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("RESHUFFLE_TURN_ORDER"), "params" to JsonObject(mapOf())))
            )
        ),
        Card(
            id = "ascended_phoenix_rebirth",
            name = "Phoenix Rebirth",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 1,
            description = "Revive to 2 Health when reaching 0.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("revive_2"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "ascended_chrono_echo",
            name = "Chrono Echo",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 1,
            description = "Repeat last Survival card effect.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("REPEAT_LAST_SURVIVAL"), "params" to JsonObject(mapOf())))
            )
        ),
        Card(
            id = "ascended_apex_predator",
            name = "Apex Predator",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 3,
            description = "Steal next draw phase from opponent.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("steal_draw"), "target" to JsonPrimitive("target_player")))))
            )
        ),
        Card(
            id = "ascended_omega_protocol",
            name = "Omega Protocol",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 5,
            description = "+15 Points in one turn.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(15), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "ascended_void_mastery",
            name = "Void Mastery",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 5,
            description = "Swap entire hand with opponent.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("SWAP_HANDS"), "params" to JsonObject(mapOf("targetA" to JsonPrimitive("self"), "targetB" to JsonPrimitive("target_player")))))
            )
        ),
        Card(
            id = "ascended_singularity",
            name = "Singularity",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 5,
            description = "Reset all players to 0 Points.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("SET_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(0), "target" to JsonPrimitive("all")))))
            )
        ),
        Card(
            id = "ascended_time_paradox",
            name = "Time Paradox",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 5,
            description = "Reverse turn order of match.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("REVERSE_TURN_ORDER"), "params" to JsonObject(mapOf("duration" to JsonPrimitive("permanent")))))
            )
        ),
        Card(
            id = "ascended_quantum_shift",
            name = "Quantum Shift",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 4,
            description = "Swap two opponents’ pinned Power cards.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("SWAP_PINNED_POWERS"), "params" to JsonObject(mapOf("targetA" to JsonPrimitive("random_opponent"), "targetB" to JsonPrimitive("random_opponent")))))
            )
        ),
        Card(
            id = "ascended_energy_convergence",
            name = "Energy Convergence",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 4,
            description = "Draw 5 cards; discard 2.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(5), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "ascended_life_nexus",
            name = "Life Nexus",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 3,
            description = "Heal 3 Health instantly.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "ascended_chaos_engine",
            name = "Chaos Engine",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 3,
            description = "Play two Chaos cards immediately.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_ACTIONS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-2), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "ascended_adaptive_ascension",
            name = "Adaptive Ascension",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 2,
            description = "Upgrade one Adapt card for double effect.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("upgrade_adapt"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "ascended_temporal_rewind",
            name = "Temporal Rewind",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 4,
            description = "Undo last turn of any player.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("UNDO_LAST_TURN"), "params" to JsonObject(mapOf())))
            )
        ),
        Card(
            id = "ascended_bio_ascendancy",
            name = "Bio Ascendancy",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 2,
            description = "Prevent all Health loss for one turn.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("prevent_health_loss_global"), "target" to JsonPrimitive("all")))))
            )
        ),
        Card(
            id = "ascended_power_overload",
            name = "Power Overload",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 3,
            description = "All pinned Power cards gain +2 Points.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS_SCALED"), "params" to JsonObject(mapOf("scaleBy" to JsonPrimitive("all_pinned_powers"), "multiplier" to JsonPrimitive(2), "target" to JsonPrimitive("all")))))
            )
        ),
        Card(
            id = "ascended_survival_apex",
            name = "Survival Apex",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 2,
            description = "All Survival cards +1 Point this turn.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("survival_plus_1_pt"), "target" to JsonPrimitive("all")))))
            )
        ),
        Card(
            id = "ascended_cataclysm_override",
            name = "Cataclysm Override",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 5,
            description = "Cancel next Catac effect globally.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("cancel_next_catac"), "target" to JsonPrimitive("global")))))
            )
        ),
        Card(
            id = "ascended_event_manipulator",
            name = "Event Manipulator",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 4,
            description = "Redirect any Twist or Catac card.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("redirect_twist_catac"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "ascended_strategic_reposition",
            name = "Strategic Reposition",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 2,
            description = "Swap two opponents’ hands.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("SWAP_HANDS"), "params" to JsonObject(mapOf("targetA" to JsonPrimitive("random_opponent"), "targetB" to JsonPrimitive("random_opponent")))))
            )
        ),
        Card(
            id = "ascended_ultimate_nexus",
            name = "Ultimate Nexus",
            type = CardType.ASCENDED,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = 5,
            description = "Draw 5, gain 5 Health, +10 Points.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(10), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(5), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "twist_blessing_of_unity",
            name = "Blessing of Unity",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Everyone draws 3 cards.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("all")))))
            )
        ),
        Card(
            id = "twist_risk_factor",
            name = "Risk Factor",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "50/50 chance gain/lose 3 Points.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("CHANCE"), "params" to JsonObject(mapOf("probability" to JsonPrimitive(0.5))), "then" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self"))))))), "else" to JsonArray(listOf(JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-3), "target" to JsonPrimitive("self")))))))))
            )
        ),
        Card(
            id = "twist_stasis_lock",
            name = "Stasis Lock",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Skip your next turn.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("skip_next"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "twist_luck_surge",
            name = "Luck Surge",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Draw 2 cards; +2 Points.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "twist_minor_luck",
            name = "Minor Luck",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Gain 5 Points.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(5), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "twist_reverse_trick",
            name = "Reverse Trick",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Reverse turn order for 1 round.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("REVERSE_TURN_ORDER"), "params" to JsonObject(mapOf("duration" to JsonPrimitive("round")))))
            )
        ),
        Card(
            id = "twist_extra_hand",
            name = "Extra Hand",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Temporarily increase max hand to 6.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_MAX_HAND"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "twist_selfswap",
            name = "Self-Swap",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Swap two of your own cards.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "twist_quick_draw",
            name = "Quick Draw",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Draw 1 card immediately.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "twist_energy_boost",
            name = "Energy Boost",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+3 Points; only affects drawer.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(3), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "twist_health_spike",
            name = "Health Spike",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+1 Health; cannot exceed 5.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "twist_card_exchange",
            name = "Card Exchange",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Swap 1 card with discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("RETURN_FROM_DISCARD"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "twist_safety_net",
            name = "Safety Net",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Prevent next negative card effect.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("prevent_negative"), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "twist_minor_shuffle",
            name = "Minor Shuffle",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Shuffle your hand; draw 1.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("SHUFFLE_HAND_INTO_DECK"), "params" to JsonObject(mapOf("target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "twist_lucky_rebound",
            name = "Lucky Rebound",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Return one discarded card to hand.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("RETURN_FROM_DISCARD"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "twist_bonus_action",
            name = "Bonus Action",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Play an extra card this turn.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_ACTIONS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "twist_turn_skip",
            name = "Turn Skip",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Skip target player’s next turn.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("skip_next"), "target" to JsonPrimitive("target_player")))))
            )
        ),
        Card(
            id = "twist_energy_draw",
            name = "Energy Draw",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Draw 2 cards; discard 1.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "twist_point_spike",
            name = "Point Spike",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+5 Points; only drawer affected.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(5), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "twist_card_rebound",
            name = "Card Rebound",
            type = CardType.TWIST,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Return a played card from discard to hand.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("RETURN_FROM_DISCARD"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self")))))
            )
        ),
        Card(
            id = "cataclysm_the_apocalypse",
            name = "The Apocalypse",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "+10 Points, strike all players; discard immediately.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-10), "target" to JsonPrimitive("all"))))),
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-10), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_plague_of_misfortune",
            name = "Plague of Misfortune",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Target loses 5 Health; discard immediately.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-3), "target" to JsonPrimitive("all"))))),
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-2), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_black_hole",
            name = "Black Hole",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Swap hand with discard pile; discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("SWAP_HANDS"), "params" to JsonObject(mapOf("targetA" to JsonPrimitive("self"), "targetB" to JsonPrimitive("discard_pile"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_wild_fire",
            name = "Wild Fire",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "All opponents lose 3 Points; discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-2), "target" to JsonPrimitive("all"))))),
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_curse_of_delay",
            name = "Curse of Delay",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Skip next turn; discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("skip_next"), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceSelfDrawn" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_instant_trap",
            name = "Instant Trap",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Any player draws extra card; discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DRAW_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("all"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_energy_drain",
            name = "Energy Drain",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Lose 3 Points; discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-2), "target" to JsonPrimitive("all"))))),
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-3), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_structural_collapse",
            name = "Structural Collapse",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Target loses pinned Power; discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DESTROY_PINNED"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("target_player"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_viral_outbreak",
            name = "Viral Outbreak",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Target loses 2 Health; discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-2), "target" to JsonPrimitive("target_player"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_gravity_rift",
            name = "Gravity Rift",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "All hands shuffled; discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("SHUFFLE_HAND_INTO_DECK"), "params" to JsonObject(mapOf("target" to JsonPrimitive("all"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_acid_spill",
            name = "Acid Spill",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Target loses 2 Points; discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-2), "target" to JsonPrimitive("target_player"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_temporal_collapse",
            name = "Temporal Collapse",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Skip next 2 draws; discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("skip_next_draw_2"), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_resource_failure",
            name = "Resource Failure",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Discard 2 Survival cards; discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(2), "filter" to JsonPrimitive("SURVIVAL"), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_firebreak",
            name = "Firebreak",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Target cannot play Fire Survival card next turn; discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("cannot_play_fire"), "target" to JsonPrimitive("target_player"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_flood_surge",
            name = "Flood Surge",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Target loses 3 Points; discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_POINTS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-3), "target" to JsonPrimitive("target_player"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_bio_contagion",
            name = "Bio Contagion",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "All opponents lose 1 Health; discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-1), "target" to JsonPrimitive("all"))))),
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_magnetic_storm",
            name = "Magnetic Storm",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Swap pinned Power with opponent; discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("SWAP_PINNED_POWERS"), "params" to JsonObject(mapOf("targetA" to JsonPrimitive("self"), "targetB" to JsonPrimitive("target_player"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_cataclysm_pulse",
            name = "Cataclysm Pulse",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "All discard piles shuffled; discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("SHUFFLE_DISCARD_INTO_DECK"), "params" to JsonObject(mapOf()))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_sudden_quake",
            name = "Sudden Quake",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Target skips next action; discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("APPLY_BUFF"), "params" to JsonObject(mapOf("buffId" to JsonPrimitive("skip_next_action"), "target" to JsonPrimitive("target_player"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        ),
        Card(
            id = "cataclysm_void_rift",
            name = "Void Rift",
            type = CardType.CATACLYSM,
            pointsDelta = 0,
            drawCount = 0,
            disasterKind = null,
            blocksDisaster = null,
            tier = null,
            description = "Draw 1, lose 1 Health; discard.",
            discardCost = 0,
            primitives = listOf(
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-1), "target" to JsonPrimitive("target_player"))))),
                JsonObject(mapOf("type" to JsonPrimitive("MODIFY_HEALTH"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(-1), "target" to JsonPrimitive("self"))))),
                JsonObject(mapOf("type" to JsonPrimitive("DISCARD_CARDS"), "params" to JsonObject(mapOf("amount" to JsonPrimitive(1), "target" to JsonPrimitive("self"), "forceAction" to JsonPrimitive(true)))))
            )
        )
    )
}
