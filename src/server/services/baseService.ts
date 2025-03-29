import { EventEmitter } from 'events';

export abstract class BaseService extends EventEmitter {
    protected _started: boolean = false;

    get isStarted() {
        return this._started;
    }

    abstract start(): Promise<void>;
    abstract stop(): Promise<void>;
}