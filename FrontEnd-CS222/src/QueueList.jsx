import React from "react";

export default function QueueList({ items, colorForIndex, onPlay, onPause }) {
  return (
    <>
      {items.map((song, id) => (
        <div key={id}>
          <div className="card shadow-lg mb-2">
            <div className={`bg-${colorForIndex(id)} card-header`}>
              {song.title || `Quote ${id + 1}`} - {song.artist || ""}
            </div>
            <div className="card-body d-flex justify-content-between align-items-center">
              <span>{song.detail || ""}</span>
              <div>
                {song.uri && (
                  <>
                    <button
                      className="btn btn-sm btn-success me-2"
                      onClick={() => onPlay(song.uri)}
                    >
                      ▶ Play
                    </button>
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={onPause}
                    >
                      ⏸ Pause
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}