import * as vscode from "vscode";
import {
  createWebviewPanel,
  setupWebviewMessageHandler,
} from "./webviewHandler";
import { SidebarProvider } from "./SidebarProvider";

// Activate the extension
export function activate(context: vscode.ExtensionContext) {
  // Register the sidebar view provider
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "deepsigh-sidebar",
      sidebarProvider
    )
  );

  // Register the chat command to open a webview panel
  const disposable = vscode.commands.registerCommand("deepsigh.chat", () => {
    const panel = createWebviewPanel(context);
    setupWebviewMessageHandler(panel);
  });

  context.subscriptions.push(disposable);
}

// Deactivate the extension
export function deactivate() {}
