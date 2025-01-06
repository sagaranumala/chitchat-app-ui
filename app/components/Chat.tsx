"use client";
import { useState, useEffect } from "react";

// TypingIndicator Component
const TypingIndicator = () => (
  <div>
    <span className="dot"></span>
    <span className="dot"></span>
    <span className="dot"></span>
  </div>
);

interface Message {
  type: string;
  from?: string;
  text?: string;
}

export default function Home() {
  const [username, setUsername] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<{ text: string; isSender: boolean }[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [typingUser, setTypingUser] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event: MessageEvent) => {
      const message = event.data;
      try {
        const data: Message = JSON.parse(message);

        if (data.type === "message" && data.from && data.text) {
          addMessage(`${data.from}: ${data.text}`, false);
        } else if (data.type === "typing" && data.from) {
          setTypingUser(data.from);
          setTimeout(() => setTypingUser(null), 2000); // Clear typing indicator after 2 seconds
        } else {
          addMessage(JSON.stringify(data), false);
        }
      } catch (e) {
        addMessage(message, false);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      setMessages([]);
      alert("Disconnected from the server.");
    };

    return () => {
      socket.close();
    };
  }, [socket]);

  const connectToServer = () => {
    if (!username.trim()) {
      alert("Username is required!");
      return;
    }

    const ws = new WebSocket("ws://localhost:8080");
    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: "register", username }));
    };
    setSocket(ws);
  };

  const disconnectFromServer = () => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
      setMessages([]);
      addMessage("You have disconnected from the server.", true);
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !socket) return;

    socket.send(JSON.stringify({ type: "message", text: inputMessage }));
    addMessage(`You: ${inputMessage}`, true);
    setInputMessage("");
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const message = e.target.value;
    setInputMessage(message);

    if (socket && message.trim()) {
      socket.send(JSON.stringify({ type: "typing", from: username }));
    }
  };

  const addMessage = (message: string, isSender: boolean) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: message, isSender },
    ]);
  };

  return (
    <div style={styles.container}>
      {!isConnected ? (
        <div style={styles.login}>
          <h2>Join Chat</h2>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
          <button onClick={connectToServer} style={styles.button}>
            Connect
          </button>
        </div>
      ) : (
        <div style={styles.chat}>
          <h2>Chat</h2>
          <div style={styles.chatMessages}>
            <div style={styles.chatList}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  ...styles.message,
                  ...(msg.isSender ? styles.senderMessage : styles.receiverMessage),
                }}
              >
                {msg.text}
              </div>
            ))}
            </div>
            <div>
            {typingUser && (
              <div style={styles.typingIndicator}>
                <TypingIndicator />
              </div>
            )}
            </div>
          </div>
          <textarea
            placeholder="Type your message"
            value={inputMessage}
            onChange={handleTyping}
            style={styles.textarea}
          />
          <button onClick={sendMessage} style={styles.button}>
            Send
          </button>
          <button onClick={disconnectFromServer} style={styles.disconnectButton}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

// Inline styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "90%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f4f4f9",
  },
  login: {
    padding: "20px",
    background: "#fff",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    borderRadius: "8px",
  },
  chat: {
    padding: "20px",
    background: "#fff",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    borderRadius: "8px",
  },
  chatMessages: {
    height: "350px",
    overflowY: "auto",
    border: "1px solid #ccc",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "4px",
    background: "#fafafa",
    display: "flex",
    flexDirection: "column",
    justifyContent:"flex-end"
  },
  chatList:{
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  typingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontStyle: "italic",
    color: "#000",
  },
  typingAnimation: {
    display: "flex",
    alignItems: "center",
    gap: "3px",
  },
  message: {
    padding: "10px",
    borderRadius: "10px",
    maxWidth: "70%",
    wordWrap: "break-word",
  },
  senderMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#4caf50",
    color: "white",
  },
  receiverMessage: {
    alignSelf: "flex-start",
    backgroundColor: "aqua",
    color: "black",
  },
  input: {
    width: "100%",
    margin: "10px 0",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  textarea: {
    width: "100%",
    margin: "10px 0",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#4caf50",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  disconnectButton: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    backgroundColor: "#f44336",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};
