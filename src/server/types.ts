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
export type Fingerprint = string;
export type SessionId = string;

export interface RegisterInfo {
    alias: string;
    version: string;
    deviceModel: string;
    deviceType: DeviceType;
    fingerprint: Fingerprint;
    port: number;
    protocol: 'http' | 'https';
    download: boolean;
    announce?: boolean;
}

export interface DeviceInfo {
    alias: string;
    version: string;
    deviceModel: string;
    deviceType: DeviceType;
    fingerprint: Fingerprint;
    download: boolean;
}

export interface PrepareUploadInfo {
    info: RegisterInfo;
    files: FilesRecord;
}

export interface PrepareDownloadInfo {
    info: DeviceInfo;
    sessionId: SessionId;
    files: FilesRecord;
}

export interface UploadMeta {
    sessionId: SessionId;
    fileId: FileId;
    token: string;
}