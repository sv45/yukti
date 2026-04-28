# Approved Clinical Source Documents

This folder contains the approved clinical source documents that are ingested into Yukti's knowledge base.

## Rules — read before adding any file

1. **Clinician approval required.** Every document must be reviewed and explicitly approved by a licensed clinician (physician or advanced practice provider) before it is placed here. Do not add documents speculatively.

2. **Approved formats only.** Supported file types: `.pdf`, `.txt`. Do not add Word documents, spreadsheets, images, or HTML files.

3. **Approved source list only.** Only documents from the following source categories may be added:
   - ACOG (American College of Obstetricians and Gynecologists) Practice Bulletins and Committee Opinions
   - ACEP (American College of Emergency Physicians) Clinical Policies
   - Society of Family Planning (SFP) Clinical Recommendations
   - Institution-specific ED protocols reviewed and signed off by the OB/GYN department
   - Any source explicitly added to this list by the clinical lead

4. **No internet content.** Do not copy-paste content from websites, UpToDate, or other secondary sources directly into text files. Use primary source PDFs only.

5. **Filename convention.** Use descriptive, lowercase, hyphenated filenames that include the source and year:
   - `acog-practice-bulletin-200-epl-2018.pdf`
   - `nypq-ed-protocol-epl-2025.pdf`
   - `sfp-medication-abortion-2023.pdf`

## After adding documents

Run the ingestion script from the `/server` directory:

```bash
# National guidelines
python knowledge_base/ingest.py --source-type national_guideline --pathway epl ectopic

# Institutional protocols
python knowledge_base/ingest.py --source-type institutional_protocol --institution nypq --pathway epl contraception
```

This will chunk, embed, and index the documents into ChromaDB. Do not query Yukti until ingestion has been run.
