# Project Objective: The Feynman Protocol

**"If you can't explain it simply, you don't understand it well enough."** — Richard Feynman

## Core Philosophy
This application is a **reverse-tutor**. Instead of an AI teaching the user, **the user teaches the AI**.

The user (student) explains a complex topic to a 3D Persona (The Student/Novice). A "Meta Judge" (The Coach) silently observes the explanation, grading it on clarity, jargon usage, and analogy quality in real-time.

## The Loop (The "Meat")
1. **Explain**: User explains a concept via voice.
2. **React**: The 3D Persona reacts (confused, nodding, asking "Why?").
3. **Judge**: The Meta Judge analyzes the transcript.
   - Too much jargon? -> "Too technical!"
   - Good analogy? -> "Great comparison!"
   - Knowledge Gap? -> "I don't get X part."
4. **Iterate**: The user simplifies and tries again until the Persona "understands".

## Technical Pillars
- **Real-time Voice**: WebRTC / OpenAI Realtime API for natural, zero-latency flow.
- **3D Emotion**: Rive / Three.js persona that mirrors the "understanding state".
- **Feedback Engine**: LLM-based Judge that scores explanations (Knowledge Debt).
- **Secondary Text**: Chat UI is secondary/fallback. Voice is primary.

## Architecture
- **Frontend**: Next.js, Framer Motion, Zustand.
- **Backend**: Next.js API Routes (Proxy to OpenAI), Postgres (Session History).
- **Testing**: Vitest, MSW (Mocking), Docker (Postgres).
