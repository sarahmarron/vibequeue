import "./App.css";
import React from "react";
import axios from "axios";
import PromptBox from "./PromptBox";
import QueueList from "./QueueList";
import GraphView from "./GraphView";
import SpotifyPlayer from "./Components/SpotifyPlayer.js";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";

class App extends React.Component {
  state = {
    details: [],
    title: "",
    artist: "",
    recPrompt: "", // text for GPT song recommendations
    message: "",
    isAuthed: false,
    authError: "",
    loadingAuth: true,
  };

  fetchMessage = () => {
    axios
      .get("http://127.0.0.1:8000/message/")
      .then((res) => {
        this.setState({ message: res.data.text });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  componentDidMount() {
    // keep existing fetch
    axios
      .get(`${API_BASE}/songs/`, { withCredentials: true }) // now loads songs from backend
      .then((res) => this.setState({ details: res.data }))
      .catch(() => {});

    // check Spotify auth status
    this.checkAuth();
  }

  checkAuth = async () => {
    try {
      this.setState({ loadingAuth: true, authError: "" });
      const res = await axios.get(`${API_BASE}/is-authenticated/`, {
        withCredentials: true,
      });
      this.setState({ isAuthed: Boolean(res.data?.status) });
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
      const { url } = res.data;
      // Always open Spotify auth page, even if already logged in
      // window.location.href = url; // opens in same tab
      window.open(url, "_blank");
      // or use window.open(url, "_blank"); to open in new tab
    } catch (e) {
      console.error("Failed to start login", e);
    }
  };

  renderSwitch = (param) => {
    switch (param + 1) {
      case 1:
        return "primary ";
      case 2:
        return "secondary";
      case 3:
        return "success";
      case 4:
        return "danger";
      case 5:
        return "warning";
      case 6:
        return "info";
      default:
        return "yellow";
    }
  };

  handleInput = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
    });
  };

  handleSubmit = (e) => {
    e.preventDefault();

    const { title, artist } = this.state;
    if (!title || !artist) {
      return; // don't submit empty songs
    }

    axios
      .post(`${API_BASE}/songs/`, {
        title,
        artist,
      })
      .then((res) => {
        // append the created Song from backend
        this.setState((prev) => ({
          details: [...prev.details, res.data],
          title: "",
          artist: "",
        }));
      })
      .catch((err) => {
        console.error("Failed to save song", err);
      });
  };

  // call backend GPT endpoint to generate + save song recs
  handleSongRecs = (e) => {
    e.preventDefault();

    const { recPrompt } = this.state;
    if (!recPrompt) return;

    axios
      .post(`${API_BASE}/song-recs/`, { prompt: recPrompt })
      .then((res) => {
        // res.data is an array of Song objects created by backend
        this.setState((prev) => ({
          details: [...prev.details, ...res.data],
          recPrompt: "",
        }));
      })
      .catch((err) => {
        console.error("Failed to get GPT song recs", err);
      });
  };

  logout = async () => {
    try {
      await axios.post(`${API_BASE}/logout/`, null, { withCredentials: true });
    } catch (e) {
      // optional: console.error(e);
    } finally {
      // Refresh state to reflect logged-out UI
      this.checkAuth();
    }
  };

  render() {
    const { loadingAuth, isAuthed, authError } = this.state;

    return (
      <div className="App container jumbotron">
        {/* Replace the entire form with PromptBox */}
        <PromptBox
          title={this.state.title}
          artist={this.state.artist}
          onChange={this.handleInput}
          onSubmit={this.handleSubmit}
        />

        {/* GPT Song Recommendations */}
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
              GPT songs are saved to the database and shown in the list below.
            </small>
          </div>
        </div>

        {/* Spotify login card */}
        <div className="card shadow-lg mb-4">
          <div className="card-header">Spotify Login</div>
          <div className="card-body">
            {loadingAuth ? (
              <p>Checking login…</p>
            ) : isAuthed ? (
              <div>
                <p>✅ You’re logged in to Spotify.</p>
                <button
                  className="btn btn-outline-danger"
                  onClick={this.logout}
                >
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

        {/* Spotify playback section */}
        {this.state.isAuthed && <SpotifyPlayer />}

        {/* Database button */}
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

        {/* Replace the map section with QueueList */}
        <QueueList
          items={this.state.details}
          colorForIndex={(i) => this.renderSwitch(i % 6)}
        />

        {/* Graphical View of User Inputs */}
        <GraphView items={this.state.details} />
      </div>
    );
  }
}

export default App;
