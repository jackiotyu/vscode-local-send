import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { PrepareUploadInfo, UploadMeta } from './types';

export class FileHandler {
    constructor(private uploadsDir: string) {}

    async prepareUpload(body: PrepareUploadInfo) {
        const sessionId = Date.now().toString();
        const map = new Map(Object.entries(body.files));
        const resFileMap = new Map<string, { id: string; token: string }>();

        map.forEach((file, fileId) => {
            resFileMap.set(fileId, {
                id: file.id,
                token: `${sessionId}-${file.id}`,
            });
        });

        return {
            sessionId,
            files: Object.fromEntries(resFileMap),
        };
    }

    async handleUpload(query: UploadMeta, contentType: string, fileData: Buffer) {
        await fs.mkdir(this.uploadsDir, { recursive: true });
        const extension = contentType.split('/')[1];
        const filePath = path.join(this.uploadsDir, `${query.fileId}.${extension}`);

        try {
            await fs.writeFile(filePath, fileData);
            const needOpen = 'Open';
            vscode.window.showInformationMessage(`File save at ${filePath}`, needOpen).then(value => {
                if(value === needOpen) vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
            });
            return { message: 'File uploaded successfully', filePath };
        } catch (error: any) {
            throw new Error(`File upload failed: ${error.message}`);
        }
    }
}
