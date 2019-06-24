import React, { Component } from "react";
import { Empty, Tabs } from "antd";
import AttackDetailView from "./AttackDetailView/AttackDetailView";
import { CONFIG_SIZE } from "../config";

const TabPane = Tabs.TabPane;

export default class DetailTabPane extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTabKey: "create",
      avoidLoop: true
    };
  }

  handleTabPaneAddExit = () => {
  };

  handleTabPaneChange(activeKey) {

    this.setState({ activeTabKey: activeKey });
    if (this.state.avoidLoop === false) {
      this.props.changeActiveTabVictimId(activeKey.split(" ")[3]);
      this.setState({ avoidLoop: false });
    }
    this.props.handleToggleProcessing(false);
  }

  componentWillReceiveProps = nextProps => {
    const { visibleAttacksInTabPane, newVictims } = nextProps;
    // console.log(visibleAttacksInTabPane);
    if (visibleAttacksInTabPane.length > 0) {
      this.handleTabPaneChange(
        "TabPane " +
        visibleAttacksInTabPane[visibleAttacksInTabPane.length - 1].name + " " + newVictims[0].id
      );
    }
  };

  render() {
    const { height, visibleAttacksInTabPane } = this.props;
    const tabPaneHeight =
      height - 36 - CONFIG_SIZE.BOTTOM_TABPANE_TABBAR_MARGINBOTTOM; // 42 is the height of the tab bar with marginBottom=6 (originally 16).

    return (
      <Tabs
        hideAdd
        activeKey={this.state.activeTabKey}
        size="small"
        type="line" //editable-card"
        style={{
          height: height,
          // background: '#FFF',
          width: "100%"
        }}
        tabBarStyle={{
          marginBottom: CONFIG_SIZE.BOTTOM_TABPANE_TABBAR_MARGINBOTTOM
        }}
        closable={false}
        onEdit={this.handleTabPaneAddExit.bind(this)}
        onChange={this.handleTabPaneChange.bind(this)}
      >
        {visibleAttacksInTabPane.length === 0 ? (
          <TabPane
            tab="Empty"
            key="create"
            style={{
              height: tabPaneHeight,
              width: "100%"
            }}
            closable={false}
          >
            <Empty
              style={{
                marginTop: 130
              }}
              description={<span>No attack selected</span>}
            />
          </TabPane>
        ) : null}
        {visibleAttacksInTabPane.map(attack => (
          <TabPane
            tab={`Instance #${attack.victimIndex}`}
            key={"TabPane " + attack.name + " " + attack.victimIndex}
            style={{
              height: tabPaneHeight,
              width: "100%"
            }}
            closable={true}
          >
            <AttackDetailView
              height={tabPaneHeight}
              attack={attack}
              victimId={this.state.victimId}
              newVictims={this.props.newVictims}
              newStrategy={this.props.newStrategy}
              actualPoisonColor={this.props.actualPoisonColor}
            />
          </TabPane>
        ))}
      </Tabs>
    );
  }
}
