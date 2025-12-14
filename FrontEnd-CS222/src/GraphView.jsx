import React, { useMemo, useState } from "react";

function songKey(s) {
  // normalize to match duplicates
  const t = (s.title || "").trim().toLowerCase();
  const a = (s.artist || "").trim().toLowerCase();
  return `${t}::${a}`;
}

export default function GraphView({ songs = [], gptRecs = [] }) {
  const [openPrompt, setOpenPrompt] = useState(null);

  const graph = useMemo(() => {
    // 1) Build prompt -> songs (from GPT rec blocks)
    const promptToSongs = new Map(); // prompt -> Map(key -> songObj)
    const songToPrompts = new Map(); // key -> Set(prompts)

    for (const block of gptRecs) {
      const prompt = block.prompt || "Unknown prompt";
      if (!promptToSongs.has(prompt)) promptToSongs.set(prompt, new Map());

      const list = Array.isArray(block.songs) ? block.songs : [];
      for (const s of list) {
        const key = songKey(s);
        promptToSongs.get(prompt).set(key, s);

        if (!songToPrompts.has(key)) songToPrompts.set(key, new Set());
        songToPrompts.get(key).add(prompt);
      }
    }

    // 2) Also include manually added songs as their own “bucket”
    // If your song objects include a prompt field, you can use that instead.
    const manualPrompt = "Manually Added";
    const manualSongs = songs.filter((s) => (s.source || "").toLowerCase() !== "gpt");
    if (manualSongs.length) {
      if (!promptToSongs.has(manualPrompt)) promptToSongs.set(manualPrompt, new Map());
      for (const s of manualSongs) {
        const key = songKey(s);
        promptToSongs.get(manualPrompt).set(key, s);

        if (!songToPrompts.has(key)) songToPrompts.set(key, new Set());
        songToPrompts.get(key).add(manualPrompt);
      }
    }

    // 3) Build prompt ↔ prompt connections by shared songs
    const connections = new Map(); // prompt -> Map(otherPrompt -> count)
    const prompts = Array.from(promptToSongs.keys());

    for (const p of prompts) connections.set(p, new Map());

    for (const [key, ps] of songToPrompts.entries()) {
      const arr = Array.from(ps);
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const a = arr[i], b = arr[j];
          connections.get(a).set(b, (connections.get(a).get(b) || 0) + 1);
          connections.get(b).set(a, (connections.get(b).get(a) || 0) + 1);
        }
      }
    }

    // 4) Flatten connection list for display
    const edges = [];
    for (const [a, map] of connections.entries()) {
      for (const [b, count] of map.entries()) {
        // avoid duplicates
        if (a < b && count > 0) edges.push({ a, b, count });
      }
    }
    edges.sort((x, y) => y.count - x.count);

    return { promptToSongs, songToPrompts, edges };
  }, [songs, gptRecs]);

  const prompts = Array.from(graph.promptToSongs.keys());

  return (
    <div className="journey">
      <div className="journey-header">
        <h3 className="journey-title">Your Song Journey Map</h3>
        <p className="journey-subtitle">
          Prompts become “buckets.” Shared songs create links between buckets.
        </p>
      </div>

      {/* Connections summary */}
      <div className="journey-connections">
        <div className="journey-section-title">Connections</div>
        {graph.edges.length === 0 ? (
          <div className="journey-muted">No overlaps yet — try another prompt and see links appear.</div>
        ) : (
          <ul className="connection-list">
            {graph.edges.slice(0, 8).map((e, idx) => (
              <li key={idx} className="connection-item">
                <span className="connection-a">{e.a}</span>
                <span className="connection-mid">↔</span>
                <span className="connection-b">{e.b}</span>
                <span className="connection-badge">{e.count} shared</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Prompt buckets */}
      <div className="prompt-grid">
        {prompts.map((prompt) => {
          const songMap = graph.promptToSongs.get(prompt);
          const songKeys = Array.from(songMap.keys());
          const isOpen = openPrompt === prompt;

          return (
            <div key={prompt} className={`prompt-card ${isOpen ? "open" : ""}`}>
              <button
                className="prompt-card-header"
                onClick={() => setOpenPrompt(isOpen ? null : prompt)}
              >
                <div className="prompt-name">{prompt}</div>
                <div className="prompt-meta">
                  <span className="prompt-chevron">{isOpen ? "▾" : "▸"}</span>
                </div>
              </button>

              {isOpen && (
                <div className="prompt-card-body">
                  {songKeys.map((k) => {
                    const s = songMap.get(k);
                    const ps = Array.from(graph.songToPrompts.get(k) || []);
                    const shared = ps.length > 1;

                    return (
                      <div key={k} className="song-row">
                        <div className="song-main">
                          <div className="song-title">{s.title}</div>
                          <div className="song-artist">{s.artist}</div>
                        </div>

                        {shared && (
                          <div className="song-shared">
                            <span className="shared-badge">Shared</span>
                            <div className="shared-with">
                              with{" "}
                              {ps
                                .filter((p) => p !== prompt)
                                .slice(0, 3)
                                .join(", ")}
                              {ps.filter((p) => p !== prompt).length > 3 ? "…" : ""}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}



/*
function GraphView({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="graph-view">
      <h2 className="graph-title">Your Song Journey</h2>

      <div className="graph-flow">
        {items.map((item, index) => {
          // Support both old shape (name/detail) and new shape (title/artist)
          const title = item.title || item.detail || "Untitled";
          const subtitle = item.artist || item.name || "";

          return (
            <React.Fragment key={index}>
              <div className="graph-node">
                <div className="graph-node-title">{title}</div>
                {subtitle && (
                  <div className="graph-node-subtitle">{subtitle}</div>
                )}
              </div>

              {index < items.length - 1 && (
                <div className="graph-arrow">
                  <span>↓</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default GraphView;
*/
