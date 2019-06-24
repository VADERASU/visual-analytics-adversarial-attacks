import React, * as react from "react";
import {Button, Card, Col, Dropdown, Icon, Menu, Row, Switch, Tag} from "antd";
import FeatureViewAlt from "./FeatureViewAlt";
import cloneDeep from "lodash/cloneDeep";
import KNNGraphView from "./KNNGraphView";
import TSNEView from "./TSNEView";
import InstanceView from "./InstanceView";
import RadarViewAlt from "./RadarViewAlt";
import * as d3 from "d3";
import {comparisonColor} from "../../utils/ColorScheme";

const COMPARISON_VIEW_HEIGHT_PERCENT = 0.45;

export default class AttackDetailView extends react.Component {
    constructor(props) {
        super(props);

        /**
         * Compute the initial selectedDataInstanceIdsForKNNView
         */

        const {attack} = this.props;
        let selectedDataInstanceIdsForKNNView = [];

        // Flipped points
        const {Xids, attackedPredictedLabel} = attack,
            lenData = Xids.length;

        const parentPredictedLabel = attack.parent.attackedPredictedLabel;

        for (let i = 0; i < lenData; i++) {
            // if (attackedPredictedLabel[i] !== attackedTrainLabel[i]) {
            if (attackedPredictedLabel[i] !== parentPredictedLabel[i]) {
                selectedDataInstanceIdsForKNNView.push(Xids[i]);
            }
        }

        this.state = {
            activatedFeatureIndices: [],
            filteredDataInstanceIds: [],
            selectedDataInstanceIdsForKNNView: selectedDataInstanceIdsForKNNView,
            kForknn: 7,
            radarViewMode: 0,
            selectedInstanceId: -1,
            rankedInstanceDisplayOption: [1, 0, 1, 1],
            elementVisibleSwitches: {
                nodes: {
                    target: true,
                    flipped: true,
                    poison: true,
                    pureknn: true
                },
                edges: {
                    knn_flipped: false,
                    other: false,
                    poison_flipped: false,
                    poison_knn: false,
                    poison: false
                }
            }
        };

        this.switchOnChange = this.switchOnChange.bind(this);
        this.selectedInstanceIdOnChange = this.selectedInstanceIdOnChange.bind(
            this
        );
    }

    selectedInstanceIdOnChange(id) {
        if (id === this.state.selectedInstanceId) {
            id = -1;
        }

        this.setState({
            selectedInstanceId: id
        });
    }

    updateFilteredDataInstanceIds(idArray) {
        this.setState({
            filteredDataInstanceIds: idArray
        });
    }

    switchOnChange(checked) {
        // console.log(`switch to ${checked}`);
        if (checked === true) {
            this.setState({
                radarViewMode: 1
            });
        } else {
            this.setState({
                radarViewMode: 0
            });
        }
    }

    edgeDetailedToKNNOnChange(checked) {
        // if (checked) {
        //     d3.selectAll(".detailed-knn").attr("display", "block");
        // } else {
        //     d3.selectAll(".detailed-knn").attr("display", "none");
        // }
        let newSwitches = Object.assign({}, this.state.elementVisibleSwitches);
        newSwitches.edges.knn_flipped = checked; //!(this.state.elementVisibleSwitches.edges.knn_flipped);

        this.setState({elementVisibleSwitches: newSwitches});
    }

    edgeDetailedToPoisonOnChange(checked) {
        // if (checked) {
        //     d3.selectAll(".detailed-poison").attr("display", "block");
        // } else {
        //     d3.selectAll(".detailed-poison").attr("display", "none");
        // }
        let newSwitches = Object.assign({}, this.state.elementVisibleSwitches);
        newSwitches.edges.poison_flipped = checked; // !(this.state.elementVisibleSwitches.edges.poison_flipped);

        this.setState({elementVisibleSwitches: newSwitches});
    }

    edgePoisonToKNNOnChange(checked) {
        // if (checked) {
        //     d3.selectAll(".poison-knn").attr("display", "block");
        // } else {
        //     d3.selectAll(".poison-knn").attr("display", "none");
        // }
        let newSwitches = Object.assign({}, this.state.elementVisibleSwitches);
        newSwitches.edges.poison_knn = checked; // !(this.state.elementVisibleSwitches.edges.poison_knn);

        this.setState({elementVisibleSwitches: newSwitches});
    }

    edgeBetweenPoisonsOnChange(checked) {
        // if (checked) {
        //     d3.select("#edge-group")
        //         .selectAll(".poison")
        //         .attr("display", "block");
        // } else {
        //     d3.select("#edge-group")
        //         .selectAll(".poison")
        //         .attr("display", "none");
        // }
        let newSwitches = Object.assign({}, this.state.elementVisibleSwitches);
        newSwitches.edges.poison = checked; // !(this.state.elementVisibleSwitches.edges.poison);

        this.setState({elementVisibleSwitches: newSwitches});
    }

    previousModelRadarOnChange(checked) {
        if (checked) {
            d3.select(".radar-chart-series_0").attr("display", "block");
        } else {
            d3.select(".radar-chart-series_0").attr("display", "none");
        }
    }

    currentModelRadarOnChange(checked) {
        if (checked) {
            d3.select(".radar-chart-series_1").attr("display", "block");
        } else {
            d3.select(".radar-chart-series_1").attr("display", "none");
        }
    }

    nodeTargetOnChange(checked) {
        let newSwitches = Object.assign({}, this.state.elementVisibleSwitches);
        newSwitches.nodes.target = checked; // !(this.state.elementVisibleSwitches.edges.target);

        this.setState({elementVisibleSwitches: newSwitches});
    }

    nodeFlippedOnChange(checked) {
        let newSwitches = Object.assign({}, this.state.elementVisibleSwitches);
        newSwitches.nodes.flipped = checked; // !(this.state.elementVisibleSwitches.edges.flipped);

        this.setState({elementVisibleSwitches: newSwitches});
    }

    nodePoisonOnChange(checked) {
        let newSwitches = Object.assign({}, this.state.elementVisibleSwitches);
        newSwitches.nodes.poison = checked; // !(this.state.elementVisibleSwitches.edges.poison);

        this.setState({elementVisibleSwitches: newSwitches});
    }

    nodeKNNOnChange(checked) {
        let newSwitches = Object.assign({}, this.state.elementVisibleSwitches);
        newSwitches.nodes.pureknn = checked; // !(this.state.elementVisibleSwitches.edges.pureknn);

        this.setState({elementVisibleSwitches: newSwitches});
    }

    render() {
        const {height, attack} = this.props;
        // const comparisonTitles = ["Comparison View I", "Comparison View II"];
        const comparisonTitles = ["MODEL OVERVIEW", "MODEL OVERVIEW"];

        const modelOverviewSwitchMenu = (
            <Menu>
                <Menu.Item>
                    <Switch
                        checkedChildren={<Icon type="check"/>}
                        unCheckedChildren={<Icon type="close"/>}
                        defaultChecked
                        onChange={this.previousModelRadarOnChange.bind(this)}
                    />
                    <Tag style={{marginLeft: 8}} color={comparisonColor[0]}>
                        Victim Model
                    </Tag>
                </Menu.Item>
                <Menu.Item>
                    <Switch
                        checkedChildren={<Icon type="check"/>}
                        unCheckedChildren={<Icon type="close"/>}
                        defaultChecked
                        onChange={this.currentModelRadarOnChange.bind(this)}
                    />
                    <Tag style={{marginLeft: 8}} color={comparisonColor[1]}>
                        Poisoned Model
                    </Tag>
                </Menu.Item>
            </Menu>
        );
        const edgeSwitchMenu = (
            <Menu>
                <Menu.Item>
                    <Switch
                        checkedChildren={<Icon type="check"/>}
                        unCheckedChildren={<Icon type="close"/>}
                        defaultChecked={this.state.elementVisibleSwitches.edges.knn_flipped}
                        onChange={this.edgeDetailedToKNNOnChange.bind(this)}
                    />
                    <span style={{marginLeft: 8}}>Innocnet (Target) - kNN</span>
                </Menu.Item>
                <Menu.Item>
                    <Switch
                        checkedChildren={<Icon type="check"/>}
                        unCheckedChildren={<Icon type="close"/>}
                        defaultChecked={
                            this.state.elementVisibleSwitches.edges.poison_flipped
                        }
                        onChange={this.edgeDetailedToPoisonOnChange.bind(this)}
                    />
                    <span style={{marginLeft: 8}}>Innocent (Target) - Poisoning</span>
                </Menu.Item>
                <Menu.Item>
                    <Switch
                        checkedChildren={<Icon type="check"/>}
                        unCheckedChildren={<Icon type="close"/>}
                        defaultChecked={this.state.elementVisibleSwitches.edges.poison_knn}
                        onChange={this.edgePoisonToKNNOnChange.bind(this)}
                    />
                    <span style={{marginLeft: 8}}>Poisoning - kNN</span>
                </Menu.Item>
                {/*<Menu.Item>*/}
                {/*<Switch*/}
                {/*checkedChildren={<Icon type="check" />}*/}
                {/*unCheckedChildren={<Icon type="close" />}*/}
                {/*defaultChecked={this.state.elementVisibleSwitches.edges.poison}*/}
                {/*onChange={this.edgeBetweenPoisonsOnChange.bind(this)}*/}
                {/*/>*/}
                {/*<span style={{ marginLeft: 8 }}>Poisoning - Poisoning</span>*/}
                {/*</Menu.Item>*/}
            </Menu>
        );

        const nodeSwitchMenu = (
            <Menu>
                <Menu.Item>
                    <Switch
                        checkedChildren={<Icon type="check"/>}
                        unCheckedChildren={<Icon type="close"/>}
                        defaultChecked={this.state.elementVisibleSwitches.nodes.target}
                        onChange={this.nodeTargetOnChange.bind(this)}
                    />
                    <span style={{marginLeft: 8}}>Target</span>
                </Menu.Item>
                <Menu.Item>
                    <Switch
                        checkedChildren={<Icon type="check"/>}
                        unCheckedChildren={<Icon type="close"/>}
                        defaultChecked={this.state.elementVisibleSwitches.nodes.poison}
                        onChange={this.nodePoisonOnChange.bind(this)}
                    />
                    <span style={{marginLeft: 8}}>Poisoning</span>
                </Menu.Item>
                <Menu.Item>
                    <Switch
                        checkedChildren={<Icon type="check"/>}
                        unCheckedChildren={<Icon type="close"/>}
                        defaultChecked={this.state.elementVisibleSwitches.nodes.flipped}
                        onChange={this.nodeFlippedOnChange.bind(this)}
                    />
                    <span style={{marginLeft: 8}}>Innocent</span>
                </Menu.Item>
                <Menu.Item>
                    <Switch
                        checkedChildren={<Icon type="check"/>}
                        unCheckedChildren={<Icon type="close"/>}
                        defaultChecked={this.state.elementVisibleSwitches.nodes.pureknn}
                        onChange={this.nodeKNNOnChange.bind(this)}
                    />
                    <span style={{marginLeft: 8}}>kNN</span>
                </Menu.Item>
            </Menu>
        );

        const instanceFilterOptions = (
            <Menu>
                <Menu.Item>
                    <Switch
                        checkedChildren={<Icon type="check"/>}
                        unCheckedChildren={<Icon type="close"/>}
                        defaultChecked={this.state.rankedInstanceDisplayOption[0]}
                        onChange={checked => {
                            let temp = this.state.rankedInstanceDisplayOption;
                            temp[0] = checked ? 1 : 0;
                            this.setState({
                                rankedInstanceDisplayOption: temp
                            });
                        }}
                    />
                    <span style={{marginLeft: 8}}>Target</span>
                </Menu.Item>
                <Menu.Item>
                    <Switch
                        checkedChildren={<Icon type="check"/>}
                        unCheckedChildren={<Icon type="close"/>}
                        defaultChecked={this.state.rankedInstanceDisplayOption[1]}
                        onChange={checked => {
                            let temp = this.state.rankedInstanceDisplayOption;
                            temp[1] = checked ? 1 : 0;
                            this.setState({
                                rankedInstanceDisplayOption: temp
                            });
                        }}
                    />
                    <span style={{marginLeft: 8}}>Poisoning</span>
                </Menu.Item>
                <Menu.Item>
                    <Switch
                        checkedChildren={<Icon type="check"/>}
                        unCheckedChildren={<Icon type="close"/>}
                        defaultChecked={this.state.rankedInstanceDisplayOption[2]}
                        onChange={checked => {
                            let temp = this.state.rankedInstanceDisplayOption;
                            temp[2] = checked ? 1 : 0;
                            this.setState({
                                rankedInstanceDisplayOption: temp
                            });
                        }}
                    />
                    <span style={{marginLeft: 8}}>Innocent</span>
                </Menu.Item>
                <Menu.Item>
                    <Switch
                        checkedChildren={<Icon type="check"/>}
                        unCheckedChildren={<Icon type="close"/>}
                        defaultChecked={this.state.rankedInstanceDisplayOption[3]}
                        onChange={checked => {
                            let temp = this.state.rankedInstanceDisplayOption;
                            temp[3] = checked ? 1 : 0;
                            this.setState({
                                rankedInstanceDisplayOption: temp
                            });
                        }}
                    />
                    <span style={{marginLeft: 8}}>Other</span>
                </Menu.Item>
            </Menu>
        );

        return (
            <div
                style={{
                    width: "100%",
                    height: height
                }}
            >
                <Row gutter={8}>
                    <Col span={15}>
                        <Row
                            gutter={8}
                            style={{
                                height: height * COMPARISON_VIEW_HEIGHT_PERCENT
                            }}
                        >
                            <Col span={10}>
                                <Card
                                    style={{
                                        width: "100%",
                                        height: 324
                                    }}
                                    title={comparisonTitles[this.state.radarViewMode]}
                                    // extra={<Switch size="small" onChange={this.switchOnChange} />}
                                    extra={
                                        <Dropdown
                                            overlay={modelOverviewSwitchMenu}
                                            trigger={["click"]}
                                        >
                                            <Button
                                                href="#"
                                                className="ant-dropdown-link"
                                                size="small"
                                            >
                                                <Icon type="filter"/>Model<Icon type="down"/>
                                            </Button>
                                        </Dropdown>
                                    }
                                    size="small"
                                    id="model-overview"
                                >
                                    {/* <ModelComparisonView
                    attack={attack}
                    height={height * COMPARISON_VIEW_HEIGHT_PERCENT - 5}
                  /> */}
                                    <RadarViewAlt
                                        attack={attack}
                                        height={height * COMPARISON_VIEW_HEIGHT_PERCENT - 5}
                                        victimId={this.props.victimId}
                                        newVictims={this.props.newVictims}
                                        radarViewMode={this.state.radarViewMode}
                                        newStrategy={this.props.newStrategy}
                                    />
                                </Card>
                            </Col>

                            <Col span={14}>
                                <Card title="FEATURE VIEW" size="small" id="feature-view">
                                    <FeatureViewAlt
                                        attack={attack}
                                        height={height * COMPARISON_VIEW_HEIGHT_PERCENT - 5}
                                        actualPoisonColor={this.props.actualPoisonColor}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Row
                            style={{
                                height: height * (1 - COMPARISON_VIEW_HEIGHT_PERCENT)
                            }}
                        >
                            <Card
                                size="small"
                                title="INSTANCE VIEW"
                                id="instance-view"
                                extra={
                                    <Dropdown
                                        overlay={instanceFilterOptions}
                                        trigger={["click"]}
                                    >
                                        <Button
                                            href="#"
                                            className="ant-dropdown-link"
                                            size="small"
                                            style={{marginRight: "480px"}}
                                        >
                                            <Icon type="filter"/>Instances<Icon type="down"/>
                                        </Button>
                                    </Dropdown>
                                }
                            >
                                <Col span={14}>
                                    <InstanceView
                                        attack={attack}
                                        height={height * (1 - COMPARISON_VIEW_HEIGHT_PERCENT)}
                                        filteredDataInstanceIds={this.state.filteredDataInstanceIds}
                                        kForknn={this.state.kForknn}
                                        updateFilteredDataInstanceIds={this.updateFilteredDataInstanceIds.bind(
                                            this
                                        )}
                                        selectedInstanceIdOnChange={this.selectedInstanceIdOnChange.bind(
                                            this
                                        )}
                                        actualPoisonColor={this.props.actualPoisonColor}
                                        rankedInstanceDisplayOption={
                                            this.state.rankedInstanceDisplayOption
                                        }
                                    />
                                </Col>
                                <Col span={10}>
                                    <TSNEView
                                        attack={attack}
                                        height={height}
                                        selectedInstanceId={this.state.selectedInstanceId}
                                        actualPoisonColor={this.props.actualPoisonColor}
                                        selectedInstanceIdOnChange={this.selectedInstanceIdOnChange.bind(
                                            this
                                        )}
                                    />
                                </Col>
                            </Card>
                        </Row>
                    </Col>
                    <Col span={9}>
                        <Card
                            title="LOCAL IMPACT VIEW"
                            id="local-impact-view"
                            size="small"
                            extra={
                                <div>
                  <span style={{marginRight: 8}}>
                    <Dropdown
                        overlay={nodeSwitchMenu}
                        placement="bottomRight"
                        trigger={["click"]}
                    >
                      <Button
                          className="ant-dropdown-link"
                          href="#"
                          size="small"
                      >
                        <Icon type="filter"/>
                        Nodes <Icon type="down"/>
                      </Button>
                    </Dropdown>
                  </span>
                                    <span>
                    <Dropdown
                        overlay={edgeSwitchMenu}
                        placement="bottomRight"
                        trigger={["click"]}
                    >
                      <Button
                          className="ant-dropdown-link"
                          href="#"
                          size="small"
                      >
                        <Icon type="filter"/>
                        Edges <Icon type="down"/>
                      </Button>
                    </Dropdown>
                  </span>
                                </div>
                            }
                        >
                            <KNNGraphView
                                attack={attack}
                                height={height}
                                selectedInstanceId={this.state.selectedInstanceId}
                                kForknn={this.state.kForknn}
                                actualPoisonColor={this.props.actualPoisonColor}
                                selectedInstanceIdOnChange={this.selectedInstanceIdOnChange.bind(
                                    this
                                )}
                                elementVisibleSwitches={cloneDeep(
                                    this.state.elementVisibleSwitches
                                )}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }
}
