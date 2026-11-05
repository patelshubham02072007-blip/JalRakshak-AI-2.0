JALRAKSHAK AI — SEVA FIRST INNOVATION CHALLENGE COMBINED EDITION
Project focus: Water shortage early warning, water-saving decisions and explainable research.

WINDOWS 11 — RUN WITH PYTHON + FLASK
1. Extract this ZIP.
2. Open the extracted JalRakshak_SevaFirst_Combined folder.
3. Click the File Explorer address bar, type cmd, and press Enter.
4. Run these commands:

   py -m venv .venv
   .venv\Scripts\activate
   py -m pip install --upgrade pip
   pip install -r requirements.txt
   py app.py

5. Open http://127.0.0.1:5000 in Chrome or Edge.
6. Stop the server with Ctrl+C.

WHAT IS COMBINED
A. Original JalRakshak AI 2.0 features retained:
- Dashboard and water-use records
- Water scarcity early warning with transparent rule-based screening
- What-if water saving simulator
- Community water stress comparison
- Rainwater harvesting calculator
- Population demand estimate
- Unusual-consumption / anomaly screening
- Irrigation estimate
- Community reports
- Official data source links
- CSV export and browser-local record storage

B. WSRIP Research Edition features added:
- Explainable water-cover and risk estimator
- Scenario comparison: baseline, demand reduction, rainwater, greywater and combined
- India-wide research observation register with provenance labels
- Research CSV export
- Research protocol, evaluation metrics, source portals and limitations

DATA AND RESEARCH HONESTY
- Preloaded/sample values are illustrative, not measured data.
- Real observation, official published data, user estimate and simulated demo labels are kept separate.
- The official portals are links; the application does not claim live CGWB, IMD, NWIC or government API connectivity.
- The current early warning is a transparent rule-based prototype, not a trained AI model, probability estimate or official drought alert.
- The area comparison is not a live GIS map.
- Flow/pressure anomaly screening is not confirmation of leakage.
- Browser records use localStorage on the same browser/device. Clearing browser site data may remove them. Export CSV regularly.
- Do not enter sensitive personal information or exact household addresses.

RESEARCH SCENARIO EXAMPLE
Starting usable storage 6,000 L + one-time rainwater addition 2,000 L = 8,000 L.
Daily demand 600 L/day reduced by 35% = 390 L/day.
Without greywater: 8,000 / 390 = 20.5 days.
If suitable greywater substitutes a further 100 L/day: net demand 290 L/day; 8,000 / 290 = 27.6 days.
These are simplified scenario calculations, not measured outcomes. Greywater is only for suitable non-potable uses.

RESEARCH DATA PORTALS
CGWB: https://gwdata.cgwb.gov.in/
NWIC: https://nwdp.nwic.gov.in/
IMD rainfall: https://imdpune.gov.in/cmpg/Griddata/Rainfall_25_NetCDF.html
Open Government Data: https://www.data.gov.in/

RESEARCH IMPLEMENTATION NEXT STEPS
1. Download a documented dataset and preserve the source, date, units, spatial scale and licence.
2. Create a clean time-series dataset with comparable water-system boundaries.
3. Separate train and test data chronologically to avoid future-data leakage.
4. Compare a simple baseline with ML models only after adequate real observations are available.
5. Report MAE/RMSE for numerical forecasting and precision/recall/F1 for classification.
6. Do not claim accuracy, impact or model performance until experiments are completed.

This package is a combined, software-first competition prototype. It is not a certified water engineering tool or a production municipal service.


VERCEL DEPLOYMENT (GITHUB)
This folder is prepared for Vercel's Python/Flask deployment.
- app.py is at the project root and exports the Flask object named `app`.
- requirements.txt is at the project root.
- `public/static/` contains copies of CSS and JavaScript assets for Vercel's static-file serving.
- The original `static/` folder is retained so the same project continues to run locally with Flask.
- The HTML uses `/static/...` paths, so Vercel can serve the files from `public/static/`.

DEPLOY STEPS
1. Create a GitHub repository and upload the CONTENTS of this folder (not an extra enclosing folder).
2. In Vercel, choose Add New -> Project and import that GitHub repository.
3. Framework Preset: Other. Root Directory: `./`.
4. Leave Build Command and Output Directory at their defaults/blank; do not add a build command.
5. Deploy. Vercel should detect the root `app.py` Flask application and install `requirements.txt`.
6. Test the deployed home page and `/health`. Also test CSS, JavaScript, forms and CSV export.

IMPORTANT
- Do not add a `vercel.json` rewrite that sends `/static/*` to Flask; those assets should be served from `public/static/`.
- Browser records remain in each visitor's localStorage. They are not shared between users and are not stored in a central database.
- The `/health` endpoint confirms the Flask function is responding; it does not confirm a live data connection.
- If Vercel's build log reports a Python/runtime issue, share the exact error text for diagnosis.
