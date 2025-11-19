const config = {
    HOST: process.env.REACT_APP_HOST || '',
};

// API 端点配置
export const API_ENDPOINTS = {
    chat: {
        // 本地不使用nginx 这里直接拼上localhost:8080
        stream: `${config.HOST}/api/chat/rag/stream`,
    },
    file: {
        upload: `${config.HOST}/api/knowledge/upload`,
    }
};