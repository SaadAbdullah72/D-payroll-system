// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import {Payroll} from "../src/Payroll.sol";

contract PayrollTest is Test {
    Payroll public payroll;
    address admin = address(1);
    address emp1 = address(2);
    uint256 constant SALARY = 1 ether;

    function setUp() public {
        vm.prank(admin);
        payroll = new Payroll();
        
        // Contract mein kuch paise bhej dete hain testing ke liye
        vm.deal(address(payroll), 10 ether); 
    }

    function test_CannotClaimEarly() public {
        vm.prank(admin);
        payroll.addEmployee(emp1, SALARY);

        // Foran claim karne ki koshish (Fail honi chahiye)
        vm.prank(emp1);
        vm.expectRevert("Too early to claim");
        payroll.claimSalary();
    }

    function test_CanClaimAfterOneMonth() public {
        vm.prank(admin);
        payroll.addEmployee(emp1, SALARY);

        // Time ko 31 din aage barha dete hain (Foundry Magic)
        vm.warp(block.timestamp + 31 days);

        uint256 initialBalance = emp1.balance;

        vm.prank(emp1);
        payroll.claimSalary();

        assertEq(emp1.balance, initialBalance + SALARY);
    }
}