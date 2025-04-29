import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../Redux/app/store";
import { toast } from "react-toastify";
import { Spinner } from "./utils/svgs";
import { IoArrowBackSharp } from "react-icons/io5";
import { useRouter } from "next/router";
import { zeroAddress } from "../utils/constants";

function Nft() {
  const [isApproving, setIsApproving] = useState(false);
  const [isTransfering, setIsTransfering] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [receiverAddress, setReceiverAddress] = useState("");
  const [approvedAddress, setApprovedAddress] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const { currentNftView, nftContract, walletAddress } = useSelector(
    (state: RootState) => state.blockchain
  );

  useEffect(() => {
    (async () => {
      const owner = await nftContract?.ownerOf(currentNftView.nftId);
      setOwnerAddress(owner.toLowerCase());
    })();
  }, [currentNftView.nftId, isTransfering]);
  const { avatar, nftId, nftName } = currentNftView;
  const router = useRouter();

  // check is already approved or not
  useEffect(() => {
    const checkIsApproved = async () => {
      const approvedAddress = await nftContract?.getApproved(nftId);
      console.log({ approvedAddress });
      setApprovedAddress(approvedAddress != zeroAddress ? approvedAddress : "");
    };

    checkIsApproved();
  }, [nftContract]);

  const handleApprove = async () => {
    if (approvedAddress) return;
    setIsApproving(true);
    try {
      (await nftContract?.approve(receiverAddress, nftId)).wait();
      toast("Nft approved successfully", { type: "success" });
      setReceiverAddress("");
    } catch (error: any) {
      console.error(error);
      toast(error?.shortMessage, { type: "error" });
    } finally {
      setIsApproving(false);
    }
  };
  const handleTransfer = async () => {
    if (ownerAddress !== walletAddress) {
      toast("Only owner can transfer nft", { type: "error" });
      return;
    }
    setIsTransfering(true);
    console.log({ receiverAddress, walletAddress, nftId });
    try {
      await (
        await nftContract?.safeTransferFrom(
          walletAddress,
          receiverAddress,
          nftId
        )
      ).wait();
      toast(`Nft transfered successfully to ${receiverAddress}`, {
        type: "success",
      });
    } catch (error: any) {
      console.error(error);
      toast(error?.shortMessage, { type: "error" });
    } finally {
      setIsTransfering(false);
    }
  };
  const handleBurn = async () => {
    if (ownerAddress !== walletAddress) {
      toast("Only owner can burn nft", { type: "error" });
      return;
    }
    setIsBurning(true);
    try {
      await (await nftContract?.burnNft(nftId)).wait();
      toast("Nft burned successfully", { type: "success" });
    } catch (error: any) {
      console.error(error);
      toast(error?.shortMessage, { type: "error" });
    } finally {
      setIsBurning(false);
    }
  };

  const operatorAccess = async () => {
    await nftContract?.setApprovalForAll(receiverAddress, true);
  };
  console.log({ ownerAddress, walletAddress });

  return (
    <div className=" flex flex-col items-center  gap-2 rounded-lg ">
      <div className="flex justify-center items-center w-full ">
        <IoArrowBackSharp
          title="back"
          onClick={() => {
            router.back();
          }}
          className="cursor-pointer rounded-full p-1 text-[2.3rem] hover:bg-gray-300 mr-auto"
        />
        <h1 className=" mr-auto"> Nft Full details</h1>
      </div>

      <img className=" h-40 w-40" src={avatar} alt="nft image" />
      <p> {nftName}</p>
      <p>Owned by {ownerAddress}</p>
      {ownerAddress == walletAddress && (
        <div className="flex flex-col items-center  gap-2 rounded-lg">
          <div className=" flex flex-row gap-3">
            <input
              className=" w-96 border-2 border-emerald-300 outline-none rounded px-2"
              type="text"
              value={receiverAddress}
              placeholder="receive Address"
              onChange={(e) => setReceiverAddress(e.target.value)}
            ></input>
          </div>
          <div className=" flex gap-3 flex-col justify-center items-center ">
            <div
              onClick={handleApprove}
              className={` rounded-lg p-2 px-4 w-min whitespace-nowrap text-center ${approvedAddress ? " bg-green-500 " : " bg-rose-400 cursor-pointer "} `}
            >
              {approvedAddress ? (
                "Already approved"
              ) : isApproving ? (
                <Spinner />
              ) : (
                "Approve"
              )}
            </div>
            {approvedAddress && (
              <p className="  ">Approved Address: {approvedAddress}</p>
            )}
          </div>

          <div
            onClick={handleTransfer}
            className=" rounded-lg bg-orange-400 p-2 px-4"
          >
            {isTransfering ? <Spinner /> : "Transfer"}
          </div>

          <div
            onClick={handleBurn}
            className=" rounded-lg bg-red-600 p-2 px-4 cursor-pointer text-white"
          >
            {isBurning ? <Spinner /> : "Burn"}
          </div>
          <div className=" w-full border-2 border-stone-600"></div>
          <h1> Admin Level Approvals </h1>
          <div
            onClick={operatorAccess}
            className=" rounded-lg bg-yellow-400 p-2 px-4"
          >
            Operator Access for all NFTs
          </div>
        </div>
      )}
    </div>
  );
}

export default Nft;
