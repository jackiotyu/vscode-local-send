import * as path from 'path';
import fs from 'fs/promises';
import { BaseService } from './baseService';
import { PrepareUploadInfo, UploadMeta } from '../types';
import { getDeviceConfig } from '../deviceConfig';
import { logger } from '../../utils/logger';
import * as vscode from 'vscode';
import { fileStore, clientStore, taskStore } from '../store';

export class FileService extends BaseService {
    private uploadsDir: string;

    constructor() {
        super();
        this.uploadsDir = getDeviceConfig().downloadDir;
    }

    async start(): Promise<void> {
        await fs.mkdir(this.uploadsDir, { recursive: true });
        this._started = true;
    }

    async stop(): Promise<void> {
        this._started = false;
    }

    async prepareDownload(body: PrepareUploadInfo) {
        const sessionId = Date.now().toString();
        const fileItems = Object.values(body.files).map(file => ({
            label: file.fileName,
            description: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
            detail: file.fileType,
            picked: true,
            file
        }));

        const selected = await vscode.window.showQuickPick(fileItems, {
            placeHolder: '选择要下载的文件',
            canPickMany: true
        });

        if (!selected || selected.length === 0) {
            return {
                sessionId: sessionId,
                files: {}
            };
        }

        // 保存文件信息到 store
        selected.forEach(item => {
            fileStore.set(item.file.id, item.file);
        });

        // 保存会话信息
        taskStore.set(sessionId, body.info.fingerprint);

        const selectedFiles = selected.reduce((acc, item) => {
            const fileId = item.file.id;
            acc[fileId] = {
                id: fileId,
                token: `${sessionId}-${fileId}`
            };
            return acc;
        }, {} as Record<string, { id: string; token: string }>);

        return {
            sessionId: sessionId,
            files: selectedFiles
        };
    }

    async handleUpload(query: UploadMeta, fileData: Buffer) {
        const fingerprint = taskStore.get(query.sessionId);
        if (!fingerprint) {
            throw new Error('Invalid session');
        }

        const client = clientStore.get(fingerprint);
        if (!client) {
            throw new Error('Client not found');
        }

        const fileInfo = fileStore.get(query.fileId);
        const fileName = fileInfo?.fileName || query.fileId;
        const filePath = path.join(this.uploadsDir, fileName);

        try {
            await fs.writeFile(filePath, fileData);
            logger.info(`File uploaded successfully: ${filePath}`);

            const needOpenFile = '打开文件';
            const needOpenDir = '打开文件夹';

            const openFile = await vscode.window.showInformationMessage(
                `文件 ${fileName} 接收完成`,
                { modal: false },
                { title: needOpenFile, isCloseAffordance: false },
                { title: needOpenDir, isCloseAffordance: false }
            );

            if (openFile?.title === needOpenFile) {
                vscode.env.openExternal(vscode.Uri.file(filePath));
            } else if (openFile?.title === needOpenDir) {
                vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(path.dirname(filePath)));
            }

            return { message: 'File uploaded successfully', filePath };
        } catch (error: any) {
            logger.error('File upload failed:', error);
            throw new Error(`File upload failed: ${error.message}`);
        }
    }
}