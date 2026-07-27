// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";

interface ITimelockController {
    function schedule(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt,
        uint256 delay
    ) external;
    function getMinDelay() external view returns (uint256);
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
}

/**
 * @title  ScheduleSetOracle
 * @notice Schedules a TimelockController proposal to call VaultEngine.setOracle()
 *         pointing to the newly deployed ChainlinkPriceOracle v1.5.
 *         The proposal can be executed after the 24-hour minimum delay elapses.
 *
 * Usage:
 *   forge script contracts/script/ScheduleSetOracle.s.sol \
 *     --rpc-url $RPC_URL \
 *     --private-key "0x$DEPLOYER_PRIVATE_KEY" \
 *     --legacy --skip-simulation --broadcast
 */
contract ScheduleSetOracle is Script {

    address constant TIMELOCK     = 0x652E73c97C679DFA4e1efC35b42a068F35131Ab8;
    address constant VAULT_ENGINE = 0xdb994C19707b2fe456c9c2AF8C9be0875eF55415;
    address constant NEW_ORACLE   = 0x77454cB888A7d5294D27C3788c29D758589D1D94;

    bytes32 constant PREDECESSOR = bytes32(0);
    bytes32 constant SALT        = keccak256("usdax.set-oracle.v1.5");

    function run() external {
        ITimelockController tl = ITimelockController(TIMELOCK);
        uint256 delay = tl.getMinDelay();

        bytes memory data = abi.encodeWithSelector(
            IVaultEngine.setOracle.selector,
            NEW_ORACLE
        );

        bytes32 opId = tl.hashOperation(VAULT_ENGINE, 0, data, PREDECESSOR, SALT);

        vm.startBroadcast();
        tl.schedule(VAULT_ENGINE, 0, data, PREDECESSOR, SALT, delay);
        vm.stopBroadcast();

        console.log("=== TIMELOCK PROPOSAL SCHEDULED ===");
        console.log("Operation ID :", vm.toString(opId));
        console.log("Target       :", VAULT_ENGINE);
        console.log("New oracle   :", NEW_ORACLE);
        console.log("Delay (sec)  :", delay);
        console.log("Executable at: block.timestamp +", delay, "seconds (~24h)");
        console.log("");
        console.log("To execute after 24h, run: ScheduleSetOracle:execute");
    }
}
