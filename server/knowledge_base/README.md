# Knowledge Base

This folder contains the approved clinical source documents that power Yukti's AI responses.

All documents placed here must be:
- Reviewed and approved by clinical leadership before ingestion
- Traceable to a named source (guideline, protocol, or policy document)
- Versioned — include the publication or effective date in the filename

Supported formats: PDF, plain text (.txt)

No AI response will be generated from content outside this folder.

## Ingestion

Run the ingestion script (to be implemented) to chunk, embed, and index documents into the vector store:

```bash
python ingest.py
```
