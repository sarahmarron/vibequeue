import React from "react";

export default function PromptBox({ user, quote, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="input-group mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text" id="basic-addon1">Author</span>
        </div>
        <input
          type="text"
          className="form-control"
          placeholder="Name of the Poet/Author"
          aria-label="Username"
          aria-describedby="basic-addon1"
          value={user}
          name="user"
          onChange={onChange}
        />
      </div>

      <div className="input-group mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text">Your Quote</span>
        </div>
        <textarea
          className="form-control"
          aria-label="With textarea"
          placeholder="Tell us what you think of ....."
          value={quote}
          name="quote"
          onChange={onChange}
        />
      </div>

      <button type="submit" className="btn btn-primary mb-5">Submit</button>
    </form>
  );
}
