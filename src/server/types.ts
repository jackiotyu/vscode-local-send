export type DeviceType = 'mobile' | 'desktop' | 'web' | 'headless' | 'server';

export interface FileItem {
    id: string;
    fileName: string;
    size: number;
    fileType: string;
    sha256?: string;
    preview: string;
}

export type FileId = string;
export type FilesRecord = Record<FileId, FileItem>;

export interface RegisterInfo {
    alias: string;
    version: string;
    deviceModel: string;
    deviceType: DeviceType;
    fingerprint: string;
    port: number;
    protocol: 'http' | 'https';
    download: boolean;
    announce?: boolean;
}

export interface PrepareUploadInfo {
    info: {
        alias: string;
        version: string;
        deviceModel: string;
        deviceType: DeviceType;
        fingerprint: string;
        port: number;
        protocol: 'http' | 'https';
        download: boolean;
    };
    files: FilesRecord;
}

export interface PrepareDownloadInfo {
    info: {
        alias: string;
        version: string;
        deviceModel: string;
        deviceType: DeviceType;
        fingerprint: string;
        download: boolean;
    };
    sessionId: string;
    files: FilesRecord;
}

export interface UploadMeta {
    sessionId: string;
    fileId: string;
    token: string;
}