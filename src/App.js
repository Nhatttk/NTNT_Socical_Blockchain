import React, { useState } from "react";
import {
  Link,
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Home from "./container/home/Home.js";
import Profile from "./container/profile/Profile.js";
import Connect from "./container/connect/Connect.js";
import { WalletProvider } from "./context/WalletContext";
import { useWallet } from "./hooks/useWallet";
import "./App.scss";
import Auctions from "./container/auctions/Auctions.js";
import Campaigns from "./container/campaigns/Campaigns.js";
import CampaignDetails from "./container/campaigns/CampaignDetails.js";

const ProtectedRoute = ({ children }) => {
  const { account, loading, initializing, isMetamaskInstalled, networkError } =
    useWallet();

  if (initializing || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-700">Initializing wallet connection...</p>
        </div>
      </div>
    );
  }

  if (networkError) {
    return (
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md">
          <h4 className="text-lg font-bold">Network Error</h4>
          <p className="my-2">{networkError}</p>
          <hr className="my-2 border-red-200" />
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!isMetamaskInstalled) {
    return (
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-md">
          <h4 className="text-lg font-bold">MetaMask Not Installed</h4>
          <p className="my-2">
            Please install MetaMask to use this application.
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-600 hover:underline"
            >
              Download MetaMask
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (!account && !initializing && !loading) {
    return <Navigate to="/connect" />;
  }

  return children;
};

function AppNavbar() {
  const {
    account,
    connectWallet,
    disconnectWallet,
    isMetamaskInstalled,
    networkError,
  } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleDisconnect = () => {
    disconnectWallet();
    navigate("/connect");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="x-container min-h-[100px] flex-1 items-center">
      <div className="p-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img
                src={"/icons/icon.svg"}
                className="h-[70px] w-[70px]"
                alt="Logo"
              />
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                to="/"
                className={`group px-3 py-2 rounded-md text-sm font-medium flex flex-col items-center gap-1 relative ${
                  isActive("/") ? "active" : ""
                }`}
              >
                <img
                  src={
                    isActive("/")
                      ? "/icons/home/home-active.svg"
                      : "/icons/home/home.svg"
                  }
                  alt="Home"
                  className="w-7 h-7"
                />
                <div
                  className={`w-1.5 h-1.5 mt-1 rounded-full bg-[#FFFD02] ${
                    isActive("/")
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                ></div>
              </Link>
              <Link
                to="/profile"
                className={`group px-3 py-2 rounded-md text-sm font-medium flex flex-col items-center gap-1 relative ${
                  isActive("/profile") ? "active" : ""
                }`}
              >
                <img
                  src={
                    isActive("/profile")
                      ? "/icons/home/profile-active.svg"
                      : "/icons/home/profile.svg"
                  }
                  alt="Profile"
                  className="w-7 h-7"
                />
                <div
                  className={`w-1.5 h-1.5 mt-1 rounded-full bg-[#FFFD02] ${
                    isActive("/profile")
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                ></div>
              </Link>
              <Link
                to="/auctions"
                className={`group px-3 py-2 rounded-md text-sm font-medium flex flex-col items-center gap-1 relative ${
                  isActive("/auctions") ? "active" : ""
                }`}
              >
                <img
                  src={
                    isActive("/auctions")
                      ? "/icons/home/auctions-active.png"
                      : "/icons/home/auctions.png"
                  }
                  alt="Auctions"
                  className="w-7 h-7"
                />
                <div
                  className={`w-1.5 h-1.5 mt-1 rounded-full bg-[#FFFD02] ${
                    isActive("/auctions")
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                ></div>
              </Link>
              <Link
                to="/campaigns"
                className={`group px-3 py-2 rounded-md text-sm font-medium flex flex-col items-center gap-1 relative ${
                  isActive("/campaigns") ? "active" : ""
                }`}
              >
                <img
                  src={
                    isActive("/campaigns")
                      ? "/icons/home/campaigns-active.png"
                      : "/icons/home/campaigns.png"
                  }
                  alt="All Campaigns"
                  className="w-7 h-7"
                />
                <div
                  className={`w-1.5 h-1.5 mt-1 rounded-full bg-[#FFFD02] ${
                    isActive("/campaigns")
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                ></div>
              </Link>
              <Link
                to="/setting"
                className={`group px-3 py-2 rounded-md text-sm font-medium flex flex-col items-center gap-1 relative ${
                  isActive("/setting") ? "active" : ""
                }`}
              >
                <img
                  src={
                    isActive("/setting")
                      ? "/icons/home/setting-active.svg"
                      : "/icons/home/setting.svg"
                  }
                  alt="Setting"
                  className="w-7 h-7"
                />
                <div
                  className={`w-1.5 h-1.5 mt-1 rounded-full bg-[#FFFD02] ${
                    isActive("/setting")
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                ></div>
              </Link>
            </div>
          </div>
          <div className="">
            {account ? (
              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="max-w-xs bg-white rounded-md flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-white px-3 py-2"
                  >
                    <span className="sr-only">Open user menu</span>
                    <span>
                      {account.slice(0, 5) + "..." + account.slice(38, 42)}
                    </span>
                  </button>
                </div>
                {dropdownOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10"
                    onBlur={() => setDropdownOpen(false)}
                  >
                    <a
                      href={`https://etherscan.io/address/${account}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      View on Etherscan
                    </a>
                    <button
                      onClick={handleDisconnect}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            ) : networkError ? (
              <button
                onClick={() => window.location.reload()}
                title={networkError}
                className="bg-yellow-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-yellow-700"
              >
                Network Error
              </button>
            ) : isMetamaskInstalled ? (
              <button
                onClick={connectWallet}
                className="bg-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Connect Wallet
              </button>
            ) : (
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700"
              >
                Install MetaMask
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

const ConditionalNavbar = () => {
  const location = useLocation();
  const { initializing } = useWallet();

  if (initializing || location.pathname === "/connect") {
    return null;
  }

  return <AppNavbar />;
};

function AppContent() {
  const { contract, loading, initializing, isMetamaskInstalled, networkError } =
    useWallet();

  return (
    <Routes>
      <Route
        path="/connect"
        element={
          initializing ? (
            <div className=" min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                <p className="text-gray-700">
                  Initializing wallet connection...
                </p>
              </div>
            </div>
          ) : !isMetamaskInstalled ? (
            <div className="max-w-4xl mx-auto mt-8 px-4">
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-md">
                <h4 className="text-lg font-bold">MetaMask Not Installed</h4>
                <p className="my-2">
                  Please install MetaMask to use this application.
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    Download MetaMask
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <Connect />
          )
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home contract={contract} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile contract={contract} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auctions"
        element={
          <ProtectedRoute>
            <Auctions contract={contract} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/campaigns"
        element={
          <ProtectedRoute>
            <Campaigns />
          </ProtectedRoute>
        }
      />
      <Route
        path="/campaign-details/:id"
        element={
          <ProtectedRoute>
            <CampaignDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/setting"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-[#1a1a1a] p-4">
              <h1 className="text-white text-2xl">Setting Page</h1>
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <div className="min-h-screen bg-[#1a1a1a]">
          <ConditionalNavbar />
          <AppContent />
        </div>
      </WalletProvider>
    </BrowserRouter>
  );
}

export default App;