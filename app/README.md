# Tend

A "How We Feel"-style companion for people living with and after cancer.

- **Check in**: energy x pleasantness mood meter, cancer-specific tags, distress thermometer
- **Steep**: synthesized Web Audio sound bath (drones, singing bowls, ocean, binaural, type-to-ring)
- **Talk**: Claude Opus 5.5 companion with layered patient-safety guardrails
- **Insights**: AI reflections over your check-in history
- **Circle**: Together tier (survivor circles, group steeps, buddy)
- **Care team portal** (`#care`): CHW + therapist dashboard with risk triage, social needs, AI pre-visit briefs

## Run

    cp .env.example .env.local   # add ANTHROPIC_API_KEY
    npm install
    npm run dev
    npm run test:guard           # guardrail pattern tests

Guardrails live in `server/guardrails.ts`: crisis/urgent-symptom input screening returns fixed, human-written responses (988 / oncology line), and an output screen blocks medication, dose, supplement, and cure claims.
