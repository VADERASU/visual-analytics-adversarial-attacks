/**
 * Component size
 */
const WINDOW_PADDING = 8;
const UPPER_HEIGHT = 250,
  LOWER_HEIGHT = 1080 - UPPER_HEIGHT - WINDOW_PADDING * 2 - 16;

const CONFIG_SIZE = {
  WINDOW_PADDING: 8,
  UPPER_HEIGHT: UPPER_HEIGHT,
  LOWER_HEIGHT: LOWER_HEIGHT,
  BOTTOM_TABPANE_TABBAR_MARGINBOTTOM: 12
};

/**
 * Size configuration for ModelComparisonView
 */
const CONFIG_MODELCOMPARISONVIEW = {
  TOP_PADDING: 8,
  MIDDLE_GAP: 110,
  LEFT_RIGHT_PADDING: 16,

  // Bars
  CONFUSION_BAR_HEIGHT: 30,
  CONFUSION_BAR_CORNER: 2,
  CONFUSION_BAR_START_Y: 45,

  // Confusion text
  CONFUSION_TEXT_OFFSET: 11,
  CONFUSION_TEXT_BORDER_WIDTH: 40,
  CONFUSION_TEXT_BORDER_HEIGHT: 16,

  // Metric bars
  METRIC_BAR_START_X: 230
};

const CONFIG_DATAGLYPHVIEW = {
  GLYPH_BAR_STROKE: "#aaa",
  GLYPH_BAR_STROKE_WIDTH: "0.5",
  GLYPH_PROB_TEXT_MARGIN: 5
};

const CREATE_NEW_ATTACK_VIEW = {
  MAIN_HEIGHT: 746
};

export {
  CONFIG_SIZE,
  CONFIG_MODELCOMPARISONVIEW,
  CONFIG_DATAGLYPHVIEW,
  CREATE_NEW_ATTACK_VIEW
};
