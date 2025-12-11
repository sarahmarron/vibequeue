import React from "react";

export default function GPTRecs({ prompt, songs }) {
  return (
    <div className="card border mt-3">
      <div className="card-header">
        Prompt: <em>{prompt}</em>
      </div>

      <ul className="list-group list-group-flush">
        {songs.map((song, i) => (
          <li className="list-group-item" key={i}>
            {song.title} — {song.artist}
          </li>
        ))}
      </ul>
    </div>
  );
}
