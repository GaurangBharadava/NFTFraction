// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// e looks fine
contract HBAR is ERC20, ERC20Burnable {
    // @audit-low names passed in constructor is shadowed
    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {}

    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }
}
