import React, { Component } from "react";
import { Card, Col, Divider, Row, Select } from "antd";
import { labelNormalColorMap } from "../../utils/ColorScheme";

export default class GlobalAttackSummary extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { height, attackTreeRoot } = this.props;

    let class0Count = 0;
    let class1Count = 0;
    attackTreeRoot["attackedTrainLabel"].forEach(element => {
      element === 0 ? class0Count++ : class1Count++;
    });

    const { labelNames } = attackTreeRoot;

    const Option = Select.Option;
    return (
      <div
        style={{
          width: "100%",
          height: height
        }}
      >
        <Card
          style={{
            width: "100%",
            height: "100%"
          }}
          title="SUMMARY OF ORIGINAL MODEL"
          size="small"
          id="global-summary-view"
        >
          <Row type="flex" justify="center" gutter={16}>
            <Col span={10}>
              <div style={{ fontSize: "1.1em" }}>
                <div>Dataset</div>
                <br/>
                <div>Training Model</div>
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Select
                  size="small"
                  defaultValue="SPAMBASE"
                  style={{ width: 170 }}
                  onChange={this.props.switchDataSource}
                >
                  <Option value="SPAMBASE">SPAMBASE</Option>
                  <Option value="MNIST_784">MNIST</Option>
                </Select>
              </div>
              <br/>
              <div>
                <Select
                  size="small"
                  defaultValue="Logistic Regression"
                  style={{ width: 170 }}
                >
                  <Option value="lr">Logistic Regression</Option>
                </Select>
              </div>
            </Col>
          </Row>
          <Divider style={{ margin: "10px 0" }}/>

          <Row type="flex" justify="center" gutter={16}>
            <Col span={12}>
              <div style={{ fontSize: "1.1em" }}>
                <div>
                  <span style={{ color: labelNormalColorMap[0] }}>
                    {labelNames[0]}
                  </span>
                  -
                  <span style={{ color: labelNormalColorMap[1] }}>
                    {labelNames[1]}
                  </span>
                </div>
              </div>
            </Col>
            <Col span={10}>
              <div style={{ fontSize: "1.1em" }}>
                <div>
                  <div>
                    <span style={{ color: labelNormalColorMap[0] }}>
                      {class0Count}
                    </span>{" "}
                    -
                    <span style={{ color: labelNormalColorMap[1] }}>
                      {class1Count}
                    </span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          <Row style={{ paddingTop: "20px" }} type="flex" justify="center">
            <Col span={5}>Accuracy </Col>
            <Col span={6}>Recall </Col>
            <Col span={6}>F1 Score</Col>
            <Col span={5}>AUC Score</Col>
          </Row>

          <Row type="flex" justify="center">
            <Col span={5}>
              {" "}
              {Number(attackTreeRoot["metrics"]["attackTrainAcc"]).toFixed(2)}
            </Col>

            <Col span={6}>
              {Number(attackTreeRoot["metrics"]["attackTrainRecall"]).toFixed(
                2
              )}
            </Col>
            <Col span={6}>
              {Number(attackTreeRoot["metrics"]["attackTrainF1Score"]).toFixed(
                2
              )}
            </Col>
            <Col span={5}>
              {Number(
                attackTreeRoot["metrics"]["attackTrainROCAUCScore"]
              ).toFixed(2)}
            </Col>
          </Row>
        </Card>
      </div>
    );
  }
}
