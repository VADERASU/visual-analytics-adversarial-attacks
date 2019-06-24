import React, * as react from "react";
import {findDOMNode} from "react-dom";
import numeric from "numericjs";
import {Col, Divider, Icon, Row} from "antd";
import * as d3 from "d3";
import {labelNormalColorMap} from "../../utils/ColorScheme";

import "../styles/KNNGraphView.css";

const highlightFadeOpacity = 0.2;

const WORD_RIGHT_SHIFT = 2;
const ID_FONT_SIZE = 13;

const NODE_STYLE = {
    RADIUS: {
        VICTIM: 35,
        DETAILED: 35,
        POISON: 15,
        OTHER: 6
    },

    DETAILED_GLYPH: {
        MIN_R: 10,
        KERNEL_MAX_R: 20,
        OLD_RING_INNER_R: 23,
        OLD_RING_OUTER_R: 29,
        NEW_RING_INNER: 31,
        NEW_RING_OUTER: 35,
        MAX_R: 35
    }
};

const EDGE_CURVE_RATIO = 0.1;

const getRotationMatrix = theta => {
    const sinTheta = Math.sin(theta),
        cosTheta = Math.cos(theta);

    return [[cosTheta, -sinTheta], [sinTheta, cosTheta]];
};

const getNormalLeftVector = vec => {
    const normal = numeric.dot(vec, getRotationMatrix(Math.PI / 2));

    return numeric.div(normal, numeric.norm2(normal));
};

const shouldReverseOrderForImpact = (s, t) => {
    switch (s.type) {
        case "poison":
            return false;
        case "flipped":
            return true;
        case "pureknn":
            if (t.type === "poison") return true;
            else if (t.type === "flipped") return false;
            break;
        default:
            return false;
    }
};

export default class KNNGraphView extends react.Component {
    constructor(props) {
        super(props);

        this.state = {
            canvasPrefix: props.attack.name
        };
    }

    render() {
        const {
            attack,
            height,
            selectedInstanceId,
            kForknn,
            selectedInstanceIdOnChange,
            actualPoisonColor,
            elementVisibleSwitches
        } = this.props;
        const {Xids} = attack;

        const controllerHeight = 32,
            canvasHeight = height - controllerHeight;

        const knnNodesIdMap = {};

        attack["knnGraph"]["nodes"].forEach((node, idx) => {
            knnNodesIdMap[node["id"]] = idx;
        });

        const selectedInstanceIndex = Xids.indexOf(selectedInstanceId);
        let tipData = null;
        if (selectedInstanceIndex in knnNodesIdMap) {
            const currentNode =
                attack["knnGraph"]["nodes"][knnNodesIdMap[selectedInstanceIndex]];
            if (currentNode.isDetailed || currentNode.isVictim) {
                tipData = (
                    <div>
                        <strong>
                            {currentNode.isVictim
                                ? "Instance Type: Victim"
                                : "Instance Type: Influenced"}
                        </strong>
                        <Row
                            type="flex"
                            justify="center"
                            gutter={16}
                            style={{paddingTop: "10px"}}
                        >
                            <Col span={8}>
                                <div>
                                    <strong>{attack["labelNames"][0]}</strong>
                                </div>
                                <div>{currentNode.oldKnnLabelCount[0]}</div>
                                <div>
                                    {currentNode.knnLabelCount[0] >
                                    currentNode.oldKnnLabelCount[0] ? (
                                        <Icon type="arrow-down" style={{color: "#3f8600"}}/>
                                    ) : (
                                        <Icon type="arrow-down" style={{color: "#cf1322"}}/>
                                    )}
                                </div>
                                <div>{currentNode.knnLabelCount[0]}</div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>{attack["labelNames"][1]}</strong>
                                </div>
                                <div>{currentNode.oldKnnLabelCount[1]}</div>
                                <div>
                                    {currentNode.knnLabelCount[1] >
                                    currentNode.oldKnnLabelCount[1] ? (
                                        <Icon type="arrow-down" style={{color: "#3f8600"}}/>
                                    ) : (
                                        <Icon type="arrow-down" style={{color: "#cf1322"}}/>
                                    )}
                                </div>
                                <div>{currentNode.knnLabelCount[1]}</div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>Poison</strong>
                                </div>
                                <div>{currentNode.oldKnnLabelCount[2]}</div>
                                <div>
                                    {currentNode.knnLabelCount[2] >
                                    currentNode.oldKnnLabelCount[2] ? (
                                        <Icon type="arrow-down" style={{color: "#3f8600"}}/>
                                    ) : (
                                        <Icon type="arrow-down" style={{color: "#cf1322"}}/>
                                    )}
                                </div>
                                <div>{currentNode.knnLabelCount[2]}</div>
                            </Col>
                        </Row>
                    </div>
                );
            }
            if (currentNode.isPoison) {
                tipData = (
                    <div>
                        <strong>Instance Type: Poison</strong>
                        <Row
                            type="flex"
                            justify="center"
                            gutter={16}
                            style={{paddingTop: "10px"}}
                        >
                            <Col span={8}>
                                <div>
                                    <strong>{attack["labelNames"][0]}</strong>
                                </div>
                                <div>{currentNode.knnLabelCount[0]}</div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>{attack["labelNames"][1]}</strong>
                                </div>
                                <div>{currentNode.knnLabelCount[1]}</div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>Poison</strong>
                                </div>
                                <div>{currentNode.knnLabelCount[2]}</div>
                            </Col>
                        </Row>
                    </div>
                );
            }
            if (currentNode.isKNN) {
                tipData = (
                    <div>
                        <stong>KNN</stong>
                    </div>
                );
            }
        } else {
            tipData = <p>Not relevant on this graph</p>;
        }

        return (
            <div
                style={{
                    height: "680px",
                    width: "100%",
                    position: "relative"
                }}
            >
                <Row height={controllerHeight}/>

                <KNNGraphCanvas
                    height={canvasHeight}
                    width={683}
                    attack={attack}
                    kForknn={kForknn}
                    selectedInstanceId={selectedInstanceId}
                    canvasPredix={attack.name}
                    selectedInstanceIdOnChange={selectedInstanceIdOnChange}
                    actualPoisonColor={actualPoisonColor}
                    elementVisibleSwitches={elementVisibleSwitches}
                />
                {selectedInstanceId === -1 ? null : (
                    <div
                        style={{
                            position: "absolute",
                            left: attack["datasetName"] === "MNIST_784" ? 400 : 480,
                            top: 10,
                            width: attack["datasetName"] === "MNIST_784" ? 280 : 200,
                            height: 170,
                            backgroundColor: "white",
                            borderRadius: "5px",
                            border: "1px solid #ccc",
                            padding: "10px"
                        }}
                    >
                        <h4>ID: {selectedInstanceId}</h4>
                        <Divider style={{margin: "7px 0"}}/>
                        {tipData}
                    </div>
                )}
            </div>
        );
    }
}


/**
 * KNNGraghCanvas
 */

/**
 * Associations between attr and class in "elementVisibleSwitches"
 * @type {*[]}
 */

const edgeAttrAndClassName = [
    {attr: "knn_flipped", className: "detailed-knn"},
    {attr: "poison_flipped", className: "detailed-poison"},
    {attr: "poison_knn", className: "poison-knn"},
    {attr: "poison", className: "poison"}
];
const nodeAttrAndClassName = [
    {attr: "target", className: "victim"},
    {attr: "flipped", className: "detailed:not(.victim)"},
    {attr: "poison", className: "poison"},
    {attr: "pureknn", className: "pureknn"}
];

class KNNGraphCanvas extends react.Component {
    constructor(props) {
        super(props);

        this.state = {};
    }

    shouldComponentUpdate() {
        return false;
    }

    componentDidMount() {
        /******************************
         * Assemble the graph data    *
         ******************************/

        const {attack, actualPoisonColor} = this.props;
        const {
            Xids,

            knnGraph
        } = attack;

        const nodeData = knnGraph.nodes,
            edgeData = knnGraph.links;

        const nodeDataIdToIdxMap = {};
        nodeData.forEach((node, i) => {
            nodeDataIdToIdxMap[node.id] = i;
        });

        // set the node ids, indices and object refs
        edgeData.forEach(edge => {
            edge.sourceNode = nodeData[nodeDataIdToIdxMap[edge.source]];
            edge.targetNode = nodeData[nodeDataIdToIdxMap[edge.target]];
            edge.sourceXid = Xids[edge.source];
            edge.targetXid = Xids[edge.target];
            edge.shouldReverse = shouldReverseOrderForImpact(
                edge.sourceNode,
                edge.targetNode
            );
        });

        // re-scale the weights on edges
        const edgeWeightExtent = d3.extent(edgeData, e => e.weight);
        const edgeWeightScale = d3
            .scaleSymlog()
            .domain(edgeWeightExtent)
            .range([0, 1]);

        const lenEdgeData = edgeData.length;
        for (let i = 0; i < lenEdgeData; i++) {
            edgeData[i].weight = edgeWeightScale(edgeData[i].weight);
        }

        /**
         * Dimensions
         */
        const boundingBox = findDOMNode(this).getBoundingClientRect();

        /**
         * Launch
         */
        this.setState(
            {
                canvasHeight: boundingBox.height,
                canvasWidth: boundingBox.width,
                nodeData: nodeData,
                edgeData: edgeData
            },
            () => {
                this.initializeCanvas(actualPoisonColor);
            }
        );
    }

    initializeCanvas(actualPoisonColor) {
        const {canvasHeight, canvasWidth, nodeData, edgeData} = this.state;
        const {canvasPrefix, selectedInstanceIdOnChange} = this.props;
        const svg = d3.select(findDOMNode(this)),
            rootGroup = svg.select("g#base-group"),
            nodeGroup = rootGroup.select("g#node-group"),
            edgeGroup = rootGroup.select("g#edge-group"),
            shadowEdgeGroup = rootGroup.select("g#shadow-edge-group");

        svg.call(
            d3
                .zoom()
                .scaleExtent([0.1, 4])
                .on("zoom", () => {
                    rootGroup.attr("transform", d3.event.transform);
                })
        );

        // // Alternative solution: TSNE
        // let tsneModel = new TSNE({
        //     dim: 2,
        //     perplexity: 30.0,
        //     earlyExaggeration: 4.0,
        //     learningRate: 100.0,
        //     nIter: 1000,
        //     metric: "euclidean"
        // });
        //
        // tsneModel.init({
        //     data: nodeData.map(n => n.trainData),
        //     type: "dense"
        // });
        //
        // const outputScaled = tsneModel.getOutputScaled();
        //
        // const widthScaler = d3
        //         .scaleLinear()
        //         .domain(d3.extent(outputScaled, o => o[0]))
        //         .range([0, canvasWidth]),
        //     heightScaler = d3
        //         .scaleLinear()
        //         .domain(d3.extent(outputScaled, o => o[1]))
        //         .range([0, canvasHeight]);
        //
        // nodeData.forEach((n, i) => {
        //     n.x = widthScaler(outputScaled[i][0]);
        //     n.y = heightScaler(outputScaled[i][1]);
        // });
        //
        // // anti collide
        // let antiCollideSimulation = d3
        //     .forceSimulation()
        //     .nodes(nodeData)
        //     // .force('charge', d3.forceManyBody().strength(-1))
        //     .force(
        //         "x",
        //         d3
        //             .forceX()
        //             .x(d => d["x"])
        //             .strength(0.8)
        //     )
        //     .force(
        //         "y",
        //         d3
        //             .forceY()
        //             .y(d => d["y"])
        //             .strength(0.8)
        //     )
        //     .force(
        //         "collide",
        //         d3.forceCollide().radius(d => {
        //             // if (d.isVictim) return NODE_STYLE.RADIUS.VICTIM;
        //             // else return NODE_STYLE.RADIUS.VICTIM * 0.9;
        //
        //             if (d.isPoison) return NODE_STYLE.RADIUS.POISON * 1.2;
        //             else if (d.isVictim) return NODE_STYLE.RADIUS.VICTIM * 1.2;
        //             else if (d.isDetailed) return NODE_STYLE.RADIUS.DETAILED * 1.2;
        //             else return NODE_STYLE.RADIUS.OTHER * 1.1;
        //         })
        //     )
        //     .stop();
        //
        // for (let i = 0; i < 1000; i++) {
        //     antiCollideSimulation.tick();
        // }

        // Force-directed, without tSNE
        const forceDirectedSimulation = d3.forceSimulation(nodeData)
            .force("charge", d3.forceManyBody().strength(-90))
            .force("center", d3.forceCenter(canvasWidth / 2, canvasHeight / 2))
            .force("collide", d3.forceCollide(d => {
                let r = 0;

                if (d.isPoison)
                    r = NODE_STYLE.RADIUS.POISON * 1.05;
                else if (d.isVictim)
                    r = NODE_STYLE.RADIUS.VICTIM * 1.05;
                else if (d.isDetailed)
                    r = NODE_STYLE.RADIUS.DETAILED * 1.05;
                else
                    r = NODE_STYLE.RADIUS.OTHER * 1.05;

                return r;
            }))
            .force("x", d3.forceX(canvasWidth / 2).strength(0.14))
            .force("y", d3.forceY(canvasHeight / 2).strength(0.14))
            .force(
                "link",
                d3.forceLink(edgeData)
                    .id((d, i) => {
                        return d.id;
                    })
                    .distance(
                        l => {
                            if (l.weight === undefined) return 10.0;
                            return l.weight * 10;
                        }
                    )
                    .strength(2)
            );

        for (let i = 0; i < 2000; i++) {
            forceDirectedSimulation.tick();
        }

        const finalWidthScaler = d3
            .scaleLinear()
            .domain(d3.extent(nodeData, n => n.x))
            .range([0, canvasWidth]);
        const finalHeightScaler = d3
            .scaleLinear()
            .domain(d3.extent(nodeData, n => n.y))
            .range([0, canvasHeight]);

        nodeData.forEach(n => {
            n.x = finalWidthScaler(n.x);
            n.y = finalHeightScaler(n.y);
        });

        /**
         * Initialize node and edge glyphs
         */
        function addNodeGlyphBaseWhiteCircle(nodeGroupSelectAll) {
            nodeGroupSelectAll
                .append("g")
                .classed("node-glyph", true)
                .attr("id", d => `node-glyph-${d.id}`)
                .classed("victim", d => d.isVictim)
                .classed("poison", d => d.isPoison)
                .classed("detailed", d => d.isDetailed)
                .classed("pureknn", d => d.isKNN)
                .attr("transform", d => `translate(${d.x},${d.y})`);

            nodeGroupSelectAll.selectAll("g.detailed").lower();
            nodeGroupSelectAll.selectAll("g.victim").lower();
            nodeGroupSelectAll.selectAll("g.poison").lower();
            nodeGroupSelectAll.selectAll("g.pureknn").lower();
        }

        function addDetailedNode(nodeGroupSelectAll) {
            const radiusScaler = d3
                .scaleLinear()
                .domain([0.5, 1.0])
                .range([
                    NODE_STYLE.DETAILED_GLYPH.MIN_R,
                    NODE_STYLE.DETAILED_GLYPH.KERNEL_MAX_R
                ]);

            nodeGroupSelectAll
                .append("circle")
                .classed("base-white-circle", true)
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", NODE_STYLE.DETAILED_GLYPH.MAX_R)
                .style("fill", "white")
                .style("stroke", "none");

            nodeGroupSelectAll
                .append("circle")
                .classed("outer-stroke", true)
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", NODE_STYLE.DETAILED_GLYPH.OLD_RING_OUTER_R)
                .style("fill", "none")
                .style("stroke", "#555")
                .style("stroke-width", 0.75);

            nodeGroupSelectAll
                .append("circle")
                .classed("inner-stroke", true)
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", NODE_STYLE.DETAILED_GLYPH.OLD_RING_INNER_R)
                .style("fill", "none")
                .style("stroke", "#555")
                .style("stroke-width", 0.75);

            nodeGroupSelectAll
                .append("circle")
                .classed("center-circle", true)
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", d => radiusScaler(d3.max(d.predictedProba))) //computeRadius)
                .style("fill", d =>
                    d.predictedLabel === d.parentPredictedLabel
                        ? labelNormalColorMap[d.predictedLabel]
                        : `url(#${canvasPrefix}-pattern-stripe-${d.predictedLabel})`
                );

            nodeGroupSelectAll
                .append("circle")
                .classed("center-circle", true)
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", d => radiusScaler(d3.max(d.predictedProba))) //computeRadius)
                .style("fill", "none")
                .style("stroke", d => (d.isVictim ? "#666" : "#555"))
                .style("stroke-width", d => (d.isVictim ? 2.5 : 1));

            const innerPieGen = d3.pie().sort(null);
            const innerArcGen = d3
                .arc()
                .innerRadius(NODE_STYLE.DETAILED_GLYPH.OLD_RING_INNER_R)
                .outerRadius(NODE_STYLE.DETAILED_GLYPH.OLD_RING_OUTER_R);

            // inner classes
            nodeGroupSelectAll
                .append("g")
                .classed("inner-pie", true)
                .selectAll("path.inner-pie-path")
                .data(d => innerPieGen(d.oldKnnLabelCount))
                .enter()
                .append("path")
                .classed("inner-pie-path", true)
                .attr("d", innerArcGen)
                .style("fill", (_d, i) => labelNormalColorMap[i])
                .style("stroke", "none");

            // outer classes

            const outerPieGen = d3.pie().sort(null);
            const outerArcGen = d3
                .arc()
                .innerRadius(NODE_STYLE.DETAILED_GLYPH.NEW_RING_INNER)
                .outerRadius(NODE_STYLE.DETAILED_GLYPH.NEW_RING_OUTER);

            nodeGroupSelectAll
                .append("g")
                .classed("outer-pie", true)
                .selectAll("path.outer-pie-path")
                .data(d =>
                    outerPieGen(
                        [d.knnLabelCount[0], d.knnLabelCount[2], d.knnLabelCount[1]] // class 0 - poison - class 1
                    )
                )
                .enter()
                .append("path")
                .classed("outer-pie-path", true)
                .attr("d", outerArcGen)
                .style("fill", (_d, i) => {
                    switch (i) {
                        case 0:
                            return labelNormalColorMap[0];
                        case 1:
                            return actualPoisonColor;
                        case 2:
                            return labelNormalColorMap[1];
                        default:
                            return "#000";
                    }
                })
                .style("stroke", "none");

            // Compute the fuse line
            nodeGroupSelectAll.append("p").attr("d", () => {
            });

            nodeGroupSelectAll
                .append("line")
                .attr("x1", 0)
                .attr("y1", -NODE_STYLE.DETAILED_GLYPH.OLD_RING_OUTER_R)
                .attr("x2", 0)
                .attr("y2", -NODE_STYLE.DETAILED_GLYPH.MAX_R + 2)
                .style("stroke", "#555")
                .style("stroke-width", 1);

            nodeGroupSelectAll
                .append("text")
                .attr("x", NODE_STYLE.DETAILED_GLYPH.MAX_R + WORD_RIGHT_SHIFT)
                .attr("y", 0)
                .style("font-family", "sans-serif")
                .style("font-size", ID_FONT_SIZE)
                .style("text-anchor", "start")
                .style("alignment-baseline", "central")
                .text(d => d.realXid);
        }

        function addPoisonNode(nodeGroupSelectAll) {
            const radiusScaler = d3
                .scaleLinear()
                .domain([0.5, 1.0])
                .range([
                    NODE_STYLE.DETAILED_GLYPH.MIN_R,
                    NODE_STYLE.DETAILED_GLYPH.KERNEL_MAX_R
                ]);

            const poisonOpacityScaler = d3
                .scaleLinear()
                .domain(d3.extent(nodeData.filter(n => n.isPoison), n => n.impactSum))
                .range([0.1, 1]);

            nodeGroupSelectAll
                .append("circle")
                .classed("base-white-circle", true)
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", d => radiusScaler(d3.max(d.predictedProba)))
                .style("fill", "white")
                .style("stroke", "none");

            nodeGroupSelectAll
                .append("circle")
                .classed("poison-circle", true)
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", d => radiusScaler(d3.max(d.predictedProba)))
                .style("fill", actualPoisonColor)
                .style("fill-opacity", d => poisonOpacityScaler(d.impactSum))
                .style("stroke", "#555")
                .style("stroke", 0.75);

            // nodeGroupSelectAll.append('text')
            //     .attr('x', d => radiusScaler(d3.max(d.predictedProba)) + WORD_RIGHT_SHIFT)
            //     .attr('y', 0)
            //     .style('font-family', 'sans-serif')
            //     .style('font-size', ID_FONT_SIZE)
            //     .style('text-anchor', 'start')
            //     .style('alignment-baseline', 'central')
            //     .text(d => d.realXid);
        }

        function addKNNNode(nodeGroupSelectAll) {
            nodeGroupSelectAll
                .append("circle")
                .classed("base-white-circle", true)
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", NODE_STYLE.RADIUS.OTHER)
                .style("fill", "white")
                .style("stroke", "none");

            nodeGroupSelectAll
                .append("circle")
                .classed("pureknn-circle", true)
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", NODE_STYLE.RADIUS.OTHER)
                .style("fill", d =>
                    d.predictedLabel === d.parentPredictedLabel
                        ? labelNormalColorMap[d.predictedLabel]
                        : `url(#${canvasPrefix}-pattern-stripe-${d.predictedLabel})`
                )
                .style("fill-opacity", 0.75)
                .style("stroke", "#555")
                .style("stroke", 0.75)
                .style("stroke-opacity", 0.75);

            // nodeGroupSelectAll.append('text')
            //     .attr('x', NODE_STYLE.RADIUS.OTHER + WORD_RIGHT_SHIFT)
            //     .attr('y', 0)
            //     .style('font-family', 'sans-serif')
            //     .style('font-size', ID_FONT_SIZE)
            //     .style('text-anchor', 'start')
            //     .style('alignment-baseline', 'central')
            //     .text(d => d.realXid);
        }

        /**
         * Edge Glyphs
         * @param edgeGroupSelectAll
         */

        const impactToEdgeScaler = d3
            .scaleLinear()
            .domain(
                d3.extent(
                    edgeData.filter(e => e.impact !== undefined),
                    e => Math.abs(e.impactValue) // computeEdgeImpactValue
                )
            )
            .range([1, 6]);

        function addPoisonEdge(edgeGroupSelectAll) {
            edgeGroupSelectAll
                .append("g")
                // .classed("poison", true)
                .attr("class", d => `poison s-${d.sourceNode.id} t-${d.targetNode.id}`)
                .append("line")
                .attr("x1", d => d.sourceNode.x)
                .attr("y1", d => d.sourceNode.y)
                .attr("x2", d => d.targetNode.x)
                .attr("y2", d => d.targetNode.y)
                .style("stroke", actualPoisonColor)
                .style("stroke-opacity", 0.3)
                .style("stroke-width", 4)
                .attr("filter", "url(#blur)");
        }

        const generateConnection = e => {
            const {sourceNode, targetNode} = e;
            // console.log(e);
            let poisonNode, detailedNode;
            // const impactValue = Math.abs(e.impactValue); // computeEdgeImpactValue(e);

            const shouldReverse = shouldReverseOrderForImpact(sourceNode, targetNode);

            // if (sourceNode.type === 'poison') {
            if (!shouldReverse) {
                poisonNode = sourceNode;
                detailedNode = targetNode;
            } else {
                poisonNode = targetNode;
                detailedNode = sourceNode;
            }

            const lg = d3
                .select("#forKNNssake")
                .select("defs")
                .append("linearGradient")
                .attr("id", `gr${poisonNode.realXid}-${detailedNode.realXid}`)
                .attr("x1", poisonNode.x > detailedNode.x ? 1 : 0)
                .attr("y1", poisonNode.y > detailedNode.y ? 1 : 0)
                .attr("x2", poisonNode.x > detailedNode.x ? 0 : 1)
                .attr("y2", poisonNode.y > detailedNode.y ? 0 : 1);

            lg.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", function () {
                    if (poisonNode.isPoison) {
                        return actualPoisonColor;
                    } else if (poisonNode.isKNN || poisonNode.isVictim) {
                        return labelNormalColorMap[poisonNode.predictedLabel];
                    } else {
                        return "white";
                    }
                });

            lg.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "#FFF");

            // compute the anchor points
            const startX = poisonNode.x,
                startY = poisonNode.y,
                endX = detailedNode.x,
                endY = detailedNode.y;
            const startVector = [startX, startY],
                endVector = [endX, endY];
            const midVector = numeric.div(numeric.add(startVector, endVector), 2);
            const fullDist = numeric.norm2(numeric.sub(endVector, startVector));

            const connectionVector = [endX - startX, endY - startY];
            const normalLeftVector = getNormalLeftVector(connectionVector);

            const curveGen = d3
                .line()
                .curve(d3.curveBasis)
                .x(d => d[0])
                .y(d => d[1]);

            return curveGen([
                startVector,
                numeric.add(
                    midVector,
                    numeric.mul(normalLeftVector, fullDist * EDGE_CURVE_RATIO)
                ),
                endVector
            ]);
        };

        function addPoisonToDetailedEdge(edgeGroupSelectAll) {
            const sameClassEdgeGroups = edgeGroupSelectAll
                .filter(
                    d => d.sourceNode.predictedLabel === d.targetNode.predictedLabel
                )
                .append("g")
                .attr("class", d => `detailed-poison s-${d.sourceNode.id} t-${d.targetNode.id}`);
            // .classed("detailed-poison", true);

            sameClassEdgeGroups
                .append("path")
                .attr("d", generateConnection)
                .style("fill", "none") // d => labelNormalColorMap[d.sourceNode.predictedLabel])
                // .style("stroke", "url(#grad-2)")
                .style(
                    "stroke",
                    (
                        d //`url(#gr${d.sourceNode.realXid}-${d.targetNode.realXid})`
                    ) => `url(#gr${d.targetNode.realXid}-${d.sourceNode.realXid})`
                )
                .style("stroke-width", d => impactToEdgeScaler(Math.abs(d.impactValue)))
                .style("stroke-opacity", 1);
            // .style('marker-end', 'url(#arrow)');

            const counterClassEdgeGroups = edgeGroupSelectAll
                .filter(
                    d => d.sourceNode.predictedLabel !== d.targetNode.predictedLabel
                )
                .append("g")
                .attr("class", d => `detailed-poison s-${d.sourceNode.id} t-${d.targetNode.id}`);
            // .classed("detailed-poison", true);

            counterClassEdgeGroups
                .append("path")
                .attr("d", generateConnection)
                .style("fill", "none")
                // .style("stroke", "url(#grad-2)")
                .style(
                    "stroke",
                    (
                        d //`url(#gr${d.sourceNode.realXid}-${d.targetNode.realXid})`
                    ) => `url(#gr${d.targetNode.realXid}-${d.sourceNode.realXid})`
                )
                .style("stroke-width", d => impactToEdgeScaler(Math.abs(d.impactValue)))
                .style("stroke-opacity", 1);
            // .style('marker-end', 'url(#arrow)');
        }

        function addPoisonToKnnEdge(edgeGroupSelectAll) {
            const sameClassEdgeGroups = edgeGroupSelectAll
                .filter(
                    d => d.sourceNode.predictedLabel === d.targetNode.predictedLabel
                )
                .append("g")
                .attr("class", d => `poison-knn s-${d.sourceNode.id} t-${d.targetNode.id}`);
            // .classed("poison-knn", true);

            sameClassEdgeGroups
                .append("path")
                .attr("d", generateConnection)
                .style("fill", "none") // d => labelNormalColorMap[d.sourceNode.predictedLabel])
                .style("stroke", actualPoisonColor)
                .style("stroke-width", d => impactToEdgeScaler(Math.abs(d.impactValue)))
                .style("stroke-opacity", 0.75);
            // .style("marker-end", "url(#arrow)");

            const counterClassEdgeGroups = edgeGroupSelectAll
                .filter(
                    d => d.sourceNode.predictedLabel !== d.targetNode.predictedLabel
                )
                .append("g")
                .attr("class", d => `poison-knn s-${d.sourceNode.id} t-${d.targetNode.id}`);
            // .classed("poison-knn", true);

            counterClassEdgeGroups
                .append("path")
                .attr("d", generateConnection)
                .style("fill", "none")
                .style("stroke", actualPoisonColor)
                .style("stroke-width", d => impactToEdgeScaler(Math.abs(d.impactValue)))
                .style("stroke-opacity", 0.75);
            // .style("marker-end", "url(#arrow)");
        }

        function addDetailedToKnnEdge(edgeGroupSelectAll) {
            const sameClassEdgeGroups = edgeGroupSelectAll
                .filter(
                    d => d.sourceNode.predictedLabel === d.targetNode.predictedLabel
                )
                .append("g")
                .attr("class", d => `detailed-knn s-${d.sourceNode.id} t-${d.targetNode.id}`);
            // .classed("detailed-knn", true)
            // .classed(d => `s-${d.sourceNode.id}`, true)
            // .classed(d => `t-${d.targetNode.id}`, true);

            sameClassEdgeGroups
                .append("path")
                .attr("d", generateConnection)
                .style("fill", "none") // d => labelNormalColorMap[d.sourceNode.predictedLabel])
                .style(
                    "stroke",
                    d =>
                        // labelNormalColorMap[
                        //     (d.sourceNode.type === 'pureknn') ? d.sourceNode.predictedLabel : d.targetNode.predictedLabel
                        // ]
                        // `url(#grad-${
                        //   d.sourceNode.type === "pureknn"
                        //     ? d.sourceNode.predictedLabel
                        //     : d.targetNode.predictedLabel
                        // })`
                        // `url(#gr${d.sourceNode.realXid}-${d.targetNode.realXid})`
                        `url(#gr${d.targetNode.realXid}-${d.sourceNode.realXid})`
                )
                .style("stroke-width", d => impactToEdgeScaler(Math.abs(d.impactValue)))
                .style("stroke-opacity", 0.75);
            // .style("marker-end", "url(#arrow)");

            const counterClassEdgeGroups = edgeGroupSelectAll
                .filter(
                    d => d.sourceNode.predictedLabel !== d.targetNode.predictedLabel
                )
                .append("g")
                .attr("class", d => `detailed-knn s-${d.sourceNode.id} t-${d.targetNode.id}`);
            // .classed("detailed-knn", true);

            counterClassEdgeGroups
                .append("path")
                .attr("d", generateConnection)
                .style("fill", "none")
                .style(
                    "stroke",
                    d =>
                        // labelNormalColorMap[
                        //     (d.sourceNode.type === 'pureknn') ? d.sourceNode.predictedLabel : d.targetNode.predictedLabel
                        //     ]
                        // `url(#grad-${
                        //   d.sourceNode.type === "pureknn"
                        //     ? d.sourceNode.predictedLabel
                        //     : d.targetNode.predictedLabel
                        // })`
                        // `url(#gr${d.sourceNode.realXid}-${d.targetNode.realXid})`
                        `url(#gr${d.targetNode.realXid}-${d.sourceNode.realXid})`
                )
                .style("stroke-width", d => impactToEdgeScaler(Math.abs(d.impactValue)))
                .style("stroke-opacity", 0.75);
            // .style("marker-end", "url(#arrow)");
        }

        /**
         * Add nodes
         */
        nodeGroup
            .selectAll("g.node-glyph")
            .data(nodeData)
            .enter()
            .call(addNodeGlyphBaseWhiteCircle);

        nodeGroup.selectAll("g.node-glyph").on("click", d => {
            selectedInstanceIdOnChange(d.realXid);
        });

        nodeGroup.selectAll("g.pureknn").call(addKNNNode);

        nodeGroup.selectAll("g.poison").call(addPoisonNode);

        nodeGroup.selectAll("g.detailed").call(addDetailedNode);

        /**
         * Add edges
         */
        edgeGroup
            .selectAll("g.detailed-knn")
            .data(edgeData.filter(e => e.type === "knn_flipped"))
            .enter()
            .call(addDetailedToKnnEdge);

        edgeGroup
            .selectAll("g.detailed-poison") // detailed-poison
            .data(edgeData.filter(e => e.type === "poison_flipped"))
            .enter()
            .call(addPoisonToDetailedEdge);

        edgeGroup
            .selectAll("g.poison-knn") // poison-knn
            .data(edgeData.filter(e => e.type === "poison_knn"))
            .enter()
            .call(addPoisonToKnnEdge);

        edgeGroup
            .selectAll("g.poison")  // poison
            .data(edgeData.filter(e => e.type === "poison"))
            .enter()
            .call(addPoisonEdge);

        edgeGroup
            .selectAll("g.subgraph")
            .data(edgeData.filter(e => e.type === "subgraph"))
            .enter()
            .append("g")
            .attr("class", d => `subgraph s-${d.sourceNode.id} t-${d.targetNode.id}`)
            // .classed("subgraph", true)
            .append("path")
            .attr("d", generateConnection)
            .style("fill", "none")
            .style("stroke", "#333")
            .style("stroke-width", 1)
            .style("stroke-dasharray", "5,3");

        // Disable by default
        edgeGroup.selectAll("g").style("display", "none");
        edgeGroup.selectAll("g.subgraph").style("display", null);

        // duplicate the edges into the shadow-edge-group
        edgeGroup.selectAll("g")
            .each(function (e) {
                const {source, target} = e;

                shadowEdgeGroup.append("g")
                    .attr("class", d3.select(this).attr("class"))
                    .datum(e)
                    .append("line")
                    .attr("x1", source.x)
                    .attr("y1", source.y)
                    .attr("x2", target.x)
                    .attr("y2", target.y)
                    .style("stroke", "#999")
                    .style("stroke-width", 0.75)
                    .style("stroke-opacity", 0.75);

                shadowEdgeGroup.selectAll("g.subgraph")
                    .style("display", "none");
            });

        // shadowEdgeGroup.selectAll('g')
        //     .data(edgeData)
        //     .enter()
        //     .append('g')
        //     .attr('class', d => {
        //         let typeClass;
        //
        //         switch (d.type) {
        //             case 'poison_knn':
        //                 typeClass = 'poison-knn';
        //                 break;
        //             case 'knn_flipped':
        //                 typeClass = 'detailed-knn';
        //                 break;
        //             case 'poison_knn':
        //                 typeClass = 'poison-knn';
        //                 break;
        //             case 'poison_knn':
        //                 typeClass = 'poison-knn';
        //                 break;
        //         }
        //     })
    }

    /**
     * Status updated
     */
    componentWillReceiveProps(nextProps) {
        // console.log(this.props);
        // console.log(nextProps);
        // console.log(nextProps.elementVisibleSwitches);

        this.updateCanvas(nextProps);
    }

    updateCanvas(nextProps) {
        const oldElementVisibleSwitches = this.props.elementVisibleSwitches;
        const oldSelectedInstanceId = this.props.selectedInstanceId;
        const {selectedInstanceId, elementVisibleSwitches} = nextProps,
            {nodeData, edgeData} = this.state;

        const svg = d3.select(findDOMNode(this)),
            rootGroup = svg.select("g#base-group"),
            nodeGroup = rootGroup.select("g#node-group"),
            edgeGroup = rootGroup.select("g#edge-group"),
            shadowEdgeGroup = rootGroup.select("g#shadow-edge-group");

        /**
         * Remove the highlighting first, if no selection
         */
        /**
         * Highlighting
         */

        if (selectedInstanceId === -1) {
            // reset all the graphs
            // reset again;
            const fadeIn = d3
                .transition()
                .duration(200)
                .ease(d3.easeLinear);

            nodeGroup
                .selectAll("g") //classed('dimmed-elements', false);
                .transition(fadeIn)
                .style("opacity", 1);
            edgeGroup
                .selectAll("g") //classed('dimmed-elements', false);
                .transition(fadeIn)
                .style("opacity", 1);
            shadowEdgeGroup
                .selectAll('g')
                .transition(fadeIn)
                .style('opacity', 1);
        }

        /**
         * Set node and edge status based on the switches
         */
        const nodeSwitches = elementVisibleSwitches.nodes, edgeSwitches = elementVisibleSwitches.edges;
        const oldNodeSwitches = oldElementVisibleSwitches.nodes, oldEdgeSwitches = oldElementVisibleSwitches.edges;

        // Edges first
        // - knn_flipped: true,
        // - other: true,
        // - poison_flipped: true,
        // - poison_knn: true,
        // - poison: true


        const updateEdge = (newFlag, oldFlag, attr, className) => {
            // if (newFlag !== oldFlag) {
            edgeGroup.selectAll("g." + className).style("display", (edgeSwitches[attr]) ? null : "none");
            // }
        };

        edgeAttrAndClassName.forEach(a => {
            const {attr, className} = a;

            updateEdge(edgeSwitches[attr], oldEdgeSwitches[attr], attr, className);
        });

        // nodes second, including the connected edges
        // - target: true,
        // - flipped: true,
        // - poison: true,
        // - pureknn: true


        const updateNode = (newFlag, oldFlag, attr, className) => {
            // const switchValue = nodeSwitches[attr];

            // if (newFlag !== oldFlag) {
            nodeGroup.selectAll("g." + className).style("display", (newFlag) ? null : "none");
            nodeGroup.selectAll("g." + className).each(d => {
                // edgeGroup.selectAll('g.s-' + d.id).style('display', (newFlag) ? null : 'none');
                // edgeGroup.selectAll('g.t-' + d.id).style('display', (newFlag) ? null : 'none');
                edgeGroup.selectAll("g.s-" + d.id).classed("forced-display-none", !newFlag);
                edgeGroup.selectAll("g.t-" + d.id).classed("forced-display-none", !newFlag);
                shadowEdgeGroup.selectAll("g.s-" + d.id).classed("forced-display-none", !newFlag);
                shadowEdgeGroup.selectAll("g.t-" + d.id).classed("forced-display-none", !newFlag);
            });
            // }
        };

        nodeAttrAndClassName.forEach(a => {
            const {attr, className} = a;
            updateNode(nodeSwitches[attr], oldNodeSwitches[attr], attr, className);
        });

        // if (nodeSwitches.target !== oldNodeSwitches.target) {
        //     nodeGroup.select('g.victim').style('display', (nodeSwitches.target) ? null : 'none');
        //     nodeGroup.select('g.victim').each(d => {
        //         edgeGroup.selectAll('g.s-' + d.id).style('display', (nodeSwitches.target) ? null : 'none');
        //         edgeGroup.selectAll('g.t-' + d.id).style('display', (nodeSwitches.target) ? null : 'none');
        //     });
        // }
        //
        // if (nodeSwitches.flipped !== oldNodeSwitches.flipped) {
        //     nodeGroup.selectAll('g.detailed')
        //         .filter(d => !d.isVictim)
        //         .style('display', (nodeSwitches.flipped) ? null : 'none');
        //     // nodeGroup.selectAll('g.detailed').filter(d => !d.isVictim).each(d => {
        //     nodeGroup.selectAll('g.detailed:not(.victim)').each(d => {
        //         // console.log(edgeGroup.selectAll('g.s-' + d.id));
        //         // console.log(edgeGroup.selectAll('g.t-' + d.id));
        //
        //         edgeGroup.selectAll('g.s-' + d.id).style('display', (nodeSwitches.flipped) ? null : 'none');
        //         edgeGroup.selectAll('g.t-' + d.id).style('display', (nodeSwitches.flipped) ? null : 'none');
        //     });
        // }
        //
        // if (nodeSwitches.poison !== oldNodeSwitches.poison) {
        //     nodeGroup.selectAll('g.poison').style('display', (nodeSwitches.poison) ? null : 'none');
        //     nodeGroup.selectAll('g.poison').each(d => {
        //         edgeGroup.selectAll('g.s-' + d.id).style('display', (nodeSwitches.poison) ? null : 'none');
        //         edgeGroup.selectAll('g.t-' + d.id).style('display', (nodeSwitches.poison) ? null : 'none');
        //     });
        // }
        //
        // if (nodeSwitches.pureknn !== oldNodeSwitches.pureknn) {
        //     nodeGroup.selectAll('g.pureknn').style('display', (nodeSwitches.pureknn) ? null : 'none');
        //     nodeGroup.selectAll('g.pureknn').each(d => {
        //         edgeGroup.selectAll('g.s-' + d.id).style('display', (nodeSwitches.pureknn) ? null : 'none');
        //         edgeGroup.selectAll('g.t-' + d.id).style('display', (nodeSwitches.pureknn) ? null : 'none');
        //     });
        // }

        /**
         * update the shadow edges
         */
        edgeGroup.selectAll("g")
            .each(function () {
                const currentEdgeDOM = d3.select(this);
                const classStr = currentEdgeDOM.attr("class").split(" ").join(".");
                const currentShadow = shadowEdgeGroup.select("g." + classStr);

                // highlight edge is hidden; open shadow
                if (currentEdgeDOM.style("display") === "none") {
                    currentShadow.style("display", null);
                } else {
                    currentShadow.style("display", "none");
                }
            });

        // /**
        //  * Handle highlighting if some node is selected
        //  */
        // if (selectedInstanceId !== -1) {
        //     let adjacentNodes = [];
        //
        //     // 1. dim all unselected edges and nodes
        //     edgeGroup
        //
        //     // 2. highlight the selected one
        //     nodeGroup.selectAll(`g:not(#node-glyph-${selectedInstanceId}`)
        // }


        if (selectedInstanceId !== -1) {
            // find the node and all the edges

            const canFind = nodeData.findIndex(n => n.realXid === selectedInstanceId);

            // if not appeared, do nothing
            // TODO: maybe to reset here

            if (canFind === -1) {
                // reset again;
                const fadeIn = d3
                    .transition()
                    .duration(200)
                    .ease(d3.easeLinear);

                nodeGroup
                    .selectAll("g") //classed('dimmed-elements', false);
                    .transition(fadeIn)
                    .style("opacity", 1);
                edgeGroup
                    .selectAll("g") //classed('dimmed-elements', false);
                    .transition(fadeIn)
                    .style("opacity", 1);
            } else {
                const nodeIdx = nodeData[canFind].id;

                const fadeOut = d3
                    .transition()
                    .duration(200)
                    .ease(d3.easeLinear);

                let highlightNodeIds = edgeData.map(e => {
                    const {sourceNode, targetNode} = e;

                    if (sourceNode.id === nodeIdx) return targetNode.id;
                    else if (targetNode.id === nodeIdx) return sourceNode.id;
                    else return null;
                });

                highlightNodeIds = highlightNodeIds.filter(x => x !== null);

                // const highlightNodeIds = filterNodes(nodeIdx);
                highlightNodeIds.push(nodeIdx);

                // set the color
                nodeGroup
                    .selectAll("g.node-glyph")
                    .filter(d => highlightNodeIds.indexOf(d.id) < 0)
                    .transition(fadeOut)
                    .style("opacity", highlightFadeOpacity);
                // .classed('dimmed-elements', true);

                // filter out all the linked edges
                const nonHighlightEdges = edgeGroup
                    .selectAll("g")
                    .filter(d => {
                        const {sourceNode, targetNode} = d;

                        return !(
                            sourceNode.realXid === selectedInstanceId ||
                            targetNode.realXid === selectedInstanceId
                        );
                    });

                nonHighlightEdges
                    .transition(fadeOut)
                    .style("opacity", highlightFadeOpacity);

                nonHighlightEdges
                    .each(function (d) {
                        shadowEdgeGroup.select('.' + d3.select(this).attr('class').split(' ').join('.'))
                            .transition(fadeOut)
                            .style('opacity', highlightFadeOpacity);
                    });

                const highlightEdges = edgeGroup.selectAll("g")
                    .filter(d => {
                        const {sourceNode, targetNode} = d;

                        return (
                            sourceNode.realXid === selectedInstanceId ||
                            targetNode.realXid === selectedInstanceId
                        );
                    })
                    .classed('force-display-none', false)
                    .style('display', null);

                highlightEdges.each(function(d) {
                    shadowEdgeGroup.select('.' + d3.select(this).attr('class').split(' ').join('.'))
                        .style('display', 'none');
                });

                /**
                 * enable the highlight edges
                 */

            }
        }
    }

    render() {
        const {width, canvasPrefix, actualPoisonColor} = this.props;

        return (
            <svg
                id="forKNNssake"
                height="680"
                width={width} //"100%"
                style={{
                    top: 0,
                    left: 0,
                    position: "absolute"
                }}
            >
                <defs>
                    {/*<marker*/}
                    {/*id="arrow"*/}
                    {/*markerUnits="strokeWidth"*/}
                    {/*markerWidth="12"*/}
                    {/*markerHeight="12"*/}
                    {/*viewBox="0 0 12 12"*/}
                    {/*refX="6"*/}
                    {/*refY="6"*/}
                    {/*orient="auto">*/}
                    {/*<path d="M2,2 L10,6 L2,10 L6,6 L2,2" style={{fill: '#555'}} />*/}
                    {/*</marker>*/}

                    <linearGradient id="grad-0">
                        <stop stopColor={labelNormalColorMap[0]}/>
                        <stop offset="100%" stopColor="white"/>
                    </linearGradient>
                    <linearGradient id="grad-1">
                        <stop stopColor={labelNormalColorMap[1]}/>
                        <stop offset="100%" stopColor="white"/>
                    </linearGradient>
                    <linearGradient id="grad-2">
                        <stop stopColor={actualPoisonColor}/>
                        <stop offset="100%" stopColor="white"/>
                    </linearGradient>
                    <filter id="blur">
                        <feGaussianBlur stdDeviation="5"/>
                    </filter>
                    <pattern
                        id={`${canvasPrefix}-pattern-stripe-0`}
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
                        id={`${canvasPrefix}-pattern-stripe-1`}
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
                <g id="base-group">
                    <g id="shadow-edge-group"/>
                    <g id="edge-group"/>
                    <g id="node-group"/>
                </g>
            </svg>
        );
    }
}
