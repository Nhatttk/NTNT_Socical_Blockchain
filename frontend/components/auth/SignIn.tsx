import Image from "next/image";
import { ConnectButton } from "web3uikit";
import { useDispatch, useSelector } from "react-redux";
import { setWalletAddress } from "../../Redux/features/BlockchainSlice";
import {
  freeEthPublicAddress,
  mainnetEtherscanApi,
  sepoliaEtherscanApi,
  sepoliaExplorer,
} from "../../utils/constants";
import { NewTwitterLogo, Spinner } from "../utils/svgs";
import { RootState } from "../../Redux/app/store";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useContracts from "../hooks/useContracts";
import DarkMode from "../utils/darkMode";
import { ConnectWallet } from "../utils/reusable";
import axiosAPI from "../../axios";
import { explorerPaths } from "../../utils/constants.json";
import Moment from "react-moment";
import { etherScanRes } from "../../Types/blockchain.types";
import { sortArray } from "../../utils/commonFunctions";
import MetamaskLogo from "../utils/Metamask";
import ThreeDotsLoading from "../utils/threeDotsLoading";

export default function SignIn() {
  useContracts();
  const [isEthWithGasLoading, setIsEthWithGasLoading] = useState(false);
  const [isFreeEthLoading, setIsFreeEthLoading] = useState(false);
  const [transaction, setTransaction] = useState("");
  const [isFreeEthAlreadySent, setIsFreeEthAlreadySent] =
    useState<etherScanRes[]>();
  const [isEtherScanLoading, setIsEtherScanLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const { twitterContract, walletAddress, provider } = useSelector(
    (state: RootState) => state.blockchain
  );
  const [displayMetamask, setShouldDisplayMetamask] = useState(false);
  const currentTimestamp = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  useEffect(() => {
    if (!walletAddress) return;
    (async () => {
      const network = provider?.getNetwork ? await provider?.getNetwork() : null;
      const name = network?.name || "sepolia";
      const etherscanAPi =
        name === "sepolia" ? sepoliaEtherscanApi : mainnetEtherscanApi;
      const timeStamp = (currentTimestamp - twentyFourHours) / 1000;
  
      setIsEtherScanLoading(true);
      try {
        const { data }: { data: { status: string; result: any } } =
          await axiosAPI.get(etherscanAPi, {
            params: {
              module: "account",
              action: "txlist",
              tag: "latest",
              address: walletAddress,
              startblock: 0,
              endblock: 99999999,
              sort: "asc",
              apikey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
            },
          });
  
        setIsEtherScanLoading(false);
  
        let filteredData: etherScanRes[] = [];
        if (data?.status === "1" && Array.isArray(data.result)) {
          filteredData = data.result.filter(
            (item) =>
              Number(item.timeStamp) > timeStamp &&
              item?.from?.toLowerCase() === freeEthPublicAddress.toLowerCase()
          );
        } else {
          console.warn("⚠ Etherscan trả về result không hợp lệ:", data?.result);
        }
  
        const sortedData = sortArray(filteredData, "timeStamp", false);
        setIsFreeEthAlreadySent(sortedData);
      } catch (error) {
        setIsEtherScanLoading(false);
        console.error("❌ Lỗi khi fetch từ Etherscan:", error);
      }
    })();
  }, [walletAddress, transaction]);
  

  const { isDarkMode } = useSelector((state: RootState) => state.global);
  function connectWallet() {
    if (window.ethereum) {
      (async () => {
        setShouldDisplayMetamask(false);
        const fetchWalletAddress = await ConnectWallet();
        dispatch(setWalletAddress(fetchWalletAddress));
      })();
    } else {
      setShouldDisplayMetamask(true);
      toast("install metamask to connect", { type: "warning" });
    }
  }

  async function getEthWithGas() {
    setTransaction("");
    if (!walletAddress) {
      toast("Please connect your wallet", { type: "error" });
      return;
    }
    setIsEthWithGasLoading(true);
    const freeEth = 0.01;
    try {
      const ContractTransactionResponse = await (
        await twitterContract?.freeEth(ethers.parseEther(freeEth.toString()))
      ).wait(1);
      console.log({ ContractTransactionResponse });
      setTransaction(
        `${sepoliaExplorer}/${explorerPaths.transaction}/${ContractTransactionResponse.hash}`
      );
    } catch (err: any) {
      // console.log({ err });
      toast(err.shortMessage, { type: "error" });
    } finally {
      setIsEthWithGasLoading(false);
    }
  }

  async function getFreeEth() {
    setTransaction("");
    if (Boolean(isFreeEthAlreadySent?.length)) {
      return;
    }
    if (!walletAddress) {
      toast("Please connect your wallet", { type: "error" });
      return;
    }
    setIsFreeEthLoading(true);
    try {
      const res = (await axiosAPI.post(
        "/sendEth",
        JSON.stringify({ address: walletAddress })
      )) as { data: { txHash: string; amount: string } };
      setTransaction(
        `${sepoliaExplorer}/${explorerPaths.transaction}/${res.data.txHash}`
      );
      toast(` You have received ${res.data.amount} ETH successfully `, {
        type: "success",
      });
    } catch (err: any) {
      console.error({ err });
      toast(err.shortMessage, { type: "error" });
    } finally {
      setIsFreeEthLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 dark:text-white">
      <DarkMode />
      <div className="flex max-w-xl flex-col items-center gap-5 rounded-[3rem] border p-6 ">
        <a className=" w-[4rem] cursor-pointer " href="/home">
          {/* <Image
            layout="fill"
            src="https://links.papareact.com/gll"
            alt="twitter"
          ></Image> */}
          <NewTwitterLogo isDarkMode={isDarkMode} />
        </a>
        <h1 className="text-[4rem] font-bold">Happening now</h1>
        <h2 className="text-[2rem] font-bold">Join Twitter today</h2>
        <div
          onClick={connectWallet}
          className=" cursor-pointer rounded-2xl bg-[rgb(242,246,255)] p-2 px-4 font-bold text-[rgb(46,125,175)]"
        >
          {walletAddress ? walletAddress : "Connect Wallet"}
        </div>
      </div>

      {displayMetamask && (
        <a
          href="https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en"
          id="metamask-container"
          target="_blank"
        >
          <MetamaskLogo
            pxNotRatio={true}
            width={150}
            height={120}
            followMouse={true}
            slowDrift={false}
          />
          {/* <img
          alt="Metamask"
          src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
          className=" w-32 h-32 cursor-pointer"
        /> */}
        </a>
      )}

      <div
        className=" min-w-16 cursor-pointer rounded-full bg-orange-200 p-3 px-5 dark:bg-orange-400 "
        onClick={getEthWithGas}
      >
        {isEthWithGasLoading ? (
          <Spinner />
        ) : (
          "Get 0.01 testnet eth by bearing gas cost "
        )}
      </div>

      {!isEtherScanLoading ? (
        <div
          className={` min-w-16 rounded-full  p-3 px-5  ${Boolean(isFreeEthAlreadySent?.length) ? " bg-slate-200 cursor-not-allowed dark:bg-slate-600 " : " bg-orange-200 dark:bg-orange-400 cursor-pointer "} `}
          onClick={getFreeEth}
        >
          {isFreeEthLoading ? (
            <Spinner />
          ) : Boolean(isFreeEthAlreadySent?.length) && isFreeEthAlreadySent ? (
            <>
              Already sent free eth{" "}
              <Moment fromNow>
                {Number(isFreeEthAlreadySent[0]?.timeStamp) * 1000}
              </Moment>
              {", "}
              Redeem again{" "}
              <Moment toNow subtract={{ hours: 24 }}>
                {Number(isFreeEthAlreadySent[0]?.timeStamp) * 1000}
              </Moment>
            </>
          ) : (
            "Get free eth without any gas cost "
          )}
        </div>
      ) : (
        <ThreeDotsLoading />
      )}
      {transaction ? (
        <p>
          <a className=" underline" href={transaction} target="_blank">
            click here {"  "}
          </a>
          to check the transaction or{" "}
          <a className=" underline " href="/home">
            Go to Home page
          </a>
        </p>
      ) : (
        <a className=" underline " href="/home">
          Go to Home page
        </a>
      )}
    </div>
  );
}
