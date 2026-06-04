# Yukti — Design and Testing Document

> Capstone deliverable. This document explains the design and architecture decisions
> behind Yukti and the testing approach used to verify it.
>
> **Note to self:** Sections marked **[FILL IN]** are things only you can complete
> (your real test counts, your deployment URL, etc.). Everything else is drafted.
> The checklists in the Testing and Deployment sections are your to-do list — work
> through them one line at a time.

---

## 1. What Yukti is

Yukti is a clinical decision support tool for emergency department clinicians managing
early pregnancy presentations. A clinician enters what they know about a patient
(dating, ultrasound findings, clinical picture), and Yukti guides them through the
relevant pathway — early pregnancy loss, medication abortion, contraception — surfacing
guideline-based recommendations with their sources attached.

It is built as a web application: a React frontend, a Python backend, and a
retrieval-augmented (RAG) knowledge base of clinical guidelines so the tool's answers
are grounded in cited sources rather than generated freely.

---

## 2. Architecture overview

**[FILL IN: confirm or correct this stack description — inferred from the code]**

- **Frontend:** React (component-based UI). Each clinical pathway is its own component
  (e.g. `EPLPathway.jsx`). A top-level `App.jsx` holds shared patient state and renders
  the active pathway.
- **Backend:** Python API server exposing endpoints such as `/api/chat` (the AskYukti
  assistant) and `/api/interpret-us` (parses a pasted ultrasound report into structured
  fields). **[FILL IN: Flask or FastAPI?]**
- **Knowledge base / retrieval:** A ChromaDB vector store holding chunked clinical
  guideline documents. Queries are filtered by clinical pathway so each pathway only
  retrieves relevant sources.
- **Hosting:** **[FILL IN: Render / Railway / other — see Deployment checklist below]**

### High-level data flow

1. Clinician enters patient data in a pathway UI.
2. Shared patient data lives in one state object in `App.jsx`, passed to whichever
   pathway and to the AskYukti assistant.
3. When the assistant is queried, the backend retrieves matching guideline chunks from
   ChromaDB (filtered to the relevant pathway) and returns an answer with its sources.
4. The pathway UI applies its clinical logic to the entered data and displays a
   recommendation with citations.

---

## 3. Design decisions and the reasons for them

> This section is what the rubric most rewards: the patterns used and *why*.

### 3.1 Single shared state object ("state hoisting")

**Decision.** All shared patient data (dating, ultrasound findings, pregnancy intention)
lives in one state object at the top level (`App.jsx`), passed down to each pathway and
to the assistant, rather than each pathway holding its own copy.

**Why.** A clinician often moves between pathways for one patient (e.g. starting in EPL,
then realizing it's a medication abortion case). Holding the data once, at the top, means
nothing is re-entered when they switch — the data follows the patient, not the screen.
It also gives the assistant the same patient context the pathway sees. This is the
standard "lift state up" React pattern; the reason here is clinical-workflow continuity.

### 3.2 Pathway-scoped retrieval with per-pathway metadata flags

**Decision.** Each document chunk in the knowledge base carries boolean metadata flags
for the pathways it belongs to (e.g. `pathway_epl: true`, `pathway_mab: true`), and
retrieval filters on those flags. A human-readable `pathways` string (e.g. `"mab,epl"`)
is kept alongside for display and debugging.

**Why.** A clinician asking an EPL question should not get medication-abortion sources
mixed in. Earlier the system stored pathways as a single joined string and filtered with
exact-match, which silently excluded any document tagged to more than one pathway — a
real retrieval bug. The fix was per-pathway boolean flags, because the vector store's
filtering does not reliably support substring matching on a combined string. This is a
standard pattern for multi-valued metadata in vector databases; the reason here was a
concrete bug where multi-pathway documents were invisible to retrieval.

### 3.3 Sourced answers and "no grounded source" honesty

**Decision.** The assistant attaches the source (name, year, page) to its answers, and
when retrieval returns nothing above a relevance threshold, it says so rather than
answering anyway. Superseded guidelines are flagged and filtered out of normal results.

**Why.** A clinician cannot act on, or defend, an unsourced recommendation at the point
of care. For a clinical tool, refusing to answer when there is no grounded source is a
safety feature, not a gap — a confident answer with no basis is worse than none. Filtering
superseded guidance (e.g. an older practice bulletin replaced by a newer one) prevents the
tool from ever presenting outdated criteria as current.

### 3.4 "Suggest and confirm" routing, never silent auto-routing

**Decision.** The entry screen recommends a pathway based on the entered data but always
shows *why* and lets the clinician override; it never silently decides.

**Why.** Early pregnancy presentations are genuinely ambiguous, and routing depends on
clinical judgment (e.g. the same ultrasound finding routes differently depending on
whether the pregnancy is desired). A tool that decides for the clinician and is wrong is
more dangerous than one that proposes and explains. The routing logic is kept in one
clearly-marked place pending clinical review rather than scattered through the UI.

### 3.5 "Unverified — confirm" state for any data the clinician didn't type directly

**Decision.** Any field populated by the system — parsed from a pasted ultrasound report,
or carried over from the entry screen — is shown in an explicit "unverified, confirm"
state rather than treated as if the clinician entered it.

**Why.** Auto-populated data can be wrong (a misparse, a carry-over that no longer
applies). Forcing explicit confirmation prevents a clinician from unknowingly acting on
data they didn't vet.

### 3.6 Dating as orientation, not a hard gate (EPL pathway)

**Decision.** The EPL pathway does not require a precise gestational age to proceed. The
clinician can enter LMP, an ultrasound estimate, or mark dating as uncertain, and still
continue. A soft check flags presentations that look beyond the first trimester.

**Why.** EPL is often exactly the situation where dating is uncertain. The diagnosis is
driven by the ultrasound findings, not by a gestational-age number — so blocking on a
precise GA would stop a valid workup. Gestational age orients the clinician and provides
a boundary check; it is not the basis of the diagnosis.

---

## 4. Testing

> This is your testing methodology, written down. Work through the checklist to build it out.

### 4.1 Testing approach (the methodology)

Yukti's testing combines two methods, each guarding a different kind of error:

- **Automated unit tests on the clinical logic.** The core diagnostic logic (e.g.
  classifying an ultrasound finding as a definitive loss, probable loss, or
  indeterminate) is extracted into pure functions and tested with known inputs and
  expected outputs. Each test encodes a clinical rule from a source (SRU 2013 / ACOG
  PB 200 / Doubilet 2013) and verifies the code keeps matching that rule.

  *What these tests do and don't cover:* they verify the **code** correctly implements
  the **encoded** thresholds. They do **not** verify the thresholds themselves are
  clinically correct — that is established by the cited sources and by clinical review.
  Each test was validated by deliberately breaking the code (e.g. changing the 7mm CRL
  threshold to 6mm) and confirming the test caught it, so a passing test is meaningful.

- **Structured manual testing.** Each pathway is manually walked through a defined set of
  scenarios, with expected vs. actual behavior recorded (see the manual test plan below).
  Manual testing covers the UI flow and end-to-end behavior that unit tests don't.

### 4.2 Automated tests — build checklist

Work through these in order. You've already done step 1 once as a demo.

1. [ ] **Extract the EPL diagnostic logic into a pure function.** Pull the
   classification logic out of `EPLPathway.jsx` into a standalone function like
   `classifyEPL({ crl, msd, cardiac, noEmbryo })` that returns the impression. The
   component calls this function; the tests call it too.
2. [ ] **Install a test runner.** Use Vitest (works well with React projects):
   `npm install -D vitest`. Add `"test": "vitest run"` to the `scripts` section of
   `package.json`.
3. [ ] **Write test cases for the clinical rules**, one per sourced threshold:
   definitive loss (CRL ≥7mm + no cardiac; MSD ≥25mm + no embryo), the below-threshold
   cases that should *not* be definitive, probable loss (MSD–CRL <5mm), and the
   indeterminate fallback. Aim for ~10–15 cases.
4. [ ] **Run them:** `npm test`. Confirm all pass.
5. [ ] **Validate the tests catch real bugs.** Temporarily change one threshold in the
   code, run the tests, confirm the relevant one fails, then revert. This proves the
   tests check something. (Document that you did this — it's part of the methodology.)
6. [ ] **(Optional, higher score) Extract and test the routing logic** the same way once
   it's finalized after clinical review.
7. [ ] **(Optional) A retrieval test:** query the knowledge base for a pathway and assert
   that a known multi-pathway document is returned — this guards the boolean-flag fix.

### 4.3 Manual test plan

**[FILL IN: walk each pathway and record results in this table as you go.]**

| Pathway | Scenario (inputs) | Expected behavior | Actual | Pass? |
|---|---|---|---|---|
| EPL | CRL 8mm, no cardiac activity | Definitive early pregnancy loss | | |
| EPL | CRL 6mm, no cardiac activity | Not definitive; indeterminate / repeat scan | | |
| EPL | MSD 26mm, no embryo | Definitive early pregnancy loss | | |
| EPL | Dating uncertain selected | Can proceed; diagnosis from US findings | | |
| EPL | Entered GA beyond first trimester | Soft warning to confirm pathway | | |
| AskYukti | Question with no matching source | "No grounded source" response, not a guess | | |
| AskYukti | EPL question | Answer with EPL source cited (name, year) | | |
| ... | **[FILL IN more]** | | | |

---

## 5. Deployment

> Goal: get Yukti onto a free hosting service so it's reachable by a link.
> The rubric requires this for a web application.

### Deployment checklist

**[FILL IN as you go. Render is suggested below because its free tier handles a
frontend + Python backend straightforwardly; Railway is an equivalent alternative.]**

1. [ ] **Decide the hosting service.** Suggested: Render (render.com), free tier.
2. [ ] **Make sure the app runs from a clean checkout** of your GitHub repo on your own
   machine first — i.e. someone could clone it and start it with documented commands.
   Write those start commands in your repo's README.
3. [ ] **Create an account** on the hosting service and connect your GitHub repo.
4. [ ] **Deploy the backend** (the Python API) as a web service. Note the build command
   (e.g. `pip install -r requirements.txt`) and the start command. **[FILL IN]**
5. [ ] **Deploy the frontend**, pointed at the backend's URL. **[FILL IN]**
6. [ ] **Handle the knowledge base / ChromaDB in the deployed environment.** This is the
   one part that needs thought: confirm where ChromaDB's data lives in production and that
   it's populated (the documents are ingested) after deploy. **[FILL IN — this is your
   noted open question; resolve it here.]**
7. [ ] **Test the live link** end to end — open it fresh, walk a pathway, ask the
   assistant a question, confirm sources come back.
8. [ ] **Put the live link in your README and in the repo**, as the rubric requires.

---

## 6. Remaining capstone deliverables (tracking)

Not part of design/testing, but listed so it's all in one place:

- [ ] Share the GitHub repo with the `quantic-grader` account.
- [ ] Ensure code is documented (README with what it is, how to run, the live link).
- [ ] Task board (Trello or similar) showing user stories and tasks, linked from the repo.
- [ ] CI/CD: a GitHub Actions workflow that runs `npm test` on each push. **[FILL IN]**
- [ ] Recorded 15–20 min demo walking through the working, deployed tool.
- [ ] This design-and-testing document, completed (remove the [FILL IN] markers).

---

*Sources grounding the clinical logic referenced above: Society of Radiologists in
Ultrasound (2013); ACOG Practice Bulletin No. 200, Early Pregnancy Loss (2018, reaffirmed
2025); Doubilet et al. (2013).*
