import React, { useEffect, useRef, useState, useTransition } from "react";
import { BiSend } from "react-icons/bi";
import { BsCardImage, BsEmojiSmile } from "react-icons/bs";
import { AiOutlineFileGif } from "react-icons/ai";
import { useRouter } from "next/router";
import Message from "./Message";
import { io, Socket } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { settingOnlineUsers } from "../../Redux/features/GlobalSlice";
import Image from "next/image";
import axiosAPI from "../../axios";
import { messageType, profileType } from "../../Types/Feed.types";
import { RootState } from "../../Redux/app/store";

function MessagesPage() {
  const [input, setInput] = useState("");
  const socket = useRef<Socket>();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputFocusRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef() as React.MutableRefObject<HTMLInputElement>;
  const dispatch = useDispatch();
  const router = useRouter();
  const [arrivalMessage, setArrivalMessage] = useState<messageType>();
  const [allMessages, setAllMessages] = useState<messageType[]>([]);
  const conversationId = router?.query?.component && router.query?.component[1];
  const routerArr =
    router?.query?.component && router.query?.component[1]?.split("-");
  const { profile } = useSelector((state: RootState) => state.blockchain);
  const { receiverProfile } = useSelector((state: RootState) => state.global);
  let receiverAddress: string = "";
  const senderAddress = profile.address;

  if (router?.query.component && routerArr && senderAddress !== routerArr[0]) {
    receiverAddress = routerArr[0];
  } else if (
    router?.query.component &&
    routerArr &&
    senderAddress !== routerArr[1]
  ) {
    receiverAddress = routerArr[1];
  }
  // -------------------------------------- socket.io implementation ---------------------

  useEffect(() => {
    socket.current = io("ws://localhost:8900");
    socket.current.on("getMessage", (msg) => {
      setArrivalMessage({
        receiverAddress,
        senderAddress: msg.senderAddress,
        msg: msg.msg,
      });
    });
    inputFocusRef?.current?.focus();
  }, []);

  useEffect(() => {
    arrivalMessage &&
      routerArr &&
      routerArr.includes(arrivalMessage.senderAddress) &&
      setAllMessages((prev: messageType[]) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  useEffect(() => {
    socket.current?.emit("addUser", senderAddress);
    socket.current?.on("getUsers", (users) => {
      users && dispatch(settingOnlineUsers(users));
    });
  }, [senderAddress, socket, router?.query?.component]);

  useEffect(() => {
    async function fetchingAllMessages() {
      const data = await axiosAPI
        .post(
          "/conversation",
          JSON.stringify({ conversationId: conversationId })
        )
        .then(async (res) => await res?.data);
      console.log("conversation Id  : " + conversationId);
      setAllMessages(data);
    }
    conversationId && fetchingAllMessages();
  }, [router?.query?.component]);

  useEffect(() => {
    const handleKeyPress = (event: any) => {
      if (event.key === "Enter") {
        if (event?.target?.value?.trim() !== "") {
          console.log("click");
          inputRef?.current?.click();
        }
      }
    };

    document.addEventListener("keypress", handleKeyPress);

    return () => {
      document.removeEventListener("keypress", handleKeyPress);
    };
  }, []);

  async function handleSend() {
    const data = {
      conversationId: conversationId,
      receiverAddress,
      senderAddress,
      msg: input,
    };
    await axiosAPI.post("/message", JSON.stringify(data)).then(async (res) => {
      const data = await res.data;
    });
    socket.current?.emit("sendMessage", {
      senderAddress,
      receiverAddress,
      msg: input,
    });
    console.log("cleared input");
    setInput("");
  }

  return (
    <div className="flex">
      {receiverAddress.length ? (
        <div className="flex h-screen w-full flex-col  bg-red-100">
          <div className="flex flex-col items-center bg-red-200 hover:bg-red-300 ">
            <div className="relative h-[5rem] w-[5rem] ">
              <Image
                layout="fill"
                className=" rounded-full"
                src={
                  receiverProfile?.avatar || "https://links.papareact.com/gll"
                }
                alt="avatar"
              ></Image>
            </div>

            {/* <p>{receiverProfile?.name}</p> */}
            <p>{receiverProfile?.userId}</p>
            <p>{receiverProfile?.bio}</p>
          </div>
          <div className="  flex h-full flex-col overflow-y-scroll p-2 py-3 no-scrollbar ">
            {allMessages &&
              allMessages?.map((msg: messageType) => {
                return (
                  <Message
                    msg={msg}
                    key={msg._id + msg.msg}
                    scrollRef={scrollRef}
                    address={profile?.address}
                  />
                );
              })}
          </div>
          <div className="sticky bottom-0 m-1  mx-2 mt-auto flex items-center gap-4 rounded-3xl bg-gray-100 p-4 py-2 text-[1.5rem] text-twitter mb-4 ">
            <BsCardImage />
            <AiOutlineFileGif />
            <BsEmojiSmile />
            <input
              className="w-full bg-gray-100 text-[1rem] outline-none caret-twitter  "
              onChange={(e) => setInput(e.target.value)}
              value={input}
              type="text"
              placeholder="Start a new Message"
              ref={inputFocusRef}
            ></input>
            <div onClick={handleSend} ref={inputRef}>
              <BiSend className="ml-auto cursor-pointer text-[2.5rem] transition-transform hover:-rotate-45 " />
            </div>
          </div>
        </div>
      ) : (
        <div className=" flex h-screen w-full flex-col items-center justify-center text-center ">
          <div className=" flex flex-col items-center justify-center">
            <p className=" rounded-full bg-twitter p-2 px-6 text-[1.5rem] ">
              Start Converstion By Clicking on profile
            </p>
            <p className=" mt-3 w-[23rem] text-slate-500  ">
              Choose from your existing conversations, start a new one, or just
              keep swimming
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagesPage;
