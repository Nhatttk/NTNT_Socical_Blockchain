import React, { useRef } from "react";
import { messageType } from "../../Types/Feed.types";

type propsType = {
  msg: messageType;
  scrollRef: React.MutableRefObject<HTMLDivElement>;
  address: string;
};

function Message({ msg, scrollRef, address }: propsType) {
  const blue = address === msg.senderAddress;

  return (
    <div
      ref={scrollRef}
      className={`  ${
        blue ? " ml-auto bg-twitter " : "mr-auto bg-gray-100 dark:bg-gray-400 "
      }  m-1 rounded-full px-3  `}
    >
      {msg.msg}
    </div>
  );
}

export default Message;
