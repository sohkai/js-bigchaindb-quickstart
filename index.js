import { Buffer } from 'buffer';
import crypto from 'crypto';

import base58 from 'bs58';
import clone from 'clone';
import cc from 'five-bells-condition';
import nacl from 'tweetnacl';
import stableStringify from 'json-stable-stringify';
import uuid from 'uuid';

/**
 * @class Keypair Ed25519 keypair in base58 (as BigchainDB expects base58 keys)
 * @type {Object}
 * @property {string} publicKey
 * @property {string} privateKey
 */
export function Keypair() {
    const keyPair = nacl.sign.keyPair();
    this.publicKey = base58.encode(keyPair.publicKey);
    this.privateKey = base58.encode(keyPair.secretKey);
}

/**
 * Create an Ed25519 Cryptocondition from an Ed25519 public key to put into a transaction
 * @param {string} publicKey base58 encoded Ed25519 public key for the new "owner"
 * @returns {object} Ed25519 Condition in a format compatible with BigchainDB
 *                   Note: Assumes that 'cid' will be adjusted afterwards.
 */
export function makeEd25519Condition(publicKey) {
    const publicKeyBuffer = new Buffer(base58.decode(publicKey));

    const ed25519Fulfillment = new cc.Ed25519();
    ed25519Fulfillment.setPublicKey(publicKeyBuffer);
    const conditionUri = ed25519Fulfillment.getConditionUri();

    return {
        'amount': 1,
        'condition': {
            'cid': 0, // Will be adjusted after adding the condition to the transaction
            'owners_after': [publicKey],
            'uri': conditionUri,
            'details': {
                'signature': null,
                'type_id': 4,
                'type': 'fulfillment',
                'bitmask': 32,
                'public_key': publicKey,
            },
        },
    };
}

/**
 * Create an "empty" Ed25519 fulfillment from a ED25519 public key to put into a transaction.
 * This "mock" step is necessary in order for a transaction to be completely out so it can later
 * be serialized and signed.
 * @param {string} publicKey base58 encoded Ed25519 public key for the previous "owner"
 * @returns {object} Ed25519 Condition in a format compatible with BigchainDB
 *                   Note: Assumes that 'cid' will be adjusted afterwards.
 */
export function makeEd25519Fulfillment(publicKey) {
    return {
        'owners_before': [publicKey],
        'fid': 0, // Will be adjusted after adding the fulfillment to the transaction
        'input': null, // Will be filled out after adding the fulfillment to the transaction
        'fulfillment': null, // Will be generated during signing
    };
}

/**
 * Generate a `CREATE` transaction holding the `assetData`, `metaData`, `conditions`, and
 * `fulfillments`.
 * @param {object} assetData Asset's `data` property
 * @param {object=} metaData Metadata's `data` property
 * @param {object[]=} conditions Array of condition objectss to add to the transaction.
 *                               Think of these as the new "owners" of the asset after the transaction.
 *                               For `CREATE` transactions, this should usually just be an Ed25519
 *                               Condition generated from the creator's public key.
 * @param {object[]=} fulfillments Array of fulfillment objects to add to the transaction
 *                                 Think of these as proofs that you can manipulate the asset.
 *                                 For `CREATE` transactions, this should usually just be an
 *                                 Ed25519 Fulfillment generated from the creator's public key.
 * @returns {object} Unsigned transaction -- make sure to call signTransaction() on it before
 *                   sending it off!
 */
export function makeCreateTransaction(assetData, metadata, conditions, fulfillments) {
    const asset = {
        'id': uuid.v4(),
        'data': assetData || null,
        'divisible': false,
        'updatable': false,
        'refillable': false,
    };

    return makeTransaction('CREATE', asset, metadata, conditions, fulfillments);
}

/**
 * Generate a `TRANSFER` transaction holding the `assetData`, `metaData`, `conditions`, and
 * `fulfillments`.
 * @param {object} unspentTransaction Transaction you have control over (i.e. can fulfill its
 *                                    Condition).
 * @param {object=} metaData Metadata's `data` property
 * @param {object[]=} conditions Array of condition objects to add to the transaction
 *                               Think of these as the new "owners" of the asset after the transaction.
 *                               For `TRANSFER` transactions, this should usually just be an
 *                               Ed25519 Condition generated from the new owner's public key.
 * @param {object[]=} fulfillments Array of fulfillment objects to add to the transaction
 *                                 Think of these as proofs that you can manipulate the asset.
 *                                 For `TRANSFER` transactions, this should usually just be an
 *                                 Ed25519 Fulfillment generated from the creator's public key.
 * @returns {object} Unsigned transaction -- make sure to call signTransaction() on it before
 *                   sending it off!
 */
export function makeTransferTransaction(unspentTransaction, metadata, conditions, fulfillments) {
    // Add transactionLinks to link fulfillments with previous transaction's conditions
    // NOTE: Naively assumes that fulfillments are given in the same order as the conditions they're
    //       meant to fulfill
    fulfillments.forEach((fulfillment, index) => {
        fulfillment.input = {
            'cid': index,
            'txid': unspentTransaction.id,
        };
    });

    const assetLink = { 'id': unspentTransaction.transaction.asset.id };

    return makeTransaction('TRANSFER', assetLink, metadata, conditions, fulfillments);
}

/**
 * Sign a transaction with the given `privateKey`s.
 * @param {object} transaction Transaction to sign
 * @param {...string} privateKeys base58 Ed25519 private keys.
 *                                Looped through once to iteratively sign any Fulfillments found in
 *                                the `transaction`.
 * @returns {object} The original transaction, signed in-place.
 */
export function signTransaction(transaction, ...privateKeys) {
    transaction.transaction.fulfillments.forEach((fulfillment, index) => {
        const privateKey = privateKeys[index];
        const privateKeyBuffer = new Buffer(base58.decode(privateKey));
        const seriailizedTransaction = serializeTransactionWithoutFulfillments(transaction);

        const ed25519Fulfillment = new cc.Ed25519();
        ed25519Fulfillment.sign(new Buffer(seriailizedTransaction), privateKeyBuffer);
        const fulfillmentUri = ed25519Fulfillment.serializeUri();

        fulfillment.fulfillment = fulfillmentUri;
    });

    return transaction;
}

/*********************
 * Transaction utils *
 *********************/

function makeTransactionTemplate() {
    return {
        'id': null,
        'version': 1,
        'transaction': {
            'operation': null,
            'conditions': [],
            'fulfillments': [],
            'metadata': null,
            'asset': null,
        },
    };
}

function makeTransaction(operation, asset, metadata, conditions = [], fulfillments = []) {
    const tx = makeTransactionTemplate();
    tx.operation = operation;
    tx.transaction.asset = asset;

    if (metadata) {
        tx.transaction.metadata = {
            'id': uuid.v4(),
            'data': metadata,
        };
    }

    tx.transaction.conditions.push(...conditions);
    tx.transaction.conditions.forEach((condition, index) => {
        condition.cid = index;
    });

    tx.transaction.fulfillments.push(...fulfillments);
    tx.transaction.fulfillments.forEach((fulfillment, index) => {
        fulfillment.fid = index;
    });

    tx.id = hashTransaction(tx);
    return tx;
}

/****************
 * Crypto utils *
 ****************/

function hashTransaction(transaction) {
    return sha256Hash(serializeTransactionWithoutFulfillments(transaction));
}

function sha256Hash(data) {
    return crypto
        .createHash('sha256')
        .update(data)
        .digest('hex');
}

function serializeTransactionWithoutFulfillments(transaction) {
    // BigchainDB creates transactions IDs and signs fulfillments by serializing transactions
    // into a "canonical" format where the transaction id and each fulfillment URI are ignored and
    // the remaining keys are sorted
    const tx = clone(transaction);
    delete tx.id;
    tx.transaction.fulfillments.forEach((fulfillment) => {
        fulfillment.fulfillment = null;
    });

    // Sort the keys
    return stableStringify(tx, (a, b) => (a.key > b.key ? 1 : -1));
}
