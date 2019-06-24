import React, { Component } from "react";
import App from "./App";
import { InitialDummyAttack } from "./entities/Attack";

import "antd/dist/antd.css";
import "./index.css";
import { Spin } from "antd";

/***
 * This component is used to pull data from the backend and pass it to App component
 * @export
 */
class AppWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {
        datasetName: "SPAMBASE",
        modelType: "logisticregression"
      }
    };

    fetch(
      "/jsondata/" +
      this.state.data.modelType +
      "/initdata/initdata_" +
      this.state.data.datasetName +
      "_withmetrics.json"
    )
      .then(response => response.json())
      .then(responseJSON => {
        /**
         * Continue constructing the data structure
         */
        const initialAttack = new InitialDummyAttack(responseJSON);
        initialAttack.datasetName = this.state.data.datasetName;
        this.setState({
          data: {
            init: responseJSON,
            attacks: initialAttack,
            datasetName: "SPAMBASE",
            modelType: "logisticregression"
          }
        });
      });
    this.switchDataSource = this.switchDataSource.bind(this);
  }

  /***
   * fetch the data source based on the data name.
   * @param {String} dataName The name of data.
   */
  switchDataSource(dataName) {
    fetch(
      "/jsondata/" +
      this.state.data.modelType +
      "/initdata/initdata_" +
      dataName +
      "_withmetrics.json"
    )
      .then(response => response.json())
      .then(responseJSON => {
        const initialAttack = new InitialDummyAttack(responseJSON);
        initialAttack.datasetName = dataName;
        this.setState({
          data: {
            init: responseJSON,
            attacks: initialAttack,
            datasetName: dataName,
            modelType: "logisticregression"
          }
        });
      });
  }

  render() {
    if ("init" in this.state.data) {
      return (
        <App data={this.state.data} switchDataSource={this.switchDataSource}/>
      );
    } else {
      return (
        <div style={{ width: "100%", padding: "24% 49%" }}>
          <Spin tip="Loading" size="large"/>
        </div>
      );
    }
  }
}

export default AppWrapper;
