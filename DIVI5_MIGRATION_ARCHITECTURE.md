# Divi Forge Architecture Plan

## Product Thesis
Your Divi 4 assets are **raw material**. The product is a deterministic system that turns intake data into a launch-ready Divi 5 site in under 30 minutes.

**Recommended architecture choice:** build a **hybrid system**:
1. Web app (Builder + Generate + Review UX)
2. WordPress connector plugin (imports/exports through Divi 5 storage + processing APIs)

Why: fastest to ship, strongest reliability, and avoids locking core logic inside WordPress admin while still using Divi-native persistence.

---

## North-Star Requirements (non-negotiable)
- Core Web Vitals first (tokenized globals, minimal CSS drift, image optimization).
- No Divi 4 artifacts in final packages.
- No hardcoded brand values in templates.
- Every generated site includes a Style Guide page.
- Agency velocity: intake → reviewed export in <30 minutes for repeat templates.

---

## System Architecture (Opinionated)

## Components
1. **Builder Engine** (one-time per source template)
   - Divi 4 parser, style analyzer, dedupe clustering, tokenizer, Divi 5 mapper.
2. **Template Library**
   - Stores tokenized Divi 5 templates + schema + mapping manifests + versions.
3. **Intake Service**
   - Dynamic forms (ABA-first schema), asset uploads, validation.
4. **Generation Engine**
   - Merges intake profile into tokenized template; emits Divi 5 package.
5. **Review Studio**
   - Visual compare, overrides, section swaps, quality gates.
6. **WP Connector Plugin**
   - Pull/push with Divi 5 APIs for storage + processing and round-tripping.
7. **Observability + Audit**
   - Every transformation and human decision is logged for repeatability.

---

## PHASE 1 — Template Library Creation (Builder Mode)

## 1. Tokenized Template Format (Canonical)
Use a versioned JSON bundle called `ForgeTemplateBundle`.

```json
{
  "bundle_version": "1.0",
  "template_id": "aba_clinic_v3",
  "vertical": "aba_therapy",
  "divi_target": "5.x",
  "globals": {
    "colors": {
      "brand.primary": "{{brand.colors.primary}}",
      "brand.secondary": "{{brand.colors.secondary}}",
      "text.primary": "{{brand.colors.text_primary}}"
    },
    "fonts": {
      "heading": "{{brand.typography.heading_family}}",
      "body": "{{brand.typography.body_family}}"
    }
  },
  "presets": [{ "id": "preset.button.primary", "tokens": { "bg": "{{brand.colors.primary}}" } }],
  "theme_builder": {
    "templates": [
      { "id": "global_header", "condition": "all" },
      { "id": "single_page_default", "condition": "page:*" },
      { "id": "global_footer", "condition": "all" }
    ]
  },
  "content_model": {
    "tokens": {
      "business.name": "{{business.name}}",
      "hero.tagline": "{{messaging.hero_tagline}}",
      "contact.phone": "{{contact.phone}}"
    },
    "repeaters": {
      "team.members": { "min": 0, "max": 30 },
      "testimonials.items": { "min": 0, "max": 20 }
    }
  },
  "mapping_manifest": {
    "required_tokens": ["business.name", "brand.colors.primary"],
    "optional_tokens": ["insurance.accepted"]
  }
}
```

### Why this structure
- Separates **design system** (globals/presets) from **content tokens**.
- Makes Generate Mode deterministic.
- Supports template versioning and safe schema evolution.

## 2. Parsing Divi 4 → Tokenized Template
Use a deterministic compiler pipeline:

1. **Import layer**
   - Accept Divi 4 layout JSON + child theme ZIP.
2. **Shortcode AST parser**
   - Parse nested shortcodes recursively into typed nodes.
3. **Style capture layer**
   - Collect module attrs, inline CSS, class-based CSS, stylesheet rules.
4. **CSS cascade resolver**
   - Compute effective style per module with precedence:
     1) `!important`
     2) inline/module attrs
     3) child-theme stylesheet specificity
     4) Divi defaults
5. **Normalization**
   - Normalize units/colors/fonts into canonical form.
6. **Token candidate detection**
   - Identify brand/content literals (colors, business name, contact details, service phrases).
7. **Divi 5 mapping**
   - Emit Design IR then Divi 5-aligned structures.

### Handling `!important`
- If a style with `!important` can map to a preset/global token, preserve intent by moving it into the highest-priority applicable preset slot.
- If it cannot be represented in Divi 5 native fields, mark as `legacy_exception` and block “clean export” until resolved.

## 3. Style Deduplication Algorithm (Builder Mode)

### Recommended approach
A weighted similarity engine + human approval queue.

**Step A: Cluster candidates by module type**
- Buttons with buttons, blurbs with blurbs, etc.

**Step B: Feature vector per instance**
- Typography (family, size, weight, line-height)
- Color tuple (text/bg/border/hover)
- Spacing tuple (padding/margin)
- Border tuple (radius/width/style)
- Effects tuple (shadow/transition)

**Step C: Weighted distance**
- Color 30%
- Typography 25%
- Spacing 20%
- Border 15%
- Effects 10%

**Step D: Threshold policy (opinionated)**
- `>= 0.93`: auto-merge into canonical preset candidate.
- `0.85–0.92`: manual review bucket.
- `< 0.85`: keep distinct.

### Canonical preset selection
Pick the centroid style nearest to:
1) most frequent usage,
2) closest to brand token set,
3) lowest exception count.

### UX for approval
Show side-by-side diff with changed properties and projected impact (# instances affected).

## 4. Structural vs Site-Specific Content Classification
Use a 3-class system:

1. **Structural Block** (keep static template skeleton)
   - Section patterns like Hero, Services Grid, Team Section frame.
2. **Token Field** (single-value replaceable)
   - Business name, headline, CTA label, phone.
3. **Collection Field** (repeaters)
   - Team bios, testimonials, accepted insurances, service cards.

### Classification logic
- Rule-based heuristics first (module type + lexical patterns + placement).
- LLM only for ambiguous text classification.
- Human override is final and stored as template metadata for reuse.

---

## PHASE 2 — Intake Form & Brand Schema

## 1. ABA-first Intake Schema (Extensible)

### A. Business Identity
- Legal name, DBA, tagline, brand voice.
- NAP (name/address/phone), multi-location support.
- Hours, call tracking number, primary CTA target.

### B. ABA Practice Profile
- Ages served (e.g., 18 months–21 years).
- Service models (in-home, clinic, school, telehealth).
- Programs (early intervention, social skills groups, parent training).
- Intake process steps.
- Insurance accepted (payer list + private pay + Medicaid flags).
- Service areas (city/county/radius).

### C. Trust & Compliance Content
- Clinical leadership credentials.
- Licensing and accreditation fields.
- HIPAA/privacy policy links.
- Crisis disclaimer/non-emergency notice.

### D. Brand System
- Color tokens (primary/secondary/accent/neutrals/background/success/warning).
- Typography (heading/body/fallback stack).
- Logo pack (svg/png, light/dark variants, favicon).

### E. Conversion Content
- Hero value proposition.
- Top 3 differentiators.
- Primary + secondary CTA copy.
- FAQ list.

### F. Social Proof
- Testimonials, outcomes language, review excerpts.
- Case snippets (de-identified).

### G. Team Data (repeater)
- Name, credentials, role, bio, photo, specialties.

### H. Media Assets
- Hero images, facility photos, team photos, alt text, usage rights confirmation.

## 2. Non-Technical Form UX (Progressive Disclosure)

Recommended wizard:
1. Basics
2. Services + Insurance
3. Brand + Logo
4. Team + Testimonials
5. Compliance + Policies
6. Final review

UX principles:
- One theme per step.
- Smart defaults from template profile.
- Conditional questions (only ask telehealth details if enabled).
- Inline examples tuned for ABA practices.

## 3. Token Mapping Model
Use `token_registry` + `template_binding_map`.

- `token_registry`: global canonical token definitions.
- `template_binding_map`: maps template node paths to token IDs.

This allows:
- Template-specific subsets.
- Backward compatibility for new intake fields.
- Safe migrations when tokens are renamed.

---

## PHASE 3 — Generation Engine

## 1. Population Pipeline (Deterministic)
1. Validate intake payload against schema version.
2. Load template bundle + binding map.
3. Resolve tokens to values (with fallback chain).
4. Populate globals (colors/fonts) first.
5. Materialize presets referencing global tokens.
6. Populate content nodes + repeaters.
7. Resolve assets and generate responsive renditions.
8. Run quality gates (cleanliness + performance).
9. Produce export package + review snapshot.

## 2. Global Colors and Fonts Handling
- Write all brand colors to Divi 5 global color storage keys.
- Bind preset properties to global tokens, not raw hex.
- Set typography globals for heading/body scales.
- Enforce “no direct style literal” rule during compile.

## 3. Image and Asset Strategy

### Input states
- **Provided asset**: use directly after optimization.
- **Missing required asset**: insert approved placeholder + warning badge in review.
- **Missing optional asset**: collapse optional modules or use fallback variant.

### Processing
- Auto-generate responsive sizes + WebP/AVIF variants.
- Enforce max dimensions/size budgets.
- Require alt text; generate draft alt with AI then require approval.

## 4. Core Web Vitals Optimization Gates
Before export, run automated checks:
- Image weight budget per page.
- Font loading policy (preload primary, swap strategy).
- Module count and DOM depth thresholds.
- Unused preset/global detection.
- Zero-inline-style assertion.

If gates fail, output is “Draft Export” only with actionable fixes.

---

## PHASE 4 — Review Dashboard & Export

## 1. Review Experience

### Required screens
1. **Site Overview**: pages, templates, unresolved warnings.
2. **Design System**: colors, fonts, presets (with usage counts).
3. **Page Preview**: per-page render with inline token inspector.
4. **Content Tables**: team/testimonials/services data grids.
5. **Diff Panel**: compare generated output vs template baseline.

### Override model
- Any override is tracked as a delta patch (not destructive edits).
- User can promote override back into template (Builder feedback loop).

## 2. Export Package Contents
- Divi 5 layout/theme builder JSON.
- Global design system JSON (colors/fonts/presets).
- Media bundle (optimized + manifest).
- Token resolution report.
- Style Guide page JSON (preset/color/type specimens).
- Install script/instructions.
- QA report (CWV estimates + cleanliness score).

## 3. Round-Tripping Strategy
Hard problem: preserving mapping after manual WP edits.

Recommended approach:
1. WP connector pulls Divi 5 objects + metadata hashes.
2. Compare against last exported manifest.
3. Classify edits:
   - safe content edits,
   - safe token/preset edits,
   - structural drift.
4. Present merge UI:
   - “Apply to this project only” or
   - “Promote back to template vNext”.

Trade-off: full auto-merge is risky; require explicit human approval for structural changes.

---

## PHASE 5 — Stack & LLM Integration

## 1. Stack Recommendation (single best choice)

### Recommended: Hybrid
- **Frontend**: React + Next.js
- **Backend**: Python FastAPI
- **Queue**: Celery + Redis
- **DB**: Postgres
- **Object storage**: S3-compatible
- **WP plugin**: thin connector for Divi 5 API bridge

Why this over plugin-only:
- Better workflow UX, versioning, batch processing, and auditability.
- Keeps heavy parsing/transforms out of WP request lifecycle.

## 2. LLM vs Deterministic Boundaries

### Deterministic only
- Shortcode parsing.
- CSS cascade resolution.
- Schema transforms.
- Token replacement and export compilation.

### LLM-assisted
- Naming suggested preset groups.
- Ambiguous structural/content classification.
- Normalizing free-text intake answers into schema fields.
- Draft copy variants for placeholders.

Guardrails:
- LLM outputs must match strict JSON schema.
- Deterministic validator is source of truth.
- No direct LLM write to final Divi payload.

## 3. Divi 5 API Integration Pattern
- Implement `Divi5Adapter` abstraction:
  - `read_globals()`, `write_globals()`
  - `read_presets()`, `write_presets()`
  - `read_templates()`, `write_templates()`
- Use adapter versioning for Divi 5 schema evolution.
- Include compatibility tests per supported Divi release.

## 4. GoHighLevel (GHL) Integration
Recommended scope:
- Use GHL forms/workflows for lead capture and intake kickoff.
- Sync submission into Forge Intake Service via webhook.
- Do **not** use GHL as generation runtime; keep compile/export in Forge.

Why: GHL is great for funnel intake automation, not deterministic design-system compilation.

---

## Hardest Engineering Problems (Flagged)
1. **CSS intent recovery from messy Divi 4 + child theme overrides**
   - Mitigation: strict cascade engine + exception registry.
2. **Reliable round-trip merge from manual Divi 5 edits**
   - Mitigation: manifest hashes + explicit merge UI + semantic diffing.
3. **Preset over-merge risk (destroying intentional variants)**
   - Mitigation: conservative thresholds + human approval bucket.
4. **Keeping templates vertical-specific but reusable cross-vertical**
   - Mitigation: layered schema (core + vertical extension).

---

## 90-Day Implementation Plan

### Sprint 1–2
- Divi 4 parser + cascade resolver + Design IR.
- Basic dedupe clustering + review queue.

### Sprint 3–4
- Tokenized template bundle + template library versioning.
- ABA intake schema + progressive form wizard.

### Sprint 5–6
- Generation engine + Divi 5 adapter + export package.
- Style Guide auto-generation.

### Sprint 7–8
- Review dashboard overrides + QA gates.
- WordPress connector plugin MVP.

### Sprint 9–10
- Round-trip pull + merge assistant.
- GHL webhook ingestion.

Success metric: first client site generated and exported in <30 minutes end-to-end from completed intake.

---

## Immediate Next Deliverable (Recommended)
Create two machine-readable specs next:
1. `intake_schema.aba.v1.json` (full field definitions + validation)
2. `forge_template_bundle.v1.json` (tokenized template contract)

Those two specs will lock the Builder ↔ Generate interface and eliminate most downstream rework.
