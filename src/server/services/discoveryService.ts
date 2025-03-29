import dgram from 'dgram';
import { BaseService } from './baseService';
import { MULTICAST_ADDR, PORT } from '../config';
import { RegisterInfo } from '../types';
import { getDeviceConfig } from '../deviceConfig';
import * as vscode from 'vscode';
import { logger } from '../../utils/logger';
import { clientStore } from '../store';

export class DiscoveryService extends BaseService {
    private discoverySocket?: dgram.Socket;
    private messageBuffer: { [ip: string]: string } = {};
    private discoveredDevices: { [ip: string]: any } = {};
    private oldIds = new Set<string>();
    private broadcastInterval?: NodeJS.Timeout;

    private checkDeviceChange(address: string, data: RegisterInfo) {
        if (this.oldIds.has(address)) {
            return;
        }
        this.oldIds.add(address);
        logger.info(`Discovered device: ${data.alias} at ${address}`);
    }

    private setupListeners() {
        if (!this.discoverySocket) return;

        this.discoverySocket.on('listening', () => {
            this.discoverySocket!.setBroadcast(true);
            this.discoverySocket!.setMulticastTTL(128);
            this.discoverySocket!.addMembership(MULTICAST_ADDR);
            logger.info(`UDP socket listening on ${MULTICAST_ADDR}:${PORT}`);
        });

        this.discoverySocket.on('message', this.handleMessage.bind(this));
        this.discoverySocket.on('error', this.handleError.bind(this));
    }

    private handleMessage(msg: Buffer, rinfo: dgram.RemoteInfo) {
        try {
            const ip = rinfo.address;
            const rawData = msg.toString();

            if (!this.messageBuffer[ip]) {
                this.messageBuffer[ip] = '';
            }

            this.messageBuffer[ip] += rawData;

            const data: RegisterInfo = JSON.parse(msg.toString());
            this.discoveredDevices[rinfo.address] = data;
            this.messageBuffer[ip] = '';
            clientStore.set(data.fingerprint, {
                address: ip,
                device: data,
            });
            this.checkDeviceChange(ip, data);
        } catch (e) {
            logger.error('Failed to parse message:', e as Error);
        }
    }

    private handleError(err: Error) {
        vscode.window.showErrorMessage(`[UDP] Error: ${err.message}`);
        logger.error('UDP error:', err);
    }

    private startBroadcast() {
        const message = JSON.stringify(getDeviceConfig().deviceInfo);
        this.broadcastInterval = setInterval(() => {
            this.discoverySocket!.send(message, 0, message.length, PORT, MULTICAST_ADDR, (err) => {
                if (err) {
                    logger.error('Send error:', err);
                }
            });
        }, 5000);
    }

    async start(): Promise<void> {
        if (this.discoverySocket) {
            await this.stop();
        }

        this.discoverySocket = dgram.createSocket({
            type: 'udp4',
            reuseAddr: true,
        });

        this.setupListeners();

        await new Promise<void>((resolve) => {
            this.discoverySocket!.bind(PORT, () => {
                this.startBroadcast();
                resolve();
            });
        });

        this._started = true;
    }

    async stop(): Promise<void> {
        if (this.broadcastInterval) {
            clearInterval(this.broadcastInterval);
        }
        if (this.discoverySocket) {
            this.discoverySocket.close();
            this.discoverySocket = undefined;
        }
        this._started = false;
    }
}
