import React from "react";

/**
 * GraphView: simple vertical "story map" of the user's submissions.
 * Each item becomes a node, and arrows connect them in order.
 */
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
