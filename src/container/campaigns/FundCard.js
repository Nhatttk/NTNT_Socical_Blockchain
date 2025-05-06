import React from 'react';

const FundCard = ({ 
  owner, 
  title, 
  description, 
  target, 
  deadline, 
  amountCollected, 
  image, 
  handleClick 
}) => {
  const remainingDays = () => {
    const difference = new Date(deadline * 1000).getTime() - Date.now();
    const remainingDays = Math.max(0, difference / (1000 * 3600 * 24));
    return remainingDays.toFixed(0);
  };

  return (
    <div 
      className="bg-[#1c1c24] rounded-2xl overflow-hidden cursor-pointer w-full sm:w-[288px]"
      onClick={handleClick}
    >
      <img 
        src={image} 
        alt="campaign" 
        className="w-full h-[158px] object-cover"
      />

      <div className="p-4">
        <div className="block">
          <h3 className="text-white font-semibold text-[16px] truncate">{title}</h3>
          <p className="text-[#808191] mt-[5px] font-normal text-[12px] truncate">{description}</p>
        </div>

        <div className="flex justify-between mt-[15px] gap-2">
          <div className="flex flex-col">
            <h4 className="text-[#b2b3bd] font-semibold text-[14px] leading-[22px]">{amountCollected}</h4>
            <p className="text-[#808191] mt-[3px] font-normal text-[12px] leading-[18px]">Raised of {target}</p>
          </div>
          <div className="flex flex-col">
            <h4 className="text-[#b2b3bd] font-semibold text-[14px] leading-[22px]">{remainingDays()}</h4>
            <p className="text-[#808191] mt-[3px] font-normal text-[12px] leading-[18px]">Days Left</p>
          </div>
        </div>

        <div className="flex items-center mt-[20px] gap-[12px]">
          <div className="w-[30px] h-[30px] rounded-full flex justify-center items-center bg-[#13131a]">
            <img src="/icons/thirdweb.png" alt="user" className="w-1/2 h-1/2 object-contain"/>
          </div>
          <p className="text-[#808191] font-normal text-[12px]">by <span className="text-[#b2b3bd]">{owner.slice(0, 6)}...{owner.slice(-4)}</span></p>
        </div>
      </div>
    </div>
  );
};

export default FundCard; 