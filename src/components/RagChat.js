import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../styles/RagChat.css';

const RagChat = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const eventSourceRef = useRef(null);

    // 自动滚动到最新消息
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 发送消息
    const sendMessage = async () => {
        if (!inputValue.trim()) return;

        setIsLoading(true);
        setError(null);

        // 添加用户消息
        const userMessage = {
            id: Date.now(),
            content: inputValue,
            isUser: true,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);

        // 添加空的AI消息用于流式更新
        const aiMessageId = Date.now() + 1;
        const aiMessage = {
            id: aiMessageId,
            content: '',
            isUser: false,
            finished: false,
            errorMessage: null,
            usage: null,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        setInputValue('');

        try {
            // 使用Server-Sent Events接收流式响应
            // 使用实际的API地址
            const eventSource = new EventSource(
                `http://localhost:8080/api/chat/rag/stream?question=${encodeURIComponent(inputValue)}&topK=3`
            );

            eventSourceRef.current = eventSource;

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);

                // 更新AI消息内容
                setMessages(prev => prev.map(msg => {
                    if (msg.id === aiMessageId) {
                        return {
                            ...msg,
                            content: msg.content + (data.content || ''),
                            finished: data.finished,
                            errorMessage: data.errorMessage,
                            usage: data.usage
                        };
                    }
                    return msg;
                }));

                // 如果流结束，关闭连接
                if (data.finished) {
                    eventSource.close();
                    setIsLoading(false);
                }
            };

            eventSource.onerror = (error) => {
                console.error('EventSource error:', error);
                setError('连接服务器时出错，请检查网络连接');
                setIsLoading(false);
                eventSource.close();
            };

        } catch (err) {
            console.error('Error sending message:', err);
            setError('发送消息时出错: ' + err.message);
            setIsLoading(false);
        }
    };

    // 处理键盘事件
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // 清空聊天记录
    const clearChat = () => {
        setMessages([]);
        setError(null);
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
    };

    // 组件卸载时关闭连接
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    return (
        <div className="rag-chat-container">
            <div className="chat-header">
                <h2>RAG智能助手</h2>
                <button className="clear-btn" onClick={clearChat}>清空对话</button>
            </div>

            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="empty-state">
                        <h3>欢迎使用RAG智能助手</h3>
                        <p>请输入您的问题，我将基于知识库为您提供答案</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}
                        >
                            <div className="message-content">
                                {message.content || (message.isUser ? inputValue : '思考中...')}
                                {!message.isUser && !message.finished && !message.errorMessage && (
                                    <span className="typing-indicator">...</span>
                                )}
                            </div>
                            {message.errorMessage && (
                                <div className="error-message">
                                    错误: {message.errorMessage}
                                </div>
                            )}
                            {message.usage && (
                                <div className="usage-info">
                                    令牌使用: 输入 {message.usage.inputTokens} | 输出 {message.usage.outputTokens} | 总计 {message.usage.totalTokens}
                                </div>
                            )}
                            <div className="message-time">
                                {message.timestamp.toLocaleTimeString()}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {error && (
                <div className="error-alert">
                    {error}
                </div>
            )}

            <div className="input-container">
        <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="请输入您的问题..."
            disabled={isLoading}
            rows="3"
        />
                <button
                    onClick={sendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    className="send-btn"
                >
                    {isLoading ? '发送中...' : '发送'}
                </button>
            </div>
        </div>
    );
};

export default RagChat;