import React, * as react from "react";
import fromPairs from "lodash/fromPairs";
import zip from "lodash/zip";
import * as d3 from "d3";
import { Button, Card, Col, Empty, Modal, Row, Table, Tag } from "antd";
import onePixelBar from "../../images/1pxblue.png";
import onePixelDanger from "../../images/1pxdanger.png";
import onePixelOk from "../../images/1pxok.png";
import onePixelSafe from "../../images/1pxsafe.png";
import { labelNormalColorMap } from "../../utils/ColorScheme";
import "../styles/DatasetSetting.css";

export default class DatasetSetting extends react.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false
    };
  }

  handleStingRayAttack = () => {
    // do sting_ray
    this.props.handleToggleProcessing(true);
    this.setState({
      visible: false
    });
    setTimeout(() => {
      this.props.handleCraftDatasetVictimChanged(
        this.state.selectedRows,
        "sting_ray"
      );
    }, 200);
  };

  handleBinarySearchAttack = () => {
    // do binary search
    this.props.handleToggleProcessing(true);
    this.setState({
      visible: false
    });
    setTimeout(() => {
      this.props.handleCraftDatasetVictimChanged(
        this.state.selectedRows,
        "binary_search"
      );
    }, 200);
  };

  handleCancel = e => {
    // console.log(e);
    this.setState({
      visible: false
    });
  };

  generateColumns(dimNames, labelNames, distScaler) {
    let columns = [
      {
        title: "ID",
        dataIndex: "id",
        align: "right",
        key: "id",
        width: 45
      }
    ];

    dimNames.forEach((dim, i) => {
      if (i === 0) {
        columns.push({
          title: dim,
          dataIndex: dim,
          key: dim,
          width: 165,
          sorter: (a, b) => {
            return a[dim] - b[dim];
          },
          sortDirections: ["descend", "ascend"],
          render: d => {
            return (
              <div>
                <Row>
                  <Col span={6}>
                    <Row>{d.toFixed(2)}</Row>
                  </Col>
                  <Col span={18}>
                    <Row
                      className="no-repeat-bar"
                      style={{
                        float: "left",
                        width: "100%",
                        height: 10,
                        marginTop: 7,
                        background: "url(" + onePixelBar + ")",
                        backgroundSize: distScaler(d) * 100 + "% 100%",
                        backgroundRepeat: "no-repeat"
                      }}
                    />
                  </Col>
                </Row>
              </div>
            );
          }
        });
      } else {
        columns.push({
          title: dim,
          dataIndex: dim,
          key: dim,
          width: i === 1 || i === 4 ? 165 : 115,
          sorter: (a, b) => {
            if (a[dim]["curr"] === undefined) {
              return parseFloat(a[dim]) - parseFloat(b[dim]);
            } else {
              return parseFloat(a[dim]["curr"]) - parseFloat(b[dim]["curr"]);
            }
          },
          sortDirections: ["descend", "ascend"],
          render: d => {
            if (i === 1 || i === 4) {
              if (d === undefined) {
                return <div>N/A</div>;
              }
              let vulnerabilityColor;

              if (parseFloat(d) <= 20) {
                vulnerabilityColor = "url(" + onePixelDanger + ")";
              } else if (parseFloat(d) > 20 && parseFloat(d) <= 80) {
                vulnerabilityColor = "url(" + onePixelOk + ")";
              } else {
                vulnerabilityColor = "url(" + onePixelSafe + ")";
              }

              return (
                <div>
                  <Row>
                    <Col span={5}>
                      <Row>{d === 1000 ? "N/A" : d}</Row>
                    </Col>
                    <Col span={19}>
                      <Row
                        className="no-repeat-bar"
                        style={{
                          float: "left",
                          width: "100%",
                          marginTop: 7,
                          height: 10,
                          background: vulnerabilityColor,
                          backgroundSize: parseFloat(d) + "% 100%",
                          backgroundRepeat: "no-repeat"
                        }}
                      />
                    </Col>
                  </Row>
                </div>
              );
            } else {
              if (d["curr"] === undefined || d["curr"].toFixed(2) === "0.00") {
                return <div>N/A</div>;
              } else {
                let diff = d["curr"].toFixed(2) - d["pre"].toFixed(2);
                if (diff > 0) {
                  return (
                    <div>
                      {d["curr"].toFixed(2)}
                      <span style={{ color: "green" }}>
                        {" (+ " + diff.toFixed(2) + ")"}
                      </span>
                    </div>
                  );
                } else if (diff < 0) {
                  return (
                    <div>
                      {d["curr"].toFixed(2)}
                      <span style={{ color: "red" }}>
                        {" (-" + Math.abs(diff).toFixed(2) + ")"}
                      </span>
                    </div>
                  );
                } else {
                  return (
                    <div>
                      {d["curr"].toFixed(2)}
                      <span style={{ color: "gray" }}>{" (0.00)"}</span>
                    </div>
                  );
                }
              }
            }
          }
        });
      }
    });

    columns.push({
      title: "Label",
      dataIndex: "y",
      key: "y",
      render: y => <Tag color={labelNormalColorMap[y]}>{labelNames[y]}</Tag>,
      filters: labelNames.map((label, i) => ({ text: label, value: i })),
      onFilter: (value, record) => record["y"] === parseInt(value),
      width: 100
    });

    columns.push({
      title: "Predicted",
      dataIndex: "predictedlabel",
      key: "predictedlabely",
      render: y => <Tag color={labelNormalColorMap[y]}>{labelNames[y]}</Tag>,
      filters: labelNames.map((label, i) => ({ text: label, value: i })),
      onFilter: (value, record) => record["y"] === parseInt(value)
    });

    return columns;
  }

  generateData(Xids, dimNames, y, yPredict, statistics, metrics) {
    return Xids.map((xid, i) => {
      let obj = {};
      obj["key"] = xid;
      obj["id"] = xid;
      obj["y"] = y[i];
      obj["predictedlabel"] = yPredict[i];
      const dataPairs = zip(dimNames, statistics[i]);
      let objData = fromPairs(dataPairs);
      objData["Acc. (B. Search)"] = {
        curr: objData["Acc. (B. Search)"],
        pre: metrics["attackTrainAcc"]
      };
      objData["Acc. (StingRay)"] = {
        curr: objData["Acc. (StingRay)"],
        pre: metrics["attackTrainAcc"]
      };
      objData["Recall (B. Search)"] = {
        curr: objData["Recall (B. Search)"],
        pre: metrics["attackTrainRecall"]
      };
      objData["Recall (StingRay)"] = {
        curr: objData["Recall (StingRay)"],
        pre: metrics["attackTrainRecall"]
      };
      return Object.assign(obj, objData);
    }).filter(d => !d.id.startsWith("Attack"));
    // remove the poisoning data from the table
  }

  transpose(a) {
    return a[0].map(function(_, c) {
      return a.map(function(r) {
        return r[c];
      });
    });
  }

  render() {
    const { height, baseAttackForCreateNew, newVictims } = this.props;
    const {
      Xids,
      attackedTrainData,
      attackedTrainLabel,
      dimNames,
      labelNames,
      attackedPredictedBoundaryDists,
      attackedPredictedLabel,
      datasetName,
      newMetrics,
      metrics
    } = baseAttackForCreateNew;
    // console.log(baseAttackForCreateNew);

    let statistics = [
      attackedPredictedBoundaryDists,
      newMetrics["binary_search"]["vulnerability"],
      newMetrics["binary_search"]["modelMetricAccuracy"],
      newMetrics["binary_search"]["modelMetricRacall"],

      newMetrics["sting_ray"]["vulnerability"],
      newMetrics["sting_ray"]["modelMetricAccuracy"],
      newMetrics["sting_ray"]["modelMetricRacall"]
    ];

    statistics = this.transpose(statistics);

    const artificialDimnames = [
      "DBD",
      "MCSA (B. Search)",
      "Acc. (B. Search)",
      "Recall (B. Search)",
      "MCSA (StingRay)",
      "Acc. (StingRay)",
      "Recall (StingRay)"
    ];

    const artificialDataSet = this.generateData(
      Xids,
      artificialDimnames,
      attackedTrainLabel,
      attackedPredictedLabel,
      statistics,
      metrics
    );

    const distScaler = d3
      .scaleLinear()
      .domain(d3.extent(artificialDataSet, a => a["DBD"]))
      .range([0, 1]);

    const artificialTableColumns = this.generateColumns(
      artificialDimnames,
      labelNames,
      distScaler
    );

    let detailColumnNames = [
      {
        title: "Feature",
        dataIndex: "feature",
        key: "feature",
        width: 120,
        render: d => <Tag>{d}</Tag>
      },
      {
        title: "Value",
        dataIndex: "value",
        key: "value",
        align: "center"
      }
    ];

    let detailDataSource = [];
    if (newVictims.length > 0) {
      const newVictimIdx = Xids.indexOf(newVictims[0].id);

      detailDataSource = attackedTrainData[newVictimIdx].map((x, i) => ({
        key: `${newVictimIdx} ${i}`,
        feature: dimNames[i],
        value: x
      }));
    }

    return (
      <Row gutter={8} style={{ height: "100%", width: "100%" }}>
        <Col span={4}>
          <Card
            title="TARGET"
            id="target-view"
            extra={
              newVictims.length > 0 ? (
                <div
                  // style={{float: 'left'}}
                >
                  <b>ID: {Xids.indexOf(newVictims[0].id)}</b>
                  <Tag
                    color={
                      labelNormalColorMap[
                        attackedTrainLabel[Xids.indexOf(newVictims[0].id)]
                        ]
                    }
                    style={{
                      // height: 58,
                      fontSize: 14,
                      // display: 'flex'
                      marginLeft: 12
                    }}
                  >
                    <p style={{ margin: "auto" }}>
                      {
                        labelNames[
                          attackedTrainLabel[Xids.indexOf(newVictims[0].id)]
                          ]
                      }
                    </p>
                  </Tag>
                </div>
              ) : (
                <div/>
              )
            }
            size="small"
            style={{
              height: height
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%"
                // overflowY: 'scroll'
              }}
            >
              {datasetName === "MNIST_784" ? (
                newVictims[0] ? (
                  <div>
                    <img
                      alt=""
                      width="240"
                      src={require("../../images/mnist_pic/mnist_" +
                        Xids.indexOf(newVictims[0].id) +
                        ".png")}
                    />
                  </div>
                ) : (
                  <Empty
                    style={{ paddingTop: 25 }}
                    description="Please select a victim"
                  />
                )
              ) : newVictims.length > 0 ? (
                <Table
                  style={{
                    height: 171,
                    borderLeft: 0,
                    borderRight: 0,
                    borderBottom: 0
                  }}
                  size="small"
                  scroll={{
                    y: 170
                  }}
                  columns={detailColumnNames}
                  dataSource={detailDataSource}
                  pagination={false}

                />
              ) : (
                <Empty
                  style={{ paddingTop: 25 }}
                  description="Please select a victim"
                />
              )}
            </div>
          </Card>
        </Col>
        <Col style={{ paddingRight: 0 }} span={20}>
          <Table
            style={{
              height: height - 23, // bodyHeight,
              width: "100%"
            }}
            size="small"
            id="data-overview"
            scroll={{
              y: height - 60, // bodyHeight - 37,
              x: "100%"
            }}
            bordered={false}
            columns={artificialTableColumns}
            dataSource={artificialDataSet}
            pagination={false}
            onRow={record => {
              return {
                onClick: () => {
                  this.setState({
                    visible: true,
                    selectedRows: [record]
                  });
                }
              };
            }}
          />
          <Modal
            title="Select an attack algorithm"
            visible={this.state.visible}
            onCancel={this.handleCancel}
            footer={null}
          >
            <Row gutter={8}>
              <Col span={12}>
                <Button onClick={this.handleBinarySearchAttack} block>
                  Binary Search Attack
                </Button>
              </Col>
              <Col span={12}>
                <Button onClick={this.handleStingRayAttack} block>
                  StingRay Attack
                </Button>
              </Col>
            </Row>
          </Modal>
          {/*</Row>*/}
        </Col>
      </Row>
    );
  }
}
