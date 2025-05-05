import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../../hooks/useWallet";

const Connect = () => {
  const {
    account,
    connectWallet,
    isMetamaskInstalled,
    networkError,
    initializing,
    loading,
  } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already connected, redirect to home
    if (account && !initializing) {
      navigate("/");
    }
  }, [account, navigate, initializing]);

  const handleConnect = async () => {
    const success = await connectWallet();
    if (success) {
      navigate("/");
    }
  };

  const handleBackToHome = () => {
    if (account) {
      navigate("/");
    }
  };

  // Show loading spinner while initializing
  if (initializing) {
    return (
      <div className="min-h-screen w-full flex justify-center items-center gradient-background">
        {/* Header with logo and name */}
        <div className="absolute top-8 left-10 flex items-center">
          <img
            src={"icons/icon.svg"}
            alt="Logo"
            className="w-[50px] h-[50px]"
          />
          <span className="text-white text-2xl font-bold ml-3">TNTN</span>
        </div>

        {/* Left section - Content */}
        <div className="flex flex-col flex-1 items-center justify-center">
          <div className="max-w-md text-center w-full animate-fade-in text-white">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-white border-t-transparent rounded-full mb-4"></div>
            <p className="text-white">Initializing wallet connection...</p>
          </div>
        </div>

        {/* Right section - Image */}
        <div className="h-screen flex flex-1 p-3 justify-center">
          <img
            src="/images/connect-image.png"
            alt="Connect illustration"
            className="object-cover"
          />
        </div>
      </div>
    );
  }

  if (!isMetamaskInstalled) {
    return (
      <div className="min-h-screen w-full flex justify-center items-center gradient-background">
        {/* Header with logo and name */}
        <div className="absolute top-8 left-10 flex items-center">
          <img
            src={"icons/icon.svg"}
            alt="Logo"
            className="w-[50px] h-[50px]"
          />
          <span className="text-white text-2xl font-bold ml-3">TNTN</span>
        </div>

        {/* Left section - Content */}
        <div className="flex flex-col flex-1 items-center justify-center">
          <div className="max-w-md text-center w-full animate-fade-in text-white">
            <img
              src={"icons/icon.svg"}
              alt="Logo"
              className="w-[70px] h-[70px] mx-auto mb-6"
            />
            <h1 className="text-2xl font-bold mb-4 uppercase">MetaMask Not Installed</h1>
            <p className="text-gray-200 mb-8">
              You need to install MetaMask browser extension to use
              Decentratwitter.
            </p>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 px-4 bg-black text-white font-medium rounded-lg shadow-md hover:bg-black/80 transition-all duration-300 transform hover:-translate-y-1"
            >
              Install MetaMask
            </a>
          </div>
        </div>

        {/* Right section - Image */}
        <div className="h-screen flex flex-1 p-3 justify-center">
          <img
            src="/images/connect-image.png"
            alt="Connect illustration"
            className="object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex justify-center items-center gradient-background">
      {/* Header with logo and name */}
      <div className="absolute top-8 left-10 flex items-center">
        <img
          src={"icons/icon.svg"}
          alt="Logo"
          className="w-[50px] h-[50px]"
        />
        <span className="text-white text-2xl font-bold ml-3">TNTN</span>
      </div>

      {/* Left section - Content */}
      <div className="flex flex-col flex-1 items-center justify-center">
        <div className="max-w-md text-center w-full animate-fade-in text-white">
          <h1 className="text-3xl font-bold mb-4 uppercase">Welcome to TNTN Social</h1>

          {networkError && (
            <div className="bg-red-500/20 border-l-4 border-red-500 p-4 mb-6 rounded text-left">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-300"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">
                    <strong>Connection Error: </strong>
                    {networkError}
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="text-gray-200 text-base mb-8">
            Connect your wallet to access the decentralized social platform.
          </p>

          <button
            onClick={handleConnect}
            disabled={loading}
            className={`
              w-full py-3 px-4 font-medium rounded-lg shadow-md 
              transform transition-all duration-300
              ${
                loading
                  ? "bg-black/40 cursor-not-allowed"
                  : "bg-black hover:-translate-y-1"
              }
              text-white
            `}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                <span>Connecting...</span>
              </div>
            ) : (
              "Connect Wallet"
            )}
          </button>

          {account && (
            <button
              onClick={handleBackToHome}
              className="mt-4 text-gray-300 hover:text-white underline"
            >
              Back to Home
            </button>
          )}
        </div>
      </div>

      {/* Right section - Image */}
      <div className="h-screen flex flex-1 p-3 justify-center">
        <img
          src="/images/connect-image.png"
          alt="Connect illustration"
          className="object-cover"
        />
      </div>
    </div>
  );
};

export default Connect;
