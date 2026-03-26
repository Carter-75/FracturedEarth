package com.fracturedearth.core.model

object CardCatalog {
    /**
     * Full deck: 25 unique cards per category × 2 copies = 250 cards total.
     * SURVIVAL  — adds pointsDelta to active player's survival points.
     * DISASTER  — pointsDelta is negative health damage; blocked by matching TRAIT/ADAPT.
     * TRAIT     — permanent passive blocker in active player's trait list.
     * ADAPT     — one-use blocker; consumed when it blocks a disaster.
     * CHAOS     — active player gains pointsDelta survival points; all opponents lose 1 health.
     */
    fun starterDeck(): List<Card> = (survival + disasters + traits + adapt + chaos)
        .flatMap { card -> List(2) { card.copy(id = "${card.id}_$it") } }

    // ── SURVIVAL (25) ───────────────────────────────────────────────────
    private val survival = listOf(
        Card("survival_agriculture",        "Agriculture",           CardType.SURVIVAL, pointsDelta = 3),
        Card("survival_water_reserves",     "Water Reserves",        CardType.SURVIVAL, pointsDelta = 2),
        Card("survival_energy_grid",        "Energy Grid",           CardType.SURVIVAL, pointsDelta = 2, drawCount = 1),
        Card("survival_population_boom",    "Population Boom",       CardType.SURVIVAL, pointsDelta = 4),
        Card("survival_solar_power",        "Solar Power",           CardType.SURVIVAL, pointsDelta = 3),
        Card("survival_desalination",       "Desalination Plant",    CardType.SURVIVAL, pointsDelta = 2),
        Card("survival_underground_vault",  "Underground Vault",     CardType.SURVIVAL, pointsDelta = 1, drawCount = 2),
        Card("survival_biodome",            "Biodome",               CardType.SURVIVAL, pointsDelta = 4),
        Card("survival_nuclear_reactor",    "Nuclear Reactor",       CardType.SURVIVAL, pointsDelta = 5),
        Card("survival_wind_farms",         "Wind Farms",            CardType.SURVIVAL, pointsDelta = 2),
        Card("survival_research_institute", "Research Institute",    CardType.SURVIVAL, pointsDelta = 1, drawCount = 2),
        Card("survival_trade_network",      "Trade Network",         CardType.SURVIVAL, pointsDelta = 3),
        Card("survival_geothermal",         "Geothermal Energy",     CardType.SURVIVAL, pointsDelta = 3),
        Card("survival_hydroponics",        "Hydroponics Bay",       CardType.SURVIVAL, pointsDelta = 4),
        Card("survival_comms_array",        "Communications Array",  CardType.SURVIVAL, pointsDelta = 2, drawCount = 1),
        Card("survival_medical_lab",        "Medical Lab",           CardType.SURVIVAL, pointsDelta = 2),
        Card("survival_military",           "Military Stronghold",   CardType.SURVIVAL, pointsDelta = 2),
        Card("survival_bunker",             "Bunker Complex",        CardType.SURVIVAL, pointsDelta = 3),
        Card("survival_satellite_grid",     "Satellite Grid",        CardType.SURVIVAL, pointsDelta = 1, drawCount = 2),
        Card("survival_ocean_platform",     "Ocean Platform",        CardType.SURVIVAL, pointsDelta = 3),
        Card("survival_refugee_camp",       "Refugee Camp",          CardType.SURVIVAL, pointsDelta = 2),
        Card("survival_crop_rotation",      "Crop Rotation",         CardType.SURVIVAL, pointsDelta = 3),
        Card("survival_alliance_pact",      "Alliance Pact",         CardType.SURVIVAL, pointsDelta = 4),
        Card("survival_food_stockpile",     "Food Stockpile",        CardType.SURVIVAL, pointsDelta = 3),
        Card("survival_orbital_station",    "Orbital Station",       CardType.SURVIVAL, pointsDelta = 5),
    )

    // ── DISASTER (25) — pointsDelta is negative (health damage) ─────────
    private val disasters = listOf(
        // EARTHQUAKE (7)
        Card("disaster_earthquake",         "Earthquake",            CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.EARTHQUAKE),
        Card("disaster_volcanic_eruption",  "Volcanic Eruption",     CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.EARTHQUAKE),
        Card("disaster_tremor",             "Tremor",                CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.EARTHQUAKE),
        Card("disaster_aftershock",         "Aftershock",            CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.EARTHQUAKE),
        Card("disaster_landslide",          "Landslide",             CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.EARTHQUAKE),
        Card("disaster_fault_rupture",      "Fault Rupture",         CardType.DISASTER, pointsDelta = -2, disasterKind = DisasterKind.EARTHQUAKE),
        Card("disaster_sinkhole",           "Sinkhole",              CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.EARTHQUAKE),
        // PLAGUE (6)
        Card("disaster_plague",             "Plague",                CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.PLAGUE),
        Card("disaster_pandemic",           "Pandemic",              CardType.DISASTER, pointsDelta = -2, disasterKind = DisasterKind.PLAGUE),
        Card("disaster_famine",             "Famine",                CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.PLAGUE),
        Card("disaster_bioweapon",          "Bioweapon Release",     CardType.DISASTER, pointsDelta = -2, disasterKind = DisasterKind.PLAGUE),
        Card("disaster_rat_invasion",       "Rat Invasion",          CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.PLAGUE),
        Card("disaster_contamination",      "Water Contamination",   CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.PLAGUE),
        // FLOOD (6)
        Card("disaster_flood",              "Flood",                 CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.FLOOD),
        Card("disaster_tsunami",            "Tsunami",               CardType.DISASTER, pointsDelta = -2, disasterKind = DisasterKind.FLOOD),
        Card("disaster_storm_surge",        "Storm Surge",           CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.FLOOD),
        Card("disaster_flash_flood",        "Flash Flood",           CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.FLOOD),
        Card("disaster_coastal_collapse",   "Coastal Collapse",      CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.FLOOD),
        Card("disaster_dam_failure",        "Dam Failure",           CardType.DISASTER, pointsDelta = -2, disasterKind = DisasterKind.FLOOD),
        // WILDFIRE (6)
        Card("disaster_wildfire",           "Wildfire",              CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.WILDFIRE),
        Card("disaster_forest_fire",        "Forest Fire",           CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.WILDFIRE),
        Card("disaster_firestorm",          "Firestorm",             CardType.DISASTER, pointsDelta = -2, disasterKind = DisasterKind.WILDFIRE),
        Card("disaster_ember_storm",        "Ember Storm",           CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.WILDFIRE),
        Card("disaster_ash_cloud",          "Ash Cloud",             CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.WILDFIRE),
        Card("disaster_underground_inferno","Underground Inferno",   CardType.DISASTER, pointsDelta = -1, disasterKind = DisasterKind.WILDFIRE),
    )

    // ── TRAIT (25) — permanent passive blockers ──────────────────────────
    private val traits = listOf(
        // EARTHQUAKE blockers (7)
        Card("trait_fortified_cities",      "Fortified Cities",          CardType.TRAIT, blocksDisaster = DisasterKind.EARTHQUAKE),
        Card("trait_seismic_dampeners",     "Seismic Dampeners",         CardType.TRAIT, blocksDisaster = DisasterKind.EARTHQUAKE),
        Card("trait_earthquake_drills",     "Earthquake Drills",         CardType.TRAIT, blocksDisaster = DisasterKind.EARTHQUAKE),
        Card("trait_deep_foundations",      "Deep Foundation Piers",     CardType.TRAIT, blocksDisaster = DisasterKind.EARTHQUAKE),
        Card("trait_underground_infra",     "Underground Infrastructure", CardType.TRAIT, blocksDisaster = DisasterKind.EARTHQUAKE),
        Card("trait_shock_absorbers",       "Shock Absorbers",           CardType.TRAIT, blocksDisaster = DisasterKind.EARTHQUAKE),
        Card("trait_bedrock_anchoring",     "Bedrock Anchoring",         CardType.TRAIT, blocksDisaster = DisasterKind.EARTHQUAKE),
        // PLAGUE blockers (6)
        Card("trait_medical_network",       "Medical Network",           CardType.TRAIT, blocksDisaster = DisasterKind.PLAGUE),
        Card("trait_quarantine_protocol",   "Quarantine Protocol",       CardType.TRAIT, blocksDisaster = DisasterKind.PLAGUE),
        Card("trait_vaccine_program",       "Vaccine Program",           CardType.TRAIT, blocksDisaster = DisasterKind.PLAGUE),
        Card("trait_disease_surveillance",  "Disease Surveillance",      CardType.TRAIT, blocksDisaster = DisasterKind.PLAGUE),
        Card("trait_biosecurity_border",    "Biosecurity Border",        CardType.TRAIT, blocksDisaster = DisasterKind.PLAGUE),
        Card("trait_epidemiology_grid",     "Epidemiology Grid",         CardType.TRAIT, blocksDisaster = DisasterKind.PLAGUE),
        // FLOOD blockers (6)
        Card("trait_amphibious_society",    "Amphibious Society",        CardType.TRAIT, blocksDisaster = DisasterKind.FLOOD),
        Card("trait_levee_system",          "Levee System",              CardType.TRAIT, blocksDisaster = DisasterKind.FLOOD),
        Card("trait_stormwater_mgmt",       "Stormwater Management",     CardType.TRAIT, blocksDisaster = DisasterKind.FLOOD),
        Card("trait_tide_gates",            "Tide Gates",                CardType.TRAIT, blocksDisaster = DisasterKind.FLOOD),
        Card("trait_floating_city",         "Floating City Design",      CardType.TRAIT, blocksDisaster = DisasterKind.FLOOD),
        Card("trait_mangrove_restoration",  "Mangrove Restoration",      CardType.TRAIT, blocksDisaster = DisasterKind.FLOOD),
        // WILDFIRE blockers (6)
        Card("trait_firebreak",             "Firebreak Systems",         CardType.TRAIT, blocksDisaster = DisasterKind.WILDFIRE),
        Card("trait_controlled_burns",      "Controlled Burns",          CardType.TRAIT, blocksDisaster = DisasterKind.WILDFIRE),
        Card("trait_firewatch_towers",      "FireWatch Towers",          CardType.TRAIT, blocksDisaster = DisasterKind.WILDFIRE),
        Card("trait_flame_retardant",       "Flame Retardant Coating",   CardType.TRAIT, blocksDisaster = DisasterKind.WILDFIRE),
        Card("trait_thermal_barrier",       "Thermal Barrier",           CardType.TRAIT, blocksDisaster = DisasterKind.WILDFIRE),
        Card("trait_smoke_jumpers",         "Smoke Jumpers Elite",       CardType.TRAIT, blocksDisaster = DisasterKind.WILDFIRE),
    )

    // ── ADAPT (25) — one-use reactive blockers ───────────────────────────
    private val adapt = listOf(
        // EARTHQUAKE (7)
        Card("adapt_emergency_response",    "Emergency Response",        CardType.ADAPT, blocksDisaster = DisasterKind.EARTHQUAKE),
        Card("adapt_rapid_rebuild",         "Rapid Rebuild",             CardType.ADAPT, blocksDisaster = DisasterKind.EARTHQUAKE),
        Card("adapt_aftershock_warning",    "Aftershock Warning",        CardType.ADAPT, blocksDisaster = DisasterKind.EARTHQUAKE),
        Card("adapt_seismic_isolation",     "Seismic Isolation",         CardType.ADAPT, blocksDisaster = DisasterKind.EARTHQUAKE),
        Card("adapt_structural_reinforce",  "Structural Reinforcement",   CardType.ADAPT, blocksDisaster = DisasterKind.EARTHQUAKE),
        Card("adapt_debris_removal",        "Debris Removal",            CardType.ADAPT, blocksDisaster = DisasterKind.EARTHQUAKE),
        Card("adapt_fault_zone_mapping",    "Fault Zone Mapping",        CardType.ADAPT, blocksDisaster = DisasterKind.EARTHQUAKE),
        // PLAGUE (6)
        Card("adapt_countermeasure",        "Countermeasure",            CardType.ADAPT, blocksDisaster = DisasterKind.PLAGUE),
        Card("adapt_field_hospital",        "Field Hospital",            CardType.ADAPT, blocksDisaster = DisasterKind.PLAGUE),
        Card("adapt_contact_tracing",       "Contact Tracing",           CardType.ADAPT, blocksDisaster = DisasterKind.PLAGUE),
        Card("adapt_antiviral_surge",       "Antiviral Surge",           CardType.ADAPT, blocksDisaster = DisasterKind.PLAGUE),
        Card("adapt_prophylactic",          "Prophylactic Measures",     CardType.ADAPT, blocksDisaster = DisasterKind.PLAGUE),
        Card("adapt_herd_immunity",         "Herd Immunity Push",        CardType.ADAPT, blocksDisaster = DisasterKind.PLAGUE),
        // FLOOD (6)
        Card("adapt_evacuation",            "Evacuation",                CardType.ADAPT, blocksDisaster = DisasterKind.FLOOD),
        Card("adapt_sandbag_defense",       "Sandbag Defense",           CardType.ADAPT, blocksDisaster = DisasterKind.FLOOD),
        Card("adapt_emergency_levy",        "Emergency Levy",            CardType.ADAPT, blocksDisaster = DisasterKind.FLOOD),
        Card("adapt_temporary_dam",         "Temporary Dam",             CardType.ADAPT, blocksDisaster = DisasterKind.FLOOD),
        Card("adapt_flood_barriers",        "Flood Barriers",            CardType.ADAPT, blocksDisaster = DisasterKind.FLOOD),
        Card("adapt_canal_diversion",       "Canal Diversion",           CardType.ADAPT, blocksDisaster = DisasterKind.FLOOD),
        // WILDFIRE (6)
        Card("adapt_crisis_protocol",       "Crisis Protocol",           CardType.ADAPT, blocksDisaster = DisasterKind.WILDFIRE),
        Card("adapt_fire_retardant_drop",   "Fire Retardant Drop",       CardType.ADAPT, blocksDisaster = DisasterKind.WILDFIRE),
        Card("adapt_backfire_line",         "Backfire Line",             CardType.ADAPT, blocksDisaster = DisasterKind.WILDFIRE),
        Card("adapt_waterbombing",          "Aircraft Waterbombing",     CardType.ADAPT, blocksDisaster = DisasterKind.WILDFIRE),
        Card("adapt_controlled_ignition",   "Controlled Ignition",       CardType.ADAPT, blocksDisaster = DisasterKind.WILDFIRE),
        Card("adapt_ember_watch",           "Ember Watch",               CardType.ADAPT, blocksDisaster = DisasterKind.WILDFIRE),
    )

    // ── CHAOS (25) — GLOBAL events; active player gains pointsDelta survivalPoints ─
    private val chaos = listOf(
        Card("chaos_meteor",                "Meteor Shower",             CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_solar_flare",           "Solar Flare",               CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_ice_age",               "Ice Age",                   CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_superstorm",            "Superstorm",                CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_cme",                   "Coronal Mass Ejection",     CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_gamma_burst",           "Gamma Ray Burst",           CardType.CHAOS, pointsDelta = 4, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_pole_reversal",         "Magnetic Pole Reversal",    CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_supervolcano",          "Supervolcano",              CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_asteroid",              "Asteroid Strike",           CardType.CHAOS, pointsDelta = 4, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_ozone_collapse",        "Ozone Layer Collapse",      CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_gravity_anomaly",       "Gravity Anomaly",           CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_dimensional_rift",      "Dimensional Rift",          CardType.CHAOS, pointsDelta = 4, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_tectonic_upheaval",     "Tectonic Upheaval",         CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_dark_matter",           "Dark Matter Wave",          CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_solar_storm",           "Solar Storm",               CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_kinetic_bombardment",   "Kinetic Bombardment",       CardType.CHAOS, pointsDelta = 4, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_rogue_wave",            "Rogue Wave",                CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_atmo_collapse",         "Atmospheric Collapse",      CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_subduction",            "Subduction Event",          CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_biomass_collapse",      "Biomass Collapse",          CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_radiation_surge",       "Radiation Surge",           CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_civ_reset",             "Civilizational Reset",      CardType.CHAOS, pointsDelta = 5, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_magnetic_storm",        "Magnetic Storm",            CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_ocean_heat",            "Ocean Heat Spike",          CardType.CHAOS, pointsDelta = 3, disasterKind = DisasterKind.GLOBAL),
        Card("chaos_starfall",              "Starfall",                  CardType.CHAOS, pointsDelta = 4, disasterKind = DisasterKind.GLOBAL),
    )
}
