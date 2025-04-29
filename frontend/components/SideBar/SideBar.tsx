import React from "react";
import { IoNotificationsOutline, IoSearch } from "react-icons/io5";
// import { AiOutlineHome } from "react-icons/ai";
import { TiHome } from "react-icons/ti";
import { BiHash } from "react-icons/bi";
// import { FiMail } from "react-icons/fi";
import { AiFillMessage } from "react-icons/ai";
import { BsBookmark, BsCardList } from "react-icons/bs";
// import { HiOutlineUser } from "react-icons/hi";
// import { BsPersonCircle } from "react-icons/bs";
import { BsFillPersonFill } from "react-icons/bs";
import { CgMoreO } from "react-icons/cg";
// import { CiWallet } from "react-icons/ci";
import { IoWallet } from "react-icons/io5";
import SideBarItem from "./SideBarItem";
import Link from "next/link";
import { tweetBoxModal } from "../../Redux/features/GlobalSlice";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import { FaDonate } from "react-icons/fa";
// import { FcSafe } from "react-icons/fc";
import { RiNftFill } from "react-icons/ri";
import { RootState } from "../../Redux/app/store";
import { setWalletAddress } from "../../Redux/features/BlockchainSlice";
import { NewTwitterLogo } from "../utils/svgs";
import { useRouter } from "next/router";
import { MdSell } from "react-icons/md";
// import { MdOutlineSell } from "react-icons/md";
import { delay } from "../../utils/reusable";

function SideBar() {
  const dispatch = useDispatch();
  const { profile, isSettingProfile, walletAddress } = useSelector(
    (state: RootState) => state.blockchain
  );
  const { isDarkMode } = useSelector((state: RootState) => state.global);
  const router = useRouter();

  function connectWallet() {
    if (window.ethereum) {
      (async () => {
        const { ethereum } = window;
        const connectedAccounts = (await ethereum.request({
          method: "eth_requestAccounts",
        })) as Array<string>;
        console.log(connectedAccounts);
        const walletAddress = connectedAccounts[0];
        dispatch(setWalletAddress(walletAddress));
        window.sessionStorage.setItem("walletAddress", walletAddress);
      })();
    }
  }

  return (
    <div className="col-span-2 flex h-screen flex-col pt-2  ">
      <div className="flex max-w-[12rem] flex-col items-center gap-1  lg:items-start ">
        <Link passHref href="/home">
          <div className="relative ml-4 h-[3rem] w-[3rem] rounded-full p-[0.3rem] cursor-pointer  ">
            <NewTwitterLogo isDarkMode={isDarkMode} />
          </div>
          {/* <h1 className=" items-center mx-auto ">
            Twit<span className="text-[#4FD8E0]">Gram.</span>
          </h1> */}
        </Link>

        <SideBarItem Icon={TiHome} text="Home" />
        {/* <SideBarItem Icon={IoSearch} text="Search" /> */}
        {/* <SideBarItem Icon={BiHash} text="Explore" /> */}
        {/* <SideBarItem Icon={IoNotificationsOutline} text="Notifications" /> */}
        <SideBarItem Icon={AiFillMessage} text="Messages" />
        {/* <SideBarItem Icon={BsBookmark} text="Bookmarks" /> */}
        {/* <SideBarItem Icon={BsCardList} text="Lists" /> */}
        <SideBarItem Icon={BsFillPersonFill} text="Profile" />
        {/* <SideBarItem Icon={CgMoreO} text="More" /> */}
        <SideBarItem Icon={FaDonate} text="FundMe" />
        <SideBarItem Icon={IoWallet} text="Wallet" />
        <SideBarItem Icon={RiNftFill} text="NFTProfile" />
        <SideBarItem Icon={MdSell} text="Marketplace" />
        <div
          onClick={() => dispatch(tweetBoxModal())}
          className=" tweetButton mt-5 bg-[#4FD8E0] "
        >
          Tweet
        </div>
        <div onClick={connectWallet} className=" tweetButton mt-5 bg-sky-500 ">
          {walletAddress
            ? walletAddress.slice(0, 7) +
              "......" +
              walletAddress.slice(
                walletAddress.length - 7,
                walletAddress.length
              )
            : "Connect wallet"}
        </div>
      </div>
      <div className=" mb-3 mt-auto flex  items-center justify-between rounded-full p-2 gap-2 ">
        <div className="flex items-center gap-3 ">
          <div className="relative h-[2.5rem] w-[2.5rem]">
            {isSettingProfile ? (
              <div className=" ml-auto mr-auto flex h-14 w-14 items-center self-center rounded-full bg-indigo-400 text-xs">
                <svg
                  className=" mr-3 h-5 w-5 animate-spin "
                  viewBox="0 0 24 24"
                ></svg>
                setting profile..
              </div>
            ) : (
              <Image
                layout="fill"
                className=" rounded-full"
                src={profile.avatar || "https://links.papareact.com/gll"}
                alt="avatar"
              ></Image>
            )}
          </div>
          {profile?.userId && (
            <p>@{profile?.userId.split(" ")[0].toLowerCase()}</p>
          )}
        </div>

        {walletAddress && (
          <button
            onClick={async () => {
              await router.push("/");
              await window.ethereum.request({
                method: "wallet_revokePermissions",
                params: [
                  {
                    eth_accounts: {},
                  },
                ],
              });
            }}
            className="rounded-full bg-twitter bg-opacity-60 p-1 px-2 transition-all ease-in-out hover:scale-105"
          >
            disconnect
          </button>
        )}
      </div>
    </div>
  );
}

export default SideBar;
