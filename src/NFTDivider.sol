// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {HBAR} from "./HBAR.sol";
import {IERC721, ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenDivider
 * @author Juan Pedro Ventura Baltian, 14 years old
 * @notice This contracts was created, with the intention to make a new market of nft franctions
 * There are a function to divide an nft, then you can sell and buy some fraction of nft, that are basicaly
 * erc20 tokens, each nft pegged to an nft.There are some validations, to make the platforme the most secure
 * as possible.This is the first project that i code alone, in blockchain, foundry and solidity.
 * Thank you so much for read it.
 */
contract TokenDivider is IERC721Receiver, Ownable {
    error TokenDivider__NotFromNftOwner();
    error TokenDivider__NotEnoughErc20Balance();
    error TokenDivider__NftTransferFailed();
    error TokenDivider__InsuficientBalance();
    error TokenDivider__CantTransferToAddressZero();
    error TokenDivider__TransferFailed();
    error TokenDivider__NftAddressIsZero();
    error TokenDivider__AmountCantBeZero();
    error TokenDivider__InvalidSeller();
    error TokenDivier__InvalidAmount();
    error TokenDivider__IncorrectEtherAmount();
    error TokenDivider__InsuficientEtherForFees();

    struct ERC20Info {
        address erc20Address;
        uint256 tokenId;
    }

    struct SellOrder {
        address seller;
        address erc20Address;
        uint256 price;
        uint256 amount;
    }

    /**
     * @dev balances Relates a user with an amount of a erc20 token, this erc20 tokens is an nft fraction
     *
     *  @dev nftToErc20Info Relates an nft with the erc20 pegged, and othe data like the erc20 amount, or the tokenId
     *
     *  @dev s_userToSellOrders Relates a user with an array of sell orders, that each sell order 
     *  has a seller, an erc20 that is the token to sell, a price and an amount of erc20 to sell
     */
    // @audit-info naming convention of state variable should me presise.
    mapping(address user => mapping(address erc20Address => uint256 amount)) balances;
    mapping(address nft => ERC20Info) nftToErc20Info;
    mapping(address user => SellOrder[] orders) s_userToSellOrders;
    // @audit-info missing netspac
    mapping(address erc20 => address nft) erc20ToNft;
    mapping(address erc20 => uint256 totalErc20Minted) erc20ToMintedAmount;

    event NftDivided(address indexed nftAddress, uint256 indexed amountErc20Minted, address indexed erc20Minted);
    event NftClaimed(address indexed nftAddress);
    event TokensTransfered(uint256 indexed amount, address indexed erc20Address);
    event OrderPublished(uint256 indexed amount, address indexed seller, address indexed nftPegged);
    event OrderSelled(address indexed buyer, uint256 price);

    /**
     *
     *  Only the owner of the nft can call a function with this modifier
     */
    //e looks fine
    modifier onlyNftOwner(address nft, uint256 tokenId) {
        if (msg.sender != IERC721(nft).ownerOf(tokenId)) {
            revert TokenDivider__NotFromNftOwner();
        }
        _;
    }

    constructor() Ownable(msg.sender) {} // e set the caller as the owner of the contract

    /**
     * @dev Handles the receipt of an ERC721 token. This function is called whenever an ERC721 token is transferred to this contract.
     */
    function onERC721Received(
        address, /* operator */
        address, /* from */
        uint256, /*  tokenId */
        bytes calldata /* data */
    ) external pure override returns (bytes4) {
        // Return this value to confirm the receipt of the NFT
        return this.onERC721Received.selector;
    }

    /**
     *
     * @param nftAddress The addres of the nft to divide
     * @param tokenId The id of the token to divide
     * @param amount The amount of erc20 tokens to mint for the nft
     *
     * @dev in this function, the nft passed as parameter, is locked by transfering it to this contract, then, it gives to the
     * person calling this function an amount of erc20, beeing like a fraction of this nft.
     */

    // @audit-low/info there is no meaning of use of onlyNftOwner modifier twice?
    function divideNft(address nftAddress, uint256 tokenId, uint256 amount)
        external
        onlyNftOwner(nftAddress, tokenId)
        onlyNftOwner(nftAddress, tokenId)
    {
        if (nftAddress == address(0)) revert TokenDivider__NftAddressIsZero();
        if (amount == 0) revert TokenDivider__AmountCantBeZero();
        // q what if the nft does not have any name or symbol?
        HBAR erc20Contract = new HBAR(
            string(abi.encodePacked(ERC721(nftAddress).name(), "Fraccion")),
            string(abi.encodePacked("F", ERC721(nftAddress).symbol()))
        );
        // q why is this minting the mount of erc20 token to this contract instead of the user?
        erc20Contract.mint(address(this), amount);
        address erc20 = address(erc20Contract);

        IERC721(nftAddress).safeTransferFrom(msg.sender, address(this), tokenId, "");

        if (IERC721(nftAddress).ownerOf(tokenId) == msg.sender) revert TokenDivider__NftTransferFailed(); // e looks fine
        // @audit-# state variables are updated after making the call
        balances[msg.sender][erc20] = amount;
        nftToErc20Info[nftAddress] = ERC20Info({erc20Address: erc20, tokenId: tokenId});
        erc20ToMintedAmount[erc20] = amount;
        erc20ToNft[erc20] = nftAddress;

        emit NftDivided(nftAddress, amount, erc20);
        // @audit-medium use safe erc20 instead of noraml erc20 token transfer
        bool transferSuccess = IERC20(erc20).transfer(msg.sender, amount);
        if (!transferSuccess) {
            revert TokenDivider__TransferFailed();
        }
    }
    // e looks fine for now.

    /**
     *
     * @param nftAddress  The address of the nft to claim
     *
     * @dev in this function, if you have all the erc20 minted for the nft, you can call this function to claim the nft,
     * giving to the contract all the erc20 and it will give you back the nft
     */
    function claimNft(address nftAddress) external {
        if (nftAddress == address(0)) {
            revert TokenDivider__NftAddressIsZero();
        }
        // @audit-info/gas use memory instead of storage
        ERC20Info storage tokenInfo = nftToErc20Info[nftAddress];

        if (balances[msg.sender][tokenInfo.erc20Address] < erc20ToMintedAmount[tokenInfo.erc20Address]) {
            revert TokenDivider__NotEnoughErc20Balance();
        }

        // q what if the contract has no allowence to burn the tokens?
        HBAR(tokenInfo.erc20Address).burnFrom(msg.sender, erc20ToMintedAmount[tokenInfo.erc20Address]);
        // @audit-medium does not follow CEI
        balances[msg.sender][tokenInfo.erc20Address] = 0;
        erc20ToMintedAmount[tokenInfo.erc20Address] = 0;

        emit NftClaimed(nftAddress);

        IERC721(nftAddress).safeTransferFrom(address(this), msg.sender, tokenInfo.tokenId);
    }

    /**
     *
     * @param nftAddress The nft address pegged to the erc20
     * @param to The reciver of the erc20
     * @param amount The amount of erc20 to transfer
     *
     * @dev you can use this function to transfer nft franctions 100% securily and registered by te contract
     */

    // q can anyone call this function?
    function transferErcTokens(address nftAddress, address to, uint256 amount) external {
        if (nftAddress == address(0)) {
            revert TokenDivider__NftAddressIsZero();
        }

        if (to == address(0)) {
            revert TokenDivider__CantTransferToAddressZero();
        }

        if (amount == 0) {
            revert TokenDivider__AmountCantBeZero();
        }

        ERC20Info memory tokenInfo = nftToErc20Info[nftAddress];
        // @audit-info more than one checks forreciving address
        if (to == address(0)) {
            revert TokenDivider__CantTransferToAddressZero();
        }
        if (balances[msg.sender][tokenInfo.erc20Address] < amount) {
            revert TokenDivider__NotEnoughErc20Balance();
        }
        // q integer overflow underflow can be happened?
        balances[msg.sender][tokenInfo.erc20Address] -= amount;
        balances[to][tokenInfo.erc20Address] += amount;

        emit TokensTransfered(amount, tokenInfo.erc20Address);
        // @audit-info return value is ignored
        IERC20(tokenInfo.erc20Address).transferFrom(msg.sender, to, amount);
    }

    /**
     *
     * @param nftPegged The nft address pegged to the tokens to sell
     * @param price The price of all the tokens to sell
     * @param amount  The amount of tokens to sell
     *
     * @dev this function creates a new order, is like publish you assets into a marketplace, where other persons can buy it.
     * firstly, once you call this function, the amount of tokens that you passed into as a parameter, get blocked,  by sending it
     * to this contract, then a new order is created and published.
     */
    function sellErc20(address nftPegged, uint256 price, uint256 amount) external {
        if (nftPegged == address(0)) {
            revert TokenDivider__NftAddressIsZero();
        }

        if (amount == 0) {
            revert TokenDivider__AmountCantBeZero();
        }

        ERC20Info memory tokenInfo = nftToErc20Info[nftPegged];
        if (balances[msg.sender][tokenInfo.erc20Address] < amount) {
            revert TokenDivider__InsuficientBalance();
        }

        balances[msg.sender][tokenInfo.erc20Address] -= amount;

        s_userToSellOrders[msg.sender].push(
            SellOrder({seller: msg.sender, erc20Address: tokenInfo.erc20Address, price: price, amount: amount})
        );

        emit OrderPublished(amount, msg.sender, nftPegged);

        IERC20(tokenInfo.erc20Address).transferFrom(msg.sender, address(this), amount);
    }
    // e looks great

    /**
     *
     * @param orderIndex The index of the order in all the orders array of the seller (the seller can have multiple orders active)
     * @param seller The person who is selling this tokens
     *
     * @dev when the buyer call this function, the eth or any token accepted to pay, is sent to the seller
     * if the transfer executed correctly, then this contract, wich has all the tokens, send the tokens to the msg.sender
     */
    //q what if user send more money than the price of the order?
    function buyOrder(uint256 orderIndex, address seller) external payable {
        if (seller == address(0)) {
            revert TokenDivider__InvalidSeller();
        }

        SellOrder memory order = s_userToSellOrders[seller][orderIndex];

        if (msg.value < order.price) {
            revert TokenDivider__IncorrectEtherAmount();
        }

        uint256 fee = order.price / 100; // 1 => 100/100
        uint256 sellerFee = fee / 2; //0.5 => 1/2

        // @audit-high why buyer is intended to pay seller fees?
        if (msg.value < order.price + sellerFee) {
            //100.5
            revert TokenDivider__InsuficientEtherForFees();
        }

        balances[msg.sender][order.erc20Address] += order.amount;

        s_userToSellOrders[seller][orderIndex] = s_userToSellOrders[seller][s_userToSellOrders[seller].length - 1];
        s_userToSellOrders[seller].pop();
        //seller -> 0[100] 1[100] 2[200] 3[150]
        // buyer -> index 1.
        //0[100] 1[150] 2[200]

        emit OrderSelled(msg.sender, order.price);

        // Transfer The Ether

        (bool success,) = payable(order.seller).call{value: (order.price - sellerFee)}("");

        if (!success) {
            revert TokenDivider__TransferFailed();
        }

        (bool taxSuccess,) = payable(owner()).call{value: fee}("");

        if (!taxSuccess) {
            revert TokenDivider__TransferFailed();
        }

        IERC20(order.erc20Address).transfer(msg.sender, order.amount);
    }

    /**
     * Getters
     */
    function getBalanceOf(address user, address token) public view returns (uint256) {
        return balances[user][token];
    }

    function getErc20TotalMintedAmount(address erc20) public view returns (uint256) {
        return erc20ToMintedAmount[erc20];
    }

    function getErc20InfoFromNft(address nft) public view returns (ERC20Info memory) {
        return nftToErc20Info[nft];
    }

    function getOrderPrice(address seller, uint256 index) public view returns (uint256 price) {
        price = s_userToSellOrders[seller][index].price;
    }
}
