// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";
import {TokenDivider} from "src/NFTDivider.sol";

contract DeployTokenDivider is Script {
    function run() external returns (TokenDivider) {
        vm.startBroadcast();
        TokenDivider tokenDivider = new TokenDivider();
        vm.stopBroadcast();

        return tokenDivider;
    }
}
