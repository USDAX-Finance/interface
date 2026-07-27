// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title  USDAxToken
/// @author USDAX Finance
/// @notice The USDAX stablecoin — an ERC-20 with EIP-2612 permit support.
///
///         Only the designated VaultEngine may mint or burn tokens. This restriction
///         is enforced by the `onlyVaultEngine` modifier and the `vaultEngine` state
///         variable, which is set once at initialisation (via setVaultEngine) or updated
///         for engine upgrades (via updateVaultEngine).
///
/// @dev    Mint/burn access control flow
///         ──────────────────────────────
///         1. Deploy USDAxToken(owner).
///         2. Deploy VaultEngine(..., address(this), ...).
///         3. Call updateVaultEngine(address(vaultEngine)) — authorises the engine.
///
///         For engine upgrades (e.g. new oracle integration):
///         1. Deploy new VaultEngine.
///         2. Call updateVaultEngine(address(newEngine)).
///            The old engine immediately loses mint/burn rights.
contract USDAxToken is ERC20, ERC20Permit, Ownable {

    /// @notice Address of the VaultEngine authorised to mint and burn USDAX.
    ///         Zero address means no engine is set yet (tokens cannot be minted).
    address public vaultEngine;

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @notice Emitted on the first-time, one-way vault engine assignment.
    /// @dev    Deprecated in favour of VaultEngineUpdated — retained for ABI compatibility.
    /// @param engine The vault engine address that was set.
    event VaultEngineSet(address indexed engine);

    /// @notice Emitted whenever the vault engine is updated (including the initial assignment
    ///         when called via updateVaultEngine). Captures both old and new addresses for
    ///         on-chain audit trail.
    /// @param oldEngine Previous vault engine (address(0) on first update).
    /// @param newEngine Replacement vault engine.
    event VaultEngineUpdated(address indexed oldEngine, address indexed newEngine);

    // ─── Modifier ─────────────────────────────────────────────────────────────

    /// @dev Reverts if msg.sender is not the authorised vault engine.
    modifier onlyVaultEngine() {
        require(msg.sender == vaultEngine, "USDax: not vault engine");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    /// @notice Deploy the USDAX token. No engine is set at construction — call
    ///         updateVaultEngine() after deploying the VaultEngine contract.
    /// @param owner_ Initial contract owner (Ownable). Typically the deployer or a multisig.
    constructor(address owner_)
        ERC20("USDAX Stablecoin", "USDAX")
        ERC20Permit("USDAX Stablecoin")
        Ownable(owner_)
    {}

    // ─── Admin ────────────────────────────────────────────────────────────────

    /// @notice One-time setter: assign the vault engine on a freshly deployed token.
    ///         Reverts if a vault engine has already been set (use updateVaultEngine for upgrades).
    ///         Only callable by the contract owner.
    /// @param engine Address of the VaultEngine to authorise. Must be non-zero.
    function setVaultEngine(address engine) external onlyOwner {
        require(engine != address(0), "zero address");
        require(vaultEngine == address(0), "engine already set");
        vaultEngine = engine;
        emit VaultEngineSet(engine);
    }

    /// @notice Migrate to a new VaultEngine (owner only — for oracle or protocol upgrades).
    ///         The old engine loses mint/burn rights immediately upon this call.
    ///         Emits VaultEngineUpdated with the old and new addresses.
    ///         Only callable by the contract owner (or timelock on production).
    /// @param newEngine Address of the replacement VaultEngine. Must be non-zero and different
    ///                  from the current engine.
    function updateVaultEngine(address newEngine) external onlyOwner {
        require(newEngine != address(0), "zero address");
        require(newEngine != vaultEngine, "same engine");
        address old = vaultEngine;
        vaultEngine = newEngine;
        emit VaultEngineUpdated(old, newEngine);
    }

    // ─── Mint / Burn (VaultEngine only) ──────────────────────────────────────

    /// @notice Mint USDAX to a recipient. Only callable by the authorised VaultEngine.
    ///         Called when a user mints USDAX against collateral or when stability fees accrue.
    /// @param to     Recipient address.
    /// @param amount USDAX amount to mint (18 decimals).
    function mint(address to, uint256 amount) external onlyVaultEngine {
        _mint(to, amount);
    }

    /// @notice Burn USDAX from a holder. Only callable by the authorised VaultEngine.
    ///         Called when a user repays debt or a liquidator closes a position.
    /// @param from   Address whose USDAX balance is reduced. Must have sufficient balance.
    /// @param amount USDAX amount to burn (18 decimals).
    function burn(address from, uint256 amount) external onlyVaultEngine {
        _burn(from, amount);
    }
}
