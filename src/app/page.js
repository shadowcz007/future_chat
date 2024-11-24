"use client";
import { useState } from 'react';
import styles from "./chat.module.css";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    const messageInput = document.getElementById('message-input');
    const content = messageInput.value.trim();
    if (content && !isLoading) {
      setIsLoading(true);
      
      // 添加用户消息到界面
      const newMessages = [...messages, { content, isSent: true }];
      setMessages(newMessages);
      
      // 清空输入框
      messageInput.value = '';

      try {
        // 检查 API key 是否设置
        const apiKey = process.env.NEXT_PUBLIC_SILICON_API_KEY;
        if (!apiKey) {
          throw new Error('API key 未设置');
        }

        // 调用 SiliconFlow API
        const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "deepseek-ai/DeepSeek-V2-Chat",
            messages: [{
              role: "user",
              content: content
            }],
            stream: false,
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('API 返回数据格式错误');
        }

        const aiResponse = data.choices[0].message.content;
        
        // 添加AI回复到界面
        setMessages(prev => [...prev, { content: aiResponse, isSent: false }]);

      } catch (error) {
        console.error('Error details:', error);
        
        // 根据错误类型显示不同的错误消息
        let errorMessage = "抱歉，发生了一些错误。请稍后重试。";
        if (error.message === 'API key 未设置') {
          errorMessage = "请先设置 API key";
        } else if (error.message.includes('HTTP error')) {
          errorMessage = "API 调用失败，请检查网络连接";
        }
        
        setMessages(prev => [...prev, { content: errorMessage, isSent: false }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h2>AI 聊天室</h2>
      </div>
      <div className={styles.chatMessages} id="chat-messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`${styles.message} ${message.isSent ? styles.sent : styles.received}`}
          >
            <div className={styles.messageContent}>
              {message.content}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.chatInput}>
        <input 
          type="text" 
          id="message-input" 
          placeholder="输入消息..." 
          disabled={isLoading}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !isLoading) {
              sendMessage();
            }
          }}
        />
        <button 
          onClick={sendMessage} 
          disabled={isLoading}
          className={isLoading ? styles.loading : ''}
        >
          {isLoading ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  );
}
