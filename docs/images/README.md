# Screenshots Needed for Documentation

Place screenshots in this folder to complete the documentation.

---

## Required Screenshots

### 1. dashboard-preview.png
**Location:** `/docs/images/dashboard-preview.png`  
**Used in:** README.md  
**What to capture:**
- Full analysis results page
- Summary strip at top (risk score, contract type, high-risk count, etc.)
- 2-3 visible category cards (Termination, IP Ownership, Non-compete)
- At least one expanded card showing evidence quotes
- Document preview on the left side

**Suggested size:** 1920x1080 or 2560x1440  
**Format:** PNG with transparency or white background

---

### 2. homepage.png (Optional)
**Location:** `/docs/images/homepage.png`  
**What to capture:**
- Homepage with contract type selection cards
- Text input area
- "Attach Contract" button
- ContractIQ-style design

---

### 3. loading-screen.png (Optional)
**Location:** `/docs/images/loading-screen.png`  
**What to capture:**
- Analysis in progress overlay
- 4-step progress indicators
- Clean loading animation

---

### 4. category-card-expanded.png (Optional)
**Location:** `/docs/images/category-card-expanded.png`  
**What to capture:**
- Single expanded category card
- "Why It Matters" section
- Evidence quotes with blue border
- "Who Benefits" and "Market Standard" badges
- "What to Negotiate" bullet points
- "Save to Report" and "Add Note" buttons

---

## How to Take Screenshots

### macOS
1. **Full screen:** Cmd+Shift+3
2. **Selection:** Cmd+Shift+4, then drag
3. **Window:** Cmd+Shift+4, then press Space, then click window
4. Screenshots save to Desktop by default

### Windows
1. **Full screen:** Windows+PrtScn (saves to Pictures/Screenshots)
2. **Snipping Tool:** Windows+Shift+S

### Browser DevTools
1. Open DevTools (F12)
2. Toggle device toolbar (Cmd+Shift+M)
3. Click "..." menu
4. "Capture screenshot" or "Capture full size screenshot"

---

## Tips for Good Screenshots

1. **Clean browser window** - Hide bookmarks bar, close extra tabs
2. **Use realistic data** - Use one of the sample contracts for demo
3. **High resolution** - 1920x1080 minimum, 2560x1440 ideal
4. **Good contrast** - Ensure text is readable
5. **No sensitive data** - Use fake names, redact if necessary
6. **Consistent theme** - Use light or dark mode, be consistent

---

## Screenshot Checklist

- [ ] dashboard-preview.png (required for README)
- [ ] homepage.png (optional, enhances documentation)
- [ ] loading-screen.png (optional, shows UX flow)
- [ ] category-card-expanded.png (optional, shows detail view)

---

## Alternative: Video Walkthrough

Instead of (or in addition to) screenshots, consider recording a 30-60 second demo:

1. Start at homepage
2. Paste sample contract
3. Click "Analyze"
4. Show results loading
5. Expand a category card
6. Highlight evidence quotes

Upload to YouTube/Vimeo and link in README:

```markdown
## Demo Video

Watch a 60-second walkthrough: [YouTube Link](https://youtube.com/...)
```

---

## GIF Alternative

Animated GIFs can show interactions better than static images:

**Tools:**
- **macOS:** Gifski (convert video to GIF)
- **Windows:** ScreenToGif
- **Online:** CloudConvert, ezgif.com

**Recommended size:** 1280x720, 10-15 seconds max, ~2-5MB file size

---

Once you've added screenshots, commit them:

```bash
git add docs/images/
git commit -m "Add documentation screenshots"
git push
```
