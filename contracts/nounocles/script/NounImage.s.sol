// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "forge-std/Script.sol";
import "../src/NounImage.sol";

contract DeployNounImage is Script {
    function run() external {
        // Replace with the address of the oracle contract
        address oracleAddress = 0x68EC9556830AD097D661Df2557FBCeC166a0A075;

        vm.startBroadcast();

        NounImage nounImage = new NounImage(oracleAddress);

        vm.stopBroadcast();
         // Optionally, log the deployed contract address
        console.log("Nounocles deployed to:", address(nounImage));
    }
}