const { override, fixBabelImports, addLessLoader } = require("customize-cra");

module.exports = override(
  fixBabelImports("import", {
    libraryName: "antd",
    libraryDirectory: "es",
    style: true
  }),
  addLessLoader({
    javascriptEnabled: true,
    modifyVars: {
      "@primary-color": "#1890ff", // 全局主色 #1890ff
      "@link-color": "#1890ff", // 链接色
      "@success-color": "#52c41a", // 成功色
      "@warning-color": "#faad14", // 警告色
      "@error-color": "#f5222d", // 错误色
      "@font-size-base": "14px", // 主字号
      "@heading-color": "#444444", // 标题色
      "@text-color": "#666666", // 主文本色
      "@text-color-secondary ": "rgba(0, 0, 0, .45)", // 次文本色
      "@disabled-color ": "rgba(0, 0, 0, .25)", // 失效色
      "@border-radius-base": "4px", // 组件/浮层圆角
      "@border-color-base": "#e7e7e7", // 边框色
      "@box-shadow-base": "2 2px 8px rgba(0, 0, 0, 0.50)" // 浮层阴影
    }
  })
);
