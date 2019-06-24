import React, { Component } from "react";
import { findDOMNode } from "react-dom";
import * as d3 from "d3";
import { Col, Row, Table, Tag } from "antd";
import "../styles/InstanceView.css";
import scale_spam from "../../images/scale_spam.png";
import scale_mnist from "../../images/scale_mnist.png";
import { labelNormalColorMap } from "../../utils/ColorScheme";

export default class InstanceView extends Component {
  constructor(props) {
    super(props);
    const originalRankedData = this.generateData();
    this.state = {
      linearGradientIdPrefix: "iv" + props.attack.name.split(" ")[1],
      wiredTableSortBugVoidFirstUpdate: false,
      originalRankedData: originalRankedData,
      currentRankedData: [originalRankedData["victim"]]
        .concat(originalRankedData["flipped"])
        .concat(originalRankedData["rest"])
    };
  }

  componentWillReceiveProps = nextProps => {
    const { rankedInstanceDisplayOption } = nextProps;
    const { originalRankedData } = this.state;
    var tempData = [];
    if (rankedInstanceDisplayOption[0] === 1) {
      tempData = tempData.concat(originalRankedData["victim"]);
    }
    if (rankedInstanceDisplayOption[1] === 1) {
      tempData = tempData.concat(originalRankedData["poison"]);
    }
    if (rankedInstanceDisplayOption[2] === 1) {
      tempData = tempData.concat(originalRankedData["flipped"]);
    }
    if (rankedInstanceDisplayOption[3] === 1) {
      tempData = tempData.concat(originalRankedData["rest"]);
    }
    this.setState({
      currentRankedData: tempData
    });

    this.forceUpdate();
    setTimeout(() => this.svgUpdate(), 100);
    // this.updateCanvas(tempData);
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

  // updateCanvas(newSortedData) {
  //   const thisDOM = findDOMNode(this);
  //   d3.select(thisDOM)
  //     .selectAll(".db-base")
  //     .remove();
  //   d3.select(thisDOM)
  //     .selectAll("svg")
  //     .append("g")
  //     .attr("class", "db-base");
  //
  //   const distDomain = d3.extent(flatten([0, 1]));
  //   newSortedData.forEach((data_item, i) => {
  //     const svgRoot = d3
  //       .select(thisDOM)
  //       .select("#deciB" + data_item["decisionBoundary"]);
  //     this.renderComponents(svgRoot, data_item, distDomain);
  //   });
  // }

  renderComponents(svgRoot, data, distDomain) {
    const { linearGradientIdPrefix } = this.state;

    let wrapData = [];
    wrapData.push(data);

    const g = svgRoot.select(".db-base");
    const ele = g
      .selectAll("g")
      .data(wrapData)
      .enter();
    const height = 65;
    const width = 160;
    const BAR_MAX_WIDTH = 65;
    const BACK_RECT_WIDTH = 14;


    const distScaler = d3
      .scaleSymlog()
      .domain(distDomain)
      .range([0, 1]);

    ele
      .append("rect")
      .attr("width", BACK_RECT_WIDTH)
      .attr("height", height)
      .attr("fill", `url(#${linearGradientIdPrefix}gradient3)`)
      .attr("transform", "translate(" + (width / 2 - BACK_RECT_WIDTH) + " ,0)");

    ele
      .append("rect")
      .attr("width", BACK_RECT_WIDTH)
      .attr("height", height)
      .attr("fill", `url(#${linearGradientIdPrefix}gradient1)`)
      .attr("transform", "translate(" + width / 2 + ",0)");

    // decision Boundary

    ele
      .append("line")
      .attr("x1", width / 2)
      .attr("y1", 0)
      .attr("x2", width / 2)
      .attr("y2", height)
      .style("stroke", "#ccc");

    ele
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", height)
      .style("stroke", "#ccc");

    ele
      .append("line")
      .attr("x1", width)
      .attr("y1", 0)
      .attr("x2", width)
      .attr("y2", height)
      .style("stroke", "#ccc");

    // parent circle

    const raScaler = d3
      .scaleLinear()
      .domain([0.5, 1])
      .range([1, 0]);

    ele
      .filter(function(d) {
        return d["predLabel1"] !== undefined;
      })
      .append("circle")
      .attr("cx", function(d) {
        if (d["predLabel1"] === 0) {
          // if current point is class of victim, on left side;
          return width / 2 - BAR_MAX_WIDTH * Math.abs(distScaler(d["dist1"]));
        } else if (d["predLabel1"] === 1) {
          // other class on the right side
          return width / 2 + BAR_MAX_WIDTH * Math.abs(distScaler(d["dist1"]));
        } else return NaN;
      })
      .attr("cy", height / 2)
      .attr("r", function(d) {
        if (d["prop1"]) {
          // return raScaler(d3.max(d[5])) * 12 + 8;
          return 2;
        } else {
          return 0;
        }
      })
      .style("fill", function(d) {
        return labelNormalColorMap[d["predLabel1"]];
      })
      .style("fill-opacity", 0.4)
      .style("stroke", d => labelNormalColorMap[d["predLabel1"]])
      .style("stroke-width", "2px");

    // curr circle

    ele
      .append("circle")
      .attr("cx", function(d) {
        // if current point is class of victims
        if (d["predLabel2"] === 0) {
          return width / 2 - BAR_MAX_WIDTH * Math.abs(distScaler(d["dist2"]));
        } else if (d["predLabel2"] === 1) {
          return width / 2 + BAR_MAX_WIDTH * Math.abs(distScaler(d["dist2"]));
        } else {
          return NaN;
        }
      })
      .attr("cy", height / 2)
      .attr("r", function(d) {
        if (d["prop2"]) {
          // return raScaler(d3.max(d["prop2"])) * 12 + 8;
          return 2;
        } else {
          return 0;
        }
      })
      .style("fill", function(d) {
        return labelNormalColorMap[d["predLabel2"]];
      })
      .style("fill-opacity", 0.4)
      .style("stroke", d => labelNormalColorMap[d["predLabel2"]])
      .style("stroke-width", "2px");

    ele
      .filter(d => !d["id"].startsWith("P"))
      .append("line")
      .attr("x1", function(d) {
        if (d["predLabel1"] === 0) {
          // if current point is class of victim, on left side;
          return width / 2 - BAR_MAX_WIDTH * Math.abs(distScaler(d["dist1"]));
        } else if (d["predLabel1"] === 1) {
          // other class on the right side
          return width / 2 + BAR_MAX_WIDTH * Math.abs(distScaler(d["dist1"]));
        } else return NaN;
      })
      .attr("y1", function(d) {
        if (d["predLabel1"] === 0) {
          return height / 2 - raScaler(d["prop1"]) * 20;
        } else {
          return height / 2 - raScaler(1 - d["prop1"]) * 20;
        }
      })
      .attr("x2", function(d) {
        if (d["predLabel1"] === 0) {
          // if current point is class of victim, on left side;
          return width / 2 - BAR_MAX_WIDTH * Math.abs(distScaler(d["dist1"]));
        } else if (d["predLabel1"] === 1) {
          // other class on the right side
          return width / 2 + BAR_MAX_WIDTH * Math.abs(distScaler(d["dist1"]));
        } else return NaN;
      })
      .attr("y2", function(d) {
        if (d["predLabel1"] === 0) {
          return raScaler(d["prop1"]) * 20 + height / 2;
        } else {
          return raScaler(1 - d["prop1"]) * 20 + height / 2;
        }
      })
      .style("stroke", d => labelNormalColorMap[d["predLabel1"]])
      .style("stroke-width", "2px");

    ele
      .append("line")
      .attr("x1", function(d) {
        if (d["predLabel2"] === 0) {
          // if current point is class of victim, on left side;
          return width / 2 - BAR_MAX_WIDTH * Math.abs(distScaler(d["dist2"]));
        } else if (d["predLabel2"] === 1) {
          // other class on the right side
          return width / 2 + BAR_MAX_WIDTH * Math.abs(distScaler(d["dist2"]));
        } else return NaN;
      })
      .attr("y1", function(d) {
        if (d["predLabel2"] === 0) {
          return height / 2 - raScaler(d["prop2"]) * 20;
        } else {
          return height / 2 - raScaler(1 - d["prop2"]) * 20;
        }
      })
      .attr("x2", function(d) {
        if (d["predLabel2"] === 0) {
          // if current point is class of victim, on left side;
          return width / 2 - BAR_MAX_WIDTH * Math.abs(distScaler(d["dist2"]));
        } else if (d["predLabel2"] === 1) {
          // other class on the right side
          return width / 2 + BAR_MAX_WIDTH * Math.abs(distScaler(d["dist2"]));
        } else return NaN;
      })
      .attr("y2", function(d) {
        if (d["predLabel2"] === 0) {
          return height / 2 + raScaler(d["prop2"]) * 20;
        } else {
          return height / 2 + raScaler(1 - d["prop2"]) * 20;
        }
      })
      .style("stroke", d => labelNormalColorMap[d["predLabel2"]])
      .style("stroke-width", "2px");

    // curr line
    ele
      .filter(d => !d["id"].startsWith("P"))
      .append("line")
      .attr("marker-end", d => (d["id"].startsWith("P") ? null : "url(#arrow)"))
      .attr("x1", function(d) {
        if (d["dist1"]) {
          if (d["predLabel1"] === 0) {
            // if current point is class of victim, on left side;
            return width / 2 - BAR_MAX_WIDTH * Math.abs(distScaler(d["dist1"]));
          } else {
            // other class on the right side
            return width / 2 + BAR_MAX_WIDTH * Math.abs(distScaler(d["dist1"]));
          }
        } else {
          if (d["predLabel2"] === 0) {
            return width / 2 - BAR_MAX_WIDTH * Math.abs(distScaler(d["dist2"]));
          } else {
            return width / 2 + BAR_MAX_WIDTH * Math.abs(distScaler(d["dist2"]));
          }
        }
      })
      .attr("y1", height / 2)
      .attr("x2", function(d) {
        if (d["predLabel2"] === 0) {
          return width / 2 - BAR_MAX_WIDTH * Math.abs(distScaler(d["dist2"]));
        } else {
          return width / 2 + BAR_MAX_WIDTH * Math.abs(distScaler(d["dist2"]));
        }
      })
      .attr("y2", height / 2)
      .style("stroke", "#000");
  }

  shouldComponentUpdate() {
    return false;
  }

  initializeCanvas() {
    const thisDOM = findDOMNode(this);
    const data = this.state.currentRankedData;
    const originalData = this.state.originalRankedData;
    const originalDataCat = [originalData["victim"]]
      .concat(originalData["poison"])
      .concat(originalData["flipped"])
      .concat(originalData["rest"]);
    const distRange = originalDataCat.map(d => {
      if (d["dist1"] !== "NaN") {
        return Math.max(Number(d["dist1"]), Number(d["dist2"]));
      } else {
        return Number(d["dist2"]);
      }
    });
    let distDomain = d3.extent(distRange);
    distDomain[0] = 0;
    // const distDomain = d3.extent(flatten([0, 1]));
    data.forEach((data_item, i) => {
      const svgRoot = d3
        .select(thisDOM)
        .select("#deciB" + data_item["decisionBoundary"]);
      this.renderComponents(svgRoot, data_item, distDomain);
    });
  }

  svgUpdate() {
    const thisDOM = findDOMNode(this);
    if (this.state.wiredTableSortBugVoidFirstUpdate) {
      this.setState({
        wiredTableSortBugVoidFirstUpdate: false
      });
    } else {
      d3.select(thisDOM)
        .selectAll(".db-base")
        .remove();
      d3.select(thisDOM)
        .selectAll("svg")
        .append("g")
        .attr("class", "db-base");
      this.initializeCanvas();
    }
  }

  generateColumns() {
    const { linearGradientIdPrefix } = this.state;
    const { actualPoisonColor, attack } = this.props;
    return [
      {
        title: "ID",
        dataIndex: "id",
        key: "id",
        align: "right",
        width: 35,
        render: d => {
          return <div style={{ width: 14 }}>{d}</div>;
        }
      },
      {
        title: "DBD(V.)",
        dataIndex: "dist1",
        key: "dist1",
        width: 90,
        sorter: (a, b) => {
          return parseFloat(a["dist1"]) - parseFloat(b["dist1"]);
        },
        render: d => (isNaN(d) ? "N/A" : d)
      },
      {
        title: "Prob(V.)",
        dataIndex: "prop1",
        key: "prop1",
        // align: "center",
        width: 90,
        sorter: (a, b) => {
          let aTemp = parseFloat(a["prop1"]);
          let bTemp = parseFloat(b["prop1"]);
          aTemp = aTemp <= 0.5 ? 1 - aTemp : aTemp;
          bTemp = bTemp <= 0.5 ? 1 - bTemp : bTemp;
          return aTemp - bTemp;
        },
        render: d => {
          const label = d <= 0.5 ? 1 : 0;
          const actualValue = d <= 0.5 ? 1 - d : d;

          return (
            <div
              style={{
                width: 35,
                color: labelNormalColorMap[label]
              }}
            >
              {actualValue === 2 ? "N/A" : Number(actualValue).toFixed(2)}
            </div>
          );
        }
      },
      {
        title: () => {
          // return (attack["datasetName"] === "SPAMBASE") ? <div>
          //   <div>Decision Boundary</div>
          //   <div><img alt="scale" src={scale_spam} style={{ width: "160px" }}/></div>
          // </div> : <div>
          //   <div>Decision Boundary</div>
          //   <div><img alt="scale" src={scale_mnist} style={{ width: "160px" }}/></div>
          // </div>;
            return 'Decision Boundary';
        },
        dataIndex: "decisionBoundary",
        key: "decisionBoundary",
        align: "center",
        width: 180,
        render: d => {
          return (
            <svg id={"deciB" + d} style={{ width: "160px", height: "65px" }}>
              <defs>
                <linearGradient id={`${linearGradientIdPrefix}gradient1`}>
                  <stop className="stop-left1" offset="0"/>
                  <stop className="stop-right1" offset="1"/>
                </linearGradient>
                <linearGradient id={`${linearGradientIdPrefix}gradient2`}>
                  <stop className="stop-right1" offset="0"/>
                  <stop className="stop-left1" offset="1"/>
                </linearGradient>
                <linearGradient id={`${linearGradientIdPrefix}gradient3`}>
                  <stop className="stop-right2" offset="0"/>
                  <stop className="stop-left2" offset="1"/>
                </linearGradient>
                <linearGradient id={`${linearGradientIdPrefix}gradient4`}>
                  <stop className="stop-left2" offset="0"/>
                  <stop className="stop-right2" offset="1"/>
                </linearGradient>
                <marker
                  id="arrow"
                  markerUnits="strokeWidth"
                  markerWidth="12"
                  markerHeight="12"
                  viewBox="0 0 12 12"
                  refX="6"
                  refY="6"
                  orient="auto"
                >
                  <path
                    d="M2,2 L6,6 L2,10 L4,6 L2,2"
                    style={{ fill: "#000" }}
                  />
                </marker>
              </defs>
              <g className="db-base"/>
            </svg>
          );
        }
      },
      {
        title: "Prop(P.)",
        dataIndex: "prop2",
        key: "prop2",
        // align: "center",
        width: 90,
        sorter: (a, b) => {
          let aTemp = parseFloat(a["prop2"]);
          let bTemp = parseFloat(b["prop2"]);
          aTemp = aTemp <= 0.5 ? 1 - aTemp : aTemp;
          bTemp = bTemp <= 0.5 ? 1 - bTemp : bTemp;
          return aTemp - bTemp;
        },
        render: d => {
          const label = d <= 0.5 ? 1 : 0;
          const actualValue = d <= 0.5 ? 1 - d : d;

          return (
            <div
              style={{
                // // width: '100%',
                // height: '100%',
                width: 35,
                color: labelNormalColorMap[label]
              }}
            >
              {actualValue === 2 ? "N/A" : Number(actualValue).toFixed(2)}
            </div>
          );
        }
      },
      {
        title: "DBD(P.)",
        dataIndex: "dist2",
        key: "dist2",
        width: 90,
        sorter: (a, b) => {
          return parseFloat(a["dist2"]) - parseFloat(b["dist2"]);
        },
        render: d => (isNaN(d) ? "N/A" : d)
      },
      {
        title: "KNN Labels",
        dataIndex: "knnLabels",
        key: "knnLabels",
        // width: 100,
        render: d => {
          return (
            <div
              style={{
                margin: "auto"
              }}
            >
              <Row>
                <Col span={8}>
                  <Tag color={labelNormalColorMap[0]}>{d[0]}</Tag>
                </Col>
                <Col span={8}>
                  <Tag color={labelNormalColorMap[1]}>{d[1]}</Tag>
                </Col>
                <Col span={8}>
                  <Tag color={actualPoisonColor}>{d[2]}</Tag>
                </Col>
              </Row>
            </div>
          );
        }
      }
    ];
  }

  generateData() {
    const { attack, filteredDataInstanceIds, kForknn } = this.props;
    const parentAttack = attack.parent;
    const {
      Xids,
      attackedPredictedLabel,
      attackedPredictedProba,
      attackedPredictedBoundaryDists,
      victimIndex
    } = attack;
    const { knnMatrix } = attack.attackResult["KNN"];
    let filteredIdMap = {};
    filteredDataInstanceIds.forEach(id => {
      filteredIdMap[id] = true;
    });

    const poisonId = attack.attackResult["metaData"]["poison_id"];
    poisonId.forEach(pid => {
      filteredIdMap[pid] = "poison";
    });
    const parentAttackedPredictedProba = parentAttack.attackedPredictedProba;
    const parentAttackedPredictedBoundaryDists =
      parentAttack.attackedPredictedBoundaryDists;
    const parentAttackedPredictedLabel = parentAttack.attackedPredictedLabel;
    /**
     * Data instance ranking
     */
    const victimIdxInXids = Xids.indexOf(victimIndex);
    const poisonIdsSet = new Set(poisonId);

    const retData = Xids.map((xid, i) => {
      // stat the knn labels
      const knnLabelsAndIds = knnMatrix[i].slice(0, kForknn).map(kIdx => ({
        label: attackedPredictedLabel[kIdx],
        id: Xids[kIdx]
      }));

      let knnStat = [0, 0, 0]; // 0, 1: #label; 2: #poison

      knnLabelsAndIds.forEach(k => {
        if (filteredIdMap[k["id"]] === "poison") {
          knnStat[2]++;
        } else {
          knnStat[k["label"]]++;
        }
      });

      let obj = {};
      obj["key"] = xid;
      obj["id"] = xid;
      obj["dist1"] = Number(parentAttackedPredictedBoundaryDists[i]).toFixed(2);
      obj["prop1"] = parentAttackedPredictedProba[i]
        ? parentAttackedPredictedProba[i][0] //.toFixed(2)
        : -1;
      obj["decisionBoundary"] = i;
      obj["prop2"] = attackedPredictedProba[i][0]; //.toFixed(2);
      obj["dist2"] = Number(attackedPredictedBoundaryDists[i]).toFixed(2);
      obj["knnLabels"] = knnStat;
      obj["predLabel1"] = parentAttackedPredictedLabel[i];
      obj["predLabel2"] = attackedPredictedLabel[i];
      return obj;
    });

    const flippedIdsSet = new Set(
      attack.knnGraph.nodes
        .filter(n => n.type === "flipped" && !n.isVictim)
        .map(n => n["realXid"])
    );

    return {
      victim: retData[victimIdxInXids],
      poison: retData.filter(d => poisonIdsSet.has(d.id)),
      flipped: retData.filter(d => flippedIdsSet.has(d.id)),
      rest: retData.filter(
        d =>
          !poisonIdsSet.has(d.id) &&
          !flippedIdsSet.has(d.id) &&
          d.id !== victimIndex
      )
    };
  }

  render() {
    const columns = this.generateColumns();
    const data = this.state.currentRankedData;
    return (
      <div id="instance-wrapper" style={{ height: "100%", width: "100%" }}>
        <Table
          style={{
            height: 320, // bodyHeight,
            width: "100%"
          }}
          className="compact"
          size="small"
          scroll={{
            y: 320
            // x: 600
          }}
          bordered={false}
          columns={columns}
          dataSource={data}
          //   rowSelection={rowSelection}
          // onChange={this.handleTableCurrentDataChanged.bind(this)}
          pagination={false}
          onRow={record => {
            return {
              onClick: () => {
                this.props.selectedInstanceIdOnChange(record["id"]);
              }
            };
          }}
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
