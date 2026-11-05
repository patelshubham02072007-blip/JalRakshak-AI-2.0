# JalRakshak AI research implementation plan

## Current working prototype
The unified web app contains transparent rule-based shortage screening, rainwater and reuse scenario calculations, community comparisons, record capture, and a research observation register. It does not contain a trained ML model or live official data integration.

## Study design
Research question: Does combining water availability, demand, rainfall and conservation assumptions provide more useful short-term water-cover estimates than a consumption-only baseline?

### Experiments
1. Baseline comparison: compare consumption-only and rainfall/demand-aware approaches.
2. Risk classification: evaluate Low/Medium/High labels only after defining operational thresholds and obtaining valid labels.
3. Scenario analysis: compare demand reduction, rainwater capture and suitable greywater substitution.
4. Area comparison: evaluate whether relative area stress rankings agree with documented water-cover observations.
5. Explainability: inspect whether each output exposes inputs, assumptions, reasons and limitations.

### Metrics
- MAE and RMSE for numerical forecasting.
- Precision, recall and F1 for classification.
- Estimated L/day and L/week saved for scenario comparisons.
- User task completion and comprehension for usability evaluation.

### Data dictionary
date: ISO date; state; district; block_or_ward; rainfall_mm; available_storage_liters; demand_liters_day; groundwater_level_m_bgl; source_type; source_name; source_url; publication_date; access_date; units; measurement_method.

Do not combine reservoir storage, groundwater resource estimates, distribution-system supply and household tank storage without a defensible system boundary. Groundwater level in metres below ground level is not a direct volume measurement.

## India-wide public data starting points
- CGWB: https://gwdata.cgwb.gov.in/
- NWIC: https://nwdp.nwic.gov.in/
- IMD gridded rainfall: https://imdpune.gov.in/cmpg/Griddata/Rainfall_25_NetCDF.html
- data.gov.in: https://www.data.gov.in/

These are discovery portals. Check the exact dataset, units, temporal/spatial coverage, access terms and version. This application does not ingest them automatically.

## Reproducibility
Use chronological train/test splits. Record dataset versions, missing-value handling, feature definitions, model settings and random seeds. Compare ML only to a clear baseline. Never report demo-data performance as real-world performance.
