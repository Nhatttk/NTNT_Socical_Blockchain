import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FundCard from './FundCard';
import { ethers } from 'ethers';
import { useWallet } from '../../hooks/useWallet';

// Import CrowdFunding contract data
import crowdFundingAddress from '../../contractsData/crowdfunding-address.json';
import crowdFundingAbi from '../../contractsData/crowdfunding.json';

const Campaigns = () => {
  const navigate = useNavigate();
  const { provider, account } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target: '',
    deadline: '',
    image: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true);
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          crowdFundingAddress.address,
          crowdFundingAbi.abi,
          provider
        );

        const campaignsData = await contract.getCampaigns();
        
        const parsedCampaigns = campaignsData.map((campaign, i) => ({
          id: i,
          owner: campaign.owner,
          title: campaign.title,
          description: campaign.description,
          target: ethers.utils.formatEther(campaign.target.toString()),
          deadline: campaign.deadline.toNumber(),
          amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
          image: campaign.image
        }));

        setCampaigns(parsedCampaigns);
      } catch (error) {
        console.log('Error fetching campaigns:', error);
        // Fall back to mock data if contract isn't deployed yet
        const data = [
          {
            id: '1',
            owner: '0x1234...5678',
            title: 'Education Fund',
            description: 'Support education for children in need',
            target: '100',
            deadline: '2023-12-31',
            amountCollected: '50',
            image: 'https://via.placeholder.com/300',
          },
          {
            id: '2',
            owner: '0x8765...4321',
            title: 'Tech Startup',
            description: 'Funding for a new blockchain application',
            target: '500',
            deadline: '2023-10-15',
            amountCollected: '200',
            image: 'https://via.placeholder.com/300',
          },
          {
            id: '3',
            owner: '0x9876...1234',
            title: 'Community Garden',
            description: 'Creating green spaces in urban areas',
            target: '50',
            deadline: '2023-11-20',
            amountCollected: '30',
            image: 'https://via.placeholder.com/300',
          },
        ];
        setCampaigns(data);
      } finally {
        setIsLoading(false);
      }
    };

    if (window.ethereum) {
      fetchCampaigns();
    }
  }, []);

  const handleNavigate = (campaign) => {
    navigate(`/campaign-details/${campaign.id}`, { state: campaign });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Basic validation
    if (!formData.title || !formData.description || !formData.target || !formData.deadline || !formData.image) {
      setFormError('Please fill in all fields');
      return;
    }
    
    if (!window.ethereum) {
      setFormError('MetaMask not installed or not accessible');
      return;
    }
    
    if (!account) {
      setFormError('Please connect your wallet first');
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Create a provider and signer directly from window.ethereum
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const contract = new ethers.Contract(
        crowdFundingAddress.address,
        crowdFundingAbi.abi,
        signer
      );
      
      // Convert deadline to UNIX timestamp
      const deadlineDate = new Date(formData.deadline).getTime() / 1000;
      // Convert target to wei
      const targetEther = ethers.utils.parseEther(formData.target);
      
      const transaction = await contract.createCampaign(
        account,
        formData.title,
        formData.description,
        targetEther,
        deadlineDate,
        formData.image
      );
      
      await transaction.wait();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        target: '',
        deadline: '',
        image: ''
      });
      
      setShowCreateForm(false);
      
      // Refresh campaigns
      const updatedCampaigns = await contract.getCampaigns();
      const parsedCampaigns = updatedCampaigns.map((campaign, i) => ({
        id: i,
        owner: campaign.owner,
        title: campaign.title,
        description: campaign.description,
        target: ethers.utils.formatEther(campaign.target.toString()),
        deadline: campaign.deadline.toNumber(),
        amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
        image: campaign.image
      }));
      
      setCampaigns(parsedCampaigns);
    } catch (error) {
      console.error('Error creating campaign:', error);
      setFormError(error.message || 'Error creating campaign. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-white text-2xl font-bold">All Campaigns ({campaigns.length})</h1>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-[#FFFD02] hover:bg-yellow-400 text-black px-4 py-2 rounded-md font-medium transition-colors"
          >
            {showCreateForm ? 'Cancel' : 'Create Campaign'}
          </button>
        </div>

        {/* Create Campaign Form */}
        {showCreateForm && (
          <div className="bg-[#1c1c24] rounded-xl p-6 mb-8">
            <h2 className="text-white text-xl font-semibold mb-4">Create a New Campaign</h2>
            {formError && (
              <div className="bg-red-900/40 text-red-200 p-3 rounded-md mb-4">
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-[#b2b3bd] mb-2">Campaign Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    className="w-full bg-[#13131a] border border-[#2a2a35] rounded-md p-2.5 text-white"
                    placeholder="Enter title"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-[#b2b3bd] mb-2">Target Amount (ETH)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="target"
                    value={formData.target}
                    onChange={handleFormChange}
                    className="w-full bg-[#13131a] border border-[#2a2a35] rounded-md p-2.5 text-white"
                    placeholder="0.5"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-[#b2b3bd] mb-2">End Date</label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleFormChange}
                    className="w-full bg-[#13131a] border border-[#2a2a35] rounded-md p-2.5 text-white"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-[#b2b3bd] mb-2">Campaign Image URL</label>
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleFormChange}
                    className="w-full bg-[#13131a] border border-[#2a2a35] rounded-md p-2.5 text-white"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="mb-4 md:col-span-2">
                  <label className="block text-[#b2b3bd] mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    className="w-full bg-[#13131a] border border-[#2a2a35] rounded-md p-2.5 text-white h-24"
                    placeholder="Describe your campaign"
                  ></textarea>
                </div>
              </div>
              <div className="mt-4">
                <button 
                  type="submit"
                  disabled={isCreating}
                  className="bg-[#FFFD02] hover:bg-yellow-400 text-black px-6 py-2.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </span>
                  ) : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex flex-wrap gap-6">
          {isLoading && (
            <div className="w-full flex justify-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}

          {!isLoading && campaigns.length === 0 && (
            <p className="text-[#818183] text-lg w-full text-center py-12">
              No campaigns available at the moment
            </p>
          )}

          {!isLoading && campaigns.length > 0 && campaigns.map((campaign) => (
            <FundCard 
              key={campaign.id}
              {...campaign}
              handleClick={() => handleNavigate(campaign)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Campaigns;
