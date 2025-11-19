import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import RagChat from './components/RagChat';
import FileUploadPage from './pages/FileUploadPage';
import './App.css';

// 导航组件
const Navigation: React.FC = () => {
    const location = useLocation();

    return (
        <nav style={{
            backgroundColor: '#001529',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            height: '64px',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
            <div style={{
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                marginRight: '32px'
            }}>
                RAG 知识问答系统
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
                <Link
                    to="/"
                    style={{
                        color: location.pathname === '/' ? '#1890ff' : 'white',
                        textDecoration: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        backgroundColor: location.pathname === '/' ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
                        transition: 'all 0.3s'
                    }}
                >
                    智能问答
                </Link>
                <Link
                    to="/upload"
                    style={{
                        color: location.pathname === '/upload' ? '#1890ff' : 'white',
                        textDecoration: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        backgroundColor: location.pathname === '/upload' ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
                        transition: 'all 0.3s'
                    }}
                >
                    知识库管理
                </Link>
            </div>
        </nav>
    );
};

function App() {
    return (
        <Router>
            <div className="App">
                <Navigation />
                <main className="app-main-content">
                    <Routes>
                        <Route path="/" element={<RagChat />} />
                        <Route path="/upload" element={<FileUploadPage />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;