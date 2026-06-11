import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function MergePDF() {
  const [files, setFiles]         = useState([]);
  const [dragging, setDragging]   = useState(false);
  const [merging, setMerging]     = useState(false);
  const [merged, setMerged]       = useState(false);
  const [error, setError]         = useState("");
  const [mounted, setMounted]     = useState(false);
  const [mousePos, setMousePos]   = useState({ x: 0, y: 0 });
  const [tick, setTick]           = useState(0);
  const inputRef  = useRef(null);
  const mainRef   = useRef(null);
  const navigate  = useNavigate();

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
    const dropped = Array.from(e.dataTransfer.files).filter(
      f => f.type === "application/pdf"
    );
    setFiles(prev => [...prev, ...dropped]);
    setMerged(false);
    setError("");
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).filter(
      f => f.type === "application/pdf"
    );
    setFiles(prev => [...prev, ...selected]);
    setMerged(false);
    setError("");
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setMerged(false);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    setFiles(prev => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  };

  const moveDown = (index) => {
    if (index === files.length - 1) return;
    setFiles(prev => {
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError("Please add at least 2 PDF files to merge.");
      return;
    }
    setMerging(true);
    setError("");
    setMerged(false);

    try {
      const formData = new FormData();
      files.forEach(f => formData.append("files", f));

      const res = await fetch("http://127.0.0.1:8000/merge", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      // Download the merged PDF
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "merged.pdf";
      a.click();
      URL.revokeObjectURL(url);

      setMerged(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setMerging(false);
    }
  };

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
        .file-row:hover    { background: rgba(255,255,255,.05) !important; }
        .remove-btn:hover  { color: #ef4444 !important; }
        .move-btn:hover    { background: rgba(255,255,255,.1) !important; }
        .merge-btn:hover   { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(59,130,246,.45) !important; }
        .add-btn:hover     { border-color: rgba(229,57,53,.5) !important; background: rgba(229,57,53,.05) !important; }
        .back-btn:hover    { color: #fff !important; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(59,130,246,.3); border-radius:2px; }
      `}</style>

      {/* Ambient orbs */}
      <div style={{ ...s.orb,  left: `${orb1x}%`, top: `${orb1y}%` }} />
      <div style={{ ...s.orb2, left: `${orb2x}%`, top: `${orb2y}%` }} />
      <div style={{ ...s.mouseGlow, left: mousePos.x, top: mousePos.y }} />
      <div style={s.noise} />

      <div style={s.layout}>

        {/* ── SIDEBAR ── */}
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

          {/* Info card */}
          <div style={s.infoCard}>
            <div style={s.infoIcon}>⊕</div>
            <div style={s.infoTitle}>Merge PDF</div>
            <div style={s.infoDesc}>
              Combine multiple PDF files into one document. Drag to reorder before merging.
            </div>
          </div>

          {/* Tips */}
          <div style={s.tipsBox}>
            <div style={s.tipsTitle}>💡 Tips</div>
            <div style={s.tipItem}>• Add 2 or more PDFs</div>
            <div style={s.tipItem}>• Use ↑ ↓ to reorder</div>
            <div style={s.tipItem}>• Max 10 files at once</div>
            <div style={s.tipItem}>• Max 10MB per file</div>
          </div>

          <button
            className="back-btn"
            onClick={() => navigate("/")}
            style={s.backBtn}
          >
            ← Back to Dashboard
          </button>
        </aside>

        {/* ── MAIN ── */}
        <main ref={mainRef} style={s.main}>

          {/* Header */}
          <header style={{
            ...s.header,
            opacity: mounted ? 1 : 0,
            animation: mounted ? "fadeUp .5s .1s both" : "none",
          }}>
            <div>
              <div style={s.headerSub}>PDF Tools</div>
              <h1 style={s.headerTitle}>
                Merge{" "}
                <span style={{ background: "linear-gradient(90deg,#3b82f6,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  PDF
                </span>
              </h1>
            </div>
            <div style={s.fileBadge}>
              <span style={{ color: "#3b82f6", fontWeight: 700 }}>{files.length}</span>
              <span style={{ color: "rgba(255,255,255,.4)" }}>&nbsp;/ 10 files</span>
            </div>
          </header>

          {/* Drop Zone */}
          <div
            className="add-btn"
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              ...s.dropZone,
              borderColor: dragging ? "rgba(59,130,246,.6)" : "rgba(255,255,255,.1)",
              background: dragging ? "rgba(59,130,246,.05)" : "rgba(255,255,255,.015)",
              opacity: mounted ? 1 : 0,
              animation: mounted ? "fadeUp .5s .2s both" : "none",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <span style={{ fontSize: 28, marginBottom: 8 }}>⊕</span>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}>
              {dragging ? "Drop PDFs here" : "Add PDF Files"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.33)", marginTop: 4 }}>
              click or drag & drop · multiple files supported
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={s.errorBanner}>
              <span>⚠ {error}</span>
              <button onClick={() => setError("")} style={s.errorClose}>✕</button>
            </div>
          )}

          {/* Success */}
          {merged && (
            <div style={s.successBanner}>
              ✓ Merged PDF downloaded successfully!
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div style={{
              ...s.fileList,
              opacity: mounted ? 1 : 0,
              animation: mounted ? "fadeUp .4s .3s both" : "none",
            }}>
              <div style={s.fileListHeader}>
                <span style={s.fileListTitle}>Files to Merge</span>
                <button
                  onClick={() => { setFiles([]); setMerged(false); }}
                  style={s.clearAllBtn}
                >
                  Clear all
                </button>
              </div>

              {files.map((file, i) => (
                <div key={i} className="file-row" style={s.fileRow}>

                  {/* Order number */}
                  <div style={s.orderNum}>{i + 1}</div>

                  {/* PDF icon */}
                  <div style={s.fileIcon}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#3b82f6", letterSpacing: .5 }}>PDF</span>
                  </div>

                  {/* File info */}
                  <div style={s.fileInfo}>
                    <div style={s.fileName}>{file.name}</div>
                    <div style={s.fileMeta}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>

                  {/* Move buttons */}
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      className="move-btn"
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      style={{ ...s.moveBtn, opacity: i === 0 ? .25 : 1 }}
                    >
                      ↑
                    </button>
                    <button
                      className="move-btn"
                      onClick={() => moveDown(i)}
                      disabled={i === files.length - 1}
                      style={{ ...s.moveBtn, opacity: i === files.length - 1 ? .25 : 1 }}
                    >
                      ↓
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    className="remove-btn"
                    onClick={() => removeFile(i)}
                    style={s.removeBtn}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Merge Button */}
          {files.length >= 2 && (
            <button
              className="merge-btn"
              onClick={handleMerge}
              disabled={merging}
              style={{
                ...s.mergeBtn,
                opacity: merging ? .7 : 1,
                cursor: merging ? "not-allowed" : "pointer",
                animation: mounted ? "fadeUp .4s .4s both" : "none",
              }}
            >
              {merging ? (
                <span style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                  <div style={s.spinner} /> Merging {files.length} PDFs…
                </span>
              ) : (
                `⊕  Merge ${files.length} PDFs → Download`
              )}
            </button>
          )}

          {/* Empty state */}
          {files.length === 0 && (
            <div style={{
              ...s.emptyState,
              opacity: mounted ? 1 : 0,
              animation: mounted ? "fadeUp .5s .4s both" : "none",
            }}>
              <div style={s.emptyIcon}>⊕</div>
              <div style={s.emptyTitle}>No files added yet</div>
              <div style={s.emptyDesc}>Add at least 2 PDF files above to get started</div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#030305", fontFamily: "'Outfit', sans-serif", color: "#fff", position: "relative", overflow: "hidden" },
  orb:  { position: "fixed", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,.14) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0, transition: "left 2s ease, top 2s ease" },
  orb2: { position: "fixed", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(229,57,53,.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0, transition: "left 2s ease, top 2s ease" },
  mouseGlow: { position: "fixed", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,.06) 0%, transparent 70%)", transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 0, transition: "left .12s, top .12s" },
  noise: { position: "fixed", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.03'/%3E%3C/svg%3E\")", pointerEvents: "none", zIndex: 0 },
  layout: { display: "flex", minHeight: "100vh", position: "relative", zIndex: 1 },

  // Sidebar
  sidebar:   { width: 252, background: "rgba(8,8,13,.92)", backdropFilter: "blur(24px)", borderRight: "1px solid rgba(255,255,255,.06)", padding: "28px 18px", display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 0, height: "100vh" },
  logo:      { display: "flex", alignItems: "center", gap: 12, padding: "0 4px 8px" },
  logoMark:  { width: 40, height: 40, position: "relative", flexShrink: 0 },
  logoInner: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#e53935,#b71c1c)", borderRadius: 11, fontSize: 22, fontFamily: "'Syne',sans-serif", fontWeight: 800, zIndex: 1, boxShadow: "0 0 20px rgba(229,57,53,.38)" },
  logoRing:  { position: "absolute", inset: -3, borderWidth: 1, borderStyle: "solid", borderColor: "rgba(229,57,53,.28)", borderRadius: 14, animation: "pulse 3s infinite" },
  logoName:  { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: .5 },
  logoBadge: { fontSize: 9, letterSpacing: 3, color: "rgba(229,57,53,.65)", fontWeight: 600 },

  infoCard:  { background: "rgba(59,130,246,.08)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(59,130,246,.2)", borderRadius: 14, padding: "18px 16px" },
  infoIcon:  { fontSize: 28, marginBottom: 10 },
  infoTitle: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 8 },
  infoDesc:  { fontSize: 12, color: "rgba(255,255,255,.4)", lineHeight: 1.65 },

  tipsBox:   { background: "rgba(255,255,255,.03)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255,255,255,.07)", borderRadius: 12, padding: "14px 16px", flex: 1 },
  tipsTitle: { fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.5)", marginBottom: 10, letterSpacing: .5 },
  tipItem:   { fontSize: 12, color: "rgba(255,255,255,.35)", marginBottom: 6, lineHeight: 1.5 },

  backBtn:   { background: "transparent", border: "none", color: "rgba(255,255,255,.35)", fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "left", padding: "8px 0", transition: "color .2s" },

  // Main
  main:       { flex: 1, padding: "36px 44px", overflowY: "auto", position: "relative" },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 },
  headerSub:  { fontSize: 12, color: "rgba(255,255,255,.32)", letterSpacing: .5, marginBottom: 4 },
  headerTitle: { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 34, lineHeight: 1.1 },
  fileBadge:  { background: "rgba(59,130,246,.08)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(59,130,246,.2)", borderRadius: 12, padding: "10px 18px", fontSize: 14, fontFamily: "'Syne',sans-serif" },

  dropZone:   { borderWidth: "1.5px", borderStyle: "dashed", borderRadius: 18, padding: "36px 32px", cursor: "pointer", marginBottom: 20, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", transition: "all .3s" },

  errorBanner:   { display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(239,68,68,.1)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(239,68,68,.25)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#fca5a5" },
  errorClose:    { background: "none", border: "none", color: "rgba(255,255,255,.4)", cursor: "pointer", fontSize: 14 },
  successBanner: { background: "rgba(16,185,129,.1)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(16,185,129,.25)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#6ee7b7", textAlign: "center" },

  fileList:       { background: "rgba(255,255,255,.02)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255,255,255,.07)", borderRadius: 16, overflow: "hidden", marginBottom: 20 },
  fileListHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "rgba(255,255,255,.05)" },
  fileListTitle:  { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 },
  clearAllBtn:    { background: "none", border: "none", color: "rgba(239,68,68,.6)", fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" },

  fileRow:   { display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "rgba(255,255,255,.04)", transition: "background .2s" },
  orderNum:  { width: 24, height: 24, borderRadius: "50%", background: "rgba(59,130,246,.15)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(59,130,246,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#60a5fa", flexShrink: 0 },
  fileIcon:  { width: 36, height: 36, borderRadius: 9, background: "rgba(59,130,246,.08)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(59,130,246,.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  fileInfo:  { flex: 1, minWidth: 0 },
  fileName:  { fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3 },
  fileMeta:  { fontSize: 11, color: "rgba(255,255,255,.35)" },
  moveBtn:   { width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,.05)", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s", fontFamily: "'Outfit',sans-serif" },
  removeBtn: { background: "none", border: "none", color: "rgba(255,255,255,.3)", fontSize: 16, cursor: "pointer", transition: "color .2s", padding: "0 4px" },

  mergeBtn:  { width: "100%", padding: "18px 24px", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", border: "none", borderRadius: 14, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif", letterSpacing: .5, boxShadow: "0 8px 28px rgba(59,130,246,.3)", transition: "transform .2s, box-shadow .2s, opacity .2s", marginBottom: 20 },
  spinner:   { width: 18, height: 18, borderWidth: 2, borderStyle: "solid", borderColor: "rgba(255,255,255,.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" },

  emptyState: { textAlign: "center", padding: "60px 20px" },
  emptyIcon:  { fontSize: 48, marginBottom: 16, opacity: .2 },
  emptyTitle: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 8, color: "rgba(255,255,255,.4)" },
  emptyDesc:  { fontSize: 13, color: "rgba(255,255,255,.25)" },
};