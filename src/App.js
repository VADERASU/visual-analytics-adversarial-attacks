import React, { Component } from "react";
import { Col, Layout, message, Row } from "antd";
import DetailTabPane from "./components/DetailTabPane";
import GlobalAttackSummary from "./components/GlobalAttackSummary/GlobalAttackSummary";
import { CONFIG_SIZE } from "./config";
import { ATTACK_TYPE, createNewAttack } from "./entities/Attack";
import DatasetSetting from "./components/CreateNewAttackView/DatasetSetting";
import { poisonColor } from "./utils/ColorScheme";
import "./App.css";

/**
 * Main App Component
 * @export
 */
class App extends Component {
  constructor(props) {
    super(props);
    const { data } = props;
    const isProcessingFlag = 0;
    this.state = {
      // Global attack data
      globalAttackTarget: App.initGlobalAttackTarget(data["init"]),

      /**
       * Link between the tree and CreateNewAttackView
       */
      initData: data["init"],
      attackTreeRoot: data["attacks"],
      baseAttackForCreateNew: data["attacks"],
      visibleAttacksInTabPane: [],
      treeMaxwidth: 1,
      treeMaxDepth: 1,
      newAttackType: "binarysearch",
      newVictims: [],
      isProcessingFlag: isProcessingFlag,
      actualPoisonColor: poisonColor[0],
      activeTabVictimId: -1
    };
    this.handleToggleProcessing = this.handleToggleProcessing.bind(this);
    this.changeActiveTabVictimId = this.changeActiveTabVictimId.bind(this);
  }

  static initGlobalAttackTarget(initData) {
    let target;
    if (initData["model"]["type"] === "logisticregression") {
      target = {
        weights: initData["model"]["params"]["weights"],
        intercept: initData["model"]["params"]["intercept"],
        protectedData: []
      };
    } else {
      throw new Error("unsupported model type");
    }
    return target;
  }

  changeActiveTabVictimId(currentId) {
    this.setState({
      activeTabVictimId: currentId
    });
    console.log("579234052532403changed");
  }

  componentWillReceiveProps = nextProps => {
    const { data } = nextProps;
    const isProcessingFlag = 0;
    this.setState({
      // Global attack data
      globalAttackTarget: App.initGlobalAttackTarget(data["init"]),

      /**
       * Link between the tree and CreateNewAttackView
       */
      initData: data["init"],
      attackTreeRoot: data["attacks"],
      baseAttackForCreateNew: data["attacks"],
      visibleAttacksInTabPane: [],
      treeMaxwidth: 1,
      treeMaxDepth: 1,
      newAttackType: "binarysearch",
      newVictims: [],
      isProcessingFlag: isProcessingFlag,
      actualPoisonColor: poisonColor[0]
    });
  };

  handleToggleProcessing(processing) {
    if (processing) {
      this.setState({
        isProcessingFlag: message.loading("Action in progress..", 0)
      });
    } else this.state.isProcessingFlag.call(null);
  }

  /**
   * Event handlers
   */
  handleUpdateGlobalAttackTarget() {
    this.setState({});
  }

  handleSetBaseAttackForCreateNew(attack) {
    this.setState({
      baseAttackForCreateNew: attack
    });
    message.success("Rebase to " + attack["name"], 2.5);
  }

  /***
   * Apply attack and show the result in tab.
   * @param {Object} attackParams
   */
  handleSubmitAttack(attackParams) {
    let newAttack;
    /**
     * Target: protect data
     */
    if (attackParams.newAttackType === "binarysearch") {
    }

    newAttack = new createNewAttack(
      ATTACK_TYPE.INSERTION_TARGET_ATTACK,
      {
        victimIndex: attackParams["newVictims"][0]["id"],
        attackIndex: null,
        numOfPoisoningData: attackParams.numOfPoisoningData,
        strategy: attackParams.newAttackType
      },
      this.state.baseAttackForCreateNew
    );

    this.state.baseAttackForCreateNew.appendNewAttackToChildren(newAttack);

    // Run the new Attack and refresh the view
    newAttack.runAttack(() => {
      // See if the attack has succeeded
      if (newAttack.attackResult.result === "success") {
        this.state.visibleAttacksInTabPane.push(newAttack);
        this.setState({
          attackTreeRoot: Object.assign({}, this.state.attackTreeRoot),
          visibleAttacksInTabPane: this.state.visibleAttacksInTabPane
        });
      } else {
        // failed
        alert("Attack failed");
        this.state.visibleAttacksInTabPane.push(newAttack);
        this.setState({
          attackTreeRoot: Object.assign({}, this.state.attackTreeRoot)
        });
      }
    });
  }

  /***
   * Initial attack state, and set victim and actual poison color, etc.
   * @param {Object} victim
   * @param {String} strategy The name of attack method
   */
  handleCraftDatasetVictimChanged(victim, strategy) {
    let actualPoisonColor = poisonColor[0];
    if (victim.length > 0) {
      actualPoisonColor = poisonColor[victim[0]["y"]];
    }
    this.setState(
      {
        newVictims: victim,
        newStrategy: strategy,
        actualPoisonColor: actualPoisonColor
      },
      () => {
        if (victim.length === 0) {
          return;
        }
        this.handleSubmitAttack({
          newVictims: victim,
          newAttackType: strategy, // 'binary_search',
          numOfPoisoningData: 50
        });
      }
    );
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return true;
  }

  render() {
    return (
      <div className="App">
        <Layout
          style={{
            minHeight: "100vh",
            background: "#f3f5f5",
            padding: CONFIG_SIZE.WINDOW_PADDING
          }}
        >
          <Row
            gutter={8}
            style={{
              marginBottom: 16
            }}
          >
            <Col span={5}>
              <GlobalAttackSummary
                height={CONFIG_SIZE.UPPER_HEIGHT}
                initData={this.state["initData"]}
                globalAttackTarget={this.state.globalAttackTarget}
                visibleAttacksInTabPane={this.state.visibleAttacksInTabPane}
                handleUpdateGlobalAttackTarget={this.handleUpdateGlobalAttackTarget.bind(
                  this
                )}
                handleSetBaseAttackForCreateNew={this.handleSetBaseAttackForCreateNew.bind(
                  this
                )}
                attackTreeRoot={this.state.attackTreeRoot}
                switchDataSource={this.props.switchDataSource}
              />
            </Col>
            <Col span={19}>
              <DatasetSetting
                height={250}
                baseAttackForCreateNew={this.state.baseAttackForCreateNew}
                newAttackType={this.state.newAttackType}
                // handleDatasetCraftResult={this.handleCraftDataset.bind(this)}
                newVictims={this.state.newVictims}
                handleCraftDatasetVictimChanged={this.handleCraftDatasetVictimChanged.bind(
                  this
                )}
                handleToggleProcessing={this.handleToggleProcessing}
              />
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <DetailTabPane
                height={CONFIG_SIZE.LOWER_HEIGHT}
                // data={data}
                attackTreeRoot={this.state.attackTreeRoot}
                baseAttackForCreateNew={this.state.baseAttackForCreateNew}
                handleSubmitAttack={this.handleSubmitAttack.bind(this)}
                visibleAttacksInTabPane={this.state.visibleAttacksInTabPane}
                newVictims={this.state.newVictims}
                newStrategy={this.state.newStrategy}
                handleToggleProcessing={this.handleToggleProcessing}
                actualPoisonColor={this.state.actualPoisonColor}
                changeActiveTabVictimId={this.changeActiveTabVictimId}
              />
            </Col>
          </Row>
        </Layout>
      </div>
    );
  }
}

export default App;
