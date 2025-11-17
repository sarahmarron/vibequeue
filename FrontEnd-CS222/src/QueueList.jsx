import React from "react";

export default function QueueList({ items, colorForIndex }) {
  return (
    <>
      {items.map((song, idx) => (
        <div key={song.id ?? idx}>
          <div className="card shadow-lg mb-3">
            <div className={`bg-${colorForIndex(idx)} card-header`}>
              Song {idx + 1}
            </div>
            <div className="card-body">
              <h3 className="mb-1">{song.title}</h3>
              <p className="text-muted mb-0">{song.artist}</p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}