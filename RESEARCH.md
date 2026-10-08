# Research: Mood check-in + sound bath app for cancer patients & survivors

_Quick scan, 2026-10-08. Demo/MVP framing. Not clinical or legal advice._

## 1. creativesteeping.com (inspiration for the sound bath)

**What it is:** "CREÅTIVE STEEPING — A Journey to the Essence of Your Flavor." Made by THE ALIEN SCHOOL (founder Kamau Zuberi Akabueze, "KzA"). It is a contemplative creative self-inquiry practice with a tea metaphor, not a clinical or wellness app. Tagline: "Where Do You Find Your Self?" The pitch is "Seven Steeps, nine vessels, one question."
- **Framework:** the Seven Steeps are Essence, Mosaic, Summits, Mirror, Labyrinth, Conclave, Crown Jewels. The world is called the "Steeperverse."
- **Vessels:** each "Hexagong" is a six-sided vessel/chapter. There are nine, numbered 00 through 08, and each one holds a writing field ("Your Architecture") where reflections are saved.
- It is a React SPA built with Vite. The plain page HTML is just a shell; I got the details below by grepping its JS bundle.

**Sound offering: the "Sonnet Engine" ("Sonic Inkwell")**
- The core idea is that **your keystrokes and clicks become gong strikes**: "Your words become gong strikes in this signature sound bath." Writing is turned into sound in real time.
- It has three harmonic systems, and the user's steep picks which one plays:
  - **C Major Pentatonic tuned to A=444Hz**, so C5 lands on **528Hz** (which the site calls "the Miracle Tone")
  - **174Hz Solfeggio Foundation scale**, which the site associates with "pain relief and grounding" (that is the site's claim; see section 3)
  - **176Hz "Deep Desert" scale**, KzA's own tuning
- Other tones: an interactive **220Hz "Root Foraging Tone"** with an "[ INITIATE 220Hz WATER SEARCH ]" button, described as "deep, slow acoustic seeking that floods the stereo field." It also mentions 10–240Hz "root clicks."
- An essay called **"The Sound of Becoming"** argues that 528Hz writing sonification engages the vagus nerve and that keystrokes act as bilateral stimulation. It also mentions L-theanine and alpha waves (8–14Hz).
- **Web Audio implementation (from the bundle):** about 23 oscillators, mostly `sine` with some `triangle`. 14 BiquadFilters (bandpass, Q≈1.4, with an exponential frequency sweep from f×9 down to f×2.2, which gives a gong/strike character). One ConvolverNode for reverb. StereoPanners for spatial movement. Looped noise buffers. Strike envelopes use a fast linear attack and an exponential decay of about 0.2s. **This is a good recipe to copy.**
- Not found in the bundle: 396Hz, 432Hz, singing bowls, binaural beats, or named timed sessions.

**Visual style**
- Very dark, cosmic and ritualistic. The OG image is "a matte black teapot in darkness, steam rising into a galaxy."
- Default background `#050505`/`#090500`. The main accent is **amber gold `#d4922a`**, with cream `#fff3dc`.
- It has five theme modes:
  - Incandescent: gold `#d4922a` on `#090500`
  - Oceanic: cyan `#38bdf8` on `#00080a`
  - Emergent: grey `#e5e5e5`
  - Planetary: magenta `#ff00ff` on `#050008` (this mode also shifts the scale to the 176Hz base)
  - Dark Matter: steel `#6b7280` on `#000`
- Fonts: **EB Garamond** and **Playfair Display** (serif display), **DM Mono** (labels in the style `[03.A] 528HZ TUNING`), and **Atkinson Hyperlegible** (body text, chosen for accessibility).
- UI motifs: bracketed mono labels, `::` separators, button text like "[ INITIATE … ]", and slow glows.

**What to borrow:** the dark gold-on-black palette, Atkinson Hyperlegible for body text (it suits patients with chemo-related vision or cognitive issues), sine plus bandpass-filtered noise strikes run through a convolver, mood quadrant mapped to a scale, and taps on the canvas triggering soft gong strikes.

## 2. Competitive scan: what to borrow

- **How We Feel** (Yale, Marc Brackett): a mood meter with two axes, energy and pleasantness. Quadrants: red (high energy, unpleasant), blue (low energy, unpleasant), green (low energy, pleasant), yellow (high energy, pleasant). It has 144 emotion words.
  - Borrow: (1) a check-in flow of quadrant, then word, then context tags (who/where/what), then an optional note; (2) a **"Stay or Shift"** choice that leads to strategy cards grouped as Change Your Thinking / Move Your Body / Be Mindful / Reach Out; (3) pattern reports over time and sharing with friends.
- **Headspace:** short guided sessions on a daily streak, plus a playful, calm illustration style. Borrow the "Today" card with one recommended action.
- **Calm:** Sleep Stories and soundscapes with a timer, plus a "Daily Calm." Borrow a sleep timer with fade-out for the sound bath, since insomnia is common after treatment.
- **Insight Timer:** a customizable meditation timer with interval bells and ambient layers, and live group sessions. Borrow interval bells and a live group sound bath at a scheduled time for the community tier.
- **Bearable:** correlates symptoms with mood and factors (sleep, meds, activity). Borrow simple correlation insights, e.g. "low-energy days follow poor sleep," and custom symptom tags such as fatigue, neuropathy, chemo brain, and scanxiety.
- **Belong.Life:** a cancer community app with an AI mentor ("Dave") that explains medical documents, matches trials, and helps users talk to their providers. It includes a disclaimer that the AI "may provide incorrect answers." Borrow community feeds split by diagnosis and stage, an AI disclaimer that is always visible, and a "questions for my care team" export.
- **Cancer Survivors Network (ACS):** discussion boards by cancer type, plus survivor-to-survivor peer support. Borrow topic boards (Fear of Recurrence, Post-Treatment Life, Caregivers) and moderated peer replies.
- **Untire:** a CBT/mindfulness program for cancer-related fatigue. It has a daily program, weekly energy reports, an invite-a-buddy feature, and a community. Borrow an **energy check-in** next to mood, a weekly report, and inviting a support buddy.
- **Wysa:** AI chat with an **always-visible SOS button** that leads to local helplines, a personal safety plan, and grounding exercises. Its AI flagged 82% of confirmed crisis cases. In its data only 2.4% of users called a helpline when prompted, and 49% used their **safety plan**. Borrow an SOS button in the header, a self-built safety plan, and risk flags that go to a human reviewer (its Copilot product does this for therapists).

## 3. Patient-safety guardrails for an AI companion (oncology mental health)

**Screening anchors (validated and familiar to clinicians)**
- **NCCN Distress Thermometer:** 0–10 scale. A score of 4 or higher means a referral is recommended. Use it as a weekly check-in slider plus a problem list (practical, family, emotional, physical).
- **PHQ-2 / GAD-2** as quick screens. PHQ-9 item 9 asks about thoughts of self-harm, so any score above 0 triggers the crisis flow. The Columbia (C-SSRS) screener is used for follow-up risk questions.

**Crisis detection: trigger the safety flow on**
- Suicidal ideation or self-harm language: "want to die," "end it," "no point continuing," "better off without me," "kill myself," "hurt myself," "stockpiling pills," plans, means, or timelines.
- **Oncology-specific passive SI:** "stop fighting," "stop treatment so it ends," "what's the point if it comes back." Separate an informed treatment decision from hopelessness. Flag it gently, don't alarm the user, and route to a human.
- Medical red flags, routed to the **oncology team or 911, not just 988**: fever of 100.4°F (38°C) or higher during chemo (possible neutropenic fever), chest pain, trouble breathing, uncontrolled bleeding, new confusion, severe uncontrolled pain.
- Abuse or interpersonal safety risk. Acute substance overdose goes to 911.
- Use a layered approach: a keyword/regex prefilter, then an LLM classifier, then a **fail-safe default that shows resources whenever unsure**. Log every flag to the CHW/therapist queue.

**Crisis response (fixed script, not generated text)**
- "I'm really glad you told me. You deserve support right now. You can **call or text 988** (Suicide & Crisis Lifeline, US, 24/7) or chat at 988lifeline.org. Veterans: dial 988 then press 1. If you're in immediate danger, call 911."
- Also list Crisis Text Line: **text HOME to 741741**.
- Offer: open my safety plan, start a grounding exercise (5-4-3-2-1, paced breathing), or notify my care contact or CHW (with consent).
- Never leave the user at a dead end. Don't argue, don't moralize, and keep it short.

**The AI must NOT**
- Advise stopping, skipping, or changing any medication (chemo, hormone therapy such as tamoxifen/AIs, antidepressants, opioids), or give **any dosage** advice.
- Diagnose, whether that means depression, PTSD, or recurrence ("that sounds like your cancer is back"). It must not interpret scans or labs as medical advice.
- Suggest **unproven cancer cures or alternatives** (alkaline diets, high-dose vitamin C, laetrile/B17, ivermectin/fenbendazole, Gerson, "frequency healing" of tumors).
- Recommend supplements or herbs. Known chemo interactions include **St. John's wort** (CYP3A4 inducer that lowers levels of irinotecan, imatinib, and many TKIs), **grapefruit**, high-dose antioxidants during chemo/radiation, and turmeric/curcumin, green tea extract (EGCG with bortezomib), and ginkgo (bleeding risk). The standard answer is to ask the oncology team or pharmacist.
- Promise outcomes, give survival statistics as a prognosis, or claim to be a therapist or human.

**Referral language templates**
- "That's an important question for your oncology team or pharmacist. Want me to add it to your 'questions for my care team' list?"
- "It sounds like a lot to carry. Many survivors find talking with a psycho-oncology counselor or oncology social worker helpful. Would you like help finding one?" (Resources: ACS 1-800-227-2345, CancerCare.)
- Use a persistent footer: "This is a supportive companion, not medical care. In crisis, call or text 988."

**Sound bath claims (important)**
- Frame frequencies as **relaxation, calm, and focus support only**. Use "may help you relax" and "a calming soundscape."
- Never use "heals," "treats," "pain relief," "repairs DNA" (a common 528Hz claim), or "fights cancer." Solfeggio and 432/528Hz claims lack clinical evidence, and the FTC/FDA treat disease claims as health claims.
- Evidence-friendly framing: music and sound interventions have modest evidence for **reducing anxiety** in cancer patients (Cochrane reviews of music interventions). Present the frequencies as "tunings" or "scales," not doses.
- Add a note: "If you have hearing sensitivity (e.g., from cisplatin-related ototoxicity), keep volume low." Default the volume low and fade in.

## 4. Community health worker (CHW) dashboard

**Panel list (one row per patient)**
- Name, cancer type/phase (in treatment / post-treatment / survivorship), assigned CHW, preferred language, and tier (self-guided or community).
- **Check-in adherence:** last check-in date, 7-day and 30-day streak, missed-days flag (e.g., none for 5 or more days).
- **Mood trend:** sparkline of quadrant over time, and share of check-ins in red/blue this week.
- **Distress score** (latest DT, flagged at 4 or more), PHQ-2/GAD-2 results, and a fear-of-recurrence flag near scan dates ("scanxiety").
- **Risk flag status:** Crisis (red), Elevated (amber), Stable. Show the time since the flag and who acknowledged it.

**Social needs (screen using CMS AHC HRSN domains)**
- Transportation to appointments, food insecurity, housing instability, utilities, and interpersonal safety.
- Also financial toxicity (cost of care, lost work), caregiver or childcare gaps, health literacy and language, and digital access.
- Referral status: identified, referred, connected, resolved. Track whether the referral loop is closed.

**Follow-up tasks / workflow**
- A task queue sorted by urgency: crisis flag (same day), DT 4 or higher (within 48 hours), missed check-ins (outreach), open social-need referrals, and upcoming appointments or scans.
- Outreach log: call/text/visit, outcome, and notes. **Lost to follow-up = 3 documented attempts**, a common navigation-program rule.
- Common program timelines: contact in the week of the first oncology visit; follow up within 14 days of diagnosis or 30 days of an abnormal result.
- A monthly patient-reported survey works as an early-warning trigger (as in the Houston CHW model).
- Escalation buttons: "Escalate to therapist/social worker," "Notify oncology nurse."
- Metrics tile: percent screened for social needs, percent of referrals closed, median time to acknowledge a flag, and check-in adherence.

**Therapist/practitioner view (addresses burnout)**
- A pre-session **AI summary of check-ins since the last visit**: mood trend, top emotion words, flags, and patient-chosen notes. This is the pattern of Wysa Copilot and How We Feel sharing.
- Caseload triage: who needs attention this week vs. who is stable. This replaces the idea of reading everything.
- Patient-controlled sharing (choose which notes are visible). Use de-identified data in the demo.

## Sources
- creativesteeping.com (HTML plus JS/CSS bundle inspected directly)
- How We Feel / Mood Meter: marcbrackett.com, commonsensemedia.org, rulerapproach.org
- Wysa: wysa.com/role-of-ai-in-sos, blogs.wysa.io (2024 SOS study), wysa.com/wysa-copilot
- Belong.Life: belong.life/press; Untire: ecancer.org, hcinnovationgroup.com
- CHW: PMC11234663 (social needs screening in navigation), chwcentral.org, ACCC CHI/SDOH billing deck
- Safety: 988lifeline.org, NCCN Distress Thermometer, NCI PDQ on herb-drug interactions (from background knowledge, not re-fetched)
