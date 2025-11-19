import React from 'react';
import FileUpload from '../components/FileUpload';

const FileUploadPage: React.FC = () => {
    const handleUploadSuccess = (documentId: string) => {
        console.log('文件上传成功，文档ID:', documentId);
    };

    const handleUploadError = (error: string) => {
        console.error('上传失败:', error);
    };

    return (
        <div style={{
            minHeight: '100%',
            backgroundColor: '#f8f9fa',
            padding: '24px 0'
        }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '0 20px'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '32px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    marginBottom: '24px',
                    border: '1px solid #f1f1f1'
                }}>
                    <h1 style={{
                        marginBottom: '12px',
                        color: '#2c3e50',
                        fontSize: '28px',
                        fontWeight: '600'
                    }}>
                        知识库文件管理
                    </h1>
                    <p style={{
                        color: '#6c757d',
                        fontSize: '16px',
                        marginBottom: '0',
                        lineHeight: '1.5'
                    }}>
                        上传文档到知识库，为智能问答提供数据支持。支持 PDF、MD 等多种格式。
                    </p>
                </div>

                <FileUpload
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                    maxFileSize={30}
                    acceptedFileTypes={['.pdf', '.md']}
                />
            </div>
        </div>
    );
};

export default FileUploadPage;