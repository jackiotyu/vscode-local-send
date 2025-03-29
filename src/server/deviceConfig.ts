import * as vscode from 'vscode';
import * as os from 'os';
import { PORT, DEVICE_NAME } from './config';
import { RegisterInfo } from './types';
import * as path from 'path';

export class DeviceConfig {
    private static instance: DeviceConfig;
    private _port: number;
    private _deviceName: string;
    private _ip: string;

    private constructor() {
        this._port = vscode.workspace.getConfiguration('localSend').get('port', PORT);
        this._deviceName = vscode.workspace.getConfiguration('localSend').get('deviceName', DEVICE_NAME);
        this._ip = this.getLocalIp();
    }

    public static getInstance(): DeviceConfig {
        if (!DeviceConfig.instance) {
            DeviceConfig.instance = new DeviceConfig();
        }
        return DeviceConfig.instance;
    }

    private getLocalIp(): string {
        const networks = os.networkInterfaces();
        for (const name of Object.keys(networks)) {
            const interfaces = networks[name];
            if (!interfaces) continue;

            for (const net of interfaces) {
                if (!net.internal && net.family === 'IPv4') {
                    return net.address;
                }
            }
        }
        return '127.0.0.1';
    }

    get port() {
        return this._port;
    }

    get deviceName() {
        return this._deviceName;
    }

    get ip() {
        return this._ip;
    }

    get downloadDir() {
        return path.join(os.tmpdir(), 'vscode-local-send', 'uploads');
    }

    get fingerprint() {
        return `vscode-local-send:${this.port}`;
    }

    get deviceInfo(): RegisterInfo {
        return {
            alias: this.deviceName,
            version: '2.0',
            deviceModel: this.deviceName,
            deviceType: 'desktop',
            fingerprint: this.fingerprint,
            port: this.port,
            protocol: 'http',
            download: true,
            announce: true,
        };
    }
}

export const getDeviceConfig = () => DeviceConfig.getInstance();