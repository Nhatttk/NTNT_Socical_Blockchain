// SPDX-License-Identifier: MIT
// ERC721 Contract
pragma solidity ^0.8.0;

import "./Twitter.sol";
import "./interfaces/IERC721Receiver.sol";

contract TwitterNfts {
    string public name;
    string public symbol;
    Twitter public twitterContract;
    address public immutable i_owner;

    uint256 public nextTokenIdToMint; // token ID numberr

    // token id => owner
    mapping(uint256 => address) internal _owners;
    // owner => token count
    mapping(address => uint256) internal _balances; // no of nfts owned by the specific address
    // token id => approved address
    mapping(uint256 => address) internal _tokenApprovals;
    // owner => (operator => yes/no)
    mapping(address => mapping(address => bool)) internal _operatorApprovals;
    // token id => token uri
    mapping(uint256 => string) _tokenUris;

    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);

    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);

    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

    // Market place variables

    event NFTListed(uint256 indexed tokenId, address indexed owner, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event NFTCanceled(uint256 indexed tokenId, address indexed owner);

    struct NFT {
        address owner;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => NFT) public listedNfts;
    bool private locked = false;

    modifier ownerOfToken(uint256 _tokenId) {
        require(ownerOf(_tokenId) == msg.sender, "Not the owner");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyOwner() {
        if (msg.sender != i_owner) revert Twitter_NotOwner();
        _;
    }

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        nextTokenIdToMint = 1;
        i_owner = msg.sender;
    }

    function balanceOf(address _owner) public view returns (uint256) {
        require(_owner != address(0), "!Add0");
        return _balances[_owner];
    }

    function ownerOf(uint256 _tokenId) public view returns (address) {
        return _owners[_tokenId];
    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId) public payable {
        safeTransferFrom(_from, _to, _tokenId, "");
    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes memory _data) public payable {
        require(
            ownerOf(_tokenId) == msg.sender || _tokenApprovals[_tokenId] == msg.sender
                || _operatorApprovals[ownerOf(_tokenId)][msg.sender],
            "!Auth"
        );
        // trigger func check
        require(_checkOnERC721Received(_from, _to, _tokenId, _data), "!ERC721Implementer");
        _transfer(_from, _to, _tokenId);
    }

    function transferFrom(address _from, address _to, uint256 _tokenId) public payable {
        // unsafe transfer without onERC721Received, used for contracts that dont implement
        require(
            ownerOf(_tokenId) == msg.sender || _tokenApprovals[_tokenId] == msg.sender
                || _operatorApprovals[ownerOf(_tokenId)][msg.sender],
            "!Auth"
        );
        _transfer(_from, _to, _tokenId);
    }

    function approve(address _approved, uint256 _tokenId) public payable {
        require(ownerOf(_tokenId) == msg.sender, "!Owner");
        _tokenApprovals[_tokenId] = _approved;
        emit Approval(ownerOf(_tokenId), _approved, _tokenId);
    }

    function setApprovalForAll(address _operator, bool _approved) public {
        _operatorApprovals[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    function getApproved(uint256 _tokenId) public view returns (address) {
        return _tokenApprovals[_tokenId];
    }

    function isApprovedForAll(address _owner, address _operator) public view returns (bool) {
        return _operatorApprovals[_owner][_operator];
    }

    // ------------------------ End of Erc-721 implementation ------------------------

    function approveNftInternal(address _approved, uint256 _tokenId) private {
        require(ownerOf(_tokenId) == address(this), "!Owner");
        _tokenApprovals[_tokenId] = _approved;
        emit Approval(ownerOf(_tokenId), _approved, _tokenId);
    }

    function revertApproval(uint256 _tokenId) public {
        require(ownerOf(_tokenId) == msg.sender, "!Owner");
        _tokenApprovals[_tokenId] = address(0);
    }

    function mintTo(string memory _nftUri, string memory _profileUri) public {
        // require(contractOwner == msg.sender, "!Auth");
        _owners[nextTokenIdToMint] = msg.sender;
        _balances[msg.sender] += 1;
        _tokenUris[nextTokenIdToMint] = _nftUri;
        twitterContract.setProfileAtMint(_profileUri, msg.sender);
        emit Transfer(address(0), msg.sender, nextTokenIdToMint);
        nextTokenIdToMint += 1;
    }

    function tokenURI(uint256 _tokenId) public view returns (string memory) {
        return _tokenUris[_tokenId];
    }

    function totalSupply() public view returns (uint256) {
        return nextTokenIdToMint;
    }

    // INTERNAL FUNCTIONS
    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data)
        private
        returns (bool)
    {
        // check if to is an contract, if yes, to.code.length will always > 0
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("ERC721: transfer to non ERC721Receiver implementer");
                } else {
                    /// @solidity memory-safe-assembly
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }

    // unsafe transfer
    function _transfer(address _from, address _to, uint256 _tokenId) internal {
        require(ownerOf(_tokenId) == _from, "!Owner");
        require(_to != address(0), "!ToAdd0");

        delete _tokenApprovals[_tokenId];
        // if (
        //     keccak256(abi.encodePacked(profiles[_from])) ==
        //     keccak256(abi.encodePacked(_tokenUris[_tokenId]))
        // ) {
        //     delete profiles[_from];
        // }
        _balances[_from] -= 1;
        _balances[_to] += 1;
        _owners[_tokenId] = _to;

        emit Transfer(_from, _to, _tokenId);
    }

    // fetch all the nfts owned
    function getMyNfts() public view returns (uint256[] memory _ids) {
        _ids = new uint256[](balanceOf(msg.sender));
        uint256 currentIndex;
        uint256 tokenCount = nextTokenIdToMint;
        for (uint256 i = 0; i < tokenCount; i++) {
            if (ownerOf(i) == msg.sender) {
                _ids[currentIndex] = i;
                currentIndex++;
            }
        }
        return _ids;
    }

    function getNftSymbol() public view returns (string memory) {
        return symbol;
    }

    // ----------------------------------- MarketPlace Code ---------------------------------

    function listNFT(uint256 _tokenId, uint256 _price) external ownerOfToken(_tokenId) {
        require(_price > 0, "Price must be greater than zero");
        // Transfer the NFT from the owner to the marketplace contract
        // transferFrom(msg.sender, address(this), _tokenId);
        approve(address(this), _tokenId);
        // List the NFT
        listedNfts[_tokenId] = NFT(msg.sender, _price, false);
        emit NFTListed(_tokenId, msg.sender, _price);
    }

    function buyNFT(uint256 _tokenId, uint256 _price) external payable nonReentrant {
        NFT storage nft = listedNfts[_tokenId];
        require(!nft.sold, "NFT already sold");
        require(nft.price == _price, "Incorrect price");
        require(nft.owner != msg.sender, "Cannot buy your own NFT");
        require(twitterContract.s_balanceOf(msg.sender) >= _price, "Insufficient token balance");

        nft.sold = true;
        address seller = nft.owner;
        // address listedOwner = ownerOf(_tokenId);
        // TODO : need to check the gas contract of this
        // Transfer the NFT from Listed owner to marketplace contracts
        _transfer(seller, address(this), _tokenId);
        approveNftInternal(msg.sender, _tokenId);
        // Transfer the NFT from the marketplace contract to the buyer
        safeTransferFrom(address(this), msg.sender, _tokenId);

        // Transfer the payment to the seller
        twitterContract.approveTokensForNftContract(msg.sender, address(this), _price);
        twitterContract.transferFrom(msg.sender, seller, nft.price);
        emit NFTSold(_tokenId, msg.sender, nft.price);
        // Remove the NFT from the listings
        delete listedNfts[_tokenId];
    }

    function cancelNFT(uint256 _tokenId) external ownerOfToken(_tokenId) {
        NFT storage nft = listedNfts[_tokenId];
        require(!nft.sold, "NFT already sold");

        // Revert the approval which was given to the marketplace contract
        revertApproval(_tokenId);

        emit NFTCanceled(_tokenId, nft.owner);

        // Remove the NFT from the listings
        delete listedNfts[_tokenId];
    }

    function getListedNFT(uint256 _tokenId) external view returns (NFT memory) {
        return listedNfts[_tokenId];
    }

    function getAllListedNfts() external view returns (NFT[] memory) {
        NFT[] memory nfts = new NFT[](nextTokenIdToMint);
        for (uint256 i = 0; i < nextTokenIdToMint; i++) {
            nfts[i] = listedNfts[i];
        }
        return nfts;
    }

    function setTwitterContractAddress(address payable _twitterTokenContract) public onlyOwner {
        twitterContract = Twitter(_twitterTokenContract);
    }

    function burnNft(uint256 _tokenId) external {
        require(ownerOf(_tokenId) == msg.sender, "Not the owner");
        _transfer(msg.sender, address(0), _tokenId);
    }

    // function setProfile()

    function getOwner() external view returns (address) {
        return twitterContract.i_owner();
    }
}

// https://eips.ethereum.org/EIPS/eip-721

// https://ethereum.org/en/developers/docs/standards/tokens/erc-721/
