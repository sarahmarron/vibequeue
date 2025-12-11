import React from "react";

export default function PromptBox({ title, artist, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="input-group mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text">Song Title</span>
        </div>
        <input
          type="text"
          className="form-control"
          placeholder="Enter song title"
          value={title}
          name="title"
          onChange={onChange}
        />
      </div>

      <div className="input-group mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text">Artist</span>
        </div>
        <input
          type="text"
          className="form-control"
          placeholder="Enter artist name"
          value={artist}
          name="artist"
          onChange={onChange}
        />
      </div>

      <button type="submit" className="btn btn-primary mb-5">
        Add Song
      </button>
    </form>
  );
}