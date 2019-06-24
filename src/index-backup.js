import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

import * as serviceWorker from "./serviceWorker";
import { InitialDummyAttack } from "./entities/Attack";

import "antd/dist/antd.css";
import "./index.css";

/**
 * Construct the data structure first
 */

let data = {
  // datasetName: "MNIST_784",
  datasetName: "SPAMBASE",
  // datasetName: 'MOON',

  modelType: "logisticregression"
  // modelType: 'randomforest'
};

// fetch('/api/init', {
//     method: 'POST',
//     cache: 'no-cache',
//     headers: {
//         'Content-Type': 'application/json'
//     },
//     redirect: 'follow',
//     body: JSON.stringify({
//         datasetName: data['datasetName'],
//         modelType: data['modelType']
//     })
fetch(
  "/jsondata/" +
  data.modelType +
  "/initdata/initdata_" +
  data.datasetName +
  "_withmetrics.json"
)
  .then(response => response.json())
  .then(responseJSON => {
    /**
     * Continue constructing the data structure
     */
    data["init"] = responseJSON;

    // Each attack element is an instance of AbstractAttack class. The key here is the AbstractAttack id.

    // attack 1
    const initialAttack = new InitialDummyAttack(responseJSON);
    initialAttack.datasetName = data.datasetName;

    data["attacks"] = initialAttack;

    /**
     * Start the framework
     */

    ReactDOM.render(<App data={data}/>, document.getElementById("root"));
  });

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
