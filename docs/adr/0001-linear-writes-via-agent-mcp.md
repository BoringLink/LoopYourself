# 0001 — Linear 写操作全部经 Agent→MCP

核心 CLI 永不直连 Linear API、不管理 token；一切 Linear 读写作均由 Agent 经 Linear MCP 工具完成（CLI 只做本地状态与配置校验）。理由：贴合「Linear MCP 启用时才联动」的产品定义，MCP 不存在则纯本地运行天然降级；无需 token 管理；MCP 调用享受框架权限系统把关。代价：Linear 联动的确定性依赖 skill 文档而非代码路径。
