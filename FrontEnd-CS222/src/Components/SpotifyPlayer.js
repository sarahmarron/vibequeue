import React from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";

class SpotifyPlayer extends React.Component {
  state = {
    query: "",
    searchResults: [],
    devices: [],
    selectedDevice: "",
    error: "",
    loading: false,
  };

  componentDidMount() {
    this.listDevices();
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  searchTracks = async () => {
    const { query } = this.state;
    if (!query.trim()) return;
    this.setState({ loading: true, error: "" });

    try {
      const res = await axios.get(`${API_BASE}/search/`, {
        params: { q: query },
        withCredentials: true,
      });
      this.setState({ searchResults: res.data.items || [] });
    } catch (e) {
      console.error(e);
      this.setState({ error: "Search failed." });
    } finally {
      this.setState({ loading: false });
    }
  };

  listDevices = async () => {
    try {
      const res = await axios.get(`${API_BASE}/devices/`, {
        withCredentials: true,
      });
      this.setState({ devices: res.data.devices || [] });
    } catch (e) {
      console.error(e);
      this.setState({ devices: [] });
    }
  };

  playTrack = async (uri) => {
    const { selectedDevice } = this.state;
    try {
      await axios.put(
        `${API_BASE}/play/`,
        { uri, device_id: selectedDevice || undefined },
        { withCredentials: true }
      );
    } catch (e) {
      console.error(e);
      this.setState({ error: "Could not start playback. Is Spotify open?" });
    }
  };

  pauseTrack = async () => {
    const { selectedDevice } = this.state;
    try {
      await axios.put(
        `${API_BASE}/pause/`,
        { device_id: selectedDevice || undefined },
        { withCredentials: true }
      );
    } catch (e) {
      console.error(e);
      this.setState({ error: "Could not pause playback." });
    }
  };

  render() {
    const { query, searchResults, devices, selectedDevice, loading, error } =
      this.state;

    return (
      <div className="card shadow-lg mb-4">
        <div className="card-header">Spotify Player</div>
        <div className="card-body">
          {/* Device selection */}
          <div className="mb-3">
            <label className="form-label">Select Device</label>
            <div className="input-group">
              <select
                className="form-select"
                value={selectedDevice}
                onChange={(e) =>
                  this.setState({ selectedDevice: e.target.value })
                }
              >
                <option value="">Auto (active device)</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.is_active ? "• active" : ""}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-outline-secondary"
                onClick={this.listDevices}
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search for a song (e.g., Shape of You)"
              name="query"
              value={query}
              onChange={this.handleChange}
            />
            <button className="btn btn-primary" onClick={this.searchTracks}>
              Search
            </button>
          </div>

          {/* Pause button */}
          <button className="btn btn-warning mb-3" onClick={this.pauseTrack}>
            Pause
          </button>

          {loading && <p>Loading...</p>}
          {error && <p className="text-danger">{error}</p>}

          {/* Results */}
          {searchResults.length > 0 && (
            <ul className="list-group">
              {searchResults.map((t) => (
                <li
                  key={t.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center gap-3">
                    {t.image && (
                      <img
                        src={t.image}
                        alt=""
                        style={{
                          width: 50,
                          height: 50,
                          objectFit: "cover",
                          borderRadius: 6,
                        }}
                      />
                    )}
                    <div>
                      <strong>{t.name}</strong>
                      <div className="text-muted small">
                        {t.artist} — {t.album}
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => this.playTrack(t.uri)}
                  >
                    ▶️ Play
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }
}

export default SpotifyPlayer;
