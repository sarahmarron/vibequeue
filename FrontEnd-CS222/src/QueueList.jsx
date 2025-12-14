import React from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";

export default function QueueList({ items, onRefresh, selectedDevice }) {
  // Group songs by header:
  // - GPT: use prompt (or "GPT Recommendations" if missing)
  // - manual: "Manual song search"
  const groups = React.useMemo(() => {
    const map = new Map();

    (items || []).forEach((s) => {
      const src = (s.source || "unknown").toLowerCase();
      let label = "Unlabeled";

      if (src === "gpt") label = (s.prompt || "").trim() || "GPT Recommendations";
      else if (src === "manual") label = "Manual song search";
      else label = src;

      if (!map.has(label)) map.set(label, []);
      map.get(label).push(s);
    });

    // sort by timestamp asc within each group
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      map.set(k, arr);
    }

    return Array.from(map.entries());
  }, [items]);

  const clearHistory = async () => {
    try {
      await axios.post(`${API_BASE}/songs/clear/`, null, { withCredentials: true });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
      alert("Failed to clear history (is /songs/clear/ in urls.py?)");
    }
  };

  const playFromDb = async (songId) => {
    try {
      await axios.post(
        `${API_BASE}/songs/${songId}/play/`,
        selectedDevice ? { device_id: selectedDevice } : {},
        { withCredentials: true }
      );
    } catch (e) {
      console.error(e);
      alert("Play failed (Spotify open? logged in? active device?)");
    }
  };

  const queueFromDb = async (songId) => {
    try {
      await axios.post(
        `${API_BASE}/songs/${songId}/queue/`,
        selectedDevice ? { device_id: selectedDevice } : {},
        { withCredentials: true }
      );
    } catch (e) {
      console.error(e);
      alert("Queue failed (Spotify open? logged in? active device?)");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 style={{ margin: 0 }}>Song History</h2>
        <button className="btn btn-outline-danger" onClick={clearHistory}>
          🧹 Clear History
        </button>
      </div>

      {groups.length === 0 && <p className="text-muted">No songs yet.</p>}

      {groups.map(([label, songs]) => (
        <div key={label} className="mb-4">
          <div className="mb-2">
            <strong>{label}</strong>
          </div>

          {songs.map((song) => (
            <div key={song.id} className="card shadow-lg mb-2">
              <div className="card-header">
                {song.title} — {song.artist}
                <span className="text-muted" style={{ marginLeft: 10, fontSize: 12 }}>
                  {song.timestamp ? new Date(song.timestamp).toLocaleString() : ""}
                </span>
              </div>

              <div className="card-body d-flex justify-content-between align-items-center">
                <div className="text-muted small">
                  {song.source ? `source: ${song.source}` : ""}
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-success" onClick={() => playFromDb(song.id)}>
                    ▶️ Play
                  </button>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => queueFromDb(song.id)}>
                    ➕ Queue
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
