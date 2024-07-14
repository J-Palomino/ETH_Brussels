// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Agent} from "../src/Agent.sol";

contract AgentScript is Script {
 

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        Agent agent = new Agent(0x68EC9556830AD097D661Df2557FBCeC166a0A075, "you are a helpful assistant that describes what you see in the photo without commenting on the quality of the photo");

        vm.stopBroadcast();
        console.log(address(agent));
    }
}
