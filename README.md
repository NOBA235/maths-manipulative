# Math Manipulative Verifier

A mobile-first math learning app that connects physical, hands-on activities with
AI-assisted verification. Learners complete a mission using everyday objects,
predict the result, photograph their work, and receive structured feedback.

The app includes eight missions across addition, subtraction, multiplication,
division, fractions, geometry, and measurement. Progress, XP, streaks, badges,
and concept mastery are stored locally in the browser.

## Features

- Eight grade 2-4 hands-on math missions
- Native mobile camera and photo upload support
- Gemini 2.5 Flash image analysis
- Structured JSON responses with mission-specific schemas
- Deterministic app-side correctness checks
- Correct, incorrect, and retake feedback states
- XP, streaks, badges, completion tracking, and concept mastery
- Browser-only progress storage with no database or account required
- Responsive interface with motion and accessible controls

## Technology

- [Next.js 15](https://nextjs.org/) with the App Router
- React 19 and TypeScript
- Tailwind CSS
- Framer Motion
- Google Gen AI SDK (`@google/genai`)
- Gemini 2.5 Flash
- Lucide icons

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` using `.env.example` as a template:

   ```env
   GEMINI_API_KEY=your_api_key
   GEMINI_MODEL=gemini-2.5-flash
   ```

   `GEMINI_MODEL` is optional. The application defaults to
   `gemini-2.5-flash`. `GOOGLE_API_KEY` is also accepted as a fallback.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

The API key is read only by the server-side verification route and is not
included in the browser bundle.

## How It Works

1. The learner selects a mission and reads the physical activity.
2. They enter a prediction before submitting their work.
3. They take or upload a photo of the completed manipulative.
4. The browser sends the photo, mission ID, and prediction to `/api/verify`.
5. Gemini analyzes the image and returns mission-specific JSON.
6. The app compares that structured result with the mission's target.
7. A confident match awards XP and records progress in `localStorage`.
8. Ambiguous photos request a retake without counting as an attempt.

Gemini does not decide correctness through free-form prose. It reports
observable values such as object count, array dimensions, equal group sizes,
fraction parts, angle estimate, or ruler reading. The application performs the
final comparison against the stored target specification.

## Included Missions

| Concept | Mission | Target |
| --- | --- | --- |
| Addition | Combine Two Piles | Combine 7 and 8 objects to make 15 |
| Subtraction | Leave 9 Behind | Remove objects from 15 until 9 remain |
| Multiplication | Rows of Four | Build a 6 by 4 array |
| Division | Four Equal Piles | Split 20 objects into 4 groups of 5 |
| Fractions | Four Fair Parts | Make 4 roughly equal parts |
| Geometry | Paper Right Angle | Create an angle close to 90 degrees |
| Measurement | Measure a Pencil | Read a pencil length against a ruler |
| Multiplication | Five, Ten, Fifteen | Make 5 groups of 5 |

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create and type-check a production build |
| `npm run start` | Serve an existing production build |
| `npm run lint` | Run the Next.js ESLint checks |
| `npm run test:verifier` | Run prompt and evaluator fixture tests |
| `npm run verify:photos` | Run live Gemini checks against sample photos |

## Testing

### Fixture Tests

The fixture suite does not call Gemini or require an API key:

```bash
npm run test:verifier
```

It checks all eight missions, shared counting prompts, JSON-only prompt rules,
response schemas, confidence handling, and app-side target comparison.

### Live Photo Verification

Create a sample directory with one folder per mission:

```text
sample-photos/
|-- add-7-8/
|-- sub-15-to-9/
|-- multi-6-by-4/
|-- divide-20-by-4/
|-- fraction-fourths/
|-- geometry-right-angle/
|-- measure-pencil/
`-- skip-5-to-25/
```

Add three or four `.jpg`, `.jpeg`, `.png`, or `.webp` files to each folder.
Include at least one messy or ambiguous image to exercise the retake behavior.

Set the API key in the current shell and run the verifier:

```powershell
$env:GEMINI_API_KEY = "your_api_key"
npm run verify:photos -- sample-photos
```

On macOS or Linux:

```bash
GEMINI_API_KEY="your_api_key" npm run verify:photos -- sample-photos
```

Live verification sends each sample image to the Gemini API and prints the
evaluation status, observed result, and required target.

## Project Structure

```text
app/
|-- api/verify/route.ts       Server-side photo verification endpoint
|-- globals.css               Global Tailwind styles
|-- layout.tsx                Metadata and root layout
`-- page.tsx                  Application entry page
components/
`-- MathVerifierApp.tsx       Missions, capture flow, feedback, and progress UI
lib/
|-- evaluate.ts               Structured result comparison
|-- geminiVision.ts           Gemini image request and JSON parsing
|-- missions.ts               Mission definitions and target specifications
|-- progress.ts               localStorage progress and rewards
`-- prompts.ts                Vision prompts and response schemas
scripts/
`-- verify-sample-photos.ts   Live sample-photo runner
tests/
`-- verifier.test.ts          Prompt and evaluator fixtures
public/
`-- manipulatives.svg         Application visual asset
```

## Privacy and Data

- The app has no database, user accounts, or server-side progress history.
- Learning progress is stored in the current browser using `localStorage`.
- Submitted photos pass through the Next.js API route and are sent to the
  configured Gemini API for analysis.
- The application does not intentionally persist uploaded photos.
- Clearing browser storage resets local progress.

Review Google's Gemini API data-use terms before using the app with learners or
deploying it in a school environment.

## Verification Limitations

Image verification depends on lighting, focus, camera angle, object separation,
and ruler visibility. The prompts require Gemini to return `confident: false`
when the relevant evidence cannot be read reliably. Learners should then retake
the photo with a clearer overhead view.

AI output is treated as an observation, not an unquestioned answer. The server
parses structured JSON, and the evaluator validates those values against the
mission target before awarding progress.
