// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import {Payroll} from "../src/Payroll.sol";

contract DeployPayroll is Script {
    function run() external {
        vm.startBroadcast(); 
        new Payroll();
        vm.stopBroadcast();
    }
}