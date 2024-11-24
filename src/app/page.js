"use client";
import styles from "./chat.module.css";

export default function Home() {
  const sendMessage = () => {
    const messageInput = document.getElementById('message-input');
    const content = messageInput.value.trim();
    if (content) {
      // 发送用户消息
      addMessage(content, true);
      
      // 模拟接收回复
      setTimeout(() => {
        addMessage('这是一条自动回复消息', false);
      }, 1000);
      
      // 清空输入框
      messageInput.value = '';
    }
  };

  const addMessage = (content, isSent) => {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `${styles.message} ${isSent ? styles.sent : styles.received}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = styles.messageContent;
    messageContent.textContent = content;
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // 滚动到最新消息
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h2>聊天室</h2>
      </div>
      <div className={styles.chatMessages} id="chat-messages">
      </div>
      <div className={styles.chatInput}>
        <input 
          type="text" 
          id="message-input" 
          placeholder="输入消息..." 
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              sendMessage();
            }
          }}
        />
        <button onClick={sendMessage}>发送</button>
      </div>
    </div>
  );
}
