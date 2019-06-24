import React, * as react from "react";
import { findDOMNode } from "react-dom";
import * as d3 from "d3";
import { Col, Row, Tag } from "antd";
import { comparisonColor, labelNormalColorMap } from "../../utils/ColorScheme";
import "../styles/RadarView.css";

export default class RadarViewAlt extends react.Component {
  constructor(props) {
    super(props);

    this.state = {
      VictimId:
        this.props.newVictims.length > 0 ? this.props.newVictims[0].id : -1,
      newStrategy: this.props.newStrategy
    };
  }

  componentDidMount() {
    const thisDOM = findDOMNode(this);
    this.setState(
      {
        canvasWidth: thisDOM.clientWidth
      },
      () => this.initializeCanvas(this.props)
    );
  }

  shouldComponentUpdate() {
    return false;
  }

  componentWillReceiveProps = nextProps => {
    this.updateCanvas(nextProps);
  };

  drawRadarChart(divId, w, h, props) {
    let circleSize = 1;
    let strokeWidthPolygon = "2px";
    const { attack, radarViewMode } = props;
    const parentAttack = attack.parent;
    const thisDOM = findDOMNode(this);

    const attackConfusionMatrix = attack["metrics"]["confusionMatrix"],
      parentConfusionMatrix = parentAttack["metrics"]["confusionMatrix"];

    const maxScale = Math.max(
      Math.abs(attackConfusionMatrix[0][0] - parentConfusionMatrix[0][0]),
      Math.abs(attackConfusionMatrix[0][1] - parentConfusionMatrix[0][1]),
      Math.abs(attackConfusionMatrix[1][0] - parentConfusionMatrix[1][0]),
      Math.abs(attackConfusionMatrix[1][1] - parentConfusionMatrix[1][1])
    );

    const diffTrainAcc =
      attack["metrics"]["attackTrainAcc"] -
      parentAttack["metrics"]["attackTrainAcc"];

    const diffTrainRec =
      attack["metrics"]["attackTrainRecall"] -
      parentAttack["metrics"]["attackTrainRecall"];

    const diffTrainF1 =
      attack["metrics"]["attackTrainF1Score"] -
      parentAttack["metrics"]["attackTrainF1Score"];

    const diffTrainAUC =
      attack["metrics"]["attackTrainROCAUCScore"] -
      parentAttack["metrics"]["attackTrainROCAUCScore"];

    const accuracyScale = Math.max(
      Math.abs(diffTrainAcc),
      Math.abs(diffTrainRec),
      Math.abs(diffTrainF1),
      Math.abs(diffTrainAUC)
    ).toFixed(3);

    // Options for the Radar chart, other than default
    const myOptions = {
      w: w,
      h: h,
      ExtraWidthX: 180,
      labelScale: 0.7,
      levels: 5,
      levelScale: 0.85,
      facetPaddingScale: 1.9,
      maxValue: 0.6,
      showAxes: true,
      showAxesLabels: true,
      showLegend: true,
      showLevels: true,
      showLevelsLabels: false,
      showPolygons: true,
      showVertices: true
    };

    let originalView = [
      [
        { axis: "TP", value: parentConfusionMatrix[1][1] },
        { axis: "FN", value: parentConfusionMatrix[1][0] },
        { axis: "FP", value: parentConfusionMatrix[0][1] },
        { axis: "TN", value: parentConfusionMatrix[0][0] },
        { axis: "Accuracy", value: parentAttack["metrics"]["attackTrainAcc"] },
        { axis: "Recall", value: parentAttack["metrics"]["attackTrainRecall"] },
        {
          axis: "F1-Score",
          value: parentAttack["metrics"]["attackTrainF1Score"]
        },
        {
          axis: "AUC Score",
          value: parentAttack["metrics"]["attackTrainROCAUCScore"]
        }
      ],
      [
        {
          axis: "TP",
          value: attackConfusionMatrix[1][1],
          prev: parentConfusionMatrix[1][1]
        },
        {
          axis: "FN",
          value: attackConfusionMatrix[1][0],
          prev: parentConfusionMatrix[1][0]
        },
        {
          axis: "FP",
          value: attackConfusionMatrix[0][1],
          prev: parentConfusionMatrix[0][1]
        },
        {
          axis: "TN",
          value: attackConfusionMatrix[0][0],
          prev: parentConfusionMatrix[0][0]
        },
        {
          axis: "Accuracy",
          value: attack["metrics"]["attackTrainAcc"],
          prev: parentAttack["metrics"]["attackTrainAcc"]
        },
        {
          axis: "Recall",
          value: attack["metrics"]["attackTrainRecall"],
          prev: parentAttack["metrics"]["attackTrainRecall"]
        },
        {
          axis: "F1-Score",
          value: attack["metrics"]["attackTrainF1Score"],
          prev: parentAttack["metrics"]["attackTrainF1Score"]
        },
        {
          axis: "AUC Score",
          value: attack["metrics"]["attackTrainROCAUCScore"],
          prev: parentAttack["metrics"]["attackTrainROCAUCScore"]
        }
      ],

      [
        {
          axis: "TP",
          value: attackConfusionMatrix[1][1],
          prev: parentConfusionMatrix[1][1]
        },
        {
          axis: "FN",
          value: attackConfusionMatrix[1][0],
          prev: parentConfusionMatrix[1][0]
        },
        {
          axis: "FP",
          value: attackConfusionMatrix[0][1],
          prev: parentConfusionMatrix[0][1]
        },
        {
          axis: "TN",
          value: attackConfusionMatrix[0][0],
          prev: parentConfusionMatrix[0][0]
        },
        {
          axis: "Accuracy",
          value: attack["metrics"]["attackTrainAcc"],
          prev: parentAttack["metrics"]["attackTrainAcc"]
        },
        {
          axis: "Recall",
          value: attack["metrics"]["attackTrainRecall"],
          prev: parentAttack["metrics"]["attackTrainRecall"]
        },
        {
          axis: "F1-Score",
          value: attack["metrics"]["attackTrainF1Score"],
          prev: parentAttack["metrics"]["attackTrainF1Score"]
        },
        {
          axis: "AUC Score",
          value: attack["metrics"]["attackTrainROCAUCScore"],
          prev: parentAttack["metrics"]["attackTrainROCAUCScore"]
        }
      ]
    ];

    let comparisonView = [
      [
        { axis: "TP", value: maxScale },
        { axis: "FN", value: maxScale },
        { axis: "FP", value: maxScale },
        { axis: "TN", value: maxScale },
        { axis: "Accuracy", value: accuracyScale },
        { axis: "Recall", value: accuracyScale },
        {
          axis: "F1-Score",
          value: accuracyScale
        },
        {
          axis: "AUC Score",
          value: accuracyScale
        }
      ],
      [
        {
          axis: "TP",
          value:
            maxScale + attackConfusionMatrix[1][1] - parentConfusionMatrix[1][1]
        },
        {
          axis: "FN",
          value:
            maxScale + attackConfusionMatrix[1][0] - parentConfusionMatrix[1][0]
        },
        {
          axis: "FP",
          value:
            maxScale + attackConfusionMatrix[0][1] - parentConfusionMatrix[0][1]
        },
        {
          axis: "TN",
          value:
            maxScale + attackConfusionMatrix[0][0] - parentConfusionMatrix[0][0]
        },
        {
          axis: "Accuracy",
          value: (Number(accuracyScale) + Number(diffTrainAcc)).toFixed(3)
        },
        {
          axis: "Recall",
          value: (Number(accuracyScale) + Number(diffTrainRec)).toFixed(3)
        },
        {
          axis: "F1-Score",
          value: (Number(accuracyScale) + Number(diffTrainF1)).toFixed(3)
        },
        {
          axis: "AUC Score",
          value: (Number(accuracyScale) + Number(diffTrainAUC)).toFixed(3)
        }
      ],
      [
        {
          axis: "TP",
          value: attackConfusionMatrix[1][1],
          prev: parentConfusionMatrix[1][1]
        },
        {
          axis: "FN",
          value: attackConfusionMatrix[1][0],
          prev: parentConfusionMatrix[1][0]
        },
        {
          axis: "FP",
          value: attackConfusionMatrix[0][1],
          prev: parentConfusionMatrix[0][1]
        },
        {
          axis: "TN",
          value: attackConfusionMatrix[0][0],
          prev: parentConfusionMatrix[0][0]
        },
        {
          axis: "Accuracy",
          value: attack["metrics"]["attackTrainAcc"],
          prev: parentAttack["metrics"]["attackTrainAcc"]
        },
        {
          axis: "Recall",
          value: attack["metrics"]["attackTrainRecall"],
          prev: parentAttack["metrics"]["attackTrainRecall"]
        },
        {
          axis: "F1-Score",
          value: attack["metrics"]["attackTrainF1Score"],
          prev: parentAttack["metrics"]["attackTrainF1Score"]
        },
        {
          axis: "AUC Score",
          value: attack["metrics"]["attackTrainROCAUCScore"],
          prev: parentAttack["metrics"]["attackTrainROCAUCScore"]
        }
      ]
    ];

    let RadarChart = {
      draw: function(id, data, options) {
        let cfg = {
          radius: circleSize,
          w: w,
          h: h,
          factor: 1,
          factorLegend: 0.85,
          levels: 3,
          maxValue: 0,
          radians: 2 * Math.PI,
          opacityArea: 0.001,
          ToRight: 5,
          TranslateX: 65,
          TranslateY: 30,
          ExtraWidthX: 10,
          ExtraWidthY: 100
        };

        if ("undefined" !== typeof options) {
          for (let i in options) {
            if ("undefined" !== typeof options[i]) {
              cfg[i] = options[i];
            }
          }
        }
        cfg.maxValue = Math.max(
          cfg.maxValue,
          d3.max(data, i => d3.max(i.map(o => o.value)))
        );
        let allAxis = data[2].map(i => [i.axis, i.value, i.prev]);
        let total = allAxis.length;
        let radius = cfg.factor * Math.min(cfg.w / 2, cfg.h / 2);

        let g = d3
          .select(thisDOM)
          .select(id)
          .append("svg")
          .attr("width", cfg.w + cfg.ExtraWidthX)
          .attr("height", cfg.h + cfg.ExtraWidthY)
          .attr("class", "graph-svg-component")
          .append("g")
          .attr(
            "transform",
            "translate(" + cfg.TranslateX + "," + cfg.TranslateY + ")"
          );


        // Circular segments
        for (let j = 0; j < cfg.levels; j++) {
          let levelFactor = cfg.factor * radius * ((j + 1) / cfg.levels);
          g.selectAll(".levels")
            .data(allAxis)
            .enter()
            .append("svg:line")
            .attr(
              "x1",
              (d, i) =>
                levelFactor *
                (1 - cfg.factor * Math.sin(((i + 0.5) * cfg.radians) / total))
            )
            .attr(
              "y1",
              (d, i) =>
                levelFactor *
                (1 - cfg.factor * Math.cos(((i + 0.5) * cfg.radians) / total))
            )
            .attr(
              "x2",
              (d, i) =>
                levelFactor *
                (1 - cfg.factor * Math.sin(((i + 1.5) * cfg.radians) / total))
            )
            .attr(
              "y2",
              (d, i) =>
                levelFactor *
                (1 - cfg.factor * Math.cos(((i + 1.5) * cfg.radians) / total))
            )
            .attr("class", "line")
            .style("stroke", "grey")
            .style("stroke-opacity", "0.75")
            .style("stroke-width", "0.3px")
            .attr(
              "transform",
              "translate(" +
              (cfg.w / 2 - levelFactor) +
              ", " +
              (cfg.h / 2 - levelFactor) +
              ")"
            );
        }


        let series = 0;
        // console.log(allAxis);
        var axis = g
          .selectAll(".axis")
          .data(allAxis)
          .enter()
          .append("g")
          .attr("class", "axis");

        axis
          .append("line")
          .attr("x1", cfg.w / 2)
          .attr("y1", cfg.h / 2)
          .attr(
            "x2",
            (d, i) =>
              (cfg.w / 2) *
              (1 - cfg.factor * Math.sin(((i + 0.5) * cfg.radians) / total))
          )
          .attr(
            "y2",
            (d, i) =>
              (cfg.h / 2) *
              (1 - cfg.factor * Math.cos(((i + 0.5) * cfg.radians) / total))
          )
          .attr("class", "line")
          .style("stroke", "grey")
          .style("stroke-width", "1px");

        // Frame
        // axis
        //   .append("rect")
        //   .attr("dy", "1.5em")
        //   .attr("transform", (d, i) => {
        //     if (i < 4) {
        //       return "translate(-35, -10)";
        //     } else {
        //       return "translate(-20, -10)";
        //     }
        //   })
        //   .attr(
        //     "x",
        //     (d, i) =>
        //       (cfg.w / 2) *
        //         (1 -
        //           cfg.factorLegend *
        //             Math.sin(((i + 0.5) * cfg.radians) / total)) -
        //       0.8 * 60 * Math.sin(((i + 0.5) * cfg.radians) / total)
        //   )
        //   .attr("y", (d, i) => {
        //     if (i >= 2 && i <= 5) {
        //       return (
        //         (cfg.h / 2) *
        //           (1 - Math.cos(((i + 0.5) * cfg.radians) / total)) -
        //         0.6 * 20 * Math.cos(((i + 0.5) * cfg.radians) / total)
        //       );
        //     } else {
        //       return (
        //         (cfg.h / 2) *
        //           (1 - Math.cos(((i + 0.5) * cfg.radians) / total)) -
        //         1.5 * 20 * Math.cos(((i + 0.5) * cfg.radians) / total)
        //       );
        //     }
        //   })
        //   .attr("width", "62px")
        //   .attr("height", "38px")
        //   .attr("rx", 6)
        //   .attr("ry", 6)
        //   .style("stroke", "#ccc")
        //   .style("fill", "none");

        // First Row
        axis
          .append("text")
          .attr("class", "legend")
          .style("font-size", "11px")
          .style("font-weight", "bold")
          .attr("text-anchor", "left")
          .attr("dy", "1.1em")
          .attr("transform", (d, i) => {
            if (i < 4) {
              return "translate(-35, -10)";
            } else {
              return "translate(-28, -10)";
            }
          })
          .attr(
            "x",
            (d, i) =>
              (cfg.w / 2) *
              (1 -
                cfg.factorLegend *
                Math.sin(((i + 0.5) * cfg.radians) / total)) -
              0.8 * 60 * Math.sin(((i + 0.5) * cfg.radians) / total)
          )
          .attr("y", (d, i) => {
            if (i >= 2 && i <= 5) {
              return (
                (cfg.h / 2) *
                (1 - Math.cos(((i + 0.5) * cfg.radians) / total)) -
                0.6 * 20 * Math.cos(((i + 0.5) * cfg.radians) / total)
              );
            } else {
              return (
                (cfg.h / 2) *
                (1 - Math.cos(((i + 0.5) * cfg.radians) / total)) -
                1.5 * 20 * Math.cos(((i + 0.5) * cfg.radians) / total)
              );
            }
          })
          .text(d => d[0]);

        // Second Row
        axis
          .append("text")
          .attr("class", "legend")
          .style("font-size", "11px")
          .style("fill", comparisonColor[0])
          .attr("text-anchor", "left")
          .attr("dy", "2.1em")
          .attr("transform", (d, i) => {
            if (i < 4) {
              return "translate(-35, -10)";
            } else {
              return "translate(-28, -10)";
            }
          })
          .attr(
            "x",
            (d, i) =>
              (cfg.w / 2) *
              (1 -
                cfg.factorLegend *
                Math.sin(((i + 0.5) * cfg.radians) / total)) -
              0.8 * 60 * Math.sin(((i + 0.5) * cfg.radians) / total)
          )
          .attr("y", (d, i) => {
            if (i >= 2 && i <= 5) {
              return (
                (cfg.h / 2) *
                (1 - Math.cos(((i + 0.5) * cfg.radians) / total)) -
                0.6 * 20 * Math.cos(((i + 0.5) * cfg.radians) / total)
              );
            } else {
              return (
                (cfg.h / 2) *
                (1 - Math.cos(((i + 0.5) * cfg.radians) / total)) -
                1.5 * 20 * Math.cos(((i + 0.5) * cfg.radians) / total)
              );
            }
          })
          .text((d, i) => {
            if (i < 4) {
              return "Victim: " + d[2];
            } else {
              return "Victim: " + d[2].toFixed(2);
            }
          });

        // Third Row
        axis
          .append("text")
          .attr("class", "legend")
          .style("font-size", "11px")
          .style("fill", comparisonColor[1])
          .attr("text-anchor", "left")
          .attr("dy", "3.1em")
          .attr("transform", (d, i) => {
            if (i < 4) {
              return "translate(-35, -10)";
            } else {
              return "translate(-28, -10)";
            }
          })
          .attr(
            "x",
            (d, i) =>
              (cfg.w / 2) *
              (1 -
                cfg.factorLegend *
                Math.sin(((i + 0.5) * cfg.radians) / total)) -
              0.8 * 60 * Math.sin(((i + 0.5) * cfg.radians) / total)
          )
          .attr("y", (d, i) => {
            if (i >= 2 && i <= 5) {
              return (
                (cfg.h / 2) *
                (1 - Math.cos(((i + 0.5) * cfg.radians) / total)) -
                0.6 * 20 * Math.cos(((i + 0.5) * cfg.radians) / total)
              );
            } else {
              return (
                (cfg.h / 2) *
                (1 - Math.cos(((i + 0.5) * cfg.radians) / total)) -
                1.5 * 20 * Math.cos(((i + 0.5) * cfg.radians) / total)
              );
            }
          })
          .text((d, i) => {
            if (i < 4) {
              return "Poisoned: " + d[1];
            } else {
              return "Poisoned: " + d[1].toFixed(2);
            }
          });

        data.forEach((y, comparisonIndex) => {
          if (comparisonIndex === 2) return;
          // console.log(comparisonIndex);
          var dataValues = [];
          g.selectAll(".nodes").data(y, (j, i) => {
            /***
             * For confusion matrix, max value depends on data.
             * For Accuracy score, max value is 1.
             */
            if (radarViewMode === 0) {
              if (i < 4) {
                dataValues.push([
                  (cfg.w / 2) *
                  (1 -
                    (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) *
                    cfg.factor *
                    Math.sin(((i + 0.5) * cfg.radians) / total)),
                  (cfg.h / 2) *
                  (1 -
                    (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) *
                    cfg.factor *
                    Math.cos(((i + 0.5) * cfg.radians) / total))
                ]);
              } else {
                dataValues.push([
                  (cfg.w / 2) *
                  (1 -
                    parseFloat(Math.max(j.value, 0)) *
                    cfg.factor *
                    Math.sin(((i + 0.5) * cfg.radians) / total)),
                  (cfg.h / 2) *
                  (1 -
                    parseFloat(Math.max(j.value, 0)) *
                    cfg.factor *
                    Math.cos(((i + 0.5) * cfg.radians) / total))
                ]);
              }
            } else {
              if (i < 4) {
                dataValues.push([
                  (cfg.w / 2) *
                  (1 -
                    (parseFloat(Math.max(j.value, 0)) / (maxScale * 2)) *
                    cfg.factor *
                    Math.sin(((i + 0.5) * cfg.radians) / total)),
                  (cfg.h / 2) *
                  (1 -
                    (parseFloat(Math.max(j.value, 0)) / (maxScale * 2)) *
                    cfg.factor *
                    Math.cos(((i + 0.5) * cfg.radians) / total))
                ]);
              } else {
                dataValues.push([
                  (cfg.w / 2) *
                  (1 -
                    (parseFloat(Math.max(j.value, 0)) / (accuracyScale * 2)) *
                    cfg.factor *
                    Math.sin(((i + 0.5) * cfg.radians) / total)),
                  (cfg.h / 2) *
                  (1 -
                    (parseFloat(Math.max(j.value, 0)) / (accuracyScale * 2)) *
                    cfg.factor *
                    Math.cos(((i + 0.5) * cfg.radians) / total))
                ]);
              }
            }
          });
          dataValues.push(dataValues[0]);
          // console.log(dataValues);
          g.selectAll(".area")
            .data([dataValues])
            .enter()
            .append("polygon")
            .attr("class", "radar-chart-series_" + series)
            .style("stroke-width", strokeWidthPolygon)
            .style("stroke", comparisonColor[comparisonIndex])
            .attr("points", d => {
              let str = "";
              for (let pti = 0; pti < d.length; pti++) {
                str = str + d[pti][0] + "," + d[pti][1] + " ";
              }
              return str;
            })
            .style("fill", comparisonColor[comparisonIndex])
            .style("fill-opacity", cfg.opacityArea)
            .on("mouseover", function() {
              const z = "polygon." + d3.select(this).attr("class");
              g.selectAll("polygon")
                .transition(200)
                .style("fill-opacity", 0.1);
              g.selectAll(z)
                .transition(200)
                .style("fill-opacity", 0.7);
            })
            .on("mouseout", () => {
              g.selectAll("polygon")
                .transition(200)
                .style("fill-opacity", cfg.opacityArea);
            });

          series++;
        });

        series = 0;

      }
    };

    radarViewMode === 0
      ? RadarChart.draw(divId, originalView, myOptions)
      : RadarChart.draw(divId, comparisonView, myOptions);
  }

  initializeCanvas(props) {
    const widthMain = 200;
    this.drawRadarChart("#radar-chart-base", widthMain, widthMain, props);
  }

  updateCanvas(nextprops) {
    const thisDOM = findDOMNode(this);
    d3.select(thisDOM)
      .select("#radar-chart-base")
      .remove();
    d3.select(thisDOM)
      .select("#radar-chart")
      .append("g")
      .attr("id", "radar-chart-base");
    const widthMain = 200;
    this.drawRadarChart("#radar-chart-base", widthMain, widthMain, nextprops);
  }

  render() {
    const { attack } = this.props;
    const parentAttack = attack.parent;

    return (
      <div
        style={{
          height: "100%",
          width: "100%"
        }}
      >
        <Row>
          <Col span={6}>
            <div>
              <strong>Victim</strong>
            </div>
            <div style={{ marginBottom: "0.6em" }}>
              {parentAttack["name"] === "Attack 1"
                ? "Original"
                : parentAttack["name"]}
            </div>

            <div>
              <strong>Strategy</strong>
            </div>
            <div style={{ marginBottom: "0.6em" }}>
              {this.state.newStrategy === "binary_search"
                ? "Binary Search"
                : "Sting Ray"}
            </div>

            <div>
              <strong># Poisons</strong>
            </div>
            <div style={{ marginBottom: "0.6em" }}>
              {attack["attackResult"]["metaData"]["poison_id"].length}
            </div>
            <div>
              <strong>Target ID</strong>
            </div>
            <div style={{ marginBottom: "0.6em" }}>{this.state.VictimId}</div>
            <div>
              <strong>Poison Label</strong>
            </div>
            <div style={{ marginBottom: "0.6em" }}>
              <Tag
                color={
                  labelNormalColorMap[
                  1 -
                  attack["attackedTrainLabel"][
                    attack["attackedTrainLabel"][
                    attack["attackedTrainLabel"].length - 1
                      ]
                    ]
                    ]
                }
              >
                {
                  attack["labelNames"][
                  1 -
                  attack["attackedTrainLabel"][
                    attack["attackedTrainLabel"][
                    attack["attackedTrainLabel"].length - 1
                      ]
                    ]
                    ]
                }
              </Tag>
            </div>
          </Col>
          <Col span={18}>
            <div>
              <svg id="radar-chart" style={{ width: "100%", height: 265 }}>
                <g id="radar-chart-base"/>
              </svg>
            </div>
          </Col>
        </Row>
      </div>
    );
  }
}
