import React, {useRef, useState} from 'react';
import {Card, Input, message, Modal, Progress, Space, Tag, Typography} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    EditOutlined,
    FileTextOutlined,
    UploadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import {API_ENDPOINTS} from "../config/api";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface FileUploadResponse {
    success: boolean;
    message: string;
    data: string; // documentId
}

interface FileUploadProps {
    onUploadSuccess?: (documentId: string) => void;
    onUploadError?: (error: string) => void;
    maxFileSize?: number; // in MB
    acceptedFileTypes?: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({
                                                   onUploadSuccess,
                                                   onUploadError,
                                                   maxFileSize = 10, // 10MB default
                                                   acceptedFileTypes = ['.pdf', '.doc', '.docx', '.txt', '.md']
                                               }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFiles, setUploadedFiles] = useState<Array<{
        name: string;
        documentId: string;
        status: 'success' | 'error';
        timestamp: Date;
    }>>([]);

    // 新增状态：文件信息和描述模态框
    const [fileInfoModalVisible, setFileInfoModalVisible] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    const [fileDescription, setFileDescription] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];

        // 文件大小验证
        if (file.size > maxFileSize * 1024 * 1024) {
            message.error(`文件大小不能超过 ${maxFileSize}MB`);
            return;
        }

        // 文件类型验证
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedFileTypes.includes(fileExtension || '')) {
            message.error(`不支持的文件类型。支持的类型: ${acceptedFileTypes.join(', ')}`);
            return;
        }

        // 设置选中的文件并打开信息填写模态框
        setSelectedFile(file);
        setFileName(file.name); // 默认使用原文件名
        setFileDescription(''); // 清空描述
        setFileInfoModalVisible(true);

        // 清空input，允许重复选择同一文件
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setFileInfoModalVisible(false);
        await uploadFile(selectedFile, fileName, fileDescription);
    };

    const uploadFile = async (file: File, fileName: string, description: string) => {
        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', fileName);
        formData.append('description', description);

        try {
            // 使用 API_ENDPOINTS.file.upload 作为上传地址
            const response = await axios.post<FileUploadResponse>(
                API_ENDPOINTS.file.upload,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const percentCompleted = Math.round(
                                (progressEvent.loaded * 100) / progressEvent.total
                            );
                            setUploadProgress(percentCompleted);
                        }
                    },
                }
            );

            if (response.data.success) {
                const documentId = response.data.data;
                message.success('文件上传成功！');

                // 添加到已上传文件列表
                setUploadedFiles(prev => [{
                    name: file.name,
                    documentId,
                    status: 'success',
                    timestamp: new Date()
                }, ...prev.slice(0, 4)]); // 只保留最近5个文件

                onUploadSuccess?.(documentId);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || '上传失败';
            message.error(`上传失败: ${errorMessage}`);

            // 添加到已上传文件列表（失败状态）
            setUploadedFiles(prev => [{
                name: file.name,
                documentId: '',
                status: 'error',
                timestamp: new Date()
            }, ...prev.slice(0, 4)]);

            onUploadError?.(errorMessage);
        } finally {
            setUploading(false);
            setUploadProgress(0);
            setSelectedFile(null);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];

            // 文件大小验证
            if (file.size > maxFileSize * 1024 * 1024) {
                message.error(`文件大小不能超过 ${maxFileSize}MB`);
                return;
            }

            // 文件类型验证
            const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
            if (!acceptedFileTypes.includes(fileExtension || '')) {
                message.error(`不支持的文件类型。支持的类型: ${acceptedFileTypes.join(', ')}`);
                return;
            }

            setSelectedFile(file);
            setFileName(file.name);
            setFileDescription('');
            setFileInfoModalVisible(true);
        }
    };

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return <FileTextOutlined style={{ color: '#ff4d4f' }} />;
            case 'doc':
            case 'docx':
                return <FileTextOutlined style={{ color: '#1890ff' }} />;
            case 'txt':
                return <FileTextOutlined style={{ color: '#52c41a' }} />;
            case 'md':
                return <FileTextOutlined style={{ color: '#faad14' }} />;
            default:
                return <FileTextOutlined />;
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Card
                title={
                    <Space>
                        <UploadOutlined />
                        <span>知识库文件上传</span>
                    </Space>
                }
                style={{ marginBottom: 16 }}
            >
                {/* 上传区域 */}
                <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    style={{
                        border: '2px dashed #d9d9d9',
                        borderRadius: 8,
                        padding: 40,
                        textAlign: 'center',
                        backgroundColor: '#fafafa',
                        cursor: 'pointer',
                        transition: 'border-color 0.3s',
                        marginBottom: 16,
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#1890ff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#d9d9d9';
                    }}
                >
                    <UploadOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                    <Title level={4} style={{ marginBottom: 8 }}>
                        点击或拖拽文件到此处上传
                    </Title>
                    <Text type="secondary">
                        支持 {acceptedFileTypes.join(', ')} 格式，单个文件不超过 {maxFileSize}MB
                    </Text>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept={acceptedFileTypes.join(',')}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* 上传进度 */}
                {uploading && (
                    <div style={{ marginBottom: 16 }}>
                        <Text>上传中...</Text>
                        <Progress percent={uploadProgress} status="active" />
                    </div>
                )}

                {/* 最近上传的文件 */}
                {uploadedFiles.length > 0 && (
                    <div>
                        <Title level={5}>最近上传的文件</Title>
                        <Space direction="vertical" style={{ width: '100%' }} size={8}>
                            {uploadedFiles.map((file, index) => (
                                <Card
                                    key={index}
                                    size="small"
                                    style={{
                                        borderLeft: `4px solid ${
                                            file.status === 'success' ? '#52c41a' : '#ff4d4f'
                                        }`,
                                    }}
                                >
                                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                        <Space>
                                            {getFileIcon(file.name)}
                                            <Text strong>{file.name}</Text>
                                            <Tag color={file.status === 'success' ? 'green' : 'red'}>
                                                {file.status === 'success' ? '成功' : '失败'}
                                            </Tag>
                                        </Space>
                                        <Space>
                                            {file.status === 'success' && (
                                                <>
                                                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {file.timestamp.toLocaleTimeString()}
                                                    </Text>
                                                </>
                                            )}
                                            {file.status === 'error' && (
                                                <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                                            )}
                                        </Space>
                                    </Space>
                                    {file.status === 'success' && file.documentId && (
                                        <div style={{ marginTop: 4 }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                文档ID: {file.documentId}
                                            </Text>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </Space>
                    </div>
                )}
            </Card>

            {/* 使用说明 */}
            <Card size="small" title="使用说明">
                <Space direction="vertical" size={8}>
                    <Text>1. 点击上传区域或拖拽文件到指定区域</Text>
                    <Text>2. 支持的文件格式: {acceptedFileTypes.join(', ')}</Text>
                    <Text>3. 单个文件大小限制: {maxFileSize}MB</Text>
                    <Text>4. 上传前可以为文件添加描述信息</Text>
                    <Text>5. 上传成功后文件将自动添加到知识库</Text>
                </Space>
            </Card>

            {/* 文件信息填写模态框 */}
            <Modal
                title={
                    <Space>
                        <EditOutlined />
                        <span>文件信息</span>
                    </Space>
                }
                open={fileInfoModalVisible}
                onOk={handleUpload}
                onCancel={() => setFileInfoModalVisible(false)}
                okText="上传"
                cancelText="取消"
                confirmLoading={uploading}
            >
                <div style={{ marginBottom: 16 }}>
                    <Text strong>文件名:</Text>
                    <Input
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="请输入文件名"
                        style={{ marginTop: 8 }}
                    />
                </div>
                <div style={{ marginBottom: 16 }}>
                    <Text strong>文件描述:</Text>
                    <TextArea
                        value={fileDescription}
                        onChange={(e) => setFileDescription(e.target.value)}
                        placeholder="请输入文件描述（可选）"
                        rows={4}
                        style={{ marginTop: 8 }}
                    />
                </div>
                {selectedFile && (
                    <div>
                        <Text type="secondary">
                            文件: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                        </Text>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FileUpload;