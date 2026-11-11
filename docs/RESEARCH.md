# FindIt AI — R&D Log

Living research document. Update after every experiment or major decision.  
Do not invent metrics. Untested work is marked **Pending**.

---

## 1. Problem & hypothesis

**Problem**  
People lose small personal belongings (wallets, keys, earbuds, glasses, ID cards, bags). They often have a reference photo (or a product image) and can physically search an area with a phone camera, but visual search tools are not designed for this “find *my* instance in a scene” loop.

**Product constraint**  
The system must surface *possible visual matches* for user confirmation. It must not claim unique physical identification.

**Core technical hypothesis**  
1. An **open-vocabulary detector** prompted with the user’s item name can propose candidate regions for belongings that **COCO-class YOLO misses** (wallet, keys, earbuds, ID card, glasses).  
2. An **image–image embedding model** (CLIP and/or DINOv2) comparing multi-angle cropped references to candidate crops can rank look-alike objects well enough that **calibrated score bands** + **2–3 consecutive-frame stability** yield useful precision for a human-in-the-loop UI.  
3. Requiring the user to **crop the object** and optionally supply **2–3 reference angles** improves instance matching versus a full-scene reference.

**What we are testing**  
- Detector coverage and false boxes on personal belongings.  
- CLIP vs DINOv2 for instance-level ranking on the same crops.  
- Threshold / band selection on a held-out eval set (not folklore text–image CLIP ranges).  
- Temporal stability vs single-frame alerts (false-positive rate).

**Status**  
UI + mocked pipeline only (Phase 1). Real detection/similarity experiments: **Pending**.

---

## 2. Approaches considered

### 2.1 Object detection

| Approach | Pros | Cons | Fit for FindIt |
|----------|------|------|----------------|
| **COCO YOLO (e.g. YOLOv8n)** | Fast, mature, easy baseline; good for bag/book/phone-like classes | **Missing** wallet, keys, earbuds, ID cards, glasses; closed vocabulary | Baseline / comparator only — **not** primary |
| **YOLO-World** | Open-vocabulary; text prompt from item name; YOLO-family speed; strong MVP candidate | Prompt sensitivity; may still miss tiny/occluded items; heavier than nano COCO | **Primary candidate** for live scan |
| **OWL-ViT** | Strong open-vocab detection from vision–language pretraining | Typically slower / heavier for on-device or small HF Spaces RAM; more latency risk | Strong alternative if YOLO-World recall is weak |

**Working plan:** YOLO-World (or equivalent open-vocab YOLO) as default; OWL-ViT as challenger; COCO YOLO kept for ablation (“what closed-set misses”).

### 2.2 Visual similarity (image–image)

| Approach | Pros | Cons | Fit for FindIt |
|----------|------|------|----------------|
| **OpenCLIP ViT-B/32** | Widely used, text+image if needed later, good ecosystem | Trained for semantic alignment; may confuse look-alikes of same category | Must evaluate empirically |
| **DINOv2** | Strong self-supervised visual features; often better for instance / fine-grained appearance | No native text tower; different score scale than CLIP | Must evaluate empirically |

**Working plan:** Run both on the same eval crops; pick winner by precision/recall at calibrated operating points — **Pending**.

**Rejected as MVP primary:** Training a custom detector/re-id model from scratch (no labeled lost-item corpus yet; too slow for student MVP).

---

## 3. Decisions log

| Date | Decision | Reason | Alternatives rejected |
|------|----------|--------|------------------------|
| 2026-11-12 | Ship **mocked match UI first**, then real models | Unblocks UX, camera flow, and interview narrative without waiting on GPU hosting | Real YOLO+CLIP from day one (higher integration risk) |
| 2026-11-12 | Primary detection = **open-vocabulary** (YOLO-World or OWL-ViT) using **item name** as prompt | COCO does not cover core lost-item classes | COCO YOLO as sole detector |
| 2026-11-12 | Keep **COCO YOLO as baseline only** | Useful ablation and interview talking point | Dropping COCO entirely |
| 2026-11-12 | Evaluate **CLIP and DINOv2**; choose with data | Image–image quality is empirical; score scales differ | Guessing CLIP alone with a fixed 0.28–0.32 threshold |
| 2026-11-12 | **Do not** show raw percentages as primary UI; use **Strong / Possible / Weak** bands | Users over-trust percentages; bands match uncertainty | Always showing “78% match” |
| 2026-11-12 | Thresholds **calibrated on an eval set** | Text–image CLIP folklore thresholds are invalid for image–image cosine | Hard-coding 0.28–0.32 |
| 2026-11-12 | Require **2–3 consecutive** above-threshold frames before alert; add **vibration + sound** | Cuts single-frame false positives; clearer UX | Alert on first frame above threshold |
| 2026-11-12 | Reference flow: **crop** + up to **3 photos** + gallery/product URL | Better instance signal; many users lack a dedicated object photo | Single uncropped scene photo only |
| 2026-11-12 | **Still-image fallback** when camera fails | Android/laptop demo resilience; unsupported browsers | Camera-only product |
| 2026-11-12 | **Defer Postgres** to Phase 7 | MVP doesn’t need history; feedback logs matter once models exist | Postgres in initial scaffold |
| 2026-11-12 | Host: **local first**; deploy **Vercel + Hugging Face Spaces Docker** | Render free RAM too small for PyTorch models | Render free tier for ML API |
| 2026-11-12 | Primary demo devices: **Android Chrome + laptop webcam**; iOS Safari later; plan **HTTPS** before phone camera phase | `getUserMedia` realities on mobile | iOS-first or HTTP LAN camera testing |

---

## 4. Experiments

> Template — copy a block per experiment. Fill only after running. No placeholder numbers.

### Experiment ID: `EXP-XXX` — *title*

| Field | Value |
|-------|--------|
| **Date** | Pending |
| **Goal** | Pending |
| **Setup — detection model** | Pending |
| **Setup — similarity model** | Pending |
| **Setup — dataset split** | Pending |
| **Setup — threshold / bands** | Pending |
| **Setup — hardware** | Pending |
| **Metrics — precision** | Pending |
| **Metrics — recall** | Pending |
| **Metrics — latency (ms)** | Pending |
| **Result** | Pending |
| **Conclusion** | Pending |
| **Artifacts** | (paths to notebooks, plots, raw CSV) |

---

## 5. Evaluation dataset

**Status:** Pending — not collected yet. Target: 20–30 items including look-alikes.

### Template

| Field | Plan |
|-------|------|
| **Items** | Pending list (e.g. black wallet A, black wallet B look-alike, silver keys, white earbuds case, …) |
| **Look-alikes** | Pending pairs that should *not* count as the same instance |
| **Conditions** | Pending matrix: lighting (bright / dim / mixed), angle (top / side / oblique), distance (near / mid), occlusion (none / partial) |
| **Reference protocol** | Pending: 1–3 cropped refs per item; optional product image |
| **Query protocol** | Pending: scene frames / stills with labeled boxes |
| **Pair labeling** | Pending rules, e.g. `positive` = same physical instance; `hard_negative` = same category different instance; `negative` = different category |
| **Storage** | Pending path under `data/eval/` (git-ignored binaries; manifest committed) |

---

## 6. Threshold calibration

**Status:** Pending — no calibrated value yet.

### Method (planned)

1. Embed all reference/query crops with each similarity model.  
2. Sweep cosine thresholds; plot precision–recall.  
3. Choose operating points for **Strong / Possible / Weak** bands (maximize precision at acceptable recall for a human-confirm UI).  
4. Validate temporal rule (N consecutive frames) on short video clips.

### Chosen values

| Band | Similarity model | Threshold | Evidence |
|------|------------------|-----------|----------|
| Strong possible match | Pending | Pending | Pending |
| Possible match | Pending | Pending | Pending |
| Weak match | Pending | Pending | Pending |

**Note:** Placeholder constants in `src/lib/matchBands.ts` are UI scaffolding only — **not** production thresholds.

---

## 7. Failures & limitations

**Status:** Early product limitations (known); empirical failures Pending.

| Item | Type | Notes |
|------|------|-------|
| COCO-only detection | Known limitation | Insufficient class coverage for core lost items |
| Unique-item identification | Fundamental limit | Embeddings cannot guarantee identity of one physical object |
| Look-alike confusion | Expected risk | Two black wallets may score similarly — UX must stay “possible match” |
| Untested open-vocab recall on tiny objects | Pending | Keys / earbuds / glasses at distance |
| Untested CLIP vs DINOv2 | Pending | No winner yet |
| CPU latency on HF Spaces | Pending | May force lower frame rate or crop-only matching |
| Cross-origin product image crop | Known Phase 1 limit | Canvas may be tainted; backend proxy planned later |

---

## 8. Next experiments

Priority order (do not mark complete without results above):

1. **Pending** — Collect eval dataset (20–30 items + look-alikes + lighting/angle variants); write labeling manifest.  
2. **Pending** — Open-vocab detector smoke test (YOLO-World vs OWL-ViT) on held-out scenes; measure box recall @ IoU and ms/frame.  
3. **Pending** — COCO YOLO baseline on the same scenes (document misses).  
4. **Pending** — CLIP vs DINOv2 ranking on labeled crop pairs; PR curves + latency.  
5. **Pending** — Calibrate band thresholds; freeze values in config (not folklore defaults).  
6. **Pending** — Temporal stability (N=2 vs N=3 consecutive frames) false-positive rate on short videos.  
7. **Pending** — End-to-end laptop + Android Chrome latency under HF Spaces Docker constraints.

---

*Last updated: 2026-11-12 — Sections 1–3 filled from product decisions; Sections 4–8 templates only.*
