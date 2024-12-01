"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const DepositButton = () => {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);

  // Get PaythenaCore contract address
  const { data: coreContract } = useDeployedContractInfo("PaythenaCore");
  const { writeContractAsync: approve } = useScaffoldWriteContract("USDe");
  const { writeContractAsync: deposit } = useScaffoldWriteContract("PaythenaCore");

  const handleDeposit = async () => {
    if (!address || !amount || !coreContract) return;

    setIsDepositing(true);
    try {
      // Convert amount to Wei/smallest unit
      const amountInWei = parseEther(amount);

      // First approve PaythenaCore to spend USDe
      console.log("Approving PaythenaCore:", coreContract.address);
      const approvalTx = await approve({
        functionName: "approve",
        args: [coreContract.address, amountInWei],
      });
      console.log("Approval transaction:", approvalTx);

      // Wait for approval to be mined
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Then deposit
      console.log("Depositing amount:", amountInWei.toString());
      const depositTx = await deposit({
        functionName: "deposit",
        args: [amountInWei],
      });
      console.log("Deposit transaction:", depositTx);

      notification.success("Successfully deposited USDe!");
      setAmount("");
    } catch (error: any) {
      console.error("Full deposit error:", error);
      if (error.message.includes("insufficient allowance")) {
        notification.error("Approval failed - please try again");
      } else if (error.message.includes("insufficient balance")) {
        notification.error("Insufficient USDe balance");
      } else if (error.message.includes("user rejected")) {
        notification.error("Transaction rejected by user");
      } else {
        notification.error(`Failed to deposit: ${error.message}`);
      }
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="number"
        placeholder="Amount"
        className="input input-xs input-bordered w-32"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        disabled={isDepositing}
      />
      <button
        className={`btn btn-xs btn-primary ${isDepositing ? "loading" : ""}`}
        onClick={handleDeposit}
        disabled={!amount || isDepositing}
      >
        {isDepositing ? "..." : "Deposit"}
      </button>
    </div>
  );
};
