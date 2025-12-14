import "./App.css";
import React from "react";
import axios from "axios";
import QueueList from "./QueueList";
import GPTRecs from "./GPTRecs";
import GraphView from "./GraphView";
import SpotifyPlayer from "./Components/SpotifyPlayer.js";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";

class App extends React.Component {
  state = {
    details: [],      // songs from backend DB
    gptRecs: [],      // [{ prompt, songs }]
    recPrompt: "",
    message: "",
    isAuthed: false,
    authError: "",
    loadingAuth: true,
    activeView: "main",

    // NEW: share selected device across SpotifyPlayer + history actions
    selectedDevice: "",
  };

  componentDidMount() {
    this.refreshSongs();
    this.checkAuth();
  }

  // ----------- DATA LOADING -----------

  refreshSongs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/songs/`, { withCredentials: true });
      this.setState({ details: res.data || [] });
    } catch (e) {
      // ignore
    }
  };

  // ----------- SPOTIFY AUTH -----------

  checkAuth = async () => {
    try {
      this.setState({ loadingAuth: true, authError: "" });
      const res = await axios.get(`${API_BASE}/is-authenticated/`, {
        withCredentials: true,
      });
      const authed = Boolean(res.data?.status);
      this.setState({ isAuthed: authed });
    } catch (e) {
      this.setState({ isAuthed: false, authError: "Auth check failed" });
    } finally {
      this.setState({ loadingAuth: false });
    }
  };

  startLogin = async () => {
    try {
      const res = await axios.get(`${API_BASE}/get-auth-url/`, {
        withCredentials: true,
      });
      window.open(res.data.url, "_blank");
    } catch (e) {
      console.error("Failed to start login", e);
    }
  };

  logout = async () => {
    try {
      await axios.post(`${API_BASE}/logout/`, null, { withCredentials: true });
    } catch (e) {
      // ignore
    } finally {
      this.checkAuth();
      this.refreshSongs();
    }
  };

  // ----------- UI HELPERS -----------

  setView = (view) => this.setState({ activeView: view });

  handleInput = (e) => this.setState({ [e.target.name]: e.target.value });

  // ----------- PLAYBACK CONTROLS -----------

  togglePlayPause = async () => {
    try {
      await axios.post(`${API_BASE}/play-toggle/`, null, {
        withCredentials: true,
      });
    } catch (e) {
      console.error("Failed to toggle play/pause", e);
    }
  };

  queueLatest = async () => {
    try {
      await axios.post(`${API_BASE}/queue-latest/`, null, {
        withCredentials: true,
      });
      //alert("Queued latest 5 recommendations in Spotify");
    } catch (e) {
      console.error("Failed to queue latest songs", e);
    }
  };

  // ----------- GPT RECS -----------

  handleSongRecs = (e) => {
    e.preventDefault();
    const { recPrompt } = this.state;
    if (!recPrompt) return;

    axios
      .post(`${API_BASE}/song-recs/`, { prompt: recPrompt }, { withCredentials: true })
      .then((res) => {
        const created = res.data || [];
        this.setState((prev) => ({
          details: [...prev.details, ...created],
          gptRecs: [...prev.gptRecs, { prompt: recPrompt, songs: created }],
          recPrompt: "",
        }));

        return this.queueLatest();
      })
      .catch((err) => console.error("Failed to get GPT song recs", err));
  };

  // ----------- MESSAGE -----------

  fetchMessage = () => {
    axios
      .get(`${API_BASE}/message/`)
      .then((res) => this.setState({ message: res.data.text }))
      .catch((err) => console.error(err));
  };

  render() {
    const { loadingAuth, isAuthed, authError, selectedDevice } = this.state;

    return (
      <div className="App">
        <header className="hero">
          <h1 className="hero-title">Dare to Endeavor</h1>
          <p className="hero-subtitle">Turn a vibe into a playlist</p>
        </header>

        <div className="tabs">
          <button
            className={this.state.activeView === "main" ? "tab-button active" : "tab-button"}
            onClick={() => this.setView("main")}
          >
            Playlist
          </button>
          <button
            className={this.state.activeView === "journey" ? "tab-button active" : "tab-button"}
            onClick={() => this.setView("journey")}
          >
            Song Journey
          </button>
        </div>

        <main className="layout">
          {this.state.activeView === "main" && (
            <>
              <section className="card card-gptRecs">
                <div className="card shadow-lg mb-4">
                  <div className="card-header">GPT Song Recommendations</div>
                  <div className="card-body">
                    <div className="input-group mb-3">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Describe the vibe (e.g. 'happy cheerful spring songs')"
                        name="recPrompt"
                        value={this.state.recPrompt}
                        onChange={this.handleInput}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={this.handleSongRecs}
                        disabled={!this.state.recPrompt}
                      >
                        Get Recommendations
                      </button>
                    </div>

                    <small className="text-muted">
                      GPT songs are saved to the database and shown in the history below.
                    </small>
                  </div>
                </div>

                {this.state.gptRecs.map((block, i) => (
                  <GPTRecs key={i} prompt={block.prompt} songs={block.songs} />
                ))}
              </section>

              <section className="card card-spotify">
                {isAuthed && (
                  <div className="mb-4">
                    <button className="btn btn-outline-dark" onClick={this.togglePlayPause}>
                      ⏯️ Play / Pause
                    </button>
                  </div>
                )}

                <div className="card shadow-lg mb-4">
                  <div className="card-header">Spotify Login</div>
                  <div className="card-body">
                    {loadingAuth ? (
                      <p>Checking login…</p>
                    ) : isAuthed ? (
                      <div>
                        <p>✅ You’re logged in to Spotify.</p>
                        <button className="btn btn-outline-danger" onClick={this.logout}>
                          Log out
                        </button>
                      </div>
                    ) : (
                      <>
                        <p>Not logged in.</p>
                        <button className="btn btn-success" onClick={this.startLogin}>
                          Log in with Spotify
                        </button>
                      </>
                    )}
                    {authError && <p className="text-danger mt-2">{authError}</p>}
                  </div>
                </div>

                {isAuthed && (
                  <SpotifyPlayer
                    selectedDevice={selectedDevice}
                    onDeviceChange={(id) => this.setState({ selectedDevice: id })}
                    onSongSaved={this.refreshSongs}
                  />
                )}

                <div className="my-4">
                  <button className="btn btn-success" onClick={this.fetchMessage}>
                    Get Message
                  </button>
                  <p className="mt-2">
                    {this.state.message && <strong>Message: </strong>}
                    {this.state.message}
                  </p>
                </div>

                <hr
                  style={{
                    color: "#000000",
                    backgroundColor: "#000000",
                    height: 0.5,
                    borderColor: "#000000",
                  }}
                />
              </section>

              <section className="card card-queueList">
                <QueueList
                  items={this.state.details}
                  onRefresh={this.refreshSongs}
                  selectedDevice={selectedDevice}
                />
              </section>
            </>
          )}

          {this.state.activeView === "journey" && (
            <section className="card card-graphView">
              <GraphView
                songs={this.state.details}
                gptRecs={this.state.gptRecs}
              />
            </section>
          )}
        </main>

        <footer className="footer">CS 222 • Team 99</footer>
      </div>
    );
  }
}

export default App;
