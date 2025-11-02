import './App.css';
import React from 'react';
import axios from "axios";
import PromptBox from "./PromptBox";
import QueueList from "./QueueList";

class App extends React.Component {
  state = {
    details: [],
    user: "",
    quote: "",
  };

  componentDidMount() {
    let data;

    axios
      .get("http://localhost:8000/wel/")
      .then((res) => {
        data = res.data;
        this.setState({
          details: data,
        });
      })
      .catch((err) => {});
  }

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
  };

  render() {
    return (
      <div className="App container jumbotron">
        {/* Replace the entire form with PromptBox */}
        <PromptBox
          user={this.state.user}
          quote={this.state.quote}
          onChange={this.handleInput}
          onSubmit={this.handleSubmit}
        />
  
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
      </div>
    );
  }
  
}

export default App;
