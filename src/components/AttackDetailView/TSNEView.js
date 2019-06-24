import React, { Component } from "react";
import { findDOMNode } from "react-dom";
import * as d3 from "d3";
import { labelNormalColorMap } from "../../utils/ColorScheme";

export default class TSNEView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      elementHistory: {}
    };
  }

  shouldComponentUpdate() {
    return false;
  }

  componentWillReceiveProps = nextProps => {
    this.updateCanvas(nextProps);
  };

  componentDidMount() {
    const thisDOM = findDOMNode(this);
    this.setState(
      {
        canvasWidth: thisDOM.clientWidth
      },
      () => this.initializeCanvas()
    );
  }

  renderComponents(realSVG, svgRoot, attack) {
    //width and height
    const { selectedInstanceIdOnChange, actualPoisonColor } = this.props;
    const Xids = attack.Xids;

    let w = 470;
    let h = 380;
    let padding = 40;

    let dataset2 = attack["metrics"]["t-SNE"];
    const predictedLabels = attack["attackedPredictedLabel"];
    const parentPredictedLabel = attack.parent.attackedPredictedLabel;
    const lenWithoutPoison = attack.parent.attackedTrainData.length;

    //scale function
    let xScale = d3
      .scaleLinear()
      .domain([
        d3.min(dataset2, function(d) {
          return d[0];
        }),
        d3.max(dataset2, function(d) {
          return d[0];
        })
      ])
      .range([0 + padding, w - padding]);

    let yScale = d3
      .scaleLinear()
      .domain([
        d3.min(dataset2, function(d) {
          return d[1];
        }),
        d3.max(dataset2, function(d) {
          return d[1];
        })
      ])
      .range([h - padding, padding]);

    //create svg element
    let svg = svgRoot;
    let circle = svg
      .selectAll("circle")
      .data(dataset2)
      .enter()
      .append("circle")
      .attr("id", function(_d, i) {
        return "tsne-" + attack["Xids"][i];
      })
      .attr("cx", function(d) {
        return xScale(d[0]);
      })
      .attr("cy", function(d) {
        return yScale(d[1]);
      })
      .attr("r", function() {
        return 5;
      })
      .attr("stroke-width", function() {
        return 1;
      })
      .attr("stroke", function() {
        return "#666";
      })
      .attr("fill", function(d, i) {
        if (
          i < lenWithoutPoison &&
          predictedLabels[i] !== parentPredictedLabel[i]
        ) {
          // mis classified
          return `url(#pattern-stripe-${predictedLabels[i]})`;
        } else if (i < 400) {
          return labelNormalColorMap[d[2]];
        } else {
          return actualPoisonColor;
        }
      })
      .style("opacity", 0.5)
      .attr("transform", transform(d3.zoomIdentity))
      .on("click", (_d, i) => {
        selectedInstanceIdOnChange(Xids[i]);
      });

    realSVG.call(
      d3
        .zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", function() {
          svgRoot.attr("transform", d3.event.transform);

          let new_xScale = d3.event.transform.rescaleX(xScale);
          let new_yScale = d3.event.transform.rescaleY(yScale);

          circle
            .data(dataset2)
            .attr("cx", function(d) {
              return new_xScale(d[0]);
            })
            .attr("cy", function(d) {
              return new_yScale(d[1]);
            });
        })
    );

    function transform(t) {
      return function(d) {
        return "translate(" + t.apply(d) + ")";
      };
    }
  }

  initializeCanvas() {
    const thisDOM = findDOMNode(this);
    const svgRoot = d3.select(thisDOM).select("svg");
    const baseGroup = d3.select(thisDOM).select("#tsne-base-group");
    const { attack } = this.props;
    this.renderComponents(svgRoot, baseGroup, attack);
  }

  sortWithIndeces(tobeSort) {
    let toSort = Array.from(tobeSort);
    for (let i = 0; i < toSort.length; i++) {
      toSort[i] = [toSort[i], i];
    }
    toSort.sort(function(left, right) {
      return Math.abs(left[0]) > Math.abs(right[0]) ? -1 : 1;
    });
    toSort.sortIndices = [];
    for (let j = 0; j < toSort.length; j++) {
      toSort.sortIndices.push(toSort[j][1]);
      toSort[j] = toSort[j][0];
    }
    return toSort;
  }

  updateCanvas(nextProps) {
    const { attack } = this.props;
    const { attackedTrainData } = attack;
    const thisDOM = findDOMNode(this);
    d3.select(thisDOM)
      .selectAll("circle")
      .style("opacity", 0.5)
      .attr("r", 5);
    d3.select(thisDOM)
      .select("#tsne-tip")
      .remove();

    if (nextProps.selectedInstanceId !== -1) {
      let elementHistory = {};
      const toBeUpdated = d3
        .select(thisDOM)
        .select("#tsne-" + nextProps.selectedInstanceId);
      elementHistory["id"] = nextProps.selectedInstanceId;
      elementHistory["r"] = toBeUpdated.attr("r");
      this.setState({
        elementHistory: elementHistory
      });
      d3.select(thisDOM)
        .selectAll("circle")
        .style("opacity", 0.1);
      toBeUpdated.attr("r", "10").style("opacity", 1);

      if (nextProps.attack["datasetName"] === "MNIST_784") {
        const canvas = d3
          .select(thisDOM)
          .select("svg")
          .append("g")
          .attr("id", "tsne-tip")
          .attr("transform", "translate(420,2 )");

        canvas
          .append("rect")
          .attr("width", "101px")
          .attr("height", "105px")
          .attr("fill", "#FFF")
          .attr("rx", 6)
          .attr("ry", 6)
          .attr("stroke", "#ccc");

        canvas
          .append("text")
          .attr("dy", "1.2em")
          .attr("x", "0.7em")
          .style("font-size", "1.2em")
          .text("ID:" + nextProps.selectedInstanceId);

        canvas
          .append("svg:image")
          .attr("y", "1em")
          .attr("x", "0em")
          .attr("height", "100px")
          .attr("width", "100px")
          .attr(
            "xlink:href",
            require("../../images/mnist_pic/mnist_" +
              nextProps.selectedInstanceId +
              ".png")
          );
      } else if (nextProps.attack["datasetName"] === "SPAMBASE") {
        // for spambase data
        let tipData = [];
        const dimNames = nextProps.attack["dimNames"];
        const sortedFrequency = this.sortWithIndeces(
          attackedTrainData[
            attack.Xids.indexOf(nextProps.selectedInstanceId)
            ].slice(
            0,
            attackedTrainData[attack.Xids.indexOf(nextProps.selectedInstanceId)]
              .length - 3
          )
        );
        for (let i = 0; i < 5; i++) {
          tipData.push([
            dimNames[sortedFrequency.sortIndices[i]],
            Math.abs(
              Math.round(
                attackedTrainData[
                  attack.Xids.indexOf(nextProps.selectedInstanceId)
                  ][sortedFrequency.sortIndices[i]] * 100
              ) / 100
            )
          ]);
        }

        // tip
        const canvas = d3
          .select(thisDOM)
          .select("svg")
          .append("g")
          .attr("id", "tsne-tip")
          .attr("transform", "translate(350,20 )");

        canvas
          .append("rect")
          .attr("width", "130px")
          .attr("height", "100px")
          .attr("fill", "#FFF")
          .attr("rx", 5)
          .attr("ry", 5)
          .attr("stroke", "#ccc")
          .attr("stroke-width", 0.5);

        canvas
          .append("text")
          .attr("dy", "1.2em")
          .attr("x", "0.7em")
          .style("font-size", "1.2em")
          .text("ID:" + nextProps.selectedInstanceId);

        const fillTip = canvas
          .selectAll("text")
          .data(tipData)
          .enter();

        fillTip
          .append("text")
          .attr("dy", function(_d, i) {
            return 2.2 + i + "em";
          })
          .attr("x", "1em")
          .style("fill", "black")
          .text(function(d) {
            return d[0] + ": " + d[1];
          });
      }
    }
  }

  render() {
    return (
      <div id="tsne-wrapper" style={{ height: "100%", width: "100%" }}>
        <svg id="tsne" style={{ height: 360, width: "100%" }}>
          <defs>
            <pattern
              id="pattern-stripe-0"
              width="4"
              height="4"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect
                width="2"
                height="4"
                transform="translate(0,0)"
                fill={labelNormalColorMap[0]}
              />
            </pattern>
            <pattern
              id="pattern-stripe-1"
              width="4"
              height="4"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect
                width="2"
                height="4"
                transform="translate(0,0)"
                fill={labelNormalColorMap[1]}
              />
            </pattern>
          </defs>
          <g id="tsne-base-group"/>
        </svg>
      </div>
    );
  }
}
