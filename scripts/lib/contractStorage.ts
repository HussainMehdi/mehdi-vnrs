import {
  DeployedContracts,
  FriendlyName,
  friendlyNames,
} from "./IDeployedContracts";

import { Contract } from "ethers/lib/ethers";
import { writeFileSync, existsSync, readFileSync } from "fs";

let deployedContracts: DeployedContracts = {};

if (existsSync("deployedContracts.json")) {
  deployedContracts = JSON.parse(
    readFileSync("deployedContracts.json").toString()
  ) as DeployedContracts;
} else {
  writeFileSync("deployedContracts.json", JSON.stringify(deployedContracts));
}

export function storeContract(
  contract: Contract,
  name: string,
  networkChainId: string,
  friendlyName: FriendlyName = "HARDHAT"
) {
  if (deployedContracts[networkChainId]) {
    if (deployedContracts[networkChainId][friendlyName]) {
      Object.assign(deployedContracts[networkChainId][friendlyName], {
        [name]: {
          links: {},
          address: contract.address,
          transactionHash: contract.deployTransaction.hash,
        },
      });
    } else {
      Object.assign(deployedContracts[networkChainId], {
        [friendlyName]: {
          [name]: {
            links: {},
            address: contract.address,
            transactionHash: contract.deployTransaction.hash,
          },
        },
      });
    }
  } else {
    initFriendlyNames(deployedContracts, networkChainId, friendlyNames);
    Object.assign(deployedContracts[networkChainId][friendlyName], {
      [name]: {
        links: {},
        address: contract.address,
        transactionHash: contract.deployTransaction.hash,
      },
    });
  }
  // console.log(JSON.stringify(deployedContracts));
}

export function getContractStorage(
  name: string,
  networkChainId: string,
  friendlyName: FriendlyName = "HARDHAT"
) {
  return deployedContracts[networkChainId] &&
    deployedContracts[networkChainId][friendlyName] &&
    deployedContracts[networkChainId][friendlyName][name]
    ? deployedContracts[networkChainId][friendlyName][name]
    : ({} as any);
}

export async function saveDeployedContracts() {
  await writeFileSync(
    "deployedContracts.json",
    JSON.stringify(deployedContracts)
  );
}

function initFriendlyNames(
  contracts: DeployedContracts,
  chainId: string,
  friendlyName: readonly string[]
) {
  Object.assign(deployedContracts, {
    [chainId]: {},
  });

  friendlyName.forEach((mp) => {
    Object.assign(deployedContracts[chainId], {
      [mp]: {},
    });
  });
}
