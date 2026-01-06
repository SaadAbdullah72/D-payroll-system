// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Inko aise likhen (Named Imports)
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title Professional Payroll System
 * @dev Isme Pull Pattern use kiya gaya hai taake gas limit ka issue na aaye.
 */
contract Payroll is Ownable, ReentrancyGuard {
    using Address for address payable;

    struct Employee {
        string name;
        uint256 salary;      // Amount in Wei
        uint256 lastPaid;    // Last payout timestamp
        bool isActive;       // Employment status
        bool exists;         // To check if employee is in system
    }

    uint256 public constant PAY_INTERVAL = 30 days;
    mapping(address => Employee) public employees;
    address[] public employeeList; // For frontend iteration

    // Events (Testing aur Frontend ke liye zaroori hain)
    event EmployeeAdded(address indexed wallet, uint256 salary);
    event EmployeeRemoved(address indexed wallet);
    event SalaryClaimed(address indexed wallet, uint256 amount);
    event FundsDeposited(address indexed sender, uint256 amount);

    constructor() Ownable(msg.sender) {}

    // 1. Admin Function: Employee Add karna
    function addEmployee(address _wallet, string memory _name, uint256 _salary) external onlyOwner {
    require(_wallet != address(0), "Invalid address");
    require(!employees[_wallet].exists, "Already exists");
    require(_salary > 0, "Salary must be > 0");

    employees[_wallet] = Employee({
        name: _name,           // Name save ho raha hai
        salary: _salary,
        lastPaid: block.timestamp,
        isActive: true,
        exists: true
    });
    employeeList.push(_wallet);

    emit EmployeeAdded(_wallet, _salary);
}
    // 2. Admin Function: Salary Update karna
    function updateSalary(address _wallet, uint256 _newSalary) external onlyOwner {
        require(employees[_wallet].exists, "Not an employee");
        employees[_wallet].salary = _newSalary;
    }

    // 3. Admin Function: Employee Remove karna
    function removeEmployee(address _wallet) external onlyOwner {
        require(employees[_wallet].exists, "Not an employee");
        employees[_wallet].isActive = false;
        emit EmployeeRemoved(_wallet);
    }

    // 4. Public Function: Contract mein paise jama karna
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }

    // 5. Employee Function: Apni salary claim karna (The Pull Pattern)
    function claimSalary() external nonReentrant {
        Employee storage emp = employees[msg.sender];
        
        require(emp.exists && emp.isActive, "Not an active employee");
        require(block.timestamp >= emp.lastPaid + PAY_INTERVAL, "Too early to claim");
        
        uint256 contractBalance = address(this).balance;
        require(contractBalance >= emp.salary, "Contract has insufficient funds");

        // Update state before transfer (Security: Checks-Effects-Interactions pattern)
        emp.lastPaid = block.timestamp;
        
        // Transfer funds
        payable(msg.sender).sendValue(emp.salary);

        emit SalaryClaimed(msg.sender, emp.salary);
    }

    // View Functions for Frontend
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getEmployeeCount() external view returns (uint256) {
        return employeeList.length;
    }
}