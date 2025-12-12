import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export type LogLevel = "debug" | "info" | "warning" | "error";

export interface Logger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

/**
 * Logger that uses MCP logging API when connected, falls back to stderr before connection.
 * Can be injected into services.
 */
class McpLogger implements Logger {
  private mcpServer: McpServer | null = null;
  private isConnected = false;

  /**
   * Set the MCP server reference and mark as connected.
   * Call this after server.connect() succeeds.
   */
  setServer(server: McpServer): void {
    this.mcpServer = server;
    this.isConnected = true;
  }

  /**
   * Log a message at the specified level.
   */
  log(level: LogLevel, message: string, data?: unknown): void {
    const formattedData = data ? `${message}: ${JSON.stringify(data)}` : message;

    if (this.isConnected && this.mcpServer) {
      // Use MCP logging API - logs appear in the MCP client
      this.mcpServer.server.sendLoggingMessage({
        level,
        data: formattedData,
      });
    } else {
      // Fallback to stderr before connection is established
      console.error(`[${level.toUpperCase()}] ${message}`, data ?? "");
    }
  }

  debug(message: string, data?: unknown): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: unknown): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log("warning", message, data);
  }

  error(message: string, data?: unknown): void {
    this.log("error", message, data);
  }
}

// Singleton instance for convenience
export const logger = new McpLogger();

// Export class for custom instances or testing
export { McpLogger };

