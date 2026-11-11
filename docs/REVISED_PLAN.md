# FindIt AI — Revised Plan (approved changes)

## Decisions locked in

1. **AI path:** Mocked match UI first (Phase 1–4), then real models.
2. **Detection:** Open-vocabulary detector (YOLO-World or OWL-ViT) using item name as text prompt. COCO YOLO kept only as a baseline comparator — not primary (wallets/keys/earbuds/ID cards/glasses are missing from COCO).
3. **Similarity:** Evaluate OpenCLIP ViT-B/32 **and** DINOv2 on our eval set; pick the winner empirically.
4. **Threshold:** Calibrate on evaluation data. Do not hard-code 0.28–0.32 (that range is text–image CLIP folklore, not image–image cosine).
5. **UI scores:** Show bands only — Strong possible match / Possible match / Weak match. Raw score lives in expandable technical details.
6. **References:** Crop/select-object step; 2–3 reference photos; gallery + online product image supported.
7. **Match alerts:** Require 2–3 consecutive above-threshold frames; vibration + sound; “move closer” guidance for small objects.
8. **Evaluation deliverable:** 20–30 items incl. look-alikes; precision/recall; threshold selection; CLIP vs DINOv2 comparison.
9. **DB:** Defer Postgres to Phase 7 (search history + confirm/reject feedback for tuning).
10. **Hosting:** Local first; later Vercel (frontend) + Hugging Face Spaces Docker (backend).
11. **Demo devices:** Android Chrome + laptop webcam first; iOS Safari later; plan HTTPS for local phone testing before camera phase.
12. **Still-image fallback:** Yes.

## Phase map (updated)

| Phase | Focus |
|-------|--------|
| 0 | Discovery (done) |
| 1 | React UI + routing + mocked scan flow (this phase) |
| 2 | Frontend polish: validation edge cases, empty/error states |
| 3 | FastAPI skeleton + mock scan API |
| 4 | Production camera frame pipeline + HTTPS local phone testing |
| 5 | Open-vocab detection (+ COCO YOLO baseline) |
| 6 | CLIP vs DINOv2 eval, calibrated bands, stable-frame alerts |
| 7 | Postgres history + feedback logs |
| 8 | Testing / bugfix |
| 9 | Deploy (Vercel + HF Spaces) + docs |

## Visual direction

Cool slate + amber spotlight; Syne (display) + DM Sans (body); mobile-first; match sheets over camera; no raw % as primary UI.
