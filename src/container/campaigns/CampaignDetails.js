import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWallet } from '../../hooks/useWallet';

// Import CrowdFunding contract data
import crowdFundingAddress from '../../contractsData/crowdfunding-address.json';
import crowdFundingAbi from '../../contractsData/crowdfunding.json';

const CampaignDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { account } = useWallet();
  
  // Campaign data state
  const [campaign, setCampaign] = useState(location.state || null);
  const [isLoading, setIsLoading] = useState(!location.state);
  const [donators, setDonators] = useState([]);
  const [donations, setDonations] = useState([]);
  
  // Donation state
  const [amount, setAmount] = useState('');
  const [isDonating, setIsDonating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      if (campaign) return; // Skip if we already have campaign data from location state
      
      setIsLoading(true);
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          crowdFundingAddress.address,
          crowdFundingAbi.abi,
          provider
        );

        // Fetch campaign details
        const campaignData = await contract.campaigns(id);
        
        const parsedCampaign = {
          id,
          owner: campaignData.owner,
          title: campaignData.title,
          description: campaignData.description,
          target: ethers.utils.formatEther(campaignData.target.toString()),
          deadline: campaignData.deadline.toNumber(),
          amountCollected: ethers.utils.formatEther(campaignData.amountCollected.toString()),
          image: campaignData.image
        };

        setCampaign(parsedCampaign);
      } catch (error) {
        console.error('Error fetching campaign details:', error);
        navigate('/campaigns');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchDonators = async () => {
      if (!id) return;
      
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          crowdFundingAddress.address,
          crowdFundingAbi.abi,
          provider
        );

        const [donatorsAddresses, donationAmounts] = await contract.getDonators(id);
        
        // Parse the donator data
        const parsedDonators = [];
        const parsedDonations = [];
        
        for (let i = 0; i < donatorsAddresses.length; i++) {
          parsedDonators.push(donatorsAddresses[i]);
          parsedDonations.push(ethers.utils.formatEther(donationAmounts[i].toString()));
        }

        setDonators(parsedDonators);
        setDonations(parsedDonations);
      } catch (error) {
        console.error('Error fetching donators:', error);
      }
    };

    fetchCampaignDetails();
    fetchDonators();
  }, [id, campaign, navigate]);
  
  // Load comments from localStorage when component mounts
  useEffect(() => {
    if (id) {
      const storedComments = localStorage.getItem(`campaign_${id}_comments`);
      if (storedComments) {
        try {
          setComments(JSON.parse(storedComments));
        } catch (error) {
          console.error('Error parsing stored comments:', error);
        }
      }
    }
  }, [id]);

  const handleDonate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid donation amount');
      return;
    }
    
    if (!window.ethereum) {
      setError('MetaMask not installed or not accessible');
      return;
    }
    
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (campaign.deadline * 1000 < Date.now()) {
      setError('This campaign has ended');
      return;
    }
    
    try {
      setIsDonating(true);
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const contract = new ethers.Contract(
        crowdFundingAddress.address,
        crowdFundingAbi.abi,
        signer
      );
      
      const ethAmount = ethers.utils.parseEther(amount);
      
      const transaction = await contract.donateToCampaign(id, {
        value: ethAmount
      });
      
      await transaction.wait();
      
      // Update campaign amount collected
      const updatedCampaign = { ...campaign };
      updatedCampaign.amountCollected = (
        parseFloat(updatedCampaign.amountCollected) + parseFloat(amount)
      ).toString();
      setCampaign(updatedCampaign);
      
      // Update donators
      const updatedDonators = [...donators, account];
      const updatedDonations = [...donations, amount];
      setDonators(updatedDonators);
      setDonations(updatedDonations);
      
      setSuccess(`Successfully donated ${amount} ETH!`);
      setAmount('');
      
    } catch (error) {
      console.error('Error donating to campaign:', error);
      setError(error.message || 'Error donating to campaign. Please try again.');
    } finally {
      setIsDonating(false);
    }
  };
  
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) return;
    if (!account) {
      setError('Please connect your wallet to comment');
      return;
    }
    
    setIsSubmittingComment(true);
    
    try {
      // Create new comment
      const newComment = {
        id: Date.now().toString(),
        text: commentText.trim(),
        author: account,
        timestamp: Date.now(),
        authorShort: `${account.slice(0, 6)}...${account.slice(-4)}`
      };
      
      // Add comment to state
      const updatedComments = [...comments, newComment];
      setComments(updatedComments);
      
      // Save to localStorage
      localStorage.setItem(`campaign_${id}_comments`, JSON.stringify(updatedComments));
      
      // Clear input
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const calculateBarPercentage = (goal, raisedAmount) => {
    const percentage = Math.round((raisedAmount * 100) / goal);
    return percentage > 100 ? 100 : percentage;
  };

  const remainingDays = () => {
    if (!campaign) return 0;
    const difference = new Date(campaign.deadline * 1000).getTime() - Date.now();
    const remainingDays = Math.max(0, difference / (1000 * 3600 * 24));
    return remainingDays.toFixed(0);
  };
  
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOwner = account && campaign?.owner && account.toLowerCase() === campaign.owner.toLowerCase();
  const isActive = campaign?.deadline * 1000 > Date.now();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] p-4 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] p-4 flex items-center justify-center">
        <div className="text-white text-xl">Campaign not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-4">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate('/campaigns')}
          className="mb-6 text-[#FFFD02] flex items-center gap-2 hover:underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Campaigns
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left column - Campaign Details */}
          <div className="lg:col-span-3">
            <img 
              src={campaign.image} 
              alt={campaign.title}
              className="w-full h-[300px] object-cover rounded-xl mb-6"
            />

            <div className="bg-[#1c1c24] rounded-xl p-6 mb-6">
              <h1 className="text-white text-2xl font-bold mb-4">{campaign.title}</h1>
              
              <div className="w-full bg-[#13131a] rounded-full h-2.5 mb-6">
                <div 
                  className="bg-[#FFFD02] h-2.5 rounded-full" 
                  style={{ width: `${calculateBarPercentage(campaign.target, campaign.amountCollected)}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-[#808191] text-sm">Raised</p>
                  <h4 className="text-white font-semibold">{campaign.amountCollected} ETH</h4>
                </div>
                <div>
                  <p className="text-[#808191] text-sm">Target</p>
                  <h4 className="text-white font-semibold">{campaign.target} ETH</h4>
                </div>
                <div>
                  <p className="text-[#808191] text-sm">
                    {parseInt(remainingDays()) > 0 ? 'Days Left' : 'Ended'}
                  </p>
                  <h4 className="text-white font-semibold">{remainingDays()}</h4>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-[#808191] text-sm mb-1">Creator</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#13131a] flex items-center justify-center">
                    <img src="/icons/thirdweb.png" alt="user" className="w-1/2 h-1/2 object-contain"/>
                  </div>
                  <p className="text-white">
                    {campaign.owner.slice(0, 6)}...{campaign.owner.slice(-4)}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-white text-lg font-semibold mb-2">Story</p>
                <p className="text-[#808191] whitespace-pre-line">{campaign.description}</p>
              </div>
            </div>
            
            {/* Comments Section */}
            <div className="bg-[#1c1c24] rounded-xl p-6 mb-6">
              <h2 className="text-white text-lg font-semibold mb-4">Comments ({comments.length})</h2>
              
              {/* Comment Form */}
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <div className="mb-3">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts about this campaign..."
                    className="w-full bg-[#13131a] border border-[#2a2a35] rounded-md p-3 text-white h-24 resize-none"
                    disabled={!account || isSubmittingComment}
                  ></textarea>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!account || isSubmittingComment || !commentText.trim()}
                    className="bg-[#FFFD02] hover:bg-yellow-400 text-black px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
                {!account && (
                  <p className="text-[#808191] text-sm mt-2">Connect your wallet to comment</p>
                )}
              </form>
              
              {/* Comments List */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-b border-[#2a2a35] pb-4 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#13131a] flex items-center justify-center">
                          <img src="/icons/thirdweb.png" alt="user" className="w-1/2 h-1/2 object-contain"/>
                        </div>
                        <div>
                          <p className="text-[#b2b3bd] text-sm">{comment.authorShort}</p>
                          <p className="text-[#808191] text-xs">{formatDate(comment.timestamp)}</p>
                        </div>
                      </div>
                      <p className="text-white pl-11">{comment.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[#808191] text-center py-4">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                )}
              </div>
            </div>
            
            {/* Donators List */}
            <div className="bg-[#1c1c24] rounded-xl p-6">
              <h2 className="text-white text-lg font-semibold mb-4">Donators ({donators.length})</h2>
              
              {donators.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  {donators.map((donator, index) => (
                    <div key={`${donator}-${index}`} className="flex justify-between py-2 border-b border-[#2a2a35] last:border-0">
                      <p className="text-[#b2b3bd]">{donator.slice(0, 6)}...{donator.slice(-4)}</p>
                      <p className="text-white">{donations[index]} ETH</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#808191]">No donations yet. Be the first to donate!</p>
              )}
            </div>
          </div>
          
          {/* Right column - Donation Form */}
          <div className="lg:col-span-2">
            <div className="bg-[#1c1c24] rounded-xl p-6 sticky top-4">
              <h2 className="text-white text-lg font-semibold mb-4">
                {isActive ? 'Fund this campaign' : 'Campaign has ended'}
              </h2>
              
              {isActive ? (
                <>
                  {error && (
                    <div className="bg-red-900/40 text-red-200 p-3 rounded-md mb-4">
                      {error}
                    </div>
                  )}
                  
                  {success && (
                    <div className="bg-green-900/40 text-green-200 p-3 rounded-md mb-4">
                      {success}
                    </div>
                  )}
                  
                  <form onSubmit={handleDonate}>
                    <div className="mb-4">
                      <label className="block text-[#b2b3bd] mb-2">Pledge amount</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full bg-[#13131a] border border-[#2a2a35] rounded-md p-2.5 pl-12 text-white"
                          placeholder="0.1"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-[#808191]">
                          ETH
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isDonating || isOwner}
                      className={`w-full py-2.5 rounded-md font-medium transition-colors ${
                        isOwner 
                          ? 'bg-gray-500 cursor-not-allowed text-gray-300' 
                          : 'bg-[#FFFD02] hover:bg-yellow-400 text-black disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {isDonating ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : isOwner ? (
                        'You cannot donate to your own campaign'
                      ) : (
                        'Fund Campaign'
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <p className="text-[#808191]">
                  This campaign has ended and is no longer accepting donations.
                </p>
              )}
              
              <div className="mt-6 border-t border-[#2a2a35] pt-4">
                <p className="text-[#808191] text-sm mb-1">Campaign ends on:</p>
                <p className="text-white">
                  {new Date(campaign.deadline * 1000).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails; 