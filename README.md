# BP & Pulse Meter

A single-page web app that evaluates blood pressure (SYS/DIA) and pulse using AHA ranges. It shows a colour-coded status, a gauge, pulse pressure and MAP, plain-English tips, a reference chart, and a local readings log (saved in your browser only).

No build step, no dependencies. It is one `index.html` file.

## Run locally
Open `index.html` in any browser, or run:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Put it on GitHub
```bash
cd bp-meter
git init
git add .
git commit -m "Add BP & Pulse Meter"
git branch -M main
git remote add origin https://github.com/<your-username>/bp-meter.git
git push -u origin main
```

## Publish with GitHub Pages
1. In your repo, open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` (or run the workflow from the **Actions** tab). The site goes live at
   `https://<your-username>.github.io/bp-meter/`.

## Disclaimer
For information only. Not a substitute for professional medical advice, diagnosis or treatment.

## License
MIT
