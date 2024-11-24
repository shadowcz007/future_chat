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

        // 创建一个新的消息对象用于存储AI回复
        const aiMessageId = Date.now();
        setMessages(prev => [...prev, { id: aiMessageId, content: '', isSent: false }]);

        // 调用 SiliconFlow API (流式传输)
        const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "deepseek-ai/DeepSeek-V2-Chat",
            messages: [
              {
                role: "system",
                content: "你是一位专业的室内设计师，擅长软装搭配和色彩设计。你需要：1. 根据用户的需求提供专业的配色方案建议；2. 解释每个配色方案的设计理念和情感效果；3. 考虑空间的功能性和整体协调性；4. 适时推荐合适的软装饰品来强化配色效果。请用专业且易懂的语言回答用户的问题。"
              },
              {
                role: "user",
                content: content
              }
            ],
            stream: true, // 启用流式传输
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        // 处理流式响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // 解码收到的数据
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          // 处理每一行数据
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                aiResponse += content;
                
                // 更新UI中的消息
                setMessages(prev => prev.map(msg => 
                  msg.id === aiMessageId 
                    ? { ...msg, content: aiResponse }
                    : msg
                ));
              } catch (e) {
                console.error('解析响应数据失败:', e);
              }
            }
          }
        }

      } catch (error) {
        console.error('Error details:', error);
        
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
        <h2>室内设计师 AI 助手</h2>
      </div>
      <div className={styles.chatMessages} id="chat-messages">
        {messages.map((message, index) => (
          <div 
            key={message.id || index}
            className={`${styles.messageContent} ${message.isSent ? styles.sent : styles.received}`}
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
