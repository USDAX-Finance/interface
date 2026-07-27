// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";

interface ITimelockController {
    function execute(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external;
    function isOperationReady(bytes32 id) external view returns (bool);
    function hashOperation(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external pure returns (bytes32);
}

interface IVaultEngine {
    function setOracle(address oracle) external;
    function oracle() external view returns (address);
}

/**
 * @title  ExecuteSetOracle
 * @notice Executes the previously scheduled TimelockController proposal that wires
 *         ChainlinkPriceOracle v1.5 into VaultEngine. Must be run >= 24h after
 *         ScheduleSetOracle was broadcast.
 *
 * Usage:
 *   forge script contracts/script/ExecuteSetOracle.s.sol \
 *     --rpc-url $RPC_URL \
 *     --private-key "0x$DEPLOYER_PRIVATE_KEY" \
 *     --legacy --skip-simulation --broadcast
 */
contract ExecuteSetOracle is Script {

    address constant TIMELOCK     = 0x652E73c97C679DFA4e1efC35b42a068F35131Ab8;
    address constant VAULT_ENGINE = 0xdb994C19707b2fe456c9c2AF8C9be0875eF55415;
    address constant NEW_ORACLE   = 0x77454cB888A7d5294D27C3788c29D758589D1D94;

    bytes32 constant PREDECESSOR = bytes32(0);
    bytes32 constant SALT        = keccak256("usdax.set-oracle.v1.5");

    function run() external {
        ITimelockController tl = ITimelockController(TIMELOCK);

        bytes memory data = abi.encodeWithSelector(
            IVaultEngine.setOracle.selector,
            NEW_ORACLE
        );

        bytes32 opId = tl.hashOperation(VAULT_ENGINE, 0, data, PREDECESSOR, SALT);
        require(tl.isOperationReady(opId), "Timelock: delay not elapsed yet");

        vm.startBroadcast();
        tl.execute(VAULT_ENGINE, 0, data, PREDECESSOR, SALT);
        vm.stopBroadcast();

        address live = IVaultEngine(VAULT_ENGINE).oracle();
        require(live == NEW_ORACLE, "setOracle did not take effect");

        console.log("=== ORACLE SWITCH COMPLETE ===");
        console.log("VaultEngine.oracle() =", live);
    }
}
