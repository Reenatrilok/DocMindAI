import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const NAV = [
  { icon: "⬢", label: "Dashboard",       id: "dashboard" },
  { icon: "⊕", label: "Merge PDF",        id: "merge"     },
  { icon: "⊘", label: "Split PDF",        id: "split"     },
  { icon: "◈", label: "Compress PDF",     id: "compress"  },
  { icon: "✦", label: "AI Summary",       id: "summary"   },
  { icon: "✎", label: "Notes Generator",  id: "notes"     },
  { icon: "◉", label: "Resume Analyzer",  id: "resume"    },
];

const RECENT = [
  { name: "Resume.pdf",     size: "340 KB", date: "Today, 2:14 PM",     tag: "Resume",   color: "#f59e0b" },
  { name: "Assignment.pdf", size: "1.2 MB", date: "Today, 11:02 AM",    tag: "Study",    color: "#3b82f6" },
  { name: "Research.pdf",   size: "5.8 MB", date: "Yesterday, 9:40 PM", tag: "Research", color: "#a855f7" },
];

const TOOLS = [
  { icon: "⊕", label: "Merge PDF",  desc: "Combine multiple PDFs into one",           color: "#3b82f6" },
  { icon: "⊘", label: "Split PDF",  desc: "Extract pages into separate files",         color: "#f59e0b" },
  { icon: "◈", label: "Compress",   desc: "Shrink file size without quality loss",      color: "#10b981" },
  { icon: "✦", label: "AI Summary", desc: "Get instant AI-powered document summaries",  color: "#e53935" },
  { icon: "✎", label: "Notes",      desc: "Auto-generate structured notes from PDFs",   color: "#a855f7" },
  { icon: "◉", label: "Resume AI",  desc: "Score & improve your resume with AI",        color: "#f43f5e" },
];

export default function Dashboard() {
  const [active, setActive]           = useState("dashboard");
  const [dragging, setDragging]       = useState(false);
  const [file, setFile]               = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [summary, setSummary]         = useState("");
  const [error, setError]             = useState("");
  const [tab, setTab]                 = useState("text");
  const [tick, setTick]               = useState(0);
  const [mousePos, setMousePos]       = useState({ x: 0, y: 0 });
  const [mounted, setMounted]         = useState(false);
  const mainRef  = useRef(null);
  const inputRef = useRef(null);
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

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") {
      setFile(f);
      setExtractedText("");
      setSummary("");
      setError("");
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setExtractedText("");
      setSummary("");
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    setExtractedText("");
    setSummary("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.warning) {
        setError(data.warning);
      } else if (data.text && data.text.trim().length > 0) {
        setExtractedText(data.text);
        setTab("text");
      } else {
        setError("No text could be extracted. This PDF may be a scanned image.");
      }
    } catch (err) {
      setError(`Upload failed: ${err.message} — make sure your backend is running on port 8000.`);
    } finally {
      setUploading(false);
    }
  };

  const handleSummary = async () => {
    if (!extractedText) return;
    setSummarizing(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/summary", {
        method: "POST",
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.summary) {
        setSummary(data.summary);
        setTab("summary");
      }
    } catch (err) {
      setError(`Summary failed: ${err.message}`);
    } finally {
      setSummarizing(false);
    }
  };

  const angle = (tick * 0.4 * Math.PI) / 180;
  const orb1x = 50 + 18 * Math.cos(angle);
  const orb1y = 40 + 10 * Math.sin(angle * 1.3);
  const orb2x = 70 + 15 * Math.cos(angle * 0.7 + 2);
  const orb2y = 60 + 12 * Math.sin(angle * 0.9 + 1);

  // Fix: no border shorthand mixing
  const uploadBorderColor = file
    ? "rgba(16,185,129,.4)"
    : dragging
    ? "rgba(229,57,53,.55)"
    : "rgba(255,255,255,.1)";
  const uploadBorderStyle = file ? "solid" : "dashed";
  const uploadBg = file
    ? "rgba(16,185,129,.03)"
    : dragging
    ? "rgba(229,57,53,.04)"
    : "rgba(255,255,255,.015)";

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030305; }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes borderGlow { 0%,100% { border-color: rgba(229,57,53,.2); } 50% { border-color: rgba(229,57,53,.55); } }
        .nav-btn:hover   { background: rgba(255,255,255,.06) !important; color: #fff !important; }
        .tool-card:hover { transform: translateY(-5px) !important; border-color: rgba(255,255,255,.14) !important; }
        .tool-card:hover .tool-icon-inner { transform: scale(1.15); }
        .doc-row:hover   { background: rgba(255,255,255,.04) !important; }
        .upload-zone:hover { border-color: rgba(229,57,53,.45) !important; }
        .process-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 14px 40px rgba(229,57,53,.45) !important; }
        .summary-btn:hover { background: rgba(168,85,247,.2) !important; }
        .copy-btn:hover  { background: rgba(255,255,255,.1) !important; }
        .clear-btn:hover { background: rgba(255,255,255,.08) !important; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(229,57,53,.3); border-radius:2px; }
      `}</style>

      <div style={{ ...s.orb,  left: `${orb1x}%`, top: `${orb1y}%` }} />
      <div style={{ ...s.orb2, left: `${orb2x}%`, top: `${orb2y}%` }} />
      <div style={{ ...s.mouseGlow, left: mousePos.x, top: mousePos.y }} />
      <div style={s.noise} />

      <div style={s.layout}>

        {/* ── SIDEBAR ── */}
        <aside style={{ ...s.sidebar, opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateX(-18px)", transition: "opacity .6s, transform .6s" }}>
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

          <div style={s.searchWrap}>
            <span style={{ fontSize: 15, color: "rgba(255,255,255,.28)" }}>⌕</span>
            <input placeholder="Search tools…" style={s.searchInput} />
          </div>

          <div style={s.navLabel}>WORKSPACE</div>

<nav style={s.nav}>
  {NAV.map((item, i) => {
    const isActive = active === item.id;
    return (
      <button
        key={item.id}
        className="nav-btn"
        onClick={() => {
          setActive(item.id);
          if (item.id === "merge") navigate("/merge");
          if (item.id === "split") navigate("/split");
          if (item.id === "compress") navigate("/compress");
          if (item.id === "summary") navigate("/summary");
          if (item.id === "notes") navigate("/notes");
          if (item.id === "resume") navigate("/resume");
        }}
        style={{
          ...s.navBtn,
          ...(isActive ? s.navBtnActive : {}),
          animation: mounted ? `fadeUp .5s ${i * 60}ms both` : "none",
        }}
                >
                  <span style={{ fontSize: 15, width: 18, textAlign: "center", color: isActive ? "#e53935" : "rgba(255,255,255,.32)", transition: "color .2s" }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isActive && <div style={s.activePip} />}
                </button>
              );
            })}
          </nav>

          <div style={s.upgradeCard}>
            <div style={s.upgradeGlow} />
            <div style={s.upgradeTitle}>Upgrade to Pro</div>
            <div style={s.upgradeDesc}>Unlimited AI summaries, priority processing & more.</div>
            <button style={s.upgradeBtn}>Get Pro →</button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main ref={mainRef} style={s.main}>

          <header style={{ ...s.header, opacity: mounted ? 1 : 0, animation: mounted ? "fadeUp .5s .1s both" : "none" }}>
            <div>
              <div style={s.headerSub}>Welcome back 👋</div>
              <h1 style={s.headerTitle}>
                Your{" "}
                <span style={{ background: "linear-gradient(90deg,#e53935,#ff6b6b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Workspace
                </span>
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={s.pill}>
                <span style={s.pillDot} />
                <span>AI Online</span>
              </div>
              <div style={s.notifBtn}>🔔</div>
              <div style={s.avatar}>R</div>
            </div>
          </header>

          {/* Upload Zone */}
          <div
            className="upload-zone"
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            style={{
              ...s.uploadZone,
              borderColor: uploadBorderColor,
              borderStyle: uploadBorderStyle,
              background: uploadBg,
              cursor: uploading ? "not-allowed" : "pointer",
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
                background: file ? "rgba(16,185,129,.1)" : dragging ? "rgba(229,57,53,.1)" : "rgba(255,255,255,.04)",
                borderColor: file ? "rgba(16,185,129,.28)" : dragging ? "rgba(229,57,53,.35)" : "rgba(255,255,255,.09)",
              }}>
                {uploading
                  ? <div style={s.spinner} />
                  : <span style={{ fontSize: 26 }}>{file ? "✓" : "⬆"}</span>
                }
              </div>

              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 20 }}>
                {uploading ? "Processing PDF…" : file ? file.name : "Drop your PDF here"}
              </div>

              <div style={{ fontSize: 13, color: "rgba(255,255,255,.33)" }}>
                {uploading
                  ? "Extracting text from your document"
                  : file
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB — click Process to extract text`
                  : "or click to browse · PDF files supported"}
              </div>

              {file && !uploading && (
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button
                    className="process-btn"
                    onClick={e => { e.stopPropagation(); handleUpload(); }}
                    style={s.processBtn}
                  >
                    ⬆ &nbsp;Process PDF
                  </button>
                  <button
                    className="clear-btn"
                    onClick={e => {
                      e.stopPropagation();
                      setFile(null);
                      setExtractedText("");
                      setSummary("");
                      setError("");
                    }}
                    style={s.clearBtn}
                  >
                    ✕ Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={s.errorBanner}>
              <span>⚠ {error}</span>
              <button onClick={() => setError("")} style={s.errorClose}>✕</button>
            </div>
          )}

          {/* Results Panel */}
          {(extractedText || summary) && (
            <div style={{ ...s.resultsPanel, animation: "fadeUp .4s both", marginBottom: 36 }}>
              <div style={s.tabBar}>
                <button
                  onClick={() => setTab("text")}
                  style={{ ...s.tabBtn, ...(tab === "text" ? s.tabBtnActive : {}) }}
                >
                  📄 Extracted Text
                </button>
                {summary && (
                  <button
                    onClick={() => setTab("summary")}
                    style={{ ...s.tabBtn, ...(tab === "summary" ? s.tabBtnActive : {}) }}
                  >
                    ✦ AI Summary
                  </button>
                )}
                <div style={{ flex: 1 }} />
                {extractedText && !summary && !summarizing && (
                  <button
                    className="summary-btn"
                    onClick={handleSummary}
                    style={s.summaryBtn}
                  >
                    ✦ Generate AI Summary
                  </button>
                )}
                {summarizing && (
                  <div style={s.summarizingPill}>
                    <div style={{ ...s.spinner, width: 12, height: 12, borderWidth: 2 }} />
                    <span>Summarizing…</span>
                  </div>
                )}
                <button
                  className="copy-btn"
                  onClick={() => navigator.clipboard.writeText(tab === "text" ? extractedText : summary)}
                  style={s.copyBtn}
                >
                  Copy
                </button>
              </div>
              <pre style={s.resultText}>
                {tab === "text" ? extractedText : summary}
              </pre>
            </div>
          )}

          {/* Tools Grid */}
          <section style={{ opacity: mounted ? 1 : 0, animation: mounted ? "fadeUp .5s .3s both" : "none" }}>
            <div style={s.sectionHeader}>
              <span style={s.sectionTitle}>Quick Tools</span>
              <span style={{ fontSize: 12, color: "rgba(229,57,53,.8)", cursor: "pointer", fontWeight: 500 }}>View all →</span>
            </div>
            <div style={s.toolsGrid}>
              {TOOLS.map((t, i) => (
                <div
                  key={t.label}
                  className="tool-card"
                  style={{ ...s.toolCard, animation: mounted ? `fadeUp .5s ${.35 + i * .05}s both` : "none", transition: "transform .25s, border-color .25s" }}
                >
                  <div className="tool-icon-inner" style={{ ...s.toolIcon, background: `${t.color}18`, color: t.color, transition: "transform .25s" }}>
                    {t.icon}
                  </div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.33)", lineHeight: 1.55 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Docs */}
          <section style={{ opacity: mounted ? 1 : 0, animation: mounted ? "fadeUp .5s .5s both" : "none", marginTop: 36, paddingBottom: 40 }}>
            <div style={s.sectionHeader}>
              <span style={s.sectionTitle}>Recent Documents</span>
              <span style={{ fontSize: 12, color: "rgba(229,57,53,.8)", cursor: "pointer", fontWeight: 500 }}>See all →</span>
            </div>
            <div style={s.docTable}>
              <div style={s.docHead}>
                <span style={{ flex: 2 }}>Name</span>
                <span>Tag</span>
                <span>Size</span>
                <span>Modified</span>
                <span>Actions</span>
              </div>
              {RECENT.map((doc) => (
                <div key={doc.name} className="doc-row" style={{ ...s.docRow, transition: "background .2s" }}>
                  <div style={{ ...s.docCell, flex: 2, gap: 0 }}>
                    <div style={s.docThumb}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#e53935", letterSpacing: .5 }}>PDF</span>
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 500, marginLeft: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {doc.name}
                    </span>
                  </div>
                  <div style={s.docCell}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 6, border: "1px solid", letterSpacing: .5, textTransform: "uppercase", background: `${doc.color}18`, color: doc.color, borderColor: `${doc.color}30` }}>
                      {doc.tag}
                    </span>
                  </div>
                  <div style={{ ...s.docCell, color: "rgba(255,255,255,.38)", fontSize: 13 }}>{doc.size}</div>
                  <div style={{ ...s.docCell, color: "rgba(255,255,255,.32)", fontSize: 12 }}>{doc.date}</div>
                  <div style={{ ...s.docCell, gap: 8 }}>
                    <button style={s.actionBtn}>✦ AI</button>
                    <button style={{ ...s.actionBtn, background: "rgba(255,255,255,.04)", borderColor: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.38)" }}>⬇</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#030305", fontFamily: "'Outfit', sans-serif", color: "#fff", position: "relative", overflow: "hidden" },
  orb:  { position: "fixed", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(229,57,53,.16) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0, transition: "left 2s ease, top 2s ease" },
  orb2: { position: "fixed", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,.09) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0, transition: "left 2s ease, top 2s ease" },
  mouseGlow: { position: "fixed", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(229,57,53,.065) 0%, transparent 70%)", transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 0, transition: "left .12s, top .12s" },
  noise: { position: "fixed", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.03'/%3E%3C/svg%3E\")", pointerEvents: "none", zIndex: 0 },
  layout: { display: "flex", minHeight: "100vh", position: "relative", zIndex: 1 },

  // Sidebar
  sidebar:      { width: 252, background: "rgba(8,8,13,.92)", backdropFilter: "blur(24px)", borderRight: "1px solid rgba(255,255,255,.06)", padding: "28px 18px", display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 0, height: "100vh", overflowY: "auto" },
  logo:         { display: "flex", alignItems: "center", gap: 12, padding: "0 4px 8px" },
  logoMark:     { width: 40, height: 40, position: "relative", flexShrink: 0 },
  logoInner:    { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#e53935,#b71c1c)", borderRadius: 11, fontSize: 22, fontFamily: "'Syne',sans-serif", fontWeight: 800, zIndex: 1, boxShadow: "0 0 20px rgba(229,57,53,.38)" },
  logoRing:     { position: "absolute", inset: -3, borderWidth: 1, borderStyle: "solid", borderColor: "rgba(229,57,53,.28)", borderRadius: 14, animation: "pulse 3s infinite" },
  logoName:     { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: .5 },
  logoBadge:    { fontSize: 9, letterSpacing: 3, color: "rgba(229,57,53,.65)", fontWeight: 600 },
  searchWrap:   { display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.04)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255,255,255,.07)", borderRadius: 10, padding: "9px 12px" },
  searchInput:  { background: "none", border: "none", outline: "none", color: "#fff", fontSize: 13, fontFamily: "'Outfit',sans-serif", flex: 1, width: "100%" },
  navLabel:     { fontSize: 9, letterSpacing: 3, color: "rgba(255,255,255,.2)", fontWeight: 600, padding: "0 4px" },
  nav:          { display: "flex", flexDirection: "column", gap: 2, flex: 1 },
  navBtn:       { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "transparent", borderWidth: 1, borderStyle: "solid", borderColor: "transparent", color: "rgba(255,255,255,.42)", fontSize: 13.5, cursor: "pointer", textAlign: "left", fontFamily: "'Outfit',sans-serif", fontWeight: 500, width: "100%", transition: "all .2s", position: "relative" },
  navBtnActive: { background: "rgba(229,57,53,.1)", color: "#fff", borderColor: "rgba(229,57,53,.2)" },
  activePip:    { width: 4, height: 4, borderRadius: "50%", background: "#e53935", boxShadow: "0 0 6px #e53935" },
  upgradeCard:  { background: "linear-gradient(135deg, rgba(229,57,53,.09), rgba(183,28,28,.05))", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(229,57,53,.2)", borderRadius: 14, padding: "18px 16px", position: "relative", overflow: "hidden", animation: "borderGlow 4s infinite" },
  upgradeGlow:  { position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(229,57,53,.18)", filter: "blur(25px)" },
  upgradeTitle: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14.5, marginBottom: 6 },
  upgradeDesc:  { fontSize: 11.5, color: "rgba(255,255,255,.38)", lineHeight: 1.6, marginBottom: 14 },
  upgradeBtn:   { background: "rgba(229,57,53,.14)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(229,57,53,.32)", borderRadius: 8, color: "#e53935", fontSize: 12, fontWeight: 600, padding: "7px 14px", cursor: "pointer", fontFamily: "'Outfit',sans-serif" },

  // Main
  main:        { flex: 1, padding: "36px 44px", overflowY: "auto", position: "relative" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  headerSub:   { fontSize: 12, color: "rgba(255,255,255,.32)", letterSpacing: .5, marginBottom: 4 },
  headerTitle: { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 34, lineHeight: 1.1 },
  pill:        { display: "flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,.07)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(16,185,129,.18)", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#6ee7b7", fontWeight: 500 },
  pillDot:     { width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981", animation: "pulse 2s infinite" },
  notifBtn:    { width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,.05)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255,255,255,.07)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 15 },
  avatar:      { width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#e53935,#b71c1c)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, boxShadow: "0 0 16px rgba(229,57,53,.32)", cursor: "pointer" },

  // Upload zone — no shorthand border, all separated
  uploadZone:     { borderWidth: "1.5px", borderRadius: 22, padding: "52px 32px", cursor: "pointer", marginBottom: 36, position: "relative", transition: "border-color .3s, background .3s" },
  corner:         { position: "absolute", width: 14, height: 14, pointerEvents: "none" },
  c_tl: { top: 10, left: 10,    borderTopWidth: 2, borderTopStyle: "solid", borderTopColor: "rgba(229,57,53,.38)", borderLeftWidth: 2, borderLeftStyle: "solid", borderLeftColor: "rgba(229,57,53,.38)", borderRadius: "4px 0 0 0" },
  c_tr: { top: 10, right: 10,   borderTopWidth: 2, borderTopStyle: "solid", borderTopColor: "rgba(229,57,53,.38)", borderRightWidth: 2, borderRightStyle: "solid", borderRightColor: "rgba(229,57,53,.38)", borderRadius: "0 4px 0 0" },
  c_bl: { bottom: 10, left: 10,  borderBottomWidth: 2, borderBottomStyle: "solid", borderBottomColor: "rgba(229,57,53,.38)", borderLeftWidth: 2, borderLeftStyle: "solid", borderLeftColor: "rgba(229,57,53,.38)", borderRadius: "0 0 0 4px" },
  c_br: { bottom: 10, right: 10, borderBottomWidth: 2, borderBottomStyle: "solid", borderBottomColor: "rgba(229,57,53,.38)", borderRightWidth: 2, borderRightStyle: "solid", borderRightColor: "rgba(229,57,53,.38)", borderRadius: "0 0 4px 0" },
  uploadIconWrap: { width: 64, height: 64, borderRadius: 18, borderWidth: 1, borderStyle: "solid", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4, transition: "all .3s" },
  processBtn:     { background: "linear-gradient(135deg,#e53935,#c62828)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 600, padding: "12px 28px", cursor: "pointer", fontFamily: "'Outfit',sans-serif", letterSpacing: .3, boxShadow: "0 8px 28px rgba(229,57,53,.32)", transition: "transform .2s, box-shadow .2s" },
  clearBtn:       { background: "rgba(255,255,255,.06)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255,255,255,.1)", borderRadius: 12, color: "rgba(255,255,255,.5)", fontSize: 14, fontWeight: 500, padding: "12px 20px", cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "background .2s" },
  spinner:        { width: 24, height: 24, borderWidth: 3, borderStyle: "solid", borderColor: "rgba(255,255,255,.15)", borderTopColor: "#e53935", borderRadius: "50%", animation: "spin .8s linear infinite" },

  // Error
  errorBanner: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(239,68,68,.1)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(239,68,68,.25)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#fca5a5" },
  errorClose:  { background: "none", border: "none", color: "rgba(255,255,255,.4)", cursor: "pointer", fontSize: 14, padding: "0 4px" },

  // Results
  resultsPanel:    { background: "rgba(255,255,255,.02)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255,255,255,.07)", borderRadius: 18, overflow: "hidden" },
  tabBar:          { display: "flex", alignItems: "center", gap: 4, padding: "12px 16px", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "rgba(255,255,255,.06)", background: "rgba(255,255,255,.02)" },
  tabBtn:          { background: "transparent", border: "none", color: "rgba(255,255,255,.4)", fontSize: 13, fontWeight: 500, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all .2s" },
  tabBtnActive:    { background: "rgba(229,57,53,.12)", color: "#fff", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(229,57,53,.2)" },
  summaryBtn:      { background: "rgba(168,85,247,.12)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(168,85,247,.25)", borderRadius: 8, color: "#c084fc", fontSize: 12, fontWeight: 600, padding: "6px 14px", cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "background .2s" },
  summarizingPill: { display: "flex", alignItems: "center", gap: 7, background: "rgba(168,85,247,.08)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(168,85,247,.2)", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#c084fc" },
  copyBtn:         { background: "rgba(255,255,255,.05)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255,255,255,.09)", borderRadius: 8, color: "rgba(255,255,255,.4)", fontSize: 12, padding: "6px 12px", cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "background .2s" },
  resultText:      { padding: "20px 24px", fontSize: 13, color: "rgba(255,255,255,.65)", lineHeight: 1.85, whiteSpace: "pre-wrap", maxHeight: 340, overflowY: "auto" },

  // Tools
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle:  { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17 },
  toolsGrid:     { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 },
  toolCard:      { background: "rgba(255,255,255,.025)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255,255,255,.07)", borderRadius: 16, padding: "20px 18px", cursor: "pointer" },
  toolIcon:      { width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 12 },

  // Docs table
  docTable: { background: "rgba(255,255,255,.02)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255,255,255,.06)", borderRadius: 16, overflow: "hidden" },
  docHead:  { display: "flex", alignItems: "center", gap: 16, padding: "11px 20px", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "rgba(255,255,255,.05)", fontSize: 10, letterSpacing: 1.5, color: "rgba(255,255,255,.22)", fontWeight: 600, textTransform: "uppercase" },
  docRow:   { display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "rgba(255,255,255,.04)", cursor: "pointer" },
  docCell:  { display: "flex", alignItems: "center", flex: 1, minWidth: 0 },
  docThumb: { width: 36, height: 36, borderRadius: 9, background: "rgba(229,57,53,.08)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(229,57,53,.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  actionBtn: { background: "rgba(229,57,53,.1)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(229,57,53,.2)", borderRadius: 7, color: "#e53935", fontSize: 11, fontWeight: 600, padding: "5px 10px", cursor: "pointer", fontFamily: "'Outfit',sans-serif", letterSpacing: .3 },
};