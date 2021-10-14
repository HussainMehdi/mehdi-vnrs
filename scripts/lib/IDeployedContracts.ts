export type DeployedContracts = {
    [key: string]: {
        [key in FriendlyName]: {
            [key: string]: {
                links: {},
                address: string,
                transactionHash: string
            }
        } };
};

export const friendlyNames = ['HARDHAT', 'ROPSTEN', 'RINKEBY'] as const;
export type FriendlyName = typeof friendlyNames[number];