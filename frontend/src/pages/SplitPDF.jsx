import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function SplitPDF() {
  const [file, setFile]           = useState(null);
  const [dragging, setDragging]   = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [split, setSplit]         = useState(false);
  const [error, setError]         = useState("");
  const [mounted, setMounted]     = useState(false);
  const [mousePos, setMousePos]   = useState({ x: 0, y: 0 });
  const [tick, setTick]           = useState(0);
  const [mode, setMode]           = useState("all");    // "all" | "custom"
  const [pageRange, setPageRange] = useState("");
  const inputRef = useRef(null);
  const mainRef  = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
    const id = setInterval(() => setTick(t => t + 1), 60);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!mainRef.current) return;
      const r = mainRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const angle = (tick * 0.4 * Math.PI) / 180;
  const orb1x = 40 + 18 * Math.cos(angle);
  const orb1y = 30 + 10 * Math.sin(angle * 1.3);
  const orb2x = 70 + 15 * Math.cos(angle * 0.7 + 2);
  const orb2y = 65 + 12 * Math.sin(angle * 0.9 + 1);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") {
      setFile(f);
      setSplit(false);
      setError("");
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setSplit(false);
      setError("");
    }
  };

  const handleSplit = async () => {
    if (!file) return;
    if (mode === "custom" && !pageRange.trim()) {
      setError("Please enter a page range.");
      return;
    }

    setSplitting(true);
    setError("");
    setSplit(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (mode === "custom") {
        formData.append("pages", pageRange);
      }

      const res = await fetch("http://127.0.0.1:8000/split", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "split_pages.zip";
      a.click();
      URL.revokeObjectURL(url);

      setSplit(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSplitting(false);
    }
  };

  const uploadBorderColor = file
    ? "rgba(245,158,11,.4)"
    : dragging
    ? "rgba(245,158,11,.6)"
    : "rgba(255,255,255,.1)";
  const uploadBg = file
    ? "rgba(245,158,11,.03)"
    : dragging
    ? "rgba(245,158,11,.05)"
    : "rgba(255,255,255,.015)";

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030305; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        .split-btn:hover  { transform: translateY(-2px) !important; box-shadow: 0 14px 40px rgba(245,158,11,.45) !important; }
        .mode-btn:hover   { border-color: rgba(245,158,11,.4) !important; }
        .upload-zone:hover { border-color: rgba(245,158,11,.45) !important; }
        .back-btn:hover   { color: #fff !important; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(245,158,11,.3); border-radius:2px; }
      `}</style>

      <div style={{ ...s.orb,  left: `${orb1x}%`, top: `${orb1y}%` }} />
      <div style={{ ...s.orb2, left: `${orb2x}%`, top: `${orb2y}%` }} />
      <div style={{ ...s.mouseGlow, left: mousePos.x, top: mousePos.y }} />
      <div style={s.noise} />

      <div style={s.layout}>

        {/* SIDEBAR */}
        <aside style={{
          ...s.sidebar,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "none" : "translateX(-18px)",
          transition: "opacity .6s, transform .6s",
        }}>
          <div style={s.logo}>
            <div style={s.logoMark}>
              <div style={s.logoInner}>D</div>
              <div style={s.logoRing} />
            </div>
            <div>
              <div style={s.logoName}>DocMind</div>
              <div style={s.logoBadge}>AI SUITE</div>
            </div>
          </div>

          <div style={s.infoCard}>
            <div style={s.infoIcon}>⊘</div>
            <div style={s.infoTitle}>Split PDF</div>
            <div style={s.infoDesc}>
              Extract specific pages or split every page into separate PDF files. Downloaded as a ZIP.
            </div>
          </div>

          <div style={s.tipsBox}>
            <div style={s.tipsTitle}>💡 Page Range Format</div>
            <div style={s.tipItem}>• <span style={{ color: "#f59e0b" }}>1,3,5</span> — specific pages</div>
            <div style={s.tipItem}>• <span style={{ color: "#f59e0b" }}>1-5</span> — page range</div>
            <div style={s.tipItem}>• <span style={{ color: "#f59e0b" }}>1-3,7,9-11</span> — mixed</div>
            <div style={s.tipItem}>• Leave empty to split all</div>
          </div>

          <button
            className="back-btn"
            onClick={() => navigate("/")}
            style={s.backBtn}
          >
            ← Back to Dashboard
          </button>
        </aside>

        {/* MAIN */}
        <main ref={mainRef} style={s.main}>

          <header style={{
            ...s.header,
            opacity: mounted ? 1 : 0,
            animation: mounted ? "fadeUp .5s .1s both" : "none",
          }}>
            <div>
              <div style={s.headerSub}>PDF Tools</div>
              <h1 style={s.headerTitle}>
                Split{" "}
                <span style={{ background: "linear-gradient(90deg,#f59e0b,#fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  PDF
                </span>
              </h1>
            </div>
            {file && (
              <div style={s.fileBadge}>
                <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 12 }}>
                  {file.name}
                </span>
              </div>
            )}
          </header>

          {/* Upload Zone */}
          <div
            className="upload-zone"
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !splitting && inputRef.current?.click()}
            style={{
              ...s.uploadZone,
              borderColor: uploadBorderColor,
              background: uploadBg,
              cursor: splitting ? "not-allowed" : "pointer",
              opacity: mounted ? 1 : 0,
              animation: mounted ? "fadeUp .5s .2s both" : "none",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            {["tl","tr","bl","br"].map(c => (
              <div key={c} style={{ ...s.corner, ...s[`c_${c}`] }} />
            ))}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
              <div style={{
                ...s.uploadIconWrap,
                background: file ? "rgba(245,158,11,.1)" : "rgba(255,255,255,.04)",
                borderColor: file ? "rgba(245,158,11,.3)" : "rgba(255,255,255,.09)",
              }}>
                <span style={{ fontSize: 26 }}>{file ? "✓" : "⊘"}</span>
              </div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 20 }}>
                {file ? file.name : "Drop your PDF here"}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.33)" }}>
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB — ready to split`
                  : "or click to browse · single PDF file"}
              </div>
            </div>
          </div>

          {/* Split Mode */}
          {file && (
            <div style={{
              ...s.modeSection,
              opacity: mounted ? 1 : 0,
              animation: mounted ? "fadeUp .4s .3s both" : "none",
            }}>
              <div style={s.modeSectionTitle}>Split Mode</div>
              <div style={s.modeRow}>
                <button
                  className="mode-btn"
                  onClick={() => setMode("all")}
                  style={{
                    ...s.modeBtn,
                    borderColor: mode === "all" ? "rgba(245,158,11,.5)" : "rgba(255,255,255,.08)",
                    background: mode === "all" ? "rgba(245,158,11,.08)" : "rgba(255,255,255,.02)",
                    color: mode === "all" ? "#f59e0b" : "rgba(255,255,255,.45)",
                  }}
                >
                  <span style={{ fontSize: 20, marginBottom: 6 }}>⊘</span>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 }}>Split All Pages</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 4 }}>Every page becomes a separate PDF</span>
                </button>

                <button
                  className="mode-btn"
                  onClick={() => setMode("custom")}
                  style={{
                    ...s.modeBtn,
                    borderColor: mode === "custom" ? "rgba(245,158,11,.5)" : "rgba(255,255,255,.08)",
                    background: mode === "custom" ? "rgba(245,158,11,.08)" : "rgba(255,255,255,.02)",
                    color: mode === "custom" ? "#f59e0b" : "rgba(255,255,255,.45)",
                  }}
                >
                  <span style={{ fontSize: 20, marginBottom: 6 }}>✎</span>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 }}>Custom Pages</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 4 }}>Choose specific pages to extract</span>
                </button>
              </div>

              {/* Custom page range input */}
              {mode === "custom" && (
                <div style={s.rangeWrap}>
                  <div style={s.rangeLabel}>Enter page numbers or ranges:</div>
                  <input
                    value={pageRange}
                    onChange={e => setPageRange(e.target.value)}
                    placeholder="e.g. 1,3,5-8,11"
                    style={s.rangeInput}
                  />
                  <div style={s.rangeHint}>
                    Use commas to separate pages and hyphens for ranges
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={s.errorBanner}>
              <span>⚠ {error}</span>
              <button onClick={() => setError("")} style={s.errorClose}>✕</button>
            </div>
          )}

          {/* Success */}
          {split && (
            <div style={s.successBanner}>
              ✓ Pages extracted and downloaded as ZIP successfully!
            </div>
          )}

          {/* Split Button */}
          {file && (
            <button
              className="split-btn"
              onClick={handleSplit}
              disabled={splitting}
              style={{
                ...s.splitBtn,
                opacity: splitting ? .7 : 1,
                cursor: splitting ? "not-allowed" : "pointer",
              }}
            >
              {splitting ? (
                <span style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                  <div style={s.spinner} /> Splitting PDF…
                </span>
              ) : (
                mode === "all"
                  ? "⊘  Split All Pages → Download ZIP"
                  : "⊘  Extract Selected Pages → Download ZIP"
              )}
            </button>
          )}

          {/* Empty state */}
          {!file && (
            <div style={{
              ...s.emptyState,
              opacity: mounted ? 1 : 0,
              animation: mounted ? "fadeUp .5s .4s both" : "none",
            }}>
              <div style={s.emptyIcon}>⊘</div>
              <div style={s.emptyTitle}>No file selected</div>
              <div style={s.emptyDesc}>Upload a PDF above to start splitting</div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#030305", fontFamily: "'Outfit', sans-serif", color: "#fff", position: "relative", overflow: "hidden" },
  orb:  { position: "fixed", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,.13) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0, transition: "left 2s ease, top 2s ease" },
  orb2: { position: "fixed", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(229,57,53,.07) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0, transition: "left 2s ease, top 2s ease" },
  mouseGlow: { position: "fixed", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,.06) 0%, transparent 70%)", transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 0, transition: "left .12s, top .12s" },
  noise: { position: "fixed", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.03'/%3E%3C/svg%3E\")", pointerEvents: "none", zIndex: 0 },
  layout: { display: "flex", minHeight: "100vh", position: "relative", zIndex: 1 },

  sidebar:   { width: 252, background: "rgba(8,8,13,.92)", backdropFilter: "blur(24px)", borderRight: "1px solid rgba(255,255,255,.06)", padding: "28px 18px", display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 0, height: "100vh" },
  logo:      { display: "flex", alignItems: "center", gap: 12, padding: "0 4px 8px" },
  logoMark:  { width: 40, height: 40, position: "relative", flexShrink: 0 },
  logoInner: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#e53935,#b71c1c)", borderRadius: 11, fontSize: 22, fontFamily: "'Syne',sans-serif", fontWeight: 800, zIndex: 1, boxShadow: "0 0 20px rgba(229,57,53,.38)" },
  logoRing:  { position: "absolute", inset: -3, borderWidth: 1, borderStyle: "solid", borderColor: "rgba(229,57,53,.28)", borderRadius: 14, animation: "pulse 3s infinite" },
  logoName:  { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: .5 },
  logoBadge: { fontSize: 9, letterSpacing: 3, color: "rgba(229,57,53,.65)", fontWeight: 600 },

  infoCard:  { background: "rgba(245,158,11,.07)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(245,158,11,.2)", borderRadius: 14, padding: "18px 16px" },
  infoIcon:  { fontSize: 28, marginBottom: 10 },
  infoTitle: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 8 },
  infoDesc:  { fontSize: 12, color: "rgba(255,255,255,.4)", lineHeight: 1.65 },

  tipsBox:   { background: "rgba(255,255,255,.03)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255,255,255,.07)", borderRadius: 12, padding: "14px 16px", flex: 1 },
  tipsTitle: { fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.5)", marginBottom: 10, letterSpacing: .5 },
  tipItem:   { fontSize: 12, color: "rgba(255,255,255,.35)", marginBottom: 6, lineHeight: 1.6 },

  backBtn:   { background: "transparent", border: "none", color: "rgba(255,255,255,.35)", fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "left", padding: "8px 0", transition: "color .2s" },

  main:        { flex: 1, padding: "36px 44px", overflowY: "auto", position: "relative" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 },
  headerSub:   { fontSize: 12, color: "rgba(255,255,255,.32)", letterSpacing: .5, marginBottom: 4 },
  headerTitle: { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 34, lineHeight: 1.1 },
  fileBadge:   { background: "rgba(245,158,11,.08)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(245,158,11,.2)", borderRadius: 12, padding: "10px 16px", maxWidth: 200 },

  uploadZone:     { borderWidth: "1.5px", borderStyle: "dashed", borderRadius: 22, padding: "48px 32px", cursor: "pointer", marginBottom: 24, position: "relative", transition: "border-color .3s, background .3s" },
  corner:         { position: "absolute", width: 14, height: 14, pointerEvents: "none" },
  c_tl: { top: 10, left: 10,    borderTopWidth: 2, borderTopStyle: "solid", borderTopColor: "rgba(245,158,11,.35)", borderLeftWidth: 2, borderLeftStyle: "solid", borderLeftColor: "rgba(245,158,11,.35)", borderRadius: "4px 0 0 0" },
  c_tr: { top: 10, right: 10,   borderTopWidth: 2, borderTopStyle: "solid", borderTopColor: "rgba(245,158,11,.35)", borderRightWidth: 2, borderRightStyle: "solid", borderRightColor: "rgba(245,158,11,.35)", borderRadius: "0 4px 0 0" },
  c_bl: { bottom: 10, left: 10,  borderBottomWidth: 2, borderBottomStyle: "solid", borderBottomColor: "rgba(245,158,11,.35)", borderLeftWidth: 2, borderLeftStyle: "solid", borderLeftColor: "rgba(245,158,11,.35)", borderRadius: "0 0 0 4px" },
  c_br: { bottom: 10, right: 10, borderBottomWidth: 2, borderBottomStyle: "solid", borderBottomColor: "rgba(245,158,11,.35)", borderRightWidth: 2, borderRightStyle: "solid", borderRightColor: "rgba(245,158,11,.35)", borderRadius: "0 0 4px 0" },
  uploadIconWrap: { width: 64, height: 64, borderRadius: 18, borderWidth: 1, borderStyle: "solid", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4, transition: "all .3s" },

  modeSection:      { marginBottom: 24 },
  modeSectionTitle: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 14, color: "rgba(255,255,255,.7)" },
  modeRow:          { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 },
  modeBtn:          { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", borderWidth: 1, borderStyle: "solid", borderRadius: 14, cursor: "pointer", background: "none", transition: "all .2s", fontFamily: "'Outfit',sans-serif", textAlign: "center", gap: 2 },

  rangeWrap:  { background: "rgba(245,158,11,.05)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(245,158,11,.15)", borderRadius: 12, padding: "16px 18px" },
  rangeLabel: { fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 10, fontWeight: 500 },
  rangeInput: { width: "100%", background: "rgba(255,255,255,.06)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255,255,255,.1)", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, fontFamily: "'Outfit',sans-serif", outline: "none", marginBottom: 8 },
  rangeHint:  { fontSize: 11, color: "rgba(255,255,255,.3)" },

  errorBanner:   { display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(239,68,68,.1)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(239,68,68,.25)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#fca5a5" },
  errorClose:    { background: "none", border: "none", color: "rgba(255,255,255,.4)", cursor: "pointer", fontSize: 14 },
  successBanner: { background: "rgba(16,185,129,.1)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(16,185,129,.25)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#6ee7b7", textAlign: "center" },

  splitBtn: { width: "100%", padding: "18px 24px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: 14, color: "#000", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif", letterSpacing: .5, boxShadow: "0 8px 28px rgba(245,158,11,.3)", transition: "transform .2s, box-shadow .2s, opacity .2s", marginBottom: 20 },
  spinner:  { width: 18, height: 18, borderWidth: 2, borderStyle: "solid", borderColor: "rgba(0,0,0,.2)", borderTopColor: "#000", borderRadius: "50%", animation: "spin .8s linear infinite" },

  emptyState: { textAlign: "center", padding: "60px 20px" },
  emptyIcon:  { fontSize: 48, marginBottom: 16, opacity: .2 },
  emptyTitle: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 8, color: "rgba(255,255,255,.4)" },
  emptyDesc:  { fontSize: 13, color: "rgba(255,255,255,.25)" },
};