const vscode = acquireVsCodeApi();

document.getElementById("askButton").addEventListener("click", () => {
  const text = document.getElementById("prompt").value;
  vscode.postMessage({ command: "chat", text });
});

window.addEventListener("message", (event) => {
  const { command, text } = event.data;
  if (command === "chatResponse") {
    document.getElementById("response").innerText = text;
  }
});
