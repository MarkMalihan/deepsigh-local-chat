export function getWebviewContent(): string {
  return /*html*/ `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
      <style>
    think {
      color:rgb(172, 172, 172);
      font-style: italic;
    }
  </style>
  
    </head>
    <body class="flex items-center justify-center h-screen bg-gradient-to-br from-purple-800 to-teal-600 p-4">
      <div class="w-full max-w-5xl bg-black/70 rounded-lg p-5 flex flex-col gap-4 shadow-lg">
        <h2 class="text-center text-white text-2xl font-semibold">DeepSeek Chat</h2>
  
        <!-- Chat messages container -->
        <div id="response" class="message-box overflow-y-auto max-h-[700px] p-3 bg-gray-800 rounded-lg flex flex-col gap-3"></div>
  
        <!-- Input and button container -->
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
  
        // Add event listener for sending the message or creating a new line
        document.getElementById("prompt").addEventListener("keydown", (event) => {
          const textArea = event.target;
          if (event.key === "Enter") {
            if (event.shiftKey) {
              // If Shift + Enter, add a new line
              return; // Allow new line
            } else {
              // If Enter, send the message
              const text = textArea.value.trim();
              if (!text) return;
  
              addMessage(text, "user-message");
              vscode.postMessage({ command: "chat", text });
              textArea.value = "";
              event.preventDefault(); // Prevent new line
            }
          }
        });
  
        // Send message on button click
        document.getElementById("askButton").addEventListener("click", () => {
          const text = document.getElementById("prompt").value.trim();
          if (!text) return;
  
          addMessage(text, "user-message");
          vscode.postMessage({ command: "chat", text });
          document.getElementById("prompt").value = "";
        });
  
        window.addEventListener("message", event => {
          const { command, text } = event.data;
          if (command === "chatResponse") {
            updateBotMessage(text);
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
