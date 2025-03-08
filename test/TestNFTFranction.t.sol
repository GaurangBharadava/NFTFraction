// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Test, console} from "forge-std/Test.sol";
import {DeployTokenDivider} from "../script/DeployNFTFraction.s.sol";
import {TokenDivider} from "src/NFTDivider.sol";
import {ERC721Mock} from "./mocks/ERC721Mock.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TokenDiverTest is Test {
    DeployTokenDivider deployer;
    TokenDivider tokenDivider;
    ERC721Mock erc721Mock;

    address public USER = makeAddr("user");
    address public USER2 = makeAddr("user2");
    uint256 public constant STARTING_USER_BALANCE = 10e18;
    uint256 public constant AMOUNT = 2e18;
    uint256 public constant TOKEN_ID = 0;

    function setUp() public {
        deployer = new DeployTokenDivider();
        tokenDivider = deployer.run();

        erc721Mock = new ERC721Mock();

        erc721Mock.mint(USER);
        vm.deal(USER2, STARTING_USER_BALANCE);
    }

    function testDivideNft() public {
        vm.startPrank(USER);
        erc721Mock.approve(address(tokenDivider), TOKEN_ID);

        tokenDivider.divideNft(address(erc721Mock), TOKEN_ID, AMOUNT);
        vm.stopPrank();
        ERC20Mock erc20Mock = ERC20Mock(tokenDivider.getErc20InfoFromNft(address(erc721Mock)).erc20Address);

        console.log("ERC20 Token name is: ", erc20Mock.name());
        console.log("ERC20 Token symbol is: ", erc20Mock.symbol());
        assertEq(tokenDivider.getErc20TotalMintedAmount(address(erc20Mock)), AMOUNT);
        assertEq(erc721Mock.ownerOf(TOKEN_ID), address(tokenDivider));
        assertEq(tokenDivider.getBalanceOf(USER, address(erc20Mock)), AMOUNT);
    }

    modifier nftDivided() {
        vm.startPrank(USER);
        erc721Mock.approve(address(tokenDivider), TOKEN_ID);
        tokenDivider.divideNft(address(erc721Mock), TOKEN_ID, AMOUNT);
        vm.stopPrank();

        _;
    }

    function testDivideNftFailsIsSenderIsNotNftOwner() public {
        vm.prank(USER);
        erc721Mock.approve(address(tokenDivider), TOKEN_ID);

        vm.startPrank(USER2);
        vm.expectRevert(TokenDivider.TokenDivider__NotFromNftOwner.selector);
        tokenDivider.divideNft(address(erc721Mock), TOKEN_ID, AMOUNT);
        vm.stopPrank();
    }

    function testTransferErcTokensAndClaimNftFailsIfDontHaveAllTheErc20() public nftDivided {
        ERC20Mock erc20Mock = ERC20Mock(tokenDivider.getErc20InfoFromNft(address(erc721Mock)).erc20Address);
        vm.startPrank(USER);
        // Arrange

        erc20Mock.approve(address(tokenDivider), AMOUNT);

        // Act / Assert
        tokenDivider.transferErcTokens(address(erc721Mock), USER2, AMOUNT);

        assertEq(tokenDivider.getBalanceOf(USER2, address(erc20Mock)), AMOUNT);
        assertEq(tokenDivider.getBalanceOf(USER, address(erc20Mock)), 0);

        vm.expectRevert(TokenDivider.TokenDivider__NotEnoughErc20Balance.selector);

        tokenDivider.claimNft(address(erc721Mock));

        vm.stopPrank();
    }

    function testClaimNft() public nftDivided {
        ERC20Mock erc20Mock = ERC20Mock(tokenDivider.getErc20InfoFromNft(address(erc721Mock)).erc20Address);
        vm.startPrank(USER);
        erc20Mock.approve(address(tokenDivider), AMOUNT);
        tokenDivider.claimNft(address(erc721Mock));
        vm.stopPrank();

        assertEq(erc20Mock.totalSupply(), 0);
        assertEq(tokenDivider.getBalanceOf(USER, address(erc20Mock)), 0);
        assertEq(erc721Mock.ownerOf(TOKEN_ID), USER);
    }

    function testSellErc20() public nftDivided {
        ERC20Mock erc20Mock = ERC20Mock(tokenDivider.getErc20InfoFromNft(address(erc721Mock)).erc20Address);

        vm.startPrank(USER);
        erc20Mock.approve(address(tokenDivider), AMOUNT);
        tokenDivider.sellErc20(address(erc721Mock), 1e18, AMOUNT);
        vm.stopPrank();

        assertEq(tokenDivider.getBalanceOf(USER, address(erc20Mock)), 0);
        assertEq(erc20Mock.balanceOf(address(tokenDivider)), AMOUNT);
    }

    function testBuyErc20() public nftDivided {
        ERC20Mock erc20Mock = ERC20Mock(tokenDivider.getErc20InfoFromNft(address(erc721Mock)).erc20Address);

        uint256 ownerBalanceBefore = address(tokenDivider.owner()).balance;
        uint256 userBalanceBefore = address(USER).balance;
        uint256 user2TokenBalanceBefore = tokenDivider.getBalanceOf(USER2, address(erc20Mock));

        vm.startPrank(USER);

        erc20Mock.approve(address(tokenDivider), AMOUNT);

        tokenDivider.sellErc20(address(erc721Mock), AMOUNT, 1e18); // Creamos una orden de venta por 1 ETH

        uint256 fees = AMOUNT / 100;

        vm.stopPrank();

        vm.prank(USER2);
        tokenDivider.buyOrder{value: (3e18)}(0, USER);

        uint256 ownerBalanceAfter = address(tokenDivider.owner()).balance;
        uint256 userBalanceAfter = address(USER).balance;
        uint256 user2TokenBalanceAfter = tokenDivider.getBalanceOf(USER2, address(erc20Mock));

        assertEq(user2TokenBalanceAfter - 1e18, user2TokenBalanceBefore);
        assertEq(ownerBalanceAfter - fees, ownerBalanceBefore);

        if (block.chainid != 31337) {
            assertEq(userBalanceAfter - AMOUNT + fees / 2, userBalanceBefore);
        } else {
            assertEq(user2TokenBalanceAfter, 1e18);
        }
    }

    function testStorageConsumesMoreGas() public nftDivided {
        ERC20Mock erc20Mock = ERC20Mock(tokenDivider.getErc20InfoFromNft(address(erc721Mock)).erc20Address);
        vm.startPrank(USER);
        erc20Mock.approve(address(tokenDivider), AMOUNT);
        uint256 gasBefore = gasleft();
        console.log("Gas used before: ", gasBefore);
        tokenDivider.claimNft(address(erc721Mock));
        uint256 gasAfter = gasleft();
        console.log("Gas used after: ", gasAfter);
        vm.stopPrank();
        console.log("Gas used: ", gasBefore - gasAfter);
    }

    function testZeroAmountCanbeSell() public nftDivided {
        ERC20Mock erc20Mock = ERC20Mock(tokenDivider.getErc20InfoFromNft(address(erc721Mock)).erc20Address);

        vm.startPrank(USER);
        erc20Mock.approve(address(tokenDivider), AMOUNT);
        tokenDivider.sellErc20(address(erc721Mock), 0, AMOUNT);
        vm.stopPrank();

        console.log("Price of order: ", tokenDivider.getOrderPrice(USER, 0));

        address user1 = makeAddr("user1");
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        tokenDivider.buyOrder{value: 0}(0, USER);

        console.log("Balace of user1: ", tokenDivider.getBalanceOf(user1, address(erc20Mock)));
        console.log("Balace of USER: ", tokenDivider.getBalanceOf(USER, address(erc20Mock)));
    }

    function testUserPaysMoreThenPrice() public nftDivided {
        ERC20Mock erc20Mock = ERC20Mock(tokenDivider.getErc20InfoFromNft(address(erc721Mock)).erc20Address);

        vm.startPrank(USER);
        erc20Mock.approve(address(tokenDivider), AMOUNT);
        tokenDivider.sellErc20(address(erc721Mock), 200, AMOUNT);
        vm.stopPrank();

        address user1 = makeAddr("user1");
        vm.deal(user1, 300);
        vm.prank(user1);
        tokenDivider.buyOrder{value: 201}(0, USER);

        console.log("Balance of user1: ", user1.balance);
        console.log("Balance of USER: ", USER.balance);
        console.log("Balance of user1 Token: ", tokenDivider.getBalanceOf(user1, address(erc20Mock)));
    }

    function testBuyerForceToPayExtraMoney() public nftDivided {
        ERC20Mock erc20Mock = ERC20Mock(tokenDivider.getErc20InfoFromNft(address(erc721Mock)).erc20Address);

        vm.startPrank(USER);
        erc20Mock.approve(address(tokenDivider), AMOUNT);
        tokenDivider.sellErc20(address(erc721Mock), 200, AMOUNT);
        vm.stopPrank();

        address user1 = makeAddr("user1");
        vm.deal(user1, 200);
        vm.prank(user1);
        vm.expectRevert(TokenDivider.TokenDivider__InsuficientEtherForFees.selector);
        tokenDivider.buyOrder{value: 200}(0, USER);
    }
}
