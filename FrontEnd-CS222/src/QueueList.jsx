import React from "react";

export default function QueueList({ items, colorForIndex }) {
  return (
    <>
      {items.map((detail, id) => (
        <div key={id}>
          <div className="card shadow-lg">
            <div className={`bg-${colorForIndex(id)} card-header`}>
              Quote {id + 1}
            </div>
            <div className="card-body">
              <blockquote className={`text-${colorForIndex(id)} blockquote mb-0`}>
                <h1>{detail.detail}</h1>
                <footer className="blockquote-footer">
                  <cite title="Source Title">{detail.name}</cite>
                </footer>
              </blockquote>
            </div>
          </div>
          <span className="border border-primary "></span>
        </div>
      ))}
    </>
  );
}
