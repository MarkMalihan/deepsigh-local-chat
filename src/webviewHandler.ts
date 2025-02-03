import * as vscode from "vscode";
import { getWebviewContent } from "./webviewContent";
import ollama from "ollama";

// Create the webview panel for DeepSeek Chat
export function createWebviewPanel(
  context: vscode.ExtensionContext
): vscode.WebviewPanel {
  const panel = vscode.window.createWebviewPanel(
    "deepChat",
    "DeepSeek Chat",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );

  // Set the webview HTML content
  panel.webview.html = getWebviewContent();

  return panel;
}

// Set up message handling for the webview
export function setupWebviewMessageHandler(panel: vscode.WebviewPanel) {
  panel.webview.onDidReceiveMessage(async (message: any) => {
    if (message.command === "chat") {
      const userPrompt = message.text;
      let responseText = "";

      try {
        panel.webview.postMessage({
          command: "loading",
          isLoading: true,
        });
        const streamResponse = await ollama.chat({
          model: "deepseek-r1:latest",
          messages: [{ role: "user", content: userPrompt }],
          stream: true,
        });

        for await (const part of streamResponse) {
          responseText += part.message.content;
          panel.webview.postMessage({
            command: "chatResponse",
            text: responseText,
          });
        }
      } catch (error) {
        panel.webview.postMessage({
          command: "chatResponse",
          text: `Error: ${String(error)}`,
        });
      } finally {
        panel.webview.postMessage({
          command: "loading",
          isLoading: false,
        });
      }
    }
  });
}
