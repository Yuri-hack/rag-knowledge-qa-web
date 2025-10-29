import React, { useState, useRef, useEffect } from 'react';
import '../styles/RagChat.css';
import { API_ENDPOINTS } from "../config/api";

// 定义消息类型
interface Message {
    id: number;
    content: string;
    isUser: boolean;
    finished?: boolean;
    errorMessage?: string | null;
    usage?: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    } | null;
    timestamp: Date;
}

// 定义EventSource数据响应类型
interface EventSourceData {
    content?: string;
    finished?: boolean;
    errorMessage?: string | null;
    usage?: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    } | null;
}

const RagChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    // 自动滚动到最新消息
    const scrollToBottom = (): void => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 发送消息
    const sendMessage = async (): Promise<void> => {
        if (!inputValue.trim()) return;

        setIsLoading(true);
        setError(null);

        // 添加用户消息
        const userMessage: Message = {
            id: Date.now(),
            content: inputValue,
            isUser: true,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);

        // 添加空的AI消息用于流式更新
        const aiMessageId = Date.now() + 1;
        const aiMessage: Message = {
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
            const eventSource = new EventSource(
                `${API_ENDPOINTS.chat.stream}?question=${encodeURIComponent(inputValue)}&topK=3`
            );

            eventSourceRef.current = eventSource;

            eventSource.onmessage = (event: MessageEvent) => {
                try {
                    const data: EventSourceData = JSON.parse(event.data);

                    // 更新AI消息内容
                    setMessages(prev => prev.map(msg => {
                        if (msg.id === aiMessageId) {
                            return {
                                ...msg,
                                content: msg.content + (data.content || ''),
                                finished: data.finished || false,
                                errorMessage: data.errorMessage || null,
                                usage: data.usage || null
                            };
                        }
                        return msg;
                    }));

                    // 如果流结束，关闭连接
                    if (data.finished) {
                        eventSource.close();
                        setIsLoading(false);
                    }
                } catch (parseError) {
                    console.error('Error parsing event data:', parseError);
                    setError('解析服务器响应时出错');
                    setIsLoading(false);
                    eventSource.close();
                }
            };

            eventSource.onerror = (error: Event) => {
                console.error('EventSource error:', error);
                setError('连接服务器时出错，请检查网络连接');
                setIsLoading(false);
                eventSource.close();
            };

        } catch (err) {
            console.error('Error sending message:', err);
            setError('发送消息时出错: ' + (err instanceof Error ? err.message : '未知错误'));
            setIsLoading(false);
        }
    };

    // 处理键盘事件
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // 清空聊天记录
    const clearChat = (): void => {
        setMessages([]);
        setError(null);
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
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
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="请输入您的问题..."
                    disabled={isLoading}
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