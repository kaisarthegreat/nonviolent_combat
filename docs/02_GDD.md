# Game Design Document (GDD)

## 1. Game Concept & Philosophy
- **Working Title:** *Satyagraha: The Unbroken Line*
- **Theme:** Pacifist resistance, moral endurance, and public conscience.
- **Core Loop:** Advance on the designated route -> Read opponent attack telegraphs -> Choose between precision dodge (to recover health) or peaceful brace (to maximize support) -> Convert opponents until the line is cleared.

---

## 2. Core Mechanics & Mathematical Balance

### 2.1 Primary Meters
1. **Health (HP: 0 – 100)**
   - Initial value: `100`
   - Floor: `0` (triggers Defeat)
   - Decay: Struck by baton/shield (`-15 HP` base; reduced to `-8 HP` if Braced)
   - Recovery: Successful timed dodge (`+5 HP` composure bonus)

2. **Public Support (SP: 0 – 100)**
   - Initial value: `0`
   - Target for Victory: `>= Opponent Force Score` (e.g., `80 SP`)
   - Accumulation:
     - Taking an unretaliated blow: `+10 SP` (Base)
     - Taking a blow while kneeling/bracing: `+18 SP`
     - Witness multiplier (Bystanders / Camera in range): `x 1.5`
     - Passive holding of ground on designated path: `+1 SP / 2 sec`
   - Depletion (Rule Violations):
     - Attempting physical strike/retaliation: `-35 SP`
     - Leaving the designated path: `-5 SP / sec`
     - Damaging municipal property / storefronts: `-50 SP`

### 2.2 Mathematical State Formula
At any frame $t$, the net crowd solidarity $S_t$ and health $H_t$ update as:
$$H_{t+1} = \min(100, H_t - \Delta D_{hit} + \Delta R_{dodge})$$
$$S_{t+1} = \max(0, \min(100, S_t + (\Delta S_{hit} \cdot M_{witness}) - \Delta P_{violation}))$$

Where:
- $\Delta D_{hit} \in \{8, 15\}$ depending on brace state
- $\Delta R_{dodge} = 5$ on timed evasion
- $M_{witness} \in [1.0, 2.0]$ based on proximity to press/bystanders
- $\Delta P_{violation} \in \{5, 35, 50\}$ for infractions

---

## 3. Player Actions (100% Non-Violent)

1. **March (Movement):** Walk steadily along the route (WASD or Touch Joystick).
2. **Precision Dodge (Space / Touch Button A):** Quick side-step or backward pivot with a 0.25-second invulnerability/recovery window.
3. **Peaceful Brace / Kneel (Shift / Touch Button B):** Movement speed drops to 0; player lowers head or kneels. Halves damage received and increases public sympathy by 80%.
4. **Moral Appeal / Chant (E / Touch Button C):** Radiates a calming ripple. Temporarily delays opponent attack charge by 1.5 seconds. Cooldown: 8 seconds.

---

## 4. Opponent Behavior & Archetypes

```
           [Idle / Patrol]
                 │ (Player enters vision cone)
                 ▼
          [Telegraph Wind-Up] (Red hazard indicator 0.75s)
                 │
        ┌────────┴────────┐
        ▼                 ▼
  [Execute Strike]    [Player Dodged / Braced]
        │                 │
        ▼                 ▼
   (HP decreases)   (Support increases)
        │                 │
        └────────┬────────┘
                 │
                 ▼
       [Check Morale Level]
      (Support > Threshold?)
         /             \
       YES              NO
       /                 \
[Lower Baton / Defect]  [Reset to Patrol]
```

### Opponent Archetypes:
1. **Frontline Officer (Baton):** Moves moderately; swings with a 0.75-second telegraph. Disperses at `40 SP`.
2. **Shield Enforcer (Riot Shield):** Slow moving; attempts to push player off the designated path. Disperses at `65 SP`.
3. **Mounted / Barricade Officer:** Stationary obstacle; blocks road until total crowd Support reaches `80 SP`.

---

## 5. Level & Environment Design
- **Setting:** Historic civil rights boulevard lined with sidewalks, shopfronts, and gathering bystanders.
- **Designated Path:** A highlighted clean street section marked with guide flags.
- **Bystander Areas:** Sidewalks containing civilians and photojournalists holding cameras (flashes indicate witness multiplier active).
- **Barricades:** Obstacles that part once the crowd Support reaches milestone levels.
