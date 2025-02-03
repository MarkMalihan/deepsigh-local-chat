import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import ollama from "ollama";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "chat") {
        const userPrompt = message.text;
        let responseText = "";

        try {
          webviewView.webview.postMessage({
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
            webviewView.webview.postMessage({
              command: "chatResponse",
              text: responseText,
            });
          }
        } catch (error) {
          webviewView.webview.postMessage({
            command: "chatResponse",
            text: `Error: ${String(error)}`,
          });
        } finally {
          webviewView.webview.postMessage({
            command: "loading",
            isLoading: false,
          });
        }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
    </head>
    <body>
      <div class="w-full rounded-lg flex flex-col gap-4 shadow-lg">
        <h2 class="text-center text-white text-2xl font-semibold">DeepSigh Chat</h2>

        <div id="response" class="message-box overflow-y-auto max-h-[700px] p-3 bg-gray-800 rounded-lg flex flex-col gap-3"></div>
        <div id="loadingIndicator" class="text-center text-gray-400 hidden">Thinking...</div>

        <div class="flex gap-2">
          <textarea id="prompt" rows="3" placeholder="Ask something..." 
            class="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"></textarea>
          <button id="askButton" 
            class="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-lg">
            Send
          </button>
        </div>
      </div>

      <script>
        const vscode = acquireVsCodeApi();

        document.getElementById("prompt").addEventListener("keydown", (event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            sendMessage();
            event.preventDefault();
          }
        });

        document.getElementById("askButton").addEventListener("click", sendMessage);

        function sendMessage() {
          const text = document.getElementById("prompt").value.trim();
          if (!text) return;

          addMessage(text, "user-message");
          vscode.postMessage({ command: "chat", text });
          document.getElementById("prompt").value = "";
        }

        window.addEventListener("message", (event) => {
          const { command, text, isLoading } = event.data;
          if (command === "chatResponse") {
            updateBotMessage(text);
          } else if (command === "loading") {
            document.getElementById("loadingIndicator").classList.toggle("hidden", !isLoading);
          }
        });

        function addMessage(text, className) {
          const messageBox = document.getElementById("response");
          const messageWrapper = document.createElement("div");
          const message = document.createElement("div");

          const isUser = className === "user-message";
          messageWrapper.className = \`flex \${isUser ? "justify-end" : "justify-start"}\`;
          message.className = \`p-3 rounded-lg max-w-2xl text-white text-sm/6 space-y-3 \${isUser ? "bg-blue-600" : "bg-gray-700"}\`;

          message.innerHTML = marked.parse(text);
          Prism.highlightAll();

          messageWrapper.appendChild(message);
          messageBox.appendChild(messageWrapper);
          messageBox.scrollTop = messageBox.scrollHeight;
        }

        function updateBotMessage(text) {
          const messageBox = document.getElementById("response");
          let lastMessageWrapper = messageBox.lastElementChild;
          let lastMessage = lastMessageWrapper ? lastMessageWrapper.firstChild : null;

          if (lastMessage && lastMessageWrapper.classList.contains("justify-start")) {
            lastMessage.innerHTML = marked.parse(text);
            Prism.highlightAll();
          } else {
            addMessage(text, "bot-message");
          }
          messageBox.scrollTop = messageBox.scrollHeight;
        }
      </script>
    </body>
    </html>`;
  }
}
