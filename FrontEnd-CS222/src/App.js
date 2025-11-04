import "./App.css";
import React from "react";
import axios from "axios";
import PromptBox from "./PromptBox";
import QueueList from "./QueueList";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";

class App extends React.Component {
  state = {
    details: [],
    user: "",
    quote: "",
    message: "",
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
    loadingAuth: true,
    isAuthed: false,
    authError: "",
  };

  componentDidMount() {
    // keep existing fetch
    axios
      .get(`${API_BASE}/wel/`, { withCredentials: true })
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
  
    axios
      .post("http://localhost:8000/wel/", {
        name: this.state.user,
        detail: this.state.quote,
      })
      .then((res) => {
        this.setState((prev) => ({
          details: [...prev.details, { name: prev.user, detail: prev.quote }],
          user: "",
          quote: "",
        }));
      })
      .catch((err) => {
        console.error(err);
        // Optional: still show locally if backend isn't running
        this.setState((prev) => ({
          details: [...prev.details, { name: prev.user, detail: prev.quote }],
          user: "",
          quote: "",
        }));
      });
    axios
      .post(
        `${API_BASE}/wel/`,
        {
          name: this.state.user,
          detail: this.state.quote,
        },
        { withCredentials: true }
      )
      .then(() => this.setState({ user: "", quote: "" }))
      .catch(() => {});
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
          user={this.state.user}
          quote={this.state.quote}
          onChange={this.handleInput}
          onSubmit={this.handleSubmit}
        />
  
      <div className="container jumbotron ">
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

        {/* Database button */}
        <div className="my-4">
          <button
            className="btn btn-success"
            onClick={this.fetchMessage}
          >
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

        {this.state.details.map((detail, id) => (
          <div key={id}>
            <div className="card shadow-lg">
              <div
                className={"bg-" + this.renderSwitch(id % 6) + " card-header"}
              >
                Quote {id + 1}
              </div>
              <div className="card-body">
                <blockquote
                  className={
                    "text-" + this.renderSwitch(id % 6) + " blockquote mb-0"
                  }
                >
                  <h1> {detail.detail} </h1>
                  <footer className="blockquote-footer">
                    <cite title="Source Title">{detail.name}</cite>
                  </footer>
                </blockquote>
              </div>
            </div>
            <span className="border border-primary "></span>
          </div>
        ))}
      </div>
    );
  }
  
}

export default App;
