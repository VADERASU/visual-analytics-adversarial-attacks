import React, { Component } from "react";
import { findDOMNode } from "react-dom";
import * as d3 from "d3";
import { Table, Tag } from "antd";
import "../styles/Feature.css";
import { labelNormalColorMap } from "../../utils/ColorScheme";


const FEATURE_CANVAS_WIDTH = 270;

const getRanks = (arr) => {
  const sorted = arr.slice().sort(function(a, b) {
    return b - a;
  });
  return arr.slice().map(function(v) {
    return sorted.indexOf(v) + 1;
  });
};

const getOrdinalStr = (n) => [, "st", "nd", "rd"][n % 100 >> 3 ^ 1 && n % 10] || "th";

export default class FeatureViewAlt extends Component {
  constructor(props) {
    super(props);

    this.state = {
      wiredTableSortBugVoidFirstUpdate: false
    };
  }

  shouldComponentUpdate() {
    return false;
  }

  componentWillReceiveProps() {
    this.forceUpdate();
    // this.updateCanvas();
  }

  componentDidMount() {
    const thisDOM = findDOMNode(this);
    this.setState(
      {
        canvasWidth: thisDOM.clientWidth
      },
      () => this.initializeCanvas()
    );
  }

  renderRect(svgRoot, data, maxScaleValue) {
    let g = svgRoot.select(".freq-base");

    // let width = 260;
    let width = FEATURE_CANVAS_WIDTH - 10;
    let height = 40;

    let x = d3
      .scaleBand()
      .rangeRound([0, width])
      .padding(0.2);

    let y = d3.scaleLinear().rangeRound([height, 0]);
    let valueRange = data.map(d => d[3]);

    if (valueRange.length === 25) {
      valueRange = valueRange.slice(0, 24);
    }
    // console.log(valueRange);
    x.domain(valueRange);
    // let roof = d3.max(data, d => Number(d[0]));
    // roof = Math.max(
    //     roof,
    //     d3.max(data, function (d) {
    //         return Number(d[1]);
    //     })
    // );

    // y.domain([0, roof]);
    y.domain([0, maxScaleValue]);

    g.append("g")
      .attr("class", "feature-axis")
      .attr("transform", "translate(0," + height + ")")
      .call(
        d3
          .axisBottom(x)
          .tickValues([
            valueRange[0],
            valueRange[3],
            valueRange[7],
            valueRange[11],
            valueRange[15],
            valueRange[19],
            valueRange[23]
          ])
          .tickFormat(d3.format(".1f"))
      );

    const bar = g
      .selectAll(".bar")
      .data(data)
      .enter();

    bar
      .append("rect")
      .attr("class", "bar")
      .style("fill", labelNormalColorMap[1])
      .attr("x", function(d) {
        return x(d[3]);
      })
      .attr("y", function(d) {
        return y(Number(d[0]));
      })
      .attr("width", x.bandwidth() / 3)
      .attr("height", function(d) {
        return height - y(Number(d[0]));
      });

    bar
      .append("rect")
      .attr("class", "bar")
      .style("fill", labelNormalColorMap[0])
      .attr("x", function(d) {
        return x(d[3]) + x.bandwidth() / 3;
      })
      .attr("y", function(d) {
        return y(Number(d[1]));
      })
      .attr("width", x.bandwidth() / 3)
      .attr("height", function(d) {
        return height - y(Number(d[1]));
      });

    bar
      .append("rect")
      .attr("class", "bar")
      .style("fill", this.props.actualPoisonColor) // labelNormalColorMap[3])
      .attr("x", function(d) {
        return x(d[3]) + (x.bandwidth() / 3) * 2;
      })
      .attr("y", function(d) {
        return y(Number(d[2]));
      })
      .attr("width", x.bandwidth() / 3)
      .attr("height", function(d) {
        return height - y(Number(d[2]));
      });
  }

  initializeCanvas() {
    const thisDOM = findDOMNode(this);
    const { attack } = this.props;
    const featureDistributionData = attack["featureImportance"];
    // console.log(featureDistributionData);
    let weights = attack["attackedModel"]["params"]["weights"][0];

    // compute the maximum value in all featureDistributionData
    const maxScaleValue = d3.max(d3.merge(d3.merge(
      featureDistributionData.map(f1 => f1.map(f2 => [f2[0], f2[1], f2[2]]))
    )));

    for (let i = 0; i < weights.length; i++) {
      let featureGroup = d3.select(thisDOM).select("#freq" + i);
      this.renderRect(featureGroup, featureDistributionData[i], maxScaleValue);
    }
  }

  updateCanvas() {
  }

  componentWillReceiveProps = nextProps => {
    this.forceUpdate();
  };

    generateColumns() {
        return [
            {
                title: "ID",
                dataIndex: "id",
                key: "id",
                width: 40,
                align: "center",
                render: d => {
                    return <div style={{width: 14}}>{d}</div>;
                }
            },
            {
                title: "Name",
                dataIndex: "featureName",
                key: "featureName",
                width: 105,
                render: d => <Tag>{d}</Tag>
            },
            {
                title: "Distribution",
                dataIndex: "featurePlotId",
                key: "featurePlotId",
                align: "center",
                width: FEATURE_CANVAS_WIDTH + 20,
                render: d => {
                    return (
                        <svg id={"freq" + d} style={{width: `${FEATURE_CANVAS_WIDTH}px`, height: "57px"}}>
                            <g className="freq-base"/>
                        </svg>
                    );
                }
            },
            {
                title: "Victim",
                dataIndex: "importance",
                key: "before",
                align: 'center',
                sorter: (a, b) => {
                    return (
                        Math.abs(parseFloat(a["importance"]["parentWeight"])) -
                        Math.abs(parseFloat(b["importance"]["parentWeight"]))
                    );
                },
                render: d => {
                    return (
                        <div>
                            <div>
                                {Math.abs(parseFloat(d["parentWeight"])).toFixed(3)}
                            </div>
                            <div>
                                {`(${d['parentRank'] + getOrdinalStr(d['parentRank'])})`}
                            </div>
                        </div>
                    );
                }
            },
            {
                title: "Poison",
                dataIndex: "importance",
                key: "after",
                align: 'center',
                sorter: (a, b) => {
                    return (
                        Math.abs(parseFloat(a["importance"]["currentWeight"])) -
                        Math.abs(parseFloat(b["importance"]["currentWeight"]))
                    );
                },
                render: d => {
                    // return `${Math.abs(parseFloat(d["currentWeight"])).toFixed(3)} (${d['currentRank']})`;

                    const {currentWeight, currentRank, parentRank} = d;
                    const diff = currentRank - parentRank;

                    let style = {};
                    if (diff !== 0) {
                        style.color = (diff > 0) ? 'red' : 'green';
                    }

                    return (
                        <div>
                            <div>
                                {Math.abs(parseFloat(currentWeight)).toFixed(3)}
                            </div>
                            <div
                                style={style}
                            >
                                {`(${currentRank + getOrdinalStr(currentRank)})`}
                            </div>
                        </div>
                    );
                }
            },
            {
                title: "Diff.",
                dataIndex: "importance",
                key: "change",
                align: 'center',
                sorter: (a, b) => {
                    const diffA =
                        parseFloat(a["importance"]["currentWeight"]) -
                        parseFloat(a["importance"]["parentWeight"]);
                    const diffB =
                        parseFloat(b["importance"]["currentWeight"]) -
                        parseFloat(b["importance"]["parentWeight"]);
                    return Math.abs(diffA) - Math.abs(diffB);
                },
                render: d => {
                    const diff =
                        parseFloat(d["currentWeight"]) - parseFloat(d["parentWeight"]);
                    return Math.abs(diff).toFixed(3);
                }
            }
        ];
    }

  generateData() {
    const { attack } = this.props;
    const { dimNames, attackedModel, parent } = attack;

    const weights = attackedModel["params"]["weights"][0];
    const parentWeights = parent["attackedModel"]["params"]["weights"][0];

    // Added ranking numbers
    const weightRankings = getRanks(weights.map(w => Math.abs(w))),
      parentWeightRankings = getRanks(parentWeights.map(w => Math.abs(w)));

    const retData = weights.map((weight, i) => {
      let obj = {};
      obj["key"] = i;
      obj["id"] = i;
      obj["featureName"] = dimNames[i];
      obj["featurePlotId"] = i;
      obj["importance"] = {
        currentWeight: weight,
        parentWeight: parentWeights[i],
        currentRank: weightRankings[i],
        parentRank: parentWeightRankings[i]
      };
      return obj;
    });
    return retData;
  }

  svgUpdate() {
    const thisDOM = findDOMNode(this);
    if (this.state.wiredTableSortBugVoidFirstUpdate) {
      this.setState({
        wiredTableSortBugVoidFirstUpdate: false
      });
    } else {
      d3.select(thisDOM)
        .selectAll(".freq-base")
        .remove();
      d3.select(thisDOM)
        .selectAll("svg")
        .append("g")
        .attr("class", "freq-base");
      this.initializeCanvas();
    }
  }

  render() {
    const columns = this.generateColumns();
    const data = this.generateData();
    return (
      <div id="feature-wrapper" style={{ height: "100%", width: "100%" }}>
        <Table
          style={{
            height: 285,
            width: "100%"
          }}
          className="compact"
          size="small"
          scroll={{
            y: 285 - 45
            // x: 600
          }}
          bordered={false}
          columns={columns}
          dataSource={data}
          pagination={false}
          onHeaderRow={() => {
            return {
              onClick: () => {
                setTimeout(() => this.svgUpdate(), 100);
              }
            };
          }}
        />
      </div>
    );
  }
}
