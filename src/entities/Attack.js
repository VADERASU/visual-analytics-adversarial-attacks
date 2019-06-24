import uuidv4 from "uuid/v4";
import { message } from "antd";

const supportedAttackTypes = {
  initialdummyattack: true,
  insertionTargetAttack: true,
  insertionWeightAttack: true,
  flippingTargetAttack: true
};

const ATTACK_STATE = {
  RUNNING: "the attack algorithm is running",
  FINISHED: "the attack algorithm is finished",
  INITIALIZED: "the attack model has initialized"
};

const ATTACK_TYPE = {
  INITIAL_DUMMY_ATTACK: "initialdummyattack",
  INSERTION_TARGET_ATTACK: "insertionTargetAttack",
  INSERTION_WEIGHT_ATTACK: "insertionWeightAttack",
  FLIPPING_TARGET_ATTACK: "flippingTargetAttack",

  readableArray: [
    {
      name: "Binary-Search",
      value: "binary_search"
    },
    {
      name: "StingRay",
      value: "sting_ray"
    }
  ]
};

const postAttackData = async postData => {
  // const response = await fetch('/api/attack', {
  //     method: 'POST',
  //     headers: {
  //         'Content-Type': 'application/json',
  //     },
  //     timeout: 300000, // req/res timeout in ms, 0 to disable, timeout reset on redirect
  //     body: JSON.stringify({attackType: attackType, ...postData})
  // });

  const queryString =
    "/jsondata/" +
    postData.oldAttack.model.type +
    "/precompute_data/" +
    postData.datasetName +
    "-" +
    postData.attackParams.strategy +
    "_" +
    postData.attackParams.victimIndex +
    ".json";

  const response = await fetch(queryString, {
    method: "GET",
    timeout: 300000 // req/res timeout in ms, 0 to disable, timeout reset on redirect
  });

  return await response.json();
};

const createNewAttack = (attackType, params, parentAttack) => {
  if (attackType === ATTACK_TYPE.INITIAL_DUMMY_ATTACK) {
    throw new Error("Cannot create an initial root node");
  }

  if (!isValidateAttackType(attackType)) {
    throw new Error("Type \"" + attackType + "\" is not supported here");
  }

  let newAttack;

  switch (attackType) {
    case ATTACK_TYPE.INSERTION_TARGET_ATTACK:
      newAttack = new InsertionTargetAttack(
        parentAttack,
        params["victimIndex"],
        params["attackIndex"],
        params["numOfPoisoningData"],
        params["strategy"]
      );
      break;
    case ATTACK_TYPE.INSERTION_WEIGHT_ATTACK:
      newAttack = new InsertionWeightAttack(
        parentAttack,
        params["blockedFeatures"],
        params["numOfPoisoningData"]
      );
      break;
    case ATTACK_TYPE.FLIPPING_TARGET_ATTACK:
      newAttack = new FlippingTargetAttack(
        parentAttack,
        params["victimIndex"],
        params["attackLabel"],
        params["numOfFlips"],
        params["searchRadius"]
      );
      break;
    default:
      throw new Error("Type \"" + attackType + "\" has no creation method here");
  }

  // Set new assignments
  return newAttack;
};

class AbstractAttack {
  static _counter = 1;

  constructor(attackType, parent = null, name = null) {
    if (!isValidateAttackType(attackType)) {
      throw new Error("Type \"" + attackType + "\" is not supported here");
    }

    this.attackType = attackType;
    this.id = uuidv4();
    this.name = name === null ? "Attack " + AbstractAttack._counter : name;
    this.children = [];
    this.parent = parent;
    this.attackState = ATTACK_STATE.INITIALIZED;

    AbstractAttack._counter++;
  }

  isRootNode() {
    return false;
  }

  hasParent() {
    return this.parent === null;
  }

  hasChild() {
    return !(this.children.length === 0);
  }

  getParentTrainData() {
    return this.isRootNode() ? null : this.parent.attackedTrainData;
  }

  getParentTrainLabel() {
    return this.isRootNode() ? null : this.parent.attackedTrainLabel;
  }

  getParentModel() {
    return this.isRootNode() ? null : this.parent.attackedModel;
  }

  appendNewAttackToChildren(newAttack) {
    this.children.push(newAttack);
  }
}

class InsertionTargetAttack extends AbstractAttack {
  constructor(parent, victimIndex, attackIndex, numOfPoisoningData, strategy) {
    super(ATTACK_TYPE.INSERTION_TARGET_ATTACK, parent);
    this.victimIndex = victimIndex;
    this.attackIndex = attackIndex;
    this.numOfPoisoningData = numOfPoisoningData;
    this.datasetName = this.parent.datasetName;
    this.strategy = strategy;
  }

  getParams() {
    return {
      victimIndex: this.victimIndex,
      attackIndex: this.attackIndex,
      numOfPoisoningData: this.numOfPoisoningData,
      strategy: this.strategy
    };
  }

  runAttack(callback = null) {
    if (this.parent.attackState === ATTACK_STATE.RUNNING) {
      throw new Error("The previous attack is still running!");
    }
    if (this.parent.attackState === ATTACK_STATE.INITIALIZED) {
      throw new Error("The previous attack has not been run yet!");
    }
    this.attackState = ATTACK_STATE.RUNNING;
    postAttackData({
      attackParams: this.getParams(),
      oldAttack: {
        trainData: this.parent.attackedTrainData,
        trainLabel: this.parent.attackedTrainLabel,
        predictedLabel: this.parent.attackedPredictedLabel,
        predictedProba: this.parent.attackedPredictedProba,
        dimNames: this.parent.dimNames,
        labelNames: this.parent.labelNames,
        model: this.parent.attackedModel,
        xids: this.parent.Xids
      },
      attackType: this.attackType,
      attackName: this.name,
      datasetName: this.datasetName
    }).then(res => {
      this.responseData = res;
      this.Xids = res.attackResultModule.Xid;
      this.attackedTrainData = res.attackResultModule.attackedTrainData;
      this.attackedTrainLabel = res.attackResultModule.attackedTrainLabel;
      this.attackedPredictedLabel =
        res.attackResultModule.attackedPredictedLabel;
      this.attackedPredictedProba =
        res.attackResultModule.attackedPredictedProbs;
      this.attackedPredictedBoundaryDists =
        res.attackResultModule.attackedPredictedBoundaryDists;
      this.binarySearchVulnerability =
        res.attackResultModule.metrics.binarySearchVulnerability;
      this.stingRayVulnerability =
        res.attackResultModule.metrics.stingRayVulnerability;
      this.attackedModel = res.attackResultModule.attackedModel;
      this.attackResult = res.attackResultModule.attackResult;
      this.knnGraph = res.attackResultModule.knnGraph;
      this.knnSubGraphs = res.attackResultModule.knnSubGraphs;
      this.attackState = ATTACK_STATE.FINISHED;
      this.labelNames = this.parent.labelNames;
      this.dimNames = this.parent.dimNames;
      this.metrics = res.attackResultModule.metrics;
      this.featureImportance = res.attackResultModule.featureImportance;
      // alert("debug: attack " + this.attackResult['result']);
      if (this.attackResult["result"] === "success") {
        message.success(this.name + " processed successfully", 2.5);
        // notification.open({
        //     message: 'Attack Success',
        //     description: 'This attack is successful!',
        //   });
      } else {
        message.error(this.name + " failed", 2.5);
        // notification.open({
        //     message: 'Attack Failed',
        //     description: 'This attack is failed!',
        //   });
      }

      /**
       * Check if the callback is a valid function
       */
      if (typeof callback === "function") {
        callback();
      }
    });
  }
}

class InsertionWeightAttack extends AbstractAttack {
  constructor(parent, blockedFeatures, numOfPoisoningData) {
    super(ATTACK_TYPE.INSERTION_WEIGHT_ATTACK, parent);
    this.blockedFeatures = blockedFeatures;
    this.numOfPoisoningData = numOfPoisoningData;
  }

  getParams() {
    return {
      blockedFeatures: this.blockedFeatures,
      numOfPoisoningData: this.numOfPoisoningData
    };
  }

  runAttack(callback = null) {
    if (this.parent.attackState === ATTACK_STATE.RUNNING) {
      throw new Error("The previous attack is still running!");
    }
    if (this.parent.attackState === ATTACK_STATE.INITIALIZED) {
      throw new Error("The previous attack has not been run yet!");
    }
    this.attackState = ATTACK_STATE.RUNNING;
    postAttackData({
      attackParams: this.getParams(),
      oldAttack: {
        trainData: this.parent.attackedTrainData,
        trainLabel: this.parent.attackedTrainLabel,
        dimNames: this.parent.dimNames,
        labelNames: this.parent.labelNames,
        model: this.parent.attackedModel,
        xids: this.parent.Xids
      },
      attackType: this.attackType,
      attackName: this.name
    }).then(res => {
      this.responseData = res;
      this.Xids = res.attackResultModule.Xid;
      this.attackedTrainData = res.attackResultModule.attackedTrainData;
      this.attackedTrainLabel = res.attackResultModule.attackedTrainLabel;
      this.attackedModel = res.attackResultModule.attackedModel;
      this.attackResult = res.attackResultModule.attackResult;
      this.attackState = ATTACK_STATE.FINISHED;

      /**
       * Check if the callback is a valid function
       */
      if (typeof callback === "function") {
        callback();
      }
    });
  }
}

class FlippingTargetAttack extends AbstractAttack {
  constructor(parent, victimIndex, attackLabel, numOfFlips, searchRadius) {
    super(ATTACK_TYPE.FLIPPING_TARGET_ATTACK, parent);
    this.victimIndex = victimIndex;
    this.attackLabel = attackLabel;
    this.numOfFlips = numOfFlips;
    this.searchRadius = searchRadius;
  }

  getParams() {
    return {
      victimIndex: this.victimIndex,
      attackLabel: this.attackLabel,
      numOfFlips: this.numOfFlips,
      searchRadius: this.searchRadius
    };
  }

  runAttack(callback = null) {
    if (this.parent.attackState === ATTACK_STATE.RUNNING) {
      throw new Error("The previous attack is still running!");
    }
    if (this.parent.attackState === ATTACK_STATE.INITIALIZED) {
      throw new Error("The previous attack has not been run yet!");
    }
    this.attackState = ATTACK_STATE.RUNNING;
    postAttackData({
      attackParams: this.getParams(),
      oldAttack: {
        trainData: this.parent.attackedTrainData,
        trainLabel: this.parent.attackedTrainLabel,
        dimNames: this.parent.dimNames,
        labelNames: this.parent.labelNames,
        model: this.parent.attackedModel,
        xids: this.parent.Xids
      },
      attackType: this.attackType,
      attackName: this.name
    }).then(res => {
      this.responseData = res;
      this.attackedTrainData = res.attackResultModule.attackedTrainData;
      this.attackedTrainLabel = res.attackResultModule.attackedTrainLabel;
      this.attackedPredictedLabel =
        res.attackResultModule.attackedPredictedLabel;
      this.attackedModel = res.attackResultModule.attackedModel;
      this.attackResult = res.attackResultModule.attackResult;
      this.attackState = ATTACK_STATE.FINISHED;
      /**
       * Check if the callback is a valid function
       */
      if (typeof callback === "function") {
        callback();
      }
    });
  }
}

/**
 * The attack that holds the initial data and acts as a dummy AbstractAttack instance.
 */
class InitialDummyAttack extends AbstractAttack {
  constructor(initData) {
    super(ATTACK_TYPE.INITIAL_DUMMY_ATTACK);

    // this.oldTrainData = null;
    this.datasetName = initData["dataset"]["datasetName"];
    this.attackedTrainData = initData["dataset"]["X"];
    this.attackedTrainLabel = initData["dataset"]["y"];
    this.attackedPredictedLabel = initData["dataset"]["predY"];
    this.attackedPredictedProba = initData["dataset"]["predProba"];
    this.attackedPredictedBoundaryDists = initData["dataset"]["boundaryDist"];
    this.binarySearchVulnerability =
      initData["dataset"]["binarySearchVulnerability"];
    this.stingRayVulnerability = initData["dataset"]["stingRayVulnerability"];
    this.dimNames = initData["dataset"]["dimNames"];
    this.labelNames = initData["dataset"]["labelNames"];
    this.Xids = initData["dataset"]["Xids"];
    this.attackedModel = initData["model"];
    this.metrics = initData["dataset"]["metrics"];
    this.newMetrics = initData["metrics"];
    this.attackState = ATTACK_STATE.FINISHED;
  }

  isRootNode() {
    return true;
  }
}

const isValidateAttackType = attackType => {
  return supportedAttackTypes[attackType] === true;
};

export {
  // PerturbationAttack,
  // FlippingAttack,
  // RandomFlippingAttack,
  // NoiseAttack,
  // ManualAttack,
  InitialDummyAttack,
  AbstractAttack,
  InsertionTargetAttack,
  createNewAttack,
  ATTACK_TYPE,
  ATTACK_STATE
};
