
import { ethers } from 'ethers';
import { JsonRpcRequest } from 'hardhat/types/provider';

type Provider = ethers.providers.JsonRpcProvider;

export class EVM {
    private provider:  Provider;
    private snapshots: string[] = [];

    constructor(
        provider: Provider,
    ) {
        this.provider = provider;
    }

    public setProvider(
        provider: Provider,
    ): void {
        this.provider = provider;
    }

    /**
     * Attempts to reset the EVM to its initial state. Useful for testing suites
     */
    public async resetEVM(resetSnapshotId: string = '0x1'): Promise<void> {
        const id = await this.snapshot();

        if (id !== resetSnapshotId) {
            await this.reset(resetSnapshotId);
        }
    }

    public async reset(id: string): Promise<string> {
        if (!id) {
            throw new Error('id must be set');
        }

        await this.callJsonrpcMethod('evm_revert', [id]);

        return this.snapshot();
    }

    public async snapshot(): Promise<string> {
        return this.callJsonrpcMethod('evm_snapshot');
    }

    public async evmRevert(id: string): Promise<string> {
        return this.callJsonrpcMethod('evm_revert', [id]);
    }

    public async stopMining(): Promise<string> {
        return this.callJsonrpcMethod('miner_stop');
    }

    public async startMining(): Promise<string> {
        return this.callJsonrpcMethod('miner_start');
    }

    public async mineBlock(): Promise<string> {
        return this.callJsonrpcMethod('evm_mine');
    }

    public async increaseTime(duration: number): Promise<string> {
        return this.callJsonrpcMethod('evm_increaseTime', [duration]);
    }

    public async callJsonrpcMethod(method: string, params?: (any[])): Promise<string> {
        const args: JsonRpcRequest = {
            method,
            params: params || [],
            jsonrpc: '2.0',
            id: new Date().getTime(),
        };

        const response = await this.send(args);
        return response;
    }
    public async pushSnapshot() {
        const _snapshot = await this.snapshot();
        this.snapshots.push(_snapshot);
    }

    public async popSnapshot() {
        const _snapshotId = this.snapshots.pop();
        if (_snapshotId)
            await this.evmRevert(_snapshotId);
    }

    public async popAllSnapshots() {
        this.snapshots.forEach(snp => this.popSnapshot());
    }

    private async send(args: JsonRpcRequest): Promise<any> {
        return await this.provider.send(
            args.method,
            args.params,
        );
    }
}
