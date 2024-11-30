"use client";

import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useTargetNetwork } from './useTargetNetwork';
import { useTransactor } from './useTransactor';
import { useDeployedContractInfo } from '~~/hooks/scaffold-eth';
import { ContractName } from '~~/utils/scaffold-eth/contract';
import { encodeFunctionData } from 'viem';

export const useScaffoldWriteContract = <TContractName extends ContractName>(
  contractName: TContractName,
  writeContractParams?: UseWriteContractParameters,
) => {
  const { address } = useAccount();
  const writeTx = useTransactor();
  const [isMining, setIsMining] = useState(false);
  const { targetNetwork } = useTargetNetwork();
  const { data: deployedContract } = useDeployedContractInfo(contractName);

  useEffect(() => {
    if (deployedContract) {
      console.log("Contract verification:", {
        address: deployedContract.address,
        hasAddContributor: deployedContract.abi.some(
          item => item.type === 'function' && item.name === 'addContributor'
        ),
        abi: deployedContract.abi
      });
    }
  }, [deployedContract]);

  const writeContractAsync = useCallback(
    async (params: {
      functionName: string;
      args: any[];
      value?: string | bigint;
    }) => {
      if (!deployedContract || !writeTx) {
        console.error("Contract or writeTx undefined:", {
          deployedContract: !!deployedContract,
          writeTx: !!writeTx,
          address: deployedContract?.address,
        });
        throw new Error('Contract or writeTx undefined');
      }
      if (!address) {
        throw new Error('Wallet not connected');
      }

      try {
        setIsMining(true);

        // Encode function data
        const data = encodeFunctionData({
          abi: deployedContract.abi,
          functionName: params.functionName,
          args: params.args,
        });

        // Log contract info
        console.log("Contract Info:", {
          address: deployedContract.address,
          hasAddContributor: deployedContract.abi.some(
            x => x.type === 'function' && x.name === 'addContributor'
          ),
          functionName: params.functionName,
          args: params.args.map(arg => 
            typeof arg === 'bigint' ? arg.toString() : arg
          ),
          data,
        });

        const txParams = {
          to: deployedContract.address,
          data,
          value: params.value || BigInt(0),
          from: address,
          chainId: targetNetwork.id,
          ...writeContractParams,
        };

        // Log transaction parameters
        console.log("Transaction Parameters:", {
          ...txParams,
          data: data,
        });

        const result = await writeTx(
          txParams,
          { blockConfirmations: 1 }
        );

        return result;
      } catch (error: any) {
        console.error("Write Contract Error:", {
          error,
          functionName: params.functionName,
          args: params.args,
        });
        throw error;
      } finally {
        setIsMining(false);
      }
    },
    [deployedContract, writeTx, address, targetNetwork.id, writeContractParams],
  );

  return {
    writeContractAsync,
    isMining,
  };
};
