# VF Foundations DESIGN.md

> Agent-readable foundation contract generated from the live **VF Foundations** Figma file on 2026-07-13. This document covers text styles, color variables, spacing variables, and elevation variables/styles. Figma remains the source of truth.

## Design Flow interpretation

For Design Flow, this document is the contract for **Vodafone color and typography** plus the centralized runtime mappings used by Design Flow-owned components. Under D-099, Vodafone Foundations are authoritative for color and typography only. The extracted Vodafone spacing, elevation, and component inventories remain source research, but they do not determine Design Flow's non-color component presentation.

- Design Flow owns its component code and public APIs under `src/ui/`.
- Vodafone semantic color roles/modes and Vodafone text styles remain authoritative.
- Verified Astryx references under `references/astryx/` are the preferred baseline for anatomy, proportions, density, sizing, spacing, shape, border/elevation geometry, motion, states, responsive behavior, interaction, and accessibility. Astryx is not installed, imported, copied, or wrapped.
- The Vodafone spacing, elevation, shared-component, and product-component inventories later in this file are provenance records only after D-099. They do not override verified Astryx non-color presentation, bind Design Flow to Vodafone Figma properties, or prescribe a code API.
- Translate verified Astryx presentation into centralized Design Flow semantic aliases here. If official Astryx guidance does not expose a required value, record the gap and approve an explicit fallback before implementation.
- See [ui-architecture.md](ui-architecture.md) for the full precedence and component workflow.

## 1. Foundation model

The system uses a deliberate token hierarchy:

1. **Core primitives** contain extracted raw palette, spacing, size, and type values; only color and typography are automatically adopted as Design Flow authority.
2. **Typography variables** provide language-aware font primitives for English and Arabic.
3. **Responsive variables** map semantic spacing to mobile, tablet, small desktop, and large desktop modes.
4. **Semantic variables** express intent and switch between Light and Dark modes.
5. **Component variables** consume the layers above; they are outside this document's requested scope.

### Rules for agents and implementers

- Prefer semantic tokens in product UI. Use core color/type tokens only when defining or extending semantic color/type tokens, or when a primitive is explicitly required.
- Preserve aliases. Do not replace semantic references with copied hex or pixel literals.
- Treat mode values as one token with multiple values, not as separately named tokens.
- Use the nearest existing text style. Do not invent intermediate type sizes or weights.
- Do not adopt Vodafone `space/*`, elevation, sizing, or shape values solely because they appear in this extraction. Runtime non-color presentation must trace to verified Astryx guidance or an explicit Design Flow fallback.
- Preserve semantic aliases for Astryx-aligned presentation so reference changes can be remapped centrally.
- Meet WCAG contrast requirements in every mode; a token name does not guarantee contrast in every composition.

## 2. Typography

### Typography principles

- **Vodafone VF** is the single system family in the current file.
- Editorial styles are reserved for campaign-scale moments; Display and Heading styles establish product hierarchy.
- Body styles carry reading content. Label, Caption, Button, and Link styles are role-specific and should not be substituted merely because their metrics match.
- Tracking is neutral in the current style set. Preserve `0%` letter spacing unless the source style changes.
- Underlines are explicit link variants. Do not underline buttons or non-interactive labels.
- The Typography variable collection supports **English** and **Arabic**. Even where current values match, keep the modes separate so script-specific tuning remains possible.

### Local text styles

| Style | Role | Family | Weight | Size | Line height | Tracking | Case | Decoration | Recommended use |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Editorial/Regular/56` | Editorial | Vodafone VF | Regular | 56px | 54px | 0% | Original | None | Campaign/editorial hero |
| `Editorial/Regular/48` | Editorial | Vodafone VF | Regular | 48px | 48px | 0% | Original | None | Secondary editorial hero |
| `Display/Bold/40` | Display | Vodafone VF | Bold | 40px | 45.9px | 0% | Original | None | Largest product display |
| `Display/Bold/36` | Display | Vodafone VF | Bold | 36px | 41.3px | 0% | Original | None | Large display |
| `Display/Bold/32` | Display | Vodafone VF | Bold | 32px | 36.7px | 0% | Original | None | Compact display |
| `Display/SemiBold/28` | Display | Vodafone VF | SemiBold | 28px | 32.1px | 0% | Original | None | Section display |
| `Display/Medium/20` | Display | Vodafone VF | Medium | 20px | 23px | 0% | Original | None | Small display |
| `Heading/SemiBold/24` | Heading | Vodafone VF | SemiBold | 24px | 27.6px | 0% | Original | None | Primary heading |
| `Heading/SemiBold/20` | Heading | Vodafone VF | SemiBold | 20px | 23px | 0% | Original | None | Secondary heading |
| `Heading/SemiBold/18` | Heading | Vodafone VF | SemiBold | 18px | 20.7px | 0% | Original | None | Compact heading |
| `Heading/Medium/24` | Heading | Vodafone VF | Medium | 24px | 27.6px | 0% | Original | None | Lower-emphasis heading |
| `Heading/Medium/18` | Heading | Vodafone VF | Medium | 18px | 20.7px | 0% | Original | None | Lower-emphasis compact heading |
| `Heading/Medium/16` | Heading | Vodafone VF | Medium | 16px | 18.4px | 0% | Original | None | Dense UI heading |
| `Body/Regular/16` | Body | Vodafone VF | Regular | 16px | 18.4px | 0% | Original | None | Default body |
| `Body/Regular/14` | Body | Vodafone VF | Regular | 14px | 16.1px | 0% | Original | None | Secondary body |
| `Body/Regular/12` | Body | Vodafone VF | Regular | 12px | 13.8px | 0% | Original | None | Dense supporting text |
| `Label/Medium/14` | Label | Vodafone VF | Medium | 14px | 16.1px | 0% | Original | None | Default label |
| `Label/Medium/12` | Label | Vodafone VF | Medium | 12px | 13.8px | 0% | Original | None | Compact label |
| `Caption/Medium/12` | Caption | Vodafone VF | Medium | 12px | 13.8px | 0% | Original | None | Caption and metadata |
| `Button/Button-Text/Medium/16` | Button | Vodafone VF | Medium | 16px | 18.4px | 0% | Original | None | Large button |
| `Button/Button-Text/Medium/14` | Button | Vodafone VF | Medium | 14px | 16.1px | 0% | Original | None | Default button |
| `Button/Button-Text-Hyperlink/Medium/16` | Link | Vodafone VF | Medium | 16px | 18.4px | 0% | Original | None | Large text link |
| `Button/Button-Text-Hyperlink/Medium/14` | Link | Vodafone VF | Medium | 14px | 16.1px | 0% | Original | None | Default text link |
| `Button/Button-Text-Hyperlink/Medium/12` | Link | Vodafone VF | Medium | 12px | 13.8px | 0% | Original | None | Compact text link |
| `Button/Button-Text-Hyperlink/Medium Underlined/16` | Link | Vodafone VF | Medium | 16px | 18.4px | 0% | Original | Underline | Large explicit link |
| `Button/Button-Text-Hyperlink/Medium Underlined/14` | Link | Vodafone VF | Medium | 14px | 16.1px | 0% | Original | Underline | Default explicit link |
| `Button/Button-Text-Hyperlink/Medium Underlined/12` | Link | Vodafone VF | Medium | 12px | 13.8px | 0% | Original | Underline | Compact explicit link |

### Typography variables

| Token | English | Arabic |
| --- | --- | --- |
| `typography/font/family/primary` | `Vodafone VF` | `Vodafone VF` |
| `typography/font/line-height/12` | `13.8px` | `13.8px` |
| `typography/font/line-height/14` | `16.1px` | `16.1px` |
| `typography/font/line-height/16` | `18.4px` | `19px` |
| `typography/font/line-height/18` | `20.7px` | `20.7px` |
| `typography/font/line-height/20` | `23px` | `23px` |
| `typography/font/line-height/24` | `27.6px` | `27.6px` |
| `typography/font/line-height/28` | `32.1px` | `32.1px` |
| `typography/font/line-height/32` | `36.7px` | `36.7px` |
| `typography/font/line-height/36` | `41.3px` | `41.3px` |
| `typography/font/line-height/40` | `45.9px` | `45.9px` |
| `typography/font/line-height/48` | `48px` | `64px` |
| `typography/font/line-height/56` | `54px` | `74px` |
| `typography/font/size/12` | `12px` | `12px` |
| `typography/font/size/14` | `14px` | `14px` |
| `typography/font/size/16` | `16px` | `16px` |
| `typography/font/size/18` | `18px` | `18px` |
| `typography/font/size/20` | `20px` | `20px` |
| `typography/font/size/24` | `24px` | `24px` |
| `typography/font/size/28` | `28px` | `28px` |
| `typography/font/size/32` | `32px` | `32px` |
| `typography/font/size/36` | `36px` | `36px` |
| `typography/font/size/40` | `40px` | `40px` |
| `typography/font/size/48` | `48px` | `48px` |
| `typography/font/size/56` | `56px` | `56px` |
| `typography/font/weight/bold` | `Bold` | `Bold` |
| `typography/font/weight/medium` | `Medium` | `Medium` |
| `typography/font/weight/regular` | `Regular` | `Regular` |
| `typography/font/weight/semibold` | `SemiBold` | `SemiBold` |

### Typography guardrails

- Do use Editorial sparingly for brand storytelling and campaign hero copy.
- Do use Display or Heading for product hierarchy and scannability.
- Do keep body copy at 14–16px in standard interfaces; 12px is for dense supporting content, not long reading.
- Do not infer semantic interchangeability from identical metrics. A 14px button label and 14px body style have different roles.
- Do not synthesize bold or semibold weights; load the actual Vodafone VF face.

## 3. Color

### Color architecture

- Core palettes are primitives. Their numeric steps are identifiers, not universal accessibility claims.
- Semantic variables are the default product-facing API and include Light/Dark mappings.
- Vodafone Red is the primary brand signal. Avoid using it as undifferentiated decoration or for every status.
- Functional status tokens distinguish error, success, warning, information, and neutral intent.
- Alpha tokens are overlays and state layers; apply them over the surface they were designed for.
- Data-visualization palettes are for charts and quantitative differentiation. Do not reuse them as arbitrary UI accents.

### Core color palettes

### aqua

| Token | Value |
| --- | --- |
| `core/colors/aqua/25` | `#F0FBFF` |
| `core/colors/aqua/50` | `#E2F6FF` |
| `core/colors/aqua/100` | `#C7F1F7` |
| `core/colors/aqua/275` | `#90E4F0` |
| `core/colors/aqua/350` | `#5FD6E7` |
| `core/colors/aqua/425` | `#2EC4DB` |
| `core/colors/aqua/500` | `#00B0CA` |
| `core/colors/aqua/525` | `#007A8C` |
| `core/colors/aqua/600` | `#00616F` |
| `core/colors/aqua/675` | `#004A56` |
| `core/colors/aqua/775` | `#00343D` |
| `core/colors/aqua/850` | `#002026` |
| `core/colors/aqua/900` | `#000C10` |
| `core/colors/aqua/950` | `#000102` |

### aubergine

| Token | Value |
| --- | --- |
| `core/colors/aubergine/25` | `#F5ECF7` |
| `core/colors/aubergine/50` | `#EBDAEF` |
| `core/colors/aubergine/100` | `#D8C0CF` |
| `core/colors/aubergine/275` | `#BE93B3` |
| `core/colors/aubergine/350` | `#A46A94` |
| `core/colors/aubergine/425` | `#8A4B77` |
| `core/colors/aubergine/500` | `#74325F` |
| `core/colors/aubergine/525` | `#5E2750` |
| `core/colors/aubergine/600` | `#5A2B4D` |
| `core/colors/aubergine/675` | `#46203A` |
| `core/colors/aubergine/775` | `#321326` |
| `core/colors/aubergine/850` | `#1E0B19` |
| `core/colors/aubergine/900` | `#0B020B` |
| `core/colors/aubergine/950` | `#020002` |

### golden-sahara

| Token | Value |
| --- | --- |
| `core/colors/golden-sahara/25` | `#FFFDF6` |
| `core/colors/golden-sahara/50` | `#FFFBEE` |
| `core/colors/golden-sahara/100` | `#FFF8DD` |
| `core/colors/golden-sahara/275` | `#FFF0B3` |
| `core/colors/golden-sahara/350` | `#FFE07A` |
| `core/colors/golden-sahara/425` | `#FFD24D` |
| `core/colors/golden-sahara/500` | `#F6B51E` |
| `core/colors/golden-sahara/525` | `#C08F00` |
| `core/colors/golden-sahara/600` | `#9B7300` |
| `core/colors/golden-sahara/675` | `#7A5A00` |
| `core/colors/golden-sahara/775` | `#5A4200` |
| `core/colors/golden-sahara/850` | `#3A2A00` |
| `core/colors/golden-sahara/900` | `#1B1000` |
| `core/colors/golden-sahara/950` | `#050200` |

### grey

| Token | Value |
| --- | --- |
| `core/colors/grey/25` | `#FFFFFF` |
| `core/colors/grey/50` | `#FEFEFE` |
| `core/colors/grey/100` | `#FDFEFE` |
| `core/colors/grey/275` | `#FAFBFB` |
| `core/colors/grey/350` | `#F7F8F9` |
| `core/colors/grey/425` | `#F4F6F7` |
| `core/colors/grey/500` | `#F1F3F4` |
| `core/colors/grey/525` | `#EDEFF0` |
| `core/colors/grey/600` | `#E9EBEC` |
| `core/colors/grey/675` | `#DEE0E1` |
| `core/colors/grey/700` | `#DBDEDF` |
| `core/colors/grey/775` | `#D3D6D7` |
| `core/colors/grey/800` | `#CCD0D1` |
| `core/colors/grey/850` | `#C9CBCC` |
| `core/colors/grey/900` | `#BEC1C2` |
| `core/colors/grey/950` | `#B4B7B8` |

### neutral

| Token | Value |
| --- | --- |
| `core/colors/neutral/black` | `#000000` |
| `core/colors/neutral/white` | `#FFFFFF` |

### papyrus-green

| Token | Value |
| --- | --- |
| `core/colors/papyrus-green/25` | `#F7FEFB` |
| `core/colors/papyrus-green/50` | `#F0FCF6` |
| `core/colors/papyrus-green/100` | `#E3FAEF` |
| `core/colors/papyrus-green/275` | `#B2F0CC` |
| `core/colors/papyrus-green/350` | `#7FE3AC` |
| `core/colors/papyrus-green/425` | `#4FD38B` |
| `core/colors/papyrus-green/500` | `#1FC16B` |
| `core/colors/papyrus-green/525` | `#1C955A` |
| `core/colors/papyrus-green/600` | `#176D44` |
| `core/colors/papyrus-green/675` | `#115635` |
| `core/colors/papyrus-green/775` | `#0B4026` |
| `core/colors/papyrus-green/850` | `#062A18` |
| `core/colors/papyrus-green/900` | `#001204` |
| `core/colors/papyrus-green/950` | `#000200` |

### pharos-blue

| Token | Value |
| --- | --- |
| `core/colors/pharos-blue/25` | `#F4FAFE` |
| `core/colors/pharos-blue/50` | `#EAF5FD` |
| `core/colors/pharos-blue/100` | `#D4EBFB` |
| `core/colors/pharos-blue/275` | `#A9D1F5` |
| `core/colors/pharos-blue/350` | `#7BB5ED` |
| `core/colors/pharos-blue/425` | `#4A9AE0` |
| `core/colors/pharos-blue/500` | `#1A7FCD` |
| `core/colors/pharos-blue/525` | `#006BB9` |
| `core/colors/pharos-blue/600` | `#005A95` |
| `core/colors/pharos-blue/675` | `#00446F` |
| `core/colors/pharos-blue/775` | `#002E4D` |
| `core/colors/pharos-blue/850` | `#001A2D` |
| `core/colors/pharos-blue/900` | `#000816` |
| `core/colors/pharos-blue/950` | `#000104` |

### red-nile

| Token | Value |
| --- | --- |
| `core/colors/red-nile/25` | `#FFF7F8` |
| `core/colors/red-nile/50` | `#FFF0F2` |
| `core/colors/red-nile/100` | `#FFE3E6` |
| `core/colors/red-nile/275` | `#FFB8BE` |
| `core/colors/red-nile/350` | `#FF8A94` |
| `core/colors/red-nile/425` | `#FF5C6A` |
| `core/colors/red-nile/500` | `#FB3748` |
| `core/colors/red-nile/525` | `#D12E3C` |
| `core/colors/red-nile/600` | `#9E2530` |
| `core/colors/red-nile/675` | `#7A1A22` |
| `core/colors/red-nile/775` | `#5A1117` |
| `core/colors/red-nile/850` | `#3A0B0F` |
| `core/colors/red-nile/900` | `#1C000A` |
| `core/colors/red-nile/950` | `#050001` |

### red-violet

| Token | Value |
| --- | --- |
| `core/colors/red-violet/25` | `#FDF4FF` |
| `core/colors/red-violet/50` | `#FAE9FF` |
| `core/colors/red-violet/100` | `#F2DCF4` |
| `core/colors/red-violet/275` | `#E7B6EC` |
| `core/colors/red-violet/350` | `#D98EE0` |
| `core/colors/red-violet/425` | `#C45DC7` |
| `core/colors/red-violet/500` | `#AF3AB3` |
| `core/colors/red-violet/525` | `#9C2AA0` |
| `core/colors/red-violet/600` | `#742380` |
| `core/colors/red-violet/675` | `#5A1B63` |
| `core/colors/red-violet/775` | `#411147` |
| `core/colors/red-violet/850` | `#2A0B2C` |
| `core/colors/red-violet/900` | `#130018` |
| `core/colors/red-violet/950` | `#030004` |

### turquoise

| Token | Value |
| --- | --- |
| `core/colors/turquoise/25` | `#EFF7FE` |
| `core/colors/turquoise/50` | `#E1F0FC` |
| `core/colors/turquoise/100` | `#C6E6ED` |
| `core/colors/turquoise/275` | `#8FD0DD` |
| `core/colors/turquoise/350` | `#5CB9CD` |
| `core/colors/turquoise/425` | `#2AA3BA` |
| `core/colors/turquoise/500` | `#008EA7` |
| `core/colors/turquoise/525` | `#007C92` |
| `core/colors/turquoise/600` | `#00606F` |
| `core/colors/turquoise/675` | `#004955` |
| `core/colors/turquoise/775` | `#00333D` |
| `core/colors/turquoise/850` | `#001F25` |
| `core/colors/turquoise/900` | `#000B0F` |
| `core/colors/turquoise/950` | `#000102` |

### vodafone-grey

| Token | Value |
| --- | --- |
| `core/colors/vodafone-grey/25` | `#EDEDED` |
| `core/colors/vodafone-grey/50` | `#DCDCDC` |
| `core/colors/vodafone-grey/100` | `#BEC1C2` |
| `core/colors/vodafone-grey/275` | `#A4A8A9` |
| `core/colors/vodafone-grey/350` | `#8B8F90` |
| `core/colors/vodafone-grey/425` | `#747879` |
| `core/colors/vodafone-grey/500` | `#5E6162` |
| `core/colors/vodafone-grey/525` | `#4A4D4E` |
| `core/colors/vodafone-grey/600` | `#444848` |
| `core/colors/vodafone-grey/675` | `#383B3B` |
| `core/colors/vodafone-grey/725` | `#313333` |
| `core/colors/vodafone-grey/775` | `#2A2C2C` |
| `core/colors/vodafone-grey/800` | `#232424` |
| `core/colors/vodafone-grey/850` | `#1C1D1D` |
| `core/colors/vodafone-grey/900` | `#121313` |
| `core/colors/vodafone-grey/950` | `#040404` |

### vodafone-red

| Token | Value |
| --- | --- |
| `core/colors/vodafone-red/25` | `#FFF4F8` |
| `core/colors/vodafone-red/50` | `#FEE9F1` |
| `core/colors/vodafone-red/100` | `#FBDBD2` |
| `core/colors/vodafone-red/275` | `#FF987B` |
| `core/colors/vodafone-red/350` | `#FF6F4C` |
| `core/colors/vodafone-red/425` | `#FF3016` |
| `core/colors/vodafone-red/500` | `#E60000` |
| `core/colors/vodafone-red/525` | `#E60000` |
| `core/colors/vodafone-red/600` | `#BC0100` |
| `core/colors/vodafone-red/675` | `#950700` |
| `core/colors/vodafone-red/775` | `#6E0F00` |
| `core/colors/vodafone-red/850` | `#481304` |
| `core/colors/vodafone-red/900` | `#240108` |
| `core/colors/vodafone-red/950` | `#080001` |

### Alpha colors

| Token | Value |
| --- | --- |
| `core/colors/alpha/aqua/alpha-16` | `#00B0CA29` |
| `core/colors/alpha/aqua/alpha-4` | `#00B0CA0A` |
| `core/colors/alpha/aqua/alpha-8` | `#00B0CA14` |
| `core/colors/alpha/aubergine/alpha-16` | `#5E275029` |
| `core/colors/alpha/aubergine/alpha-4` | `#5E27500A` |
| `core/colors/alpha/aubergine/alpha-8` | `#5E275014` |
| `core/colors/alpha/black/alpha-16` | `#00000029` |
| `core/colors/alpha/black/alpha-4` | `#0000000A` |
| `core/colors/alpha/black/alpha-48` | `#0000007A` |
| `core/colors/alpha/black/alpha-8` | `#00000014` |
| `core/colors/alpha/golden-sahara/alpha-16` | `#F6B51E29` |
| `core/colors/alpha/golden-sahara/alpha-4` | `#F6B51E0A` |
| `core/colors/alpha/golden-sahara/alpha-8` | `#F6B51E14` |
| `core/colors/alpha/papyrus-green/alpha-16` | `#1FC16B29` |
| `core/colors/alpha/papyrus-green/alpha-4` | `#1FC16B0A` |
| `core/colors/alpha/papyrus-green/alpha-8` | `#1FC16B14` |
| `core/colors/alpha/pharos-blue/alpha-16` | `#1A7FCD29` |
| `core/colors/alpha/pharos-blue/alpha-4` | `#1A7FCD0A` |
| `core/colors/alpha/pharos-blue/alpha-8` | `#1A7FCD14` |
| `core/colors/alpha/red-nile/alpha-16` | `#FB374829` |
| `core/colors/alpha/red-nile/alpha-4` | `#FB37480A` |
| `core/colors/alpha/red-nile/alpha-8` | `#FB374814` |
| `core/colors/alpha/red-violet/alpha-16` | `#9C2AA029` |
| `core/colors/alpha/red-violet/alpha-4` | `#9C2AA00A` |
| `core/colors/alpha/red-violet/alpha-8` | `#9C2AA014` |
| `core/colors/alpha/turqoise/alpha-16` | `#007C9229` |
| `core/colors/alpha/turqoise/alpha-4` | `#007C920A` |
| `core/colors/alpha/turqoise/alpha-8` | `#007C9214` |
| `core/colors/alpha/vodafone-grey/alpha-12` | `#1C1D1D1F` |
| `core/colors/alpha/vodafone-grey/alpha-16` | `#1C1D1D29` |
| `core/colors/alpha/vodafone-grey/alpha-4` | `#1C1D1D0A` |
| `core/colors/alpha/vodafone-grey/alpha-8` | `#1C1D1D14` |
| `core/colors/alpha/vodafone-red/alpha-12` | `#E600001F` |
| `core/colors/alpha/vodafone-red/alpha-16` | `#E6000029` |
| `core/colors/alpha/vodafone-red/alpha-4` | `#E600000A` |
| `core/colors/alpha/vodafone-red/alpha-8` | `#E6000014` |
| `core/colors/alpha/white/alpha-12` | `#FFFFFF1F` |
| `core/colors/alpha/white/alpha-16` | `#FFFFFF29` |
| `core/colors/alpha/white/alpha-4` | `#FFFFFF0A` |
| `core/colors/alpha/white/alpha-8` | `#FFFFFF14` |

### Semantic color variables

Use these tokens in UI implementation. Values shown are resolved for documentation; implementations should preserve the alias.

| Token | Light | Dark | Purpose |
| --- | --- | --- | --- |
| `sem/action/background/accent/background-color` | `#E60000` | `#E60000` | action → background → accent → background-color |
| `sem/action/background/destructive/background-color` | `#FB3748` | `#FB3748` | action → background → destructive → background-color |
| `sem/action/background/neutral/background-color` | `#2A2C2C` | `#2A2C2C` | action → background → neutral → background-color |
| `sem/action/background/secondary/background-color` | `#F4F6F7` | `#383B3B` | action → background → secondary → background-color |
| `sem/action/border/accent` | `#FF5C6A` | `#FF5C6A` | action → border → accent |
| `sem/action/border/neutral` | `#E9EBEC` | `#FFFFFF29` | action → border → neutral |
| `sem/action/foreground/accent/icon` | `#E60000` | `#E60000` | action → foreground → accent → icon |
| `sem/action/foreground/accent/text` | `#E60000` | `#E60000` | action → foreground → accent → text |
| `sem/action/foreground/destructive/icon` | `#FFFFFF` | `#FFFFFF` | action → foreground → destructive → icon |
| `sem/action/foreground/destructive/icon-inverse` | `#FB3748` | `#FF5C6A` | action → foreground → destructive → icon-inverse |
| `sem/action/foreground/destructive/text` | `#FFFFFF` | `#FFFFFF` | action → foreground → destructive → text |
| `sem/action/foreground/destructive/text-inverse` | `#FB3748` | `#FF5C6A` | action → foreground → destructive → text-inverse |
| `sem/action/foreground/disabled/icon` | `#A4A8A9` | `#8B8F90` | action → foreground → disabled → icon |
| `sem/action/foreground/disabled/text` | `#A4A8A9` | `#8B8F90` | action → foreground → disabled → text |
| `sem/action/foreground/neutral/icon` | `#FFFFFF` | `#FFFFFF` | action → foreground → neutral → icon |
| `sem/action/foreground/neutral/icon-inverse` | `#1C1D1D` | `#FDFEFE` | action → foreground → neutral → icon-inverse |
| `sem/action/foreground/neutral/text` | `#FFFFFF` | `#FFFFFF` | action → foreground → neutral → text |
| `sem/action/foreground/neutral/text-inverse` | `#1C1D1D` | `#FDFEFE` | action → foreground → neutral → text-inverse |
| `sem/action/foreground/primary/icon` | `#FFFFFF` | `#FFFFFF` | action → foreground → primary → icon |
| `sem/action/foreground/primary/icon-disable` | `#CCD0D1` | `#BEC1C2` | action → foreground → primary → icon-disable |
| `sem/action/foreground/primary/icon-inverse` | `#1C1D1D` | `#FDFEFE` | action → foreground → primary → icon-inverse |
| `sem/action/foreground/primary/text` | `#FFFFFF` | `#FFFFFF` | action → foreground → primary → text |
| `sem/action/foreground/primary/text-inverse` | `#1C1D1D` | `#FDFEFE` | action → foreground → primary → text-inverse |
| `sem/action/state/brand/disabled` | `#F4F6F7` | `#2A2C2C` | action → state → brand → disabled |
| `sem/action/state/brand/hover` | `#1C1D1D14` | `#1C1D1D1F` | action → state → brand → hover |
| `sem/action/state/brand/pressed` | `#1C1D1D1F` | `#1C1D1D29` | action → state → brand → pressed |
| `sem/action/state/destructive/disabled` | `#F4F6F7` | `#2A2C2C` | action → state → destructive → disabled |
| `sem/action/state/destructive/hover` | `#FB374814` | `#FB374814` | action → state → destructive → hover |
| `sem/action/state/destructive/pressed` | `#FB374829` | `#FB374829` | action → state → destructive → pressed |
| `sem/action/state/neutral/disabled` | `#F4F6F7` | `#2A2C2C` | action → state → neutral → disabled |
| `sem/action/state/neutral/hover` | `#1C1D1D14` | `#FFFFFF14` | action → state → neutral → hover |
| `sem/action/state/neutral/pressed` | `#1C1D1D1F` | `#FFFFFF1F` | action → state → neutral → pressed |
| `sem/action/state/selected` | `#E600001F` | `#E6000029` | action → state → selected |
| `sem/border/default` | `#DBDEDF` | `#444848` | Used for inputs, cards, containers etc. |
| `sem/border/inverse` | `#FFFFFF` | `#1C1D1D` | Used for emphasized boundaries, non-interactive selected containers |
| `sem/border/neutral` | `#DBDEDF` | `#4A4D4E` | Used for emphasized boundaries, non-interactive selected containers |
| `sem/border/strong` | `#A4A8A9` | `#747879` | Used for dividers, hairlines, table separator etc. |
| `sem/border/subtle` | `#E9EBEC` | `#383B3B` | Used for emphasized boundaries, non-interactive selected containers |
| `sem/functional-status/error/background` | `#FFE3E6` | `#7A1A22` | functional-status → error → background |
| `sem/functional-status/error/border` | `#FF8A94` | `#FB3748` | functional-status → error → border |
| `sem/functional-status/error/icon` | `#FB3748` | `#FFB8BE` | functional-status → error → icon |
| `sem/functional-status/error/text` | `#5A1117` | `#FFB8BE` | functional-status → error → text |
| `sem/functional-status/error/text-on-canvas` | `#D12E3C` | `#FF5C6A` | functional-status → error → text-on-canvas |
| `sem/functional-status/info/background` | `#D4EBFB` | `#A9D1F5` | functional-status → info → background |
| `sem/functional-status/info/border` | `#7BB5ED` | `#00446F` | functional-status → info → border |
| `sem/functional-status/info/icon` | `#1A7FCD` | `#A9D1F5` | functional-status → info → icon |
| `sem/functional-status/info/text` | `#002E4D` | `#A9D1F5` | functional-status → info → text |
| `sem/functional-status/neutral/background` | `#F7F8F9` | `#2A2C2C` | functional-status → neutral → background |
| `sem/functional-status/neutral/border` | `#BEC1C2` | `#2A2C2C` | functional-status → neutral → border |
| `sem/functional-status/neutral/icon` | `#2A2C2C` | `#4A4D4E` | functional-status → neutral → icon |
| `sem/functional-status/neutral/text` | `#2A2C2C` | `#4A4D4E` | functional-status → neutral → text |
| `sem/functional-status/success/background` | `#E3FAEF` | `#115635` | functional-status → success → background |
| `sem/functional-status/success/border` | `#7FE3AC` | `#115635` | functional-status → success → border |
| `sem/functional-status/success/icon` | `#1FC16B` | `#B2F0CC` | functional-status → success → icon |
| `sem/functional-status/success/text` | `#0B4026` | `#B2F0CC` | functional-status → success → text |
| `sem/functional-status/warning/background` | `#FFF8DD` | `#7A5A00` | functional-status → warning → background |
| `sem/functional-status/warning/border` | `#FFE07A` | `#7A5A00` | functional-status → warning → border |
| `sem/functional-status/warning/icon` | `#C08F00` | `#FFF0B3` | functional-status → warning → icon |
| `sem/functional-status/warning/text` | `#5A4200` | `#FFF0B3` | functional-status → warning → text |
| `sem/icon/disabled` | `#A4A8A9` | `#8B8F90` | icon → disabled |
| `sem/icon/inverse` | `#FFFFFF` | `#FFFFFF` | icon → inverse |
| `sem/icon/onBrand` | `#FFFFFF` | `#FFFFFF` | icon → onBrand |
| `sem/icon/primary` | `#1C1D1D` | `#FDFEFE` | icon → primary |
| `sem/icon/secondary` | `#5E6162` | `#BEC1C2` | icon → secondary |
| `sem/icon/tertiary` | `#8B8F90` | `#8B8F90` | icon → tertiary |
| `sem/surface/bg` | `#FDFEFE` | `#121313` | The foundational layer everything sits on - page canvas, screen background. Lowest elevation. |
| `sem/surface/default` | `#FAFBFB` | `#1C1D1D` | Below the default layer - switch tracks, table cell fills, input troughs, sunken containers. |
| `sem/surface/raised` | `#F7F8F9` | `#232424` | Cards, tiles, bottom navigation, persistent headers - sits one level above default. |
| `sem/surface/raised-prominent` | `#F4F6F7` | `#2A2C2C` | Modals, bottom sheets, elevated panels - sits above raised. Highest opaque surface. |
| `sem/surface/static/accent` | `#E60000` | `#E60000` | Brand accent surface - vodafone-red. Mode-invariant. For tags, badges, brand-colored chips. |
| `sem/surface/static/neutral` | `#383B3B` | `#2A2C2C` | Darker neutral surface - for neutral tags, subdued containers. |
| `sem/surface/static/on-color` | `#FFFFFF` | `#1C1D1D` | Mode-aware surface for elements placed on colored backgrounds (e.g. unchecked checkbox control, radio button base). |
| `sem/surface/static/secondary` | `#F4F6F7` | `#383B3B` | Muted secondary surface - grey tint. For avatar backgrounds, secondary tags. |
| `sem/surface/static/transparent-dark` | `#00000029` | `#00000029` | Translucent dark surface - glassmorphism, frosted glass on light backgrounds. |
| `sem/surface/static/transparent-light` | `#FFFFFF14` | `#FFFFFF14` | Translucent light surface - glassmorphism, frosted glass on dark backgrounds. |
| `sem/text/accent` | `#E60000` | `#FF3016` | text → accent |
| `sem/text/disabled` | `#A4A8A9` | `#8B8F90` | text → disabled |
| `sem/text/error` | `#9E2530` | `#FF8A94` | text → error |
| `sem/text/info` | `#00446F` | `#7BB5ED` | text → info |
| `sem/text/inverse` | `#FFFFFF` | `#FFFFFF` | text → inverse |
| `sem/text/onBrand` | `#FFFFFF` | `#FFFFFF` | text → onBrand |
| `sem/text/primary` | `#1C1D1D` | `#FDFEFE` | text → primary |
| `sem/text/secondary` | `#5E6162` | `#BEC1C2` | text → secondary |
| `sem/text/success` | `#115635` | `#7FE3AC` | text → success |
| `sem/text/tertiary` | `#8B8F90` | `#8B8F90` | text → tertiary |
| `sem/text/warning` | `#C08F00` | `#FFE07A` | text → warning |

### Color guardrails

- Do use `sem/text/*`, `sem/icon/*`, `sem/surface/*`, `sem/border/*`, and `sem/action/*` by role.
- Do verify hover, pressed, selected, disabled, and focus states in both modes.
- Do use status background/text/icon/border tokens as a coordinated set.
- Do not use core palette values directly in components when a semantic token exists.
- Do not use color as the only carrier of status or interaction state.
- Do not assume the same semantic token belongs on every surface; select inverse or on-brand roles when required.

### Design Flow workflow-status extension

The following product-level semantic aliases are the current Design Flow implementation baseline. Persisted workflow records store stable status codes, never color values. Components consume these aliases rather than raw palette values so the mapping can be changed centrally without a data migration.

| State | Product token prefix | Light background | Light text | Dark background | Dark text |
| --- | --- | --- | --- | --- | --- |
| Backlog | `product/status/backlog` | `#F7F8F9` | `#2A2C2C` | `#2A2C2C` | `#BEC1C2` |
| To do | `product/status/todo` | `#EAF5FD` | `#00446F` | `#002E4D` | `#A9D1F5` |
| In Progress | `product/status/in-progress` | `#E2F6FF` | `#00616F` | `#00343D` | `#90E4F0` |
| In Review | `product/status/in-review` | `#EBDAEF` | `#5E2750` | `#321326` | `#D8C0CF` |
| Done | `product/status/done` | `#E3FAEF` | `#0B4026` | `#115635` | `#B2F0CC` |
| Paused | `product/status/paused` | `#FFF8DD` | `#5A4200` | `#7A5A00` | `#FFF0B3` |
| Blocked indicator | `product/indicator/blocked` | `#FFE3E6` | `#5A1117` | `#7A1A22` | `#FFB8BE` |
| Archived indicator | `product/indicator/archived` | `#F4F6F7` | `#5E6162` | `#383B3B` | `#BEC1C2` |

Their visible label remains required, and color is never the only carrier of meaning. Border presence, shape, sizing, spacing, and other non-color badge presentation follow verified Astryx guidance under D-099; the former global no-border rule is no longer authoritative. Blocked remains independent of workflow status, and Archived remains a record state rather than a workflow status.

These aliases are intentionally centralized and may be remapped during implementation or after a revised Figma decision. A palette change updates token values and visual regression expectations, not persisted work-item data or reporting rules.

## 4. Spacing

> **D-099 authority note:** The following values document the Vodafone source. They are not the default Design Flow spacing authority. Design Flow runtime spacing must map verified Astryx component/pattern presentation through centralized aliases, or use an explicitly approved fallback when official guidance is unavailable.

### Core spacing primitives

The primitive scale is intentionally sparse and based primarily on a 4px rhythm, with 2px for optical refinement and negative values as controlled escape hatches.

| Token | Value |
| --- | --- |
| `core/spacing/neg16` | `-16px` |
| `core/spacing/neg8` | `-8px` |
| `core/spacing/0` | `0px` |
| `core/spacing/2` | `2px` |
| `core/spacing/4` | `4px` |
| `core/spacing/8` | `8px` |
| `core/spacing/12` | `12px` |
| `core/spacing/16` | `16px` |
| `core/spacing/20` | `20px` |
| `core/spacing/24` | `24px` |
| `core/spacing/32` | `32px` |
| `core/spacing/40` | `40px` |
| `core/spacing/48` | `48px` |
| `core/spacing/64` | `64px` |

### Responsive spacing variables

Use these for padding, margin, gaps, and layout spacing. The semantic name stays stable while the value adapts by viewport mode.

| Token | Mobile | Tablet | Small desktop | Large desktop |
| --- | --- | --- | --- | --- |
| `space/none` | `0px` | `0px` | `0px` | `0px` |
| `space/2xs` | `2px` | `2px` | `2px` | `2px` |
| `space/xs` | `4px` | `4px` | `4px` | `4px` |
| `space/sm` | `8px` | `8px` | `8px` | `8px` |
| `space/md` | `12px` | `16px` | `16px` | `16px` |
| `space/lg` | `16px` | `24px` | `24px` | `24px` |
| `space/xl` | `24px` | `32px` | `32px` | `32px` |
| `space/2xl` | `32px` | `48px` | `64px` | `64px` |
| `space/3xl` | `40px` | `40px` | `40px` | `40px` |

### Vodafone spacing inventory guardrails

- Preserve these names and values when documenting or consuming Vodafone source facts.
- Do not use this inventory to override a verified Astryx spacing target.
- Runtime component spacing uses a Design Flow semantic alias with Astryx source traceability; raw literals and undocumented approximations remain prohibited.
- If an Astryx target cannot be represented by an existing runtime alias, add a documented alias rather than forcing it onto the Vodafone spacing scale.

## 4A. Design Flow shape, control-size, and focus extension

The Phase 1 scaffold introduced the following centralized aliases under D-080 and D-096. D-099 makes their non-color values provisional until the relevant official Astryx presentation is distilled and the Phase 1 components are revalidated.

Astryx shape guidance informed the semantic separation between interactive elements, containers, overlays, and pills, but the current notes do not yet verify every listed measurement. These values describe the existing implementation baseline, not approved final Astryx fidelity.

| Product token | Value | Use |
| --- | --- | --- |
| `product/radius/element` | `4px` | Buttons, inputs, selectors, and compact interactive controls |
| `product/radius/container` | `8px` | Cards, panels, and grouped content |
| `product/radius/overlay` | `12px` | Dialogs, drawers, and highest temporary surfaces |
| `product/radius/full` | `999px` | Badges, status dots, and intentionally pill-shaped controls |
| `product/control/height/sm` | `32px` | Compact controls |
| `product/control/height/md` | `40px` | Default controls |
| `product/control/height/lg` | `48px` | Prominent controls and mobile-friendly inputs |
| `product/control/height/xl` | `64px` | Exceptional high-emphasis controls |
| `product/focus/ring-width` | `2px` | Visible keyboard focus outline |
| `product/focus/ring-offset` | `2px` | Separation between the focused control and outline |
| `product/motion/spinner-duration` | `700ms` | Continuous progress indication when motion is permitted |

Guardrails:

- Components consume the semantic alias, never a copied radius, height, or focus value.
- Interactive controls use `element`; content containers use `container`; overlays use `overlay`; `full` is never a default card or control radius.
- Prefer `md`; use `lg` when touch density or input prominence requires it. `xl` is exceptional rather than the application default.
- Focus remains visible in Light and Dark modes and cannot be removed without an accessible replacement.
- Continuous spinner motion uses the centralized duration and becomes a static progress indicator when reduced motion is requested.
- Before Phase 2 UI implementation, verify and remap these values against official Astryx guidance where exposed. Record an explicit Design Flow fallback for every unavailable measurement; component APIs and persisted data must not change.

### Phase 1 font-asset gate

The checkpoint identifies `Vodafone VF` as the required family but contains no licensed webfont files. The runtime token names `Vodafone VF` first and uses an explicit system fallback only for local foundation development. This fallback is not final visual approval. Production visual fidelity remains gated on an approved licensed font asset and real-face weight verification; the application must not synthesize or download an unapproved Vodafone face.

## 5. Depth and elevation

> **D-099 authority note:** Vodafone shadow colors remain relevant color-source facts. The following offset, blur, spread, and elevation-role geometry is retained as Vodafone provenance only; Design Flow runtime elevation geometry follows verified Astryx guidance or an explicit documented fallback.

### Semantic shadow color variables

| Token | Light | Dark |
| --- | --- | --- |
| `sem/shadow/large` | `#00000029` | `#FFFFFF1F` |
| `sem/shadow/medium` | `#00000029` | `#FFFFFF14` |
| `sem/shadow/small` | `#00000014` | `#FFFFFF0A` |
| `sem/shadow/xs` | `#0000000A` | `#FFFFFF0A` |

### Local effect styles

| Style | CSS-equivalent layers | Recommended use |
| --- | --- | --- |
| `shadow-xs` | `0 1px 2px 0 rgba(0,0,0,.04), 0 4px 8px -2px rgba(0,0,0,.08)` | Subtle lift: small controls, quiet cards |
| `shadow-sm` | `0 2px 4px 0 rgba(0,0,0,.08), 0 10px 20px 0 rgba(0,0,0,.08)` | Cards, menus, sticky controls |
| `shadow-md` | `0 3px 6px -1px rgba(0,0,0,.08), 0 12px 24px -8px rgba(0,0,0,.08), 0 22px 36px -12px rgba(0,0,0,.16)` | Popovers and floating panels |
| `shadow-lg` | `0 2px 6px -2px rgba(0,0,0,.04), 0 20px 40px -14px rgba(0,0,0,.08), 0 34px 64px -22px rgba(0,0,0,.16)` | Dialogs and highest temporary surfaces |

### Elevation model

- `shadow-xs`: subtle separation from a shared surface.
- `shadow-sm`: raised cards, menus, and sticky controls.
- `shadow-md`: overlays, popovers, and floating panels.
- `shadow-lg`: dialogs and the highest temporary surfaces.
- Keep the ladder monotonic: a child overlay must not appear below its parent surface.
- Prefer border or surface contrast when no physical layering is implied.

> **Implementation note:** the current Figma effect styles bind directly to core black-alpha variables, while `sem/shadow/*` provides Light/Dark shadow-color intent. Preserve both. If runtime dark mode must invert shadow color automatically, rebind or compose the implementation through the semantic shadow variable rather than copying the light-mode RGBA values.

## 6. Data-visualization color appendix

Use these only for charts, series, and quantitative encodings. Assign series consistently across views, provide non-color differentiation where possible, and test adjacent colors for distinguishability.

### alexandria-blue

| Token | Value |
| --- | --- |
| `core/colors/dataviz-series/alexandria-blue/50` | `#EAF5FD` |
| `core/colors/dataviz-series/alexandria-blue/100` | `#D4EBFB` |
| `core/colors/dataviz-series/alexandria-blue/200` | `#A4D3F5` |
| `core/colors/dataviz-series/alexandria-blue/300` | `#72B8ED` |
| `core/colors/dataviz-series/alexandria-blue/400` | `#4A9AE0` |
| `core/colors/dataviz-series/alexandria-blue/500` | `#1A7FCD` |
| `core/colors/dataviz-series/alexandria-blue/600` | `#006BB9` |
| `core/colors/dataviz-series/alexandria-blue/700` | `#00527A` |
| `core/colors/dataviz-series/alexandria-blue/800` | `#003A57` |
| `core/colors/dataviz-series/alexandria-blue/900` | `#00223A` |

### cleopatra-violet

| Token | Value |
| --- | --- |
| `core/colors/dataviz-series/cleopatra-violet/50` | `#FAF0FA` |
| `core/colors/dataviz-series/cleopatra-violet/100` | `#F2DAF3` |
| `core/colors/dataviz-series/cleopatra-violet/200` | `#E2B2E4` |
| `core/colors/dataviz-series/cleopatra-violet/300` | `#D088D3` |
| `core/colors/dataviz-series/cleopatra-violet/400` | `#C460C6` |
| `core/colors/dataviz-series/cleopatra-violet/500` | `#B840BD` |
| `core/colors/dataviz-series/cleopatra-violet/600` | `#962A9A` |
| `core/colors/dataviz-series/cleopatra-violet/700` | `#721E75` |
| `core/colors/dataviz-series/cleopatra-violet/800` | `#511455` |
| `core/colors/dataviz-series/cleopatra-violet/900` | `#320B34` |

### delta-teal

| Token | Value |
| --- | --- |
| `core/colors/dataviz-series/delta-teal/50` | `#ECF9F5` |
| `core/colors/dataviz-series/delta-teal/100` | `#C8F0E4` |
| `core/colors/dataviz-series/delta-teal/200` | `#8EDEC5` |
| `core/colors/dataviz-series/delta-teal/300` | `#55C9A5` |
| `core/colors/dataviz-series/delta-teal/400` | `#2EAB87` |
| `core/colors/dataviz-series/delta-teal/500` | `#0D8B6A` |
| `core/colors/dataviz-series/delta-teal/600` | `#087256` |
| `core/colors/dataviz-series/delta-teal/700` | `#055841` |
| `core/colors/dataviz-series/delta-teal/800` | `#033F2E` |
| `core/colors/dataviz-series/delta-teal/900` | `#02261C` |

### golden-sahara

| Token | Value |
| --- | --- |
| `core/colors/dataviz-series/golden-sahara/50` | `#FFFBEE` |
| `core/colors/dataviz-series/golden-sahara/100` | `#FFF8DD` |
| `core/colors/dataviz-series/golden-sahara/200` | `#FFF0B3` |
| `core/colors/dataviz-series/golden-sahara/300` | `#FFE07A` |
| `core/colors/dataviz-series/golden-sahara/400` | `#FFD24D` |
| `core/colors/dataviz-series/golden-sahara/500` | `#F6B51E` |
| `core/colors/dataviz-series/golden-sahara/600` | `#C08F00` |
| `core/colors/dataviz-series/golden-sahara/700` | `#9B7300` |
| `core/colors/dataviz-series/golden-sahara/800` | `#5A4200` |
| `core/colors/dataviz-series/golden-sahara/900` | `#3A2A00` |

### hibiscus-pink

| Token | Value |
| --- | --- |
| `core/colors/dataviz-series/hibiscus-pink/50` | `#FDF0F4` |
| `core/colors/dataviz-series/hibiscus-pink/100` | `#FADAE5` |
| `core/colors/dataviz-series/hibiscus-pink/200` | `#F4B0C6` |
| `core/colors/dataviz-series/hibiscus-pink/300` | `#EC84A6` |
| `core/colors/dataviz-series/hibiscus-pink/400` | `#E25D8F` |
| `core/colors/dataviz-series/hibiscus-pink/500` | `#D63D7A` |
| `core/colors/dataviz-series/hibiscus-pink/600` | `#B22D64` |
| `core/colors/dataviz-series/hibiscus-pink/700` | `#8B1F4C` |
| `core/colors/dataviz-series/hibiscus-pink/800` | `#641536` |
| `core/colors/dataviz-series/hibiscus-pink/900` | `#3E0C22` |

### nubian-indigo

| Token | Value |
| --- | --- |
| `core/colors/dataviz-series/nubian-indigo/50` | `#F2F2FC` |
| `core/colors/dataviz-series/nubian-indigo/100` | `#E0E1F7` |
| `core/colors/dataviz-series/nubian-indigo/200` | `#B8BAF0` |
| `core/colors/dataviz-series/nubian-indigo/300` | `#9294E4` |
| `core/colors/dataviz-series/nubian-indigo/400` | `#767AD8` |
| `core/colors/dataviz-series/nubian-indigo/500` | `#5F65C8` |
| `core/colors/dataviz-series/nubian-indigo/600` | `#4A4FA8` |
| `core/colors/dataviz-series/nubian-indigo/700` | `#373B85` |
| `core/colors/dataviz-series/nubian-indigo/800` | `#262962` |
| `core/colors/dataviz-series/nubian-indigo/900` | `#171940` |

### papyrus-green

| Token | Value |
| --- | --- |
| `core/colors/dataviz-series/papyrus-green/50` | `#F0FCF6` |
| `core/colors/dataviz-series/papyrus-green/100` | `#E3FAEF` |
| `core/colors/dataviz-series/papyrus-green/200` | `#B2F0CC` |
| `core/colors/dataviz-series/papyrus-green/300` | `#7FE3AC` |
| `core/colors/dataviz-series/papyrus-green/400` | `#4FD38B` |
| `core/colors/dataviz-series/papyrus-green/500` | `#1FC16B` |
| `core/colors/dataviz-series/papyrus-green/600` | `#1C955A` |
| `core/colors/dataviz-series/papyrus-green/700` | `#176D44` |
| `core/colors/dataviz-series/papyrus-green/800` | `#115635` |
| `core/colors/dataviz-series/papyrus-green/900` | `#062A18` |

### red-nile

| Token | Value |
| --- | --- |
| `core/colors/dataviz-series/red-nile/50` | `#FFF0F2` |
| `core/colors/dataviz-series/red-nile/100` | `#FFE3E6` |
| `core/colors/dataviz-series/red-nile/200` | `#FFB8BE` |
| `core/colors/dataviz-series/red-nile/300` | `#FF8A94` |
| `core/colors/dataviz-series/red-nile/400` | `#FF5C6A` |
| `core/colors/dataviz-series/red-nile/500` | `#FB3748` |
| `core/colors/dataviz-series/red-nile/600` | `#D12E3C` |
| `core/colors/dataviz-series/red-nile/700` | `#9E2530` |
| `core/colors/dataviz-series/red-nile/800` | `#7A1A22` |
| `core/colors/dataviz-series/red-nile/900` | `#3A0B0F` |

### redsea-coral

| Token | Value |
| --- | --- |
| `core/colors/dataviz-series/redsea-coral/50` | `#FEF2ED` |
| `core/colors/dataviz-series/redsea-coral/100` | `#FDE0D4` |
| `core/colors/dataviz-series/redsea-coral/200` | `#F9BEA5` |
| `core/colors/dataviz-series/redsea-coral/300` | `#F49A76` |
| `core/colors/dataviz-series/redsea-coral/400` | `#EF7E54` |
| `core/colors/dataviz-series/redsea-coral/500` | `#E8663C` |
| `core/colors/dataviz-series/redsea-coral/600` | `#C44E28` |
| `core/colors/dataviz-series/redsea-coral/700` | `#9A3918` |
| `core/colors/dataviz-series/redsea-coral/800` | `#70270F` |
| `core/colors/dataviz-series/redsea-coral/900` | `#461808` |

### rosetta-slate

| Token | Value |
| --- | --- |
| `core/colors/dataviz-series/rosetta-slate/50` | `#F3F5F8` |
| `core/colors/dataviz-series/rosetta-slate/100` | `#E2E7EE` |
| `core/colors/dataviz-series/rosetta-slate/200` | `#C2CCDA` |
| `core/colors/dataviz-series/rosetta-slate/300` | `#A2B0C4` |
| `core/colors/dataviz-series/rosetta-slate/400` | `#8698B4` |
| `core/colors/dataviz-series/rosetta-slate/500` | `#6B80A5` |
| `core/colors/dataviz-series/rosetta-slate/600` | `#566A8C` |
| `core/colors/dataviz-series/rosetta-slate/700` | `#415372` |
| `core/colors/dataviz-series/rosetta-slate/800` | `#2F3D55` |
| `core/colors/dataviz-series/rosetta-slate/900` | `#1D2838` |

### sinai-turquiose

| Token | Value |
| --- | --- |
| `core/colors/dataviz-series/sinai-turquiose/50` | `#E8F7FA` |
| `core/colors/dataviz-series/sinai-turquiose/100` | `#C6E6ED` |
| `core/colors/dataviz-series/sinai-turquiose/200` | `#8DD0DD` |
| `core/colors/dataviz-series/sinai-turquiose/300` | `#55B9CD` |
| `core/colors/dataviz-series/sinai-turquiose/400` | `#2AA3BA` |
| `core/colors/dataviz-series/sinai-turquiose/500` | `#008EA7` |
| `core/colors/dataviz-series/sinai-turquiose/600` | `#007488` |
| `core/colors/dataviz-series/sinai-turquiose/700` | `#005966` |
| `core/colors/dataviz-series/sinai-turquiose/800` | `#003F48` |
| `core/colors/dataviz-series/sinai-turquiose/900` | `#00262D` |

### thebes-mauve

| Token | Value |
| --- | --- |
| `core/colors/dataviz-series/thebes-mauve/50` | `#F9F3F8` |
| `core/colors/dataviz-series/thebes-mauve/100` | `#EFE1EC` |
| `core/colors/dataviz-series/thebes-mauve/200` | `#D9BDD3` |
| `core/colors/dataviz-series/thebes-mauve/300` | `#C49AB8` |
| `core/colors/dataviz-series/thebes-mauve/400` | `#B381A6` |
| `core/colors/dataviz-series/thebes-mauve/500` | `#A46A94` |
| `core/colors/dataviz-series/thebes-mauve/600` | `#88547A` |
| `core/colors/dataviz-series/thebes-mauve/700` | `#6B3F60` |
| `core/colors/dataviz-series/thebes-mauve/800` | `#4F2C46` |
| `core/colors/dataviz-series/thebes-mauve/900` | `#341B2E` |

## 7. Vodafone shared-component source inventory (reference only)

The Vodafone Component Library contains no local variable collections; its components consume VF Foundations. Active public component sets and standalone components are inventoried below as visual/source research. They may inform Design Flow, but they are not Design Flow's code contracts or public APIs. Identical duplicates on documentation canvases are collapsed; behaviorally distinct sets retain separate names.

| Group | Public contracts |
| --- | --- |
| Identity | 4 |
| Feedback & Status | 12 |
| Actions | 5 |
| Classification | 1 |
| Navigation | 2 |
| Forms | 9 |
| Selection Controls | 5 |
| Commerce | 1 |
| Layout & Structure | 1 |
| Disclosure | 4 |
| Overlay | 1 |

### Identity

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="1:5"
node-id="40:3041"
-->

#### avatar

- **Category:** Identity
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (30 variants)
- **Status:** Active
- **Figma source:** [Avatar · avatar](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=40-3041)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Icon`, `Flag`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: preserve semantic structure, meaningful names, keyboard access, focus visibility, and contrast.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Initials (2ch)` | `TEXT` | `GP` | — |
| `Count` | `TEXT` | `+3` | — |
| `Initials (1ch)` | `TEXT` | `G` | — |
| `Icon` | `INSTANCE_SWAP` | `6698:13177` | — |
| `Flag` | `INSTANCE_SWAP` | `41:96` | — |
| `Variant` | `VARIANT` | `user` | `user`, `initials`, `count`, `flag`, `icon`, `brand` |
| `Size` | `VARIANT` | `64` | `64`, `48`, `40`, `32`, `24` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="1:5"
node-id="42:264"
-->

#### avatar Badge

- **Category:** Identity
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (30 variants)
- **Status:** Active
- **Figma source:** [Avatar · avatarBadge](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=42-264)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** Uses `avatarBadgePrimitive`.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: expose meaningful status text, announce important asynchronous changes, and never rely on color alone.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Badge Type` | `VARIANT` | `Presence / Online` | `Presence / Online`, `Presence / Away`, `Presence / Busy`, `Presence / Offline`, `Region / Flag`, `Attribute / Business` |
| `Size` | `VARIANT` | `32` | `32`, `20`, `18`, `16`, `12` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="1:5"
node-id="42:138"
-->

#### avatar Badge Primitive

- **Category:** Identity
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (3 variants)
- **Status:** Active
- **Figma source:** [Avatar · avatarBadgePrimitive](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=42-138)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: expose meaningful status text, announce important asynchronous changes, and never rely on color alone.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Variant` | `VARIANT` | `Dot` | `Dot`, `icon`, `flag` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="1:5"
node-id="91:721"
-->

#### avatar Group

- **Category:** Identity
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (5 variants)
- **Status:** Active
- **Figma source:** [Avatar · avatarGroup](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=91-721)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show More`
- **Extends / uses:** Uses `avatar`.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: preserve semantic structure, meaningful names, keyboard access, focus visibility, and contrast.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show More` | `BOOLEAN` | `true` | — |
| `Size` | `VARIANT` | `64` | `64`, `40`, `32`, `24`, `48` |


### Feedback & Status

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="2184:10830"
node-id="2217:2404"
-->

#### Semantic Badges

- **Category:** Feedback & Status
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (80 variants)
- **Status:** Active
- **Figma source:** [Badge · Semantic Badges](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=2217-2404)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/functional-status/*`, `sem/surface/*`, `sem/text/*`, `sem/icon/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: expose meaningful status text, announce important asynchronous changes, and never rely on color alone.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Content` | `TEXT` | `Badge` | — |
| `Type` | `VARIANT` | `default` | `default`, `with dot`, `with icon left`, `with icon right` |
| `Tone` | `VARIANT` | `neutral` | `neutral`, `success`, `error`, `warning`, `information` |
| `Size` | `VARIANT` | `small` | `small`, `large` |
| `Prominence` | `VARIANT` | `high` | `high`, `low` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="2184:10830"
node-id="8898:4099"
-->

#### Commerce Badges

- **Category:** Feedback & Status
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (96 variants)
- **Status:** Active
- **Figma source:** [Badge · Commerce Badges](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=8898-4099)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/functional-status/*`, `sem/surface/*`, `sem/text/*`, `sem/icon/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: expose meaningful status text, announce important asynchronous changes, and never rely on color alone.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Content` | `TEXT` | `Badge` | — |
| `Type` | `VARIANT` | `default` | `default`, `with dot`, `with left icon`, `with right icon` |
| `Tone` | `VARIANT` | `vouchers` | `discount`, `vouchers`, `delivery`, `cashback/warranty/specialOffers` |
| `Size` | `VARIANT` | `small` | `small`, `large` |
| `Prominence` | `VARIANT` | `high` | `high`, `medium`, `low` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="2184:10830"
node-id="8901:3310"
-->

#### Festive Badges

- **Category:** Feedback & Status
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (98 variants)
- **Status:** Active
- **Figma source:** [Badge · Festive Badges](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=8901-3310)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/functional-status/*`, `sem/surface/*`, `sem/text/*`, `sem/icon/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: expose meaningful status text, announce important asynchronous changes, and never rely on color alone.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Content` | `TEXT` | `Badge` | — |
| `Type` | `VARIANT` | `default` | `default`, `with dot`, `with icon left`, `with icon right`, `with flag` |
| `Tone` | `VARIANT` | `ramadan` | `national day`, `ramadan`, `eid`, `new year/summer sale`, `back to school/black friday` |
| `Size` | `VARIANT` | `small` | `large`, `small` |
| `Prominence` | `VARIANT` | `high` | `low`, `high`, `medium` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="2184:10830"
node-id="8896:2352"
-->

#### Transparent Badges

- **Category:** Feedback & Status
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (4 variants)
- **Status:** Active
- **Figma source:** [Badge · Transparent Badges](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=8896-2352)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/functional-status/*`, `sem/surface/*`, `sem/text/*`, `sem/icon/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: expose meaningful status text, announce important asynchronous changes, and never rely on color alone.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Type` | `VARIANT` | `white transparent` | `black transparent`, `white transparent` |
| `Size` | `VARIANT` | `large` | `large`, `small` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="8716:1363"
node-id="8716:5085"
-->

#### Indicator

- **Category:** Feedback & Status
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (6 variants)
- **Status:** Active
- **Figma source:** [Indicators · Indicator](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=8716-5085)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/functional-status/*`, `sem/surface/*`, `sem/text/*`, `sem/icon/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: expose meaningful status text, announce important asynchronous changes, and never rely on color alone.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Prominence` | `VARIANT` | `High` | `High`, `Low` |
| `Type` | `VARIANT` | `Count` | `Count`, `Indicator` |
| `Size` | `VARIANT` | `16` | `16`, `12` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="5935:665"
node-id="5935:4606"
-->

#### Coach marks

- **Category:** Feedback & Status
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (12 variants)
- **Status:** Active
- **Figma source:** [Coachmarks · Coach-marks](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=5935-4606)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Slot`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/functional-status/*`, `sem/surface/*`, `sem/text/*`, `sem/icon/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** A `Direction` property is exposed; RTL mirroring is not specified in Figma.
- **Accessibility:** Implementation guidance: expose meaningful status text, announce important asynchronous changes, and never rely on color alone.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Slot` | `SLOT` | — | — |
| `Direction` | `VARIANT` | `top left` | `top left`, `top center`, `top right`, `bottom left`, `bottom center`, `bottom right`, `right`, `left`, `Direction9`, `Direction10`, `Direction11`, `Direction12` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="6516:727"
node-id="6529:2327"
-->

#### Loader Progress Bar

- **Category:** Feedback & Status
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (11 variants)
- **Status:** Active
- **Figma source:** [Loaders · Progress Bar](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=6529-2327)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/functional-status/*`, `sem/surface/*`, `sem/text/*`, `sem/icon/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: expose meaningful status text, announce important asynchronous changes, and never rely on color alone.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Load Percentage` | `VARIANT` | `0%` | `0%`, `10%`, `20%`, `30%`, `40%`, `50%`, `60%`, `70%`, `80%`, `90%`, `100%` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="3937:1820"
node-id="7928:2920"
-->

#### Progress Bar

- **Category:** Feedback & Status
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (2 variants)
- **Status:** Active
- **Figma source:** [Progress Bar · Progress Bar](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=7928-2920)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/functional-status/*`, `sem/surface/*`, `sem/text/*`, `sem/icon/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: expose meaningful status text, announce important asynchronous changes, and never rely on color alone.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Progress Bar Type` | `VARIANT` | `Without Units` | `Without Units`, `With Units` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="7763:3333"
node-id="7763:3754"
-->

#### Password Strength Block

- **Category:** Feedback & Status
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (6 variants)
- **Status:** Active
- **Figma source:** [Password Strength Block · Password Strength Block](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=7763-3754)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/functional-status/*`, `sem/surface/*`, `sem/text/*`, `sem/icon/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Represented through `Device`. RTL behavior is not specified in Figma.
- **Accessibility:** Implementation guidance: associate labels and supporting or error text, preserve keyboard order, and expose value, required, invalid, checked, or selected state as applicable.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Device` | `VARIANT` | `Mobile` | `Mobile`, `Desktop` |
| `State` | `VARIANT` | `Default` | `Default`, `Matched`, `Didn't Match` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="7987:6277"
node-id="7995:1339"
-->

#### Spinner

- **Category:** Feedback & Status
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (10 variants)
- **Status:** Active
- **Figma source:** [Spinner · Spinner](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=7995-1339)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Supporting Text`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/functional-status/*`, `sem/surface/*`, `sem/text/*`, `sem/icon/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Represented through `Text Orientation`. RTL behavior is not specified in Figma.
- **Accessibility:** Implementation guidance: expose meaningful status text, announce important asynchronous changes, and never rely on color alone.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show Supporting Text` | `BOOLEAN` | `true` | — |
| `Supporting Text` | `TEXT` | `Hand on tight while we load this for you` | — |
| `Size` | `VARIANT` | `xl` | `xl`, `l`, `m`, `s`, `xs` |
| `Text Orientation` | `VARIANT` | `bottom` | `right`, `bottom` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="4435:588"
node-id="4861:375"
-->

#### Alerts

- **Category:** Feedback & Status
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (10 variants)
- **Status:** Active
- **Figma source:** [Alerts · Alerts](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=4861-375)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `show SupportingText`, `leading Icon`, `show Actions`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/functional-status/*`, `sem/surface/*`, `sem/text/*`, `sem/icon/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: expose meaningful status text, announce important asynchronous changes, and never rely on color alone.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `show SupportingText` | `BOOLEAN` | `true` | — |
| `leading Icon` | `BOOLEAN` | `true` | — |
| `show Actions` | `BOOLEAN` | `true` | — |
| `Type` | `VARIANT` | `Default` | `Default`, `Info`, `Warning`, `Success`, `Error` |
| `Prominence` | `VARIANT` | `High` | `Low`, `High` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="5882:1612"
node-id="5882:3541"
-->

#### Tooltip

- **Category:** Feedback & Status
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (24 variants)
- **Status:** Active
- **Figma source:** [Tooltip · Tooltip](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=5882-3541)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show pointer`, `Show leading icon`, `Icon`, `Show dismiss`, `mediaSlot`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/functional-status/*`, `sem/surface/*`, `sem/text/*`, `sem/icon/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** A `Direction` property is exposed; RTL mirroring is not specified in Figma.
- **Accessibility:** Implementation guidance: manage focus, provide an accessible name, support dismissal where appropriate, and prevent background interaction for modal surfaces.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show pointer` | `BOOLEAN` | `true` | — |
| `Show leading icon` | `BOOLEAN` | `true` | — |
| `Icon` | `INSTANCE_SWAP` | `7647:3152` | — |
| `Show dismiss` | `BOOLEAN` | `true` | — |
| `mediaSlot` | `SLOT` | — | — |
| `Size` | `VARIANT` | `xsmall (24)` | `xsmall (24)`, `small (32)`, `large (hug)` |
| `Direction` | `VARIANT` | `top left` | `top left`, `top center`, `top right`, `bottom left`, `bottom center`, `bottom right`, `right`, `left` |


### Actions

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="84:622"
node-id="125:1404"
-->

#### button

- **Category:** Actions
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (144 variants)
- **Status:** Active
- **Figma source:** [Button · button](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=125-1404)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Left Icon`, `Left Icon Slot`, `Show Right Icon`, `Right Icon Slot`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: provide an accessible name, visible focus, keyboard activation, and programmatic disabled or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Button Label` | `TEXT` | `Button` | — |
| `Show Left Icon` | `BOOLEAN` | `false` | — |
| `Left Icon Slot` | `INSTANCE_SWAP` | `7647:3689` | — |
| `Show Right Icon` | `BOOLEAN` | `false` | — |
| `Right Icon Slot` | `INSTANCE_SWAP` | `7647:3715` | — |
| `Variant` | `VARIANT` | `neutral` | `accent`, `neutral`, `destructive`, `secondary` |
| `Style` | `VARIANT` | `filled` | `filled`, `outlined`, `ghost`, `transparent` |
| `Size` | `VARIANT` | `xlarge (64px)` | `xlarge (64px)`, `large (48px)`, `medium (40px)`, `small (32px)` |
| `State` | `VARIANT` | `default` | `default`, `hover`, `pressed`, `disabled` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="84:622"
node-id="171:3051"
-->

#### ai Button

- **Category:** Actions
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (16 variants)
- **Status:** Active
- **Figma source:** [Button · aiButton](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=171-3051)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Left Icon`, `Left Icon Slot`, `Show Right Icon`, `Right Icon Slot`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: provide an accessible name, visible focus, keyboard activation, and programmatic disabled or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Button Label` | `TEXT` | `Button` | — |
| `Show Left Icon` | `BOOLEAN` | `false` | — |
| `Left Icon Slot` | `INSTANCE_SWAP` | `7647:3708` | — |
| `Show Right Icon` | `BOOLEAN` | `false` | — |
| `Right Icon Slot` | `INSTANCE_SWAP` | `7647:3309` | — |
| `Variant` | `VARIANT` | `accent` | `accent` |
| `Size` | `VARIANT` | `xlarge (64px)` | `large (48px)`, `medium (40px)`, `small (32px)`, `xlarge (64px)` |
| `State` | `VARIANT` | `default` | `default`, `hover`, `pressed`, `disabled` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="84:622"
node-id="165:2258"
-->

#### Icon Button

- **Category:** Actions
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (144 variants)
- **Status:** Active
- **Figma source:** [Button · Icon Button](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=165-2258)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Icon Slot`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: provide an accessible name, visible focus, keyboard activation, and programmatic disabled or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Icon Slot` | `INSTANCE_SWAP` | `7647:3312` | — |
| `Variant` | `VARIANT` | `neutral` | `accent`, `neutral`, `destructive`, `secondary` |
| `Style` | `VARIANT` | `filled` | `filled`, `outlined`, `ghost`, `transparent` |
| `Size` | `VARIANT` | `xlarge (64px)` | `xlarge (64px)`, `large (48px)`, `medium (40px)`, `small (32px)` |
| `State` | `VARIANT` | `default` | `default`, `hover`, `pressed`, `disabled` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="84:622"
node-id="181:5476"
-->

#### link Button

- **Category:** Actions
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (24 variants)
- **Status:** Active
- **Figma source:** [Button · linkButton](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=181-5476)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Left Icon`, `Right Icon`, `Left Icon Slot`, `Right Icon Slot`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: provide an accessible name, visible focus, keyboard activation, and programmatic disabled or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Button Label` | `TEXT` | `Button` | — |
| `Left Icon` | `BOOLEAN` | `false` | — |
| `Right Icon` | `BOOLEAN` | `false` | — |
| `Left Icon Slot` | `INSTANCE_SWAP` | `125:1380` | — |
| `Right Icon Slot` | `INSTANCE_SWAP` | `125:1387` | — |
| `Button Label Hyperlink` | `TEXT` | `Button` | — |
| `Variant` | `VARIANT` | `accent` | `accent`, `neutral`, `destructive` |
| `Size` | `VARIANT` | `16` | `16`, `12` |
| `State` | `VARIANT` | `Default` | `Default`, `hover`, `pressed`, `disabled` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="2037:5383"
node-id="2049:7330"
-->

#### chip

- **Category:** Actions
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (8 variants)
- **Status:** Active
- **Figma source:** [Chips · chip](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=2049-7330)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Left Icon`, `Show Right Icon`, `Right Icon`, `Left Icon`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: provide an accessible name, visible focus, keyboard activation, and programmatic disabled or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show Left Icon` | `BOOLEAN` | `true` | — |
| `Show Right Icon` | `BOOLEAN` | `true` | — |
| `Right Icon` | `INSTANCE_SWAP` | `7647:3787` | — |
| `Left Icon` | `INSTANCE_SWAP` | `7647:3541` | — |
| `Variant` | `VARIANT` | `unselected` | `unselected`, `selected` |
| `State` | `VARIANT` | `default` | `default`, `hover`, `pressed`, `disabled` |


### Classification

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="2258:3029"
node-id="2258:3050"
-->

#### tag

- **Category:** Classification
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (10 variants)
- **Status:** Active
- **Figma source:** [Tags · tag](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=2258-3050)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/icon/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: provide an accessible name, visible focus, keyboard activation, and programmatic disabled or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Tag Label` | `TEXT` | `Tag Label` | — |
| `Variant` | `VARIANT` | `secondary` | `secondary`, `neutral`, `accent`, `transparent-white`, `transparent-black` |
| `Size` | `VARIANT` | `40` | `40`, `32` |


### Navigation

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="2085:590"
node-id="2093:4877"
-->

#### tab

- **Category:** Navigation
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (8 variants)
- **Status:** Active
- **Figma source:** [Tabs · tab](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=2093-4877)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Left Icon`, `Right Icon`, `Show Left Icon`, `Show Right Icon`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Left Icon` | `INSTANCE_SWAP` | `7647:3355` | — |
| `Right Icon` | `INSTANCE_SWAP` | `7647:3355` | — |
| `Show Left Icon` | `BOOLEAN` | `false` | — |
| `Show Right Icon` | `BOOLEAN` | `false` | — |
| `Tab Label` | `TEXT` | `Tab Label` | — |
| `Variant` | `VARIANT` | `unselected` | `unselected`, `selected` |
| `State` | `VARIANT` | `default` | `default`, `hover`, `pressed`, `disabled` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="2085:590"
node-id="2183:10359"
-->

#### tab Group

- **Category:** Navigation
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (10 variants)
- **Status:** Active
- **Figma source:** [Tabs · tabGroup](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=2183-10359)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Overflow Right`, `Show Overflow Left`
- **Extends / uses:** Uses `tab`.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show Overflow Right` | `BOOLEAN` | `true` | — |
| `Show Overflow Left` | `BOOLEAN` | `true` | — |
| `Variant` | `VARIANT` | `fixed` | `fixed`, `scrollable` |
| `Tab Count` | `VARIANT` | `2` | `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10` |


### Forms

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="2315:708"
node-id="2457:1059"
-->

#### text

- **Category:** Forms
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (5 variants)
- **Status:** Active
- **Figma source:** [Input Text · text](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=2457-1059)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Label`, `Show Support Text`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `sem/functional-status/error/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: associate labels and supporting or error text, preserve keyboard order, and expose value, required, invalid, checked, or selected state as applicable.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show Label` | `BOOLEAN` | `true` | — |
| `Show Support Text` | `BOOLEAN` | `true` | — |
| `State` | `VARIANT` | `default` | `default`, `hover`, `focussed`, `disabled`, `error` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="3466:2039"
node-id="3393:1727"
-->

#### email

- **Category:** Forms
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (5 variants)
- **Status:** Active
- **Figma source:** [Email · email](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=3393-1727)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Label`, `Show Support Text`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `sem/functional-status/error/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: associate labels and supporting or error text, preserve keyboard order, and expose value, required, invalid, checked, or selected state as applicable.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show Label` | `BOOLEAN` | `true` | — |
| `Show Support Text` | `BOOLEAN` | `true` | — |
| `State` | `VARIANT` | `default` | `default`, `hover`, `focussed`, `disabled`, `error` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="3466:3938"
node-id="3393:2145"
-->

#### password

- **Category:** Forms
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (5 variants)
- **Status:** Active
- **Figma source:** [Password · password](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=3393-2145)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Label`, `Show Support Text`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `sem/functional-status/error/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: associate labels and supporting or error text, preserve keyboard order, and expose value, required, invalid, checked, or selected state as applicable.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show Label` | `BOOLEAN` | `true` | — |
| `Show Support Text` | `BOOLEAN` | `true` | — |
| `State` | `VARIANT` | `default` | `default`, `hover`, `pressed`, `disabled`, `error` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="2522:1161"
node-id="2522:1182"
-->

#### search

- **Category:** Forms
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (4 variants)
- **Status:** Active
- **Figma source:** [Search · search](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=2522-1182)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `sem/functional-status/error/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: associate labels and supporting or error text, preserve keyboard order, and expose value, required, invalid, checked, or selected state as applicable.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `State` | `VARIANT` | `default` | `default`, `hover`, `focussed`, `disabled` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="2536:653"
node-id="2540:2754"
-->

#### select

- **Category:** Forms
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (5 variants)
- **Status:** Active
- **Figma source:** [Select · select](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=2540-2754)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Label`, `Show Support Text`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `sem/functional-status/error/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: associate labels and supporting or error text, preserve keyboard order, and expose value, required, invalid, checked, or selected state as applicable.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show Label` | `BOOLEAN` | `true` | — |
| `Show Support Text` | `BOOLEAN` | `true` | — |
| `State` | `VARIANT` | `default` | `default`, `hover`, `focussed`, `disabled`, `error` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="3514:1231"
node-id="3514:1252"
-->

#### phone

- **Category:** Forms
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (5 variants)
- **Status:** Active
- **Figma source:** [Phone · phone](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=3514-1252)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Label`, `Show Support Text`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `sem/functional-status/error/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: associate labels and supporting or error text, preserve keyboard order, and expose value, required, invalid, checked, or selected state as applicable.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show Label` | `BOOLEAN` | `true` | — |
| `Show Support Text` | `BOOLEAN` | `true` | — |
| `State` | `VARIANT` | `default` | `default`, `hover`, `focussed`, `disabled`, `error` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="3838:1915"
node-id="3838:1936"
-->

#### currency

- **Category:** Forms
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (5 variants)
- **Status:** Active
- **Figma source:** [Currency · currency](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=3838-1936)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Label`, `Show Support Text`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `sem/functional-status/error/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: associate labels and supporting or error text, preserve keyboard order, and expose value, required, invalid, checked, or selected state as applicable.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show Label` | `BOOLEAN` | `true` | — |
| `Show Support Text` | `BOOLEAN` | `true` | — |
| `State` | `VARIANT` | `default` | `default`, `hover`, `focussed`, `disabled`, `error` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="3530:4016"
node-id="3530:4037"
-->

#### counter

- **Category:** Forms
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (10 variants)
- **Status:** Active
- **Figma source:** [Counter · counter](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=3530-4037)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `sem/functional-status/error/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: associate labels and supporting or error text, preserve keyboard order, and expose value, required, invalid, checked, or selected state as applicable.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `State` | `VARIANT` | `default` | `default`, `hover`, `focussed`, `disabled`, `error` |
| `Type` | `VARIANT` | `standard` | `standard`, `remove` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="3838:3124"
node-id="3841:16499"
-->

#### otp Input

- **Category:** Forms
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (2 variants)
- **Status:** Active
- **Figma source:** [OTP · otpInput](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=3841-16499)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `sem/functional-status/error/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: associate labels and supporting or error text, preserve keyboard order, and expose value, required, invalid, checked, or selected state as applicable.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Variant` | `VARIANT` | `6 digits` | `6 digits`, `8 digits` |


### Selection Controls

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="2554:2601"
node-id="2555:4832"
-->

#### checkbox

- **Category:** Selection Controls
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (12 variants)
- **Status:** Active
- **Figma source:** [Checkbox · checkbox](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=2555-4832)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Checkbox Label`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: associate labels and supporting or error text, preserve keyboard order, and expose value, required, invalid, checked, or selected state as applicable.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show Checkbox Label` | `BOOLEAN` | `true` | — |
| `Type` | `VARIANT` | `unchecked` | `unchecked`, `indeterminate`, `checked` |
| `State` | `VARIANT` | `default` | `default`, `hover`, `pressed`, `disabled` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="2769:1704"
node-id="2769:2024"
-->

#### radio Button

- **Category:** Selection Controls
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (8 variants)
- **Status:** Active
- **Figma source:** [Radio Button · radioButton](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=2769-2024)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Radio Button Label`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: provide an accessible name, visible focus, keyboard activation, and programmatic disabled or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show Radio Button Label` | `BOOLEAN` | `true` | — |
| `Type` | `VARIANT` | `unselected` | `unselected`, `selected` |
| `State` | `VARIANT` | `default` | `default`, `hover`, `pressed`, `disabled` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="3693:352"
node-id="3695:3203"
-->

#### switch

- **Category:** Selection Controls
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (16 variants)
- **Status:** Active
- **Figma source:** [Switch · switch](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=3695-3203)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Switch Label`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: associate labels and supporting or error text, preserve keyboard order, and expose value, required, invalid, checked, or selected state as applicable.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show Switch Label` | `BOOLEAN` | `true` | — |
| `On` | `VARIANT` | `No` | `No`, `Yes` |
| `State` | `VARIANT` | `default` | `default`, `hover`, `pressed`, `disabled` |
| `Size` | `VARIANT` | `Large` | `Large`, `Small` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="4911:569"
node-id="4930:458"
-->

#### Date Picker

- **Category:** Selection Controls
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (1 variants)
- **Status:** Active
- **Figma source:** [Date Picker · Date Picker](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=4930-458)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: associate labels and supporting or error text, preserve keyboard order, and expose value, required, invalid, checked, or selected state as applicable.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Type` | `VARIANT` | `Default` | `Default` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="5957:2925"
node-id="5957:3010"
-->

#### Segmented Control

- **Category:** Selection Controls
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (2 variants)
- **Status:** Active
- **Figma source:** [Segmented Control · Segmented Control](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=5957-3010)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: associate labels and supporting or error text, preserve keyboard order, and expose value, required, invalid, checked, or selected state as applicable.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `No of Tabs` | `VARIANT` | `2 Tabs` | `2 Tabs`, `3 Tabs` |


### Commerce

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="3550:898"
node-id="3559:4983"
-->

#### product Card

- **Category:** Commerce
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (4 variants)
- **Status:** In review
- **Figma source:** [Product Catalog Card - CHECK WITH JAGAN · productCard](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=3559-4983)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Partner Badge`, `Show Promotion Badge`, `Show Background Image`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `sem/functional-status/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: preserve semantic structure, meaningful names, keyboard access, focus visibility, and contrast.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show Partner Badge` | `BOOLEAN` | `false` | — |
| `Show Promotion Badge` | `BOOLEAN` | `true` | — |
| `Show Background Image` | `BOOLEAN` | `true` | — |
| `Variant` | `VARIANT` | `standard` | `standard`, `quick add`, `qucik add with counter`, `full` |


### Layout & Structure

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="3631:5510"
node-id="3676:1037"
-->

#### divider

- **Category:** Layout & Structure
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (4 variants)
- **Status:** Active
- **Figma source:** [Divider · divider](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=3676-1037)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/border/*`, `sem/surface/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** A `Direction` property is exposed; RTL mirroring is not specified in Figma.
- **Accessibility:** Implementation guidance: preserve semantic structure, meaningful names, keyboard access, focus visibility, and contrast.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Direction` | `VARIANT` | `horizontal` | `horizontal`, `vertical` |
| `Variant` | `VARIANT` | `with spacing` | `with spacing`, `without spacing` |


### Disclosure

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="3624:1707"
node-id="3631:2827"
-->

#### accordion Item

- **Category:** Disclosure
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (16 variants)
- **Status:** Active
- **Figma source:** [Accordion · accordionItem](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=3631-2827)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Caption`, `Show Description`, `accordionTrigger`, `accordionTrigger2`, `accordionTrigger3`, `accordionTrigger4`, `accordionTrigger5`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `sem/surface/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show Caption` | `BOOLEAN` | `true` | — |
| `Show Description` | `BOOLEAN` | `true` | — |
| `accordionTrigger` | `SLOT` | — | — |
| `accordionTrigger2` | `SLOT` | — | — |
| `accordionTrigger3` | `SLOT` | — | — |
| `accordionTrigger4` | `SLOT` | — | — |
| `accordionTrigger5` | `SLOT` | — | — |
| `State` | `VARIANT` | `default` | `default`, `hover`, `pressed`, `disabled` |
| `Type` | `VARIANT` | `collapsed` | `collapsed`, `expanded` |
| `Variant` | `VARIANT` | `with divider` | `with divider`, `without divider` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="3624:1707"
node-id="3690:2707"
-->

#### accordion

- **Category:** Disclosure
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (4 variants)
- **Status:** Active
- **Figma source:** [Accordion · accordion](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=3690-2707)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** Uses `accordionItem`.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `sem/surface/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Items` | `VARIANT` | `2` | `2`, `3` |
| `Surface` | `VARIANT` | `page` | `page`, `contained` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="5307:1584"
node-id="5307:1982"
-->

#### list Item

- **Category:** Disclosure
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (5 variants)
- **Status:** Active
- **Figma source:** [List Item · listItem](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=5307-1982)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `leadingSlot`, `trailingSlot`, `contentSlot`, `Show leadingSlot`, `Show trailingSlot`, `Icon`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `sem/surface/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `leadingSlot` | `SLOT` | — | — |
| `trailingSlot` | `SLOT` | — | — |
| `contentSlot` | `SLOT` | — | — |
| `Show leadingSlot` | `BOOLEAN` | `true` | — |
| `Show trailingSlot` | `BOOLEAN` | `true` | — |
| `Icon` | `INSTANCE_SWAP` | `7647:3187` | — |
| `State` | `VARIANT` | `default` | `default`, `hover`, `pressed`, `disabled` |
| `Interactive` | `VARIANT` | `no` | `no`, `yes` |

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="5307:1584"
node-id="5307:2034"
-->

#### list

- **Category:** Disclosure
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Standalone component
- **Status:** Active
- **Figma source:** [List Item · list](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=5307-2034)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `listItems`
- **Extends / uses:** Uses `listItem`.
- **Token dependencies:** Expected foundation families: `sem/action/*`, `sem/text/*`, `sem/icon/*`, `sem/border/*`, `sem/surface/*`, `space/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `listItems` | `SLOT` | — | — |


### Overlay

<!-- figma-source
file-key="NzvsYn3jj6MHAEWUqUzHEP"
page-id="3996:1545"
node-id="3996:4333"
-->

#### scrim

- **Category:** Overlay
- **Platform:** Shared / platform-neutral unless exposed by a variant
- **Classification:** Shared component; Component set (2 variants)
- **Status:** Active
- **Figma source:** [Scrim · scrim](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=3996-4333)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/static/transparent-*`, `sem/shadow/*`. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Represented through `Platform`. RTL behavior is not specified in Figma.
- **Accessibility:** Implementation guidance: manage focus, provide an accessible name, support dismissal where appropriate, and prevent background interaction for modal surfaces.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Platform` | `VARIANT` | `mobile` | `mobile`, `desktop` |



## 8. Vodafone product-component source inventory (reference only)

This section covers active Sprint 1–3 Vodafone product UI only. It is retained as visual/source research for Design Flow and does not define Design Flow's component APIs or runtime architecture. B2B, dashboard, B2C mobile, deprecated, template, and graveyard pages are intentionally excluded.

| Group | Public contracts |
| --- | --- |
| Sprint 1 | 16 |
| Sprint 2 | 11 |
| Sprint 3 | 10 |

### Sprint 1

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="3:570"
node-id="33:14814"
-->

#### sidebar Navigation

- **Category:** Sprint 1
- **Platform:** Web
- **Classification:** Product component; Component set (2 variants)
- **Status:** Active
- **Figma source:** [Web (Component) \| Side Navigation · web / sidebarNavigation](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=33-14814)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `navigationPanel`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `navigationPanel` | `SLOT` | — | — |
| `Variant` | `VARIANT` | `expanded` | `expanded`, `collapsed` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="169:4203"
node-id="41:31768"
-->

#### popover Menu

- **Category:** Sprint 1
- **Platform:** Web
- **Classification:** Product component; Standalone component
- **Status:** Active
- **Figma source:** [Web (Component) \| Popover · web / popoverMenu](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=41-31768)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `contentSlot`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: manage focus, provide an accessible name, support dismissal where appropriate, and prevent background interaction for modal surfaces.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `contentSlot` | `SLOT` | — | — |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="169:5282"
node-id="42:32934"
-->

#### modal

- **Category:** Sprint 1
- **Platform:** Web
- **Classification:** Product component; Component set (1 variants)
- **Status:** Active
- **Figma source:** [Web (Component) \| Modal · web / modal](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=42-32934)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `contentSlot`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: manage focus, provide an accessible name, support dismissal where appropriate, and prevent background interaction for modal surfaces.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `contentSlot` | `SLOT` | — | — |
| `Variant` | `VARIANT` | `default` | `default` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="169:7676"
node-id="75:3098"
-->

#### pagination

- **Category:** Sprint 1
- **Platform:** Web
- **Classification:** Product component; Standalone component
- **Status:** Active
- **Figma source:** [Web (Component) \| Pagination · web / pagination](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=75-3098)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `paginationItemsSlot`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `paginationItemsSlot` | `SLOT` | — | — |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="169:8824"
node-id="2728:1205"
-->

#### carousel Bottom Action Bar

- **Category:** Sprint 1
- **Platform:** Web
- **Classification:** Product component; Component set (2 variants)
- **Status:** Active
- **Figma source:** [Web (Component) \| Carousel · carouselBottomActionBar](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=2728-1205)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Variant` | `VARIANT` | `indicator` | `indicator`, `count` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="169:8824"
node-id="129:4100"
-->

#### carousel Indicator

- **Category:** Sprint 1
- **Platform:** Web
- **Classification:** Product component; Component set (3 variants)
- **Status:** Active
- **Figma source:** [Web (Component) \| Carousel · carouselIndicator](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=129-4100)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Variant` | `VARIANT` | `default` | `default`, `loading`, `active` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="169:8824"
node-id="163:4099"
-->

#### carousel Thumb

- **Category:** Sprint 1
- **Platform:** Web
- **Classification:** Product component; Component set (4 variants)
- **Status:** Active
- **Figma source:** [Web (Component) \| Carousel · carouselThumb](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=163-4099)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `State` | `VARIANT` | `default` | `default`, `hover`, `pressed/focussed`, `active` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="169:8824"
node-id="163:4191"
-->

#### carousel Action

- **Category:** Sprint 1
- **Platform:** Web
- **Classification:** Product component; Component set (2 variants)
- **Status:** Active
- **Figma source:** [Web (Component) \| Carousel · carouselAction](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=163-4191)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Variant` | `VARIANT` | `previous` | `previous`, `next` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="169:8824"
node-id="2312:3257"
-->

#### carousel Container

- **Category:** Sprint 1
- **Platform:** Web
- **Classification:** Product component; Standalone component
- **Status:** Active
- **Figma source:** [Web (Component) \| Carousel · carouselContainer](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=2312-3257)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Indicator & Actions?`, `carouselContentSlot`
- **Extends / uses:** Uses `carouselBottomActionBar`, `carouselIndicator`, and `carouselAction`.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show Indicator & Actions?` | `BOOLEAN` | `true` | — |
| `carouselContentSlot` | `SLOT` | — | — |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="230:2385"
node-id="230:2782"
-->

#### table Cell

- **Category:** Sprint 1
- **Platform:** Web
- **Classification:** Product component; Component set (2 variants)
- **Status:** Active
- **Figma source:** [Web (Component) \| Table · tableCell](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=230-2782)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `tableCellContentSlot`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `tableCellContentSlot` | `SLOT` | — | — |
| `State` | `VARIANT` | `default` | `default`, `hover/selected` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="230:2385"
node-id="230:2801"
-->

#### table Header Cols

- **Category:** Sprint 1
- **Platform:** Web
- **Classification:** Product component; Standalone component
- **Status:** Active
- **Figma source:** [Web (Component) \| Table · tableHeaderCols](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=230-2801)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `headerColSlot`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `headerColSlot` | `SLOT` | — | — |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="230:2385"
node-id="230:2812"
-->

#### table Row Cols

- **Category:** Sprint 1
- **Platform:** Web
- **Classification:** Product component; Standalone component
- **Status:** Active
- **Figma source:** [Web (Component) \| Table · tableRowCols](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=230-2812)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `rowColSlot`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `rowColSlot` | `SLOT` | — | — |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="230:2385"
node-id="230:2836"
-->

#### table

- **Category:** Sprint 1
- **Platform:** Web
- **Classification:** Product component; Standalone component
- **Status:** Active
- **Figma source:** [Web (Component) \| Table · table](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=230-2836)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `tableContentSlot`
- **Extends / uses:** Uses `tableHeaderCols`, `tableRowCols`, `tableCell`, and `tableHeaderCell`.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `tableContentSlot` | `SLOT` | — | — |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="230:2385"
node-id="230:2773"
-->

#### table Header Cell

- **Category:** Sprint 1
- **Platform:** Web
- **Classification:** Product component; Standalone component
- **Status:** Active
- **Figma source:** [Web (Component) \| Table · tableHeaderCell](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=230-2773)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `tableHeaderLabelSlot`, `Show Checkbox`, `Show Sorting`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `tableHeaderLabelSlot` | `SLOT` | — | — |
| `Show Checkbox` | `BOOLEAN` | `true` | — |
| `Show Sorting` | `BOOLEAN` | `false` | — |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="2082:1071"
node-id="2082:4436"
-->

#### Product Card Pattern

- **Category:** Sprint 1
- **Platform:** Web
- **Classification:** Product pattern; Component set (3 variants)
- **Status:** Active
- **Figma source:** [Web (Pattern) \| Product Card · webPattern / productCard](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=2082-4436)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Implementation guidance — use this composition for web product-card journeys; inherit the shared `productCard` contract and fill the documented product slots.
- **Anatomy and slots:** `product-additional-info-badges`, `product-image`, `productCardPricing`, `rating-container`, `product-action-row`
- **Extends / uses:** Extends shared `productCard`; product slots add media, pricing, rating, badges, and actions.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: preserve semantic structure, meaningful names, keyboard access, focus visibility, and contrast.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `product-additional-info-badges` | `SLOT` | — | — |
| `product-image` | `SLOT` | — | — |
| `productCardPricing` | `SLOT` | — | — |
| `rating-container` | `SLOT` | — | — |
| `product-action-row` | `SLOT` | — | — |
| `Card Variant` | `VARIANT` | `standalone product` | `standalone product`, `bundle`, `loading` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="2082:1071"
node-id="2082:4407"
-->

#### feature Card

- **Category:** Sprint 1
- **Platform:** Web
- **Classification:** Product pattern; Standalone component
- **Status:** Active
- **Figma source:** [Web (Pattern) \| Product Card · webPattern / featureCard](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=2082-4407)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `mediaPlaceholderSlot`, `contentSlot`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: preserve semantic structure, meaningful names, keyboard access, focus visibility, and contrast.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `mediaPlaceholderSlot` | `SLOT` | — | — |
| `contentSlot` | `SLOT` | — | — |


### Sprint 2

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="230:2384"
node-id="230:2384"
-->

#### Navigation

- **Category:** Sprint 2
- **Platform:** Web
- **Classification:** Product component; Documentation page
- **Status:** Active
- **Figma source:** [Web (Component) \| Navigation · Navigation](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=230-2384)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

_Not specified in the public Figma component API._

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="423:298356"
node-id="423:299897"
-->

#### footer

- **Category:** Sprint 2
- **Platform:** Web
- **Classification:** Product component; Standalone component
- **Status:** Active
- **Figma source:** [Web (Component) \| Footer · web / footer](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=423-299897)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: preserve semantic structure, meaningful names, keyboard access, focus visibility, and contrast.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

_Not specified in the public Figma component API._

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="285:9614"
node-id="285:11570"
-->

#### page Nav

- **Category:** Sprint 2
- **Platform:** Web
- **Classification:** Product pattern; Component set (3 variants)
- **Status:** Active
- **Figma source:** [Web (Pattern) \| Header Navigation · webPattern / pageNav](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=285-11570)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** Uses `webPattern / topNavigation`.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: preserve semantic structure, meaningful names, keyboard access, focus visibility, and contrast.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Variant` | `VARIANT` | `all` | `all`, `only product nav`, `only secondary nav` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="285:9614"
node-id="285:11264"
-->

#### top Navigation

- **Category:** Sprint 2
- **Platform:** Web
- **Classification:** Product pattern; Standalone component
- **Status:** Active
- **Figma source:** [Web (Pattern) \| Header Navigation · webPattern / topNavigation](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=285-11264)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

_Not specified in the public Figma component API._

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="241:4614"
node-id="241:4628"
-->

#### breadcrumb Group

- **Category:** Sprint 2
- **Platform:** Web
- **Classification:** Product component; Standalone component
- **Status:** Active
- **Figma source:** [Web (Component) \| Breadcrumb · web / breadcrumbGroup](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=241-4628)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `breadcrumbItemsSlot`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `breadcrumbItemsSlot` | `SLOT` | — | — |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="288:422"
node-id="288:643"
-->

#### Bottom sheet

- **Category:** Sprint 2
- **Platform:** Mobile
- **Classification:** Product component; Standalone component
- **Status:** Active
- **Figma source:** [Mobile (Component) \| Action Sheet · Bottom sheet](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=288-643)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show scrim`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: manage focus, provide an accessible name, support dismissal where appropriate, and prevent background interaction for modal surfaces.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show scrim` | `BOOLEAN` | `true` | — |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="317:467"
node-id="317:3797"
-->

#### web App Shell

- **Category:** Sprint 2
- **Platform:** Web
- **Classification:** Product pattern; Component set (6 variants)
- **Status:** Active
- **Figma source:** [Web (Pattern) \| App Shells · webPattern / webAppShell](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=317-3797)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `bodySlot`, `Show Breadcrumb?`
- **Extends / uses:** Uses product navigation, breadcrumb, and body-slot contracts.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: preserve semantic structure, meaningful names, keyboard access, focus visibility, and contrast.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `bodySlot` | `SLOT` | — | — |
| `Show Breadcrumb?` | `BOOLEAN` | `false` | — |
| `Customer type` | `VARIANT` | `guest user` | `guest user`, `solutions spoc user` |
| `Application Type` | `VARIANT` | `website` | `website`, `portal` |
| `Usage` | `VARIANT` | `page` | `page`, `success`, `email confirmation`, `failure` |
| `Top Nav Position` | `VARIANT` | `relative` | `relative`, `absolute` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="326:1597"
node-id="2090:1007"
-->

#### bottom Navigation

- **Category:** Sprint 2
- **Platform:** Mobile
- **Classification:** Product component; Component set (2 variants)
- **Status:** Active
- **Figma source:** [Mobile (Component) \| Bottom Navigation · bottomNavigation](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=2090-1007)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show AI Button`, `Show Home Indicator`
- **Extends / uses:** Uses `bottomNavigationItem`.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show AI Button` | `BOOLEAN` | `false` | — |
| `Show Home Indicator` | `BOOLEAN` | `true` | — |
| `Variant` | `VARIANT` | `iOS` | `iOS`, `android` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="326:1597"
node-id="2090:896"
-->

#### bottom Navigation Item

- **Category:** Sprint 2
- **Platform:** Mobile
- **Classification:** Product component; Component set (2 variants)
- **Status:** Active
- **Figma source:** [Mobile (Component) \| Bottom Navigation · bottomNavigationItem](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=2090-896)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Badge`, `Icon`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show Badge` | `BOOLEAN` | `true` | — |
| `Icon` | `INSTANCE_SWAP` | `2090:642` | — |
| `Variant` | `VARIANT` | `active` | `active`, `inactive` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="340:9324"
node-id="340:9758"
-->

#### home Indicator

- **Category:** Sprint 2
- **Platform:** Mobile
- **Classification:** Product component; Component set (3 variants)
- **Status:** Active
- **Figma source:** [Mobile (Component) \| Utilities · homeIndicator](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=340-9758)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Represented through `Platform`, `Orientation`. RTL behavior is not specified in Figma.
- **Accessibility:** Implementation guidance: expose meaningful status text, announce important asynchronous changes, and never rely on color alone.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Platform` | `VARIANT` | `iOS` | `android`, `iOS` |
| `Orientation` | `VARIANT` | `potrait` | `potrait`, `landscape` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="340:9324"
node-id="340:9782"
-->

#### top Nav Bar

- **Category:** Sprint 2
- **Platform:** Mobile
- **Classification:** Product component; Component set (3 variants)
- **Status:** Active
- **Figma source:** [Mobile (Component) \| Utilities · topNavBar](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=340-9782)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show Trailing Icon`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: preserve semantic structure, meaningful names, keyboard access, focus visibility, and contrast.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show Trailing Icon` | `BOOLEAN` | `true` | — |
| `type` | `VARIANT` | `search` | `search`, `title`, `brand` |


### Sprint 3

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="2025:1638"
node-id="2026:2882"
-->

#### order Summary Card

- **Category:** Sprint 3
- **Platform:** Web
- **Classification:** Product pattern; Component set (2 variants)
- **Status:** Active
- **Figma source:** [Web (Pattern) \| Order Summary Card · webPattern / orderSummaryCard](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=2026-2882)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `orderSummaryContent`
- **Extends / uses:** Uses `web / promoCodeContent`.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: preserve semantic structure, meaningful names, keyboard access, focus visibility, and contrast.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `orderSummaryContent` | `SLOT` | — | — |
| `Variant` | `VARIANT` | `hidden line items` | `expanded line items`, `hidden line items` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="2025:1638"
node-id="2033:15008"
-->

#### promo Code Content

- **Category:** Sprint 3
- **Platform:** Web
- **Classification:** Product pattern; Component set (2 variants)
- **Status:** Active
- **Figma source:** [Web (Pattern) \| Order Summary Card · web / promoCodeContent](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=2033-15008)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: preserve semantic structure, meaningful names, keyboard access, focus visibility, and contrast.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Variant` | `VARIANT` | `default` | `default`, `promo applied` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="2032:4292"
node-id="2032:5733"
-->

#### promo Code Modal

- **Category:** Sprint 3
- **Platform:** Web
- **Classification:** Product component and pattern; Component set (6 variants)
- **Status:** Active
- **Figma source:** [Web (Component & Pattern) \| Promo Code Modal · webPattern / promoCodeModal](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=2032-5733)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** Uses product `web / modal` plus shared form and action primitives.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: manage focus, provide an accessible name, support dismissal where appropriate, and prevent background interaction for modal surfaces.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Variant` | `VARIANT` | `empty state` | `promo predefined`, `empty state`, `promo typed`, `promo selected`, `promo invalid`, `promo expired` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="2033:8885"
node-id="2033:10603"
-->

#### cart View Product Card

- **Category:** Sprint 3
- **Platform:** Web
- **Classification:** Product component and pattern; Component set (8 variants)
- **Status:** Active
- **Figma source:** [Web (Component & Pattern) \| Cart Product Item · webPattern / cartViewProductCard](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=2033-10603)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** Extends the product-card composition for cart context.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: preserve semantic structure, meaningful names, keyboard access, focus visibility, and contrast.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Solution Provider` | `VARIANT` | `Microsoft` | `Microsoft`, `Q:5 Proudly Enterprise Solutions`, `Smartly`, `Budu Cloud`, `Vodafone` |
| `Service` | `VARIANT` | `microsoft 365 business` | `domain registration`, `microsoft 365 business`, `retail management`, `smart hosting`, `erp`, `finance & accounting management`, `ivms`, `vpc` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="2035:17796"
node-id="2035:26497"
-->

#### filter Panel

- **Category:** Sprint 3
- **Platform:** Web
- **Classification:** Product component; Standalone component
- **Status:** Active
- **Figma source:** [Web (Component) \| Filter Panel · web / filterPanel](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=2035-26497)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `filterItemsSlot`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: preserve semantic structure, meaningful names, keyboard access, focus visibility, and contrast.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `filterItemsSlot` | `SLOT` | — | — |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="2035:23947"
node-id="2035:25121"
-->

#### accordion Item With Slot

- **Category:** Sprint 3
- **Platform:** Web
- **Classification:** Product component; Component set (16 variants)
- **Status:** Active
- **Figma source:** [Web (Component) \| Accordion · web / accordionItemWithSlot](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=2035-25121)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `accordionContent`, `accordionTrigger`, `Show Leading Slot`, `Show Badge`, `Show Caption`, `Show Description`, `Leading Icon`
- **Extends / uses:** Extends shared `accordionItem` with trigger and content slots.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `accordionContent` | `SLOT` | — | — |
| `accordionTrigger` | `SLOT` | — | — |
| `Show Leading Slot` | `BOOLEAN` | `true` | — |
| `Show Badge` | `BOOLEAN` | `false` | — |
| `Show Caption` | `BOOLEAN` | `true` | — |
| `Show Description` | `BOOLEAN` | `true` | — |
| `Leading Icon` | `INSTANCE_SWAP` | `2345:1757` | — |
| `State` | `VARIANT` | `default` | `default`, `hover`, `pressed`, `disabled` |
| `Type` | `VARIANT` | `collapsed` | `collapsed`, `expanded` |
| `Variant` | `VARIANT` | `with divider` | `with divider`, `without divider` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="2113:19402"
node-id="2113:19402"
-->

#### Dropdown Menu

- **Category:** Sprint 3
- **Platform:** Web
- **Classification:** Product component; Documentation page
- **Status:** Active
- **Figma source:** [Web (Component) \| Dropdown Menu · Dropdown Menu](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=2113-19402)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: preserve semantic structure, meaningful names, keyboard access, focus visibility, and contrast.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

_Not specified in the public Figma component API._

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="2126:22757"
node-id="2131:23492"
-->

#### progress Stepper

- **Category:** Sprint 3
- **Platform:** Web
- **Classification:** Product component; Component set (2 variants)
- **Status:** Active
- **Figma source:** [Web (Component) \| Stepper · progressStepper](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=2131-23492)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `stepperSlot`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Represented through `Breakpoint`. RTL behavior is not specified in Figma.
- **Accessibility:** Implementation guidance: use the corresponding semantic role, preserve logical keyboard order, and expose current, expanded, or selected state.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `stepperSlot` | `SLOT` | — | — |
| `Breakpoint` | `VARIANT` | `desktop` | `desktop` |
| `Direction` | `VARIANT` | `horizontal` | `horizontal`, `vertical` |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="2480:4063"
node-id="2481:312"
-->

#### banner Alert

- **Category:** Sprint 3
- **Platform:** Web
- **Classification:** Product component; Standalone component
- **Status:** Active
- **Figma source:** [Web (Component) \| Banner · web / bannerAlert](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=2481-312)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** `Show action`
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: expose meaningful status text, announce important asynchronous changes, and never rely on color alone.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

| Property | Type | Default | Allowed values |
| --- | --- | --- | --- |
| `Show action` | `BOOLEAN` | `true` | — |

<!-- figma-source
file-key="VwqdLFTd04DeiP5Q17iG9G"
page-id="3273:3629"
node-id="3273:3629"
-->

#### Slider

- **Category:** Sprint 3
- **Platform:** Web and mobile
- **Classification:** Product component; Documentation page
- **Status:** Active
- **Figma source:** [Web & Mobile (Component) \| Slider · Slider](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=3273-3629)
- **Figma description:** Not specified in Figma.
- **Recommended use:** Vodafone visual/source reference only; Design Flow defines the runtime contract under `src/ui/`.
- **Anatomy and slots:** Not specified in public Figma properties.
- **Extends / uses:** No explicit inheritance relationship is exposed by the public Figma properties.
- **Token dependencies:** Expected foundation families: `sem/surface/*`, `sem/text/*`, `sem/action/*`, `sem/border/*`, `space/*`, and inherited shared-component dependencies. Exact per-layer bindings remain owned by Figma and are not copied as literals.
- **Responsive / RTL:** Responsive and RTL behavior are not specified in Figma.
- **Accessibility:** Implementation guidance: preserve semantic structure, meaningful names, keyboard access, focus visibility, and contrast.
- **Source guardrail:** Preserve source traceability when using this inventory as visual research; Design Flow owns its states and public API.

**Public API**

_Not specified in the public Figma component API._



## 9. Design Flow precedence and composition rules

### Precedence

1. **Approved Design Flow product behavior and mandatory accessibility** own workflow, domain consequences, and usable interaction requirements.
2. **VF Foundations** own color, semantic color roles/modes, typography, and text styles.
3. **Verified Astryx references** own the preferred non-color, non-typographic presentation and engineering baseline where official guidance is available.
4. **Approved Design Flow fallbacks** fill explicitly documented Astryx gaps or record the smallest necessary product/accessibility deviation.
5. **Design Flow `src/ui/` components** own runtime implementation and public component APIs without changing those authority boundaries.
6. **Product modules** compose `src/ui/` components and own Design Flow-specific workflows without redefining foundation tokens.

### Composition rules

- Define project-appropriate component APIs; do not mirror Astryx or Vodafone Figma property names by default.
- Use product patterns as compositions of `src/ui/` components; do not flatten them into duplicated one-off elements.
- Resolve color and typography through Vodafone aliases.
- Resolve spacing, shape, sizing, elevation geometry, motion, state presentation, and responsive patterns through source-traceable Design Flow aliases mapped from verified Astryx guidance.
- Add a documented semantic fallback before using a missing or unavailable Astryx presentation value.
- Keep unspecified presentation, behavior, responsive rules, and accessibility gaps explicit until the relevant Astryx guidance is distilled and a Design Flow decision is recorded.
- Do not copy Astryx documentation or source code into the project.


## 10. Agent quick reference

When generating UI:

1. Read the relevant product specification and `docs/ui-architecture.md`.
2. Select semantic Vodafone color tokens for the target surface and mode.
3. Choose an existing Vodafone text style by role and preserve its defined metrics.
4. Read the relevant distilled Astryx note for anatomy, geometry, density, spacing, sizing, shape, elevation, motion, states, behavior, accessibility, keyboard interaction, and responsiveness.
5. If the necessary Astryx note or measurable presentation detail is missing, distill it from official Astryx documentation before coding.
6. Map verified Astryx presentation through centralized Design Flow semantic aliases.
7. If official guidance does not expose a needed value, record the gap and approve a centralized Design Flow fallback before use.
8. Document any smallest necessary deviation caused by product behavior, mandatory accessibility, Vodafone color contrast, or Vodafone text metrics.
9. Implement or reuse the Design Flow-owned component under `src/ui/`; document its API and cover its behavior with tests.
10. Validate Light/Dark contrast, responsive behavior, focus visibility, and relevant keyboard and assistive-technology paths.

## 11. Source registry and provenance

| Layer | Figma file | File key | Local variables | Documentation scope |
| --- | --- | --- | --- | --- |
| Foundations | [VF Foundations](https://www.figma.com/design/793xF92PNCLbDCNdoLue6P/VF-Foundations?node-id=0-1) | `793xF92PNCLbDCNdoLue6P` | 830 across five collections | Design Flow authority for color and typography; spacing/elevation retained as Vodafone provenance only |
| Shared components | [Vodafone Component Library](https://www.figma.com/design/NzvsYn3jj6MHAEWUqUzHEP/Vodafone-Component-Library?node-id=0-1) | `NzvsYn3jj6MHAEWUqUzHEP` | 0 | Vodafone source inventory only; does not govern Design Flow non-color presentation or runtime contracts |
| Product components | [Vodafone Product Library](https://www.figma.com/design/VwqdLFTd04DeiP5Q17iG9G/Vodafone-Product-Library?node-id=0-1) | `VwqdLFTd04DeiP5Q17iG9G` | 0 | Vodafone source inventory only; does not govern Design Flow patterns or runtime APIs |


- Figma source: [VF Foundations](https://www.figma.com/design/793xF92PNCLbDCNdoLue6P/VF-Foundations?node-id=0-1)
- Documentation pattern inspired by [VoltAgent's Awesome DESIGN.md](https://github.com/VoltAgent/awesome-design-md/tree/main), particularly its semantic token tables, role descriptions, usage rules, depth model, and do/don't guardrails.
- Reference format: [Vodafone DESIGN.md example](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/vodafone/DESIGN.md)

This is generated documentation, not a replacement for token governance. Update it whenever Figma variables or local styles change.
