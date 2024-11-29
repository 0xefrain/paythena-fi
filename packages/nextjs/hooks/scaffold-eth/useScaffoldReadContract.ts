import { useContractRead } from 'wagmi';
import { useTargetNetwork } from './useTargetNetwork';
import { useDeployedContractInfo } from '~~/hooks/scaffold-eth';
import { ContractName } from '~~/utils/scaffold-eth/contract';

export const useScaffoldReadContract = <
  TContractName extends ContractName,
  TFunctionName extends string = string,
>({ contractName, functionName, args }: {
  contractName: TContractName;
  functionName: TFunctionName;
  args?: any[];
}) => {
  const { data: deployedContract } = useDeployedContractInfo(contractName);
  const { targetNetwork } = useTargetNetwork();

  const contractRead = useContractRead({
    address: deployedContract?.address,
    abi: deployedContract?.abi,
    functionName,
    args,
    chainId: targetNetwork.id,
  });

  return contractRead;
};
