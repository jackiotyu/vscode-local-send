import { FileId, FileItem, Fingerprint, RegisterInfo, SessionId } from './types';

export const fileStore = new Map<FileId, FileItem>();

export const clientStore = new Map<Fingerprint, { device: RegisterInfo, address: string }>();

export const taskStore = new Map<SessionId, Fingerprint>();