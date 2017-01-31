# JavaScript quickstart for BigchainDB

> :bangbang: High chance of :fire: and :rage: ahead if you expect this to be production-ready

Some naive helpers to get you on your way to making some transactions :boom:, if you'd like to use
JS with [BigchainDB](https://github.com/bigchaindb/bigchaindb).

Aimed to support usage in browsers or node, but like every piece of :poop:, it might not. Use at
your own risk :rocket:. At least I can tell you it's ES6, so you'll probably need a babel here and a
bundler there, of which I expect you'll know quite well ([otherwise, go check out js-reactor :wink:](https://github.com/bigchaindb/js-reactor)).

## Getting started

Srs, just read through [index.js](./index.js) and see if you can make any sense of it.

The expected flow for making transactions:

1. Go get yourself some keypairs! Just make a `new Keypair()` (or a whole bunch of them, nobody's
   counting :sunglasses:).
1. Go get yourself a condition! `makeEd25519Condition()` should do the trick :sparkles:.
1. Go get a fulfillment (don't worry about the *why*)! `makeEd25519Fulfillment()` no sweat :muscle:.
1. (**Optional**) You've got everyting you need, except for an asset. Maybe define one (any
   JSON-serializable object will do).
1. Time to get on the rocket ship, baby. `makeCreateTransaction()` your way to lifelong glory and
   fame :clap:!
1. Ok, now you've got a transaction, but we need you to *sign* (`signTransaction()`) it cause, you
   know... cryptography and `¯\_(ツ)_/¯`.
1. Alright, sick dude, you've *finally* got everything you need to `POST` to a server. Phew
   :sweat_drops:. Go `fetch()` your way to business, start:point_up:life4evar!

...

Alright, alright, so you've made a couple transactions. Now what? Do I hear you saying
"<sub>Transfer them??</sub>" No problem, brotha, I gotcha covered :neckbeard:.

1. Go get some more conditions and fulfillments, making sure you create fulfillments to *fulfill* a
   previous transaction's condition (maybe you wanna go check out [this](https://docs.bigchaindb.com/projects/server/en/latest/data-models/crypto-conditions.html)
   and [this](https://docs.bigchaindb.com/projects/py-driver/en/latest/usage.html#asset-transfer)
   and [this](https://tools.ietf.org/html/draft-thomas-crypto-conditions-01) if you're as confused
   as I think you are).
1. Go make a transfer transaction, using the transaction you want to *spend* in
   `makeTransferTransaction()` :v:.
1. Sign that transaction with `signTransaction()`!
1. `POST` to the server, and watch the :dollar:s drop, man.

## Needs for speeds

This implementation plays "safe" by using JS-native (or downgradable) libraries for its
crypto-related functions to keep compatabilities with the browser. If that makes you :unamused: and
you'd rather go :godmode: with some :zap: :zap:, you can try using some of these to go as fast as a
:speedboat::

* [chloride](https://github.com/dominictarr/chloride), or its underlying [sodium](https://github.com/paixaop/node-sodium)
  library
* [node-sha3](https://github.com/phusion/node-sha3) -- **MAKE SURE** to use [steakknife's fork](https://github.com/steakknife/node-sha3)
  if [the FIPS 202 upgrade](https://github.com/phusion/node-sha3/pull/25) hasn't been merged
  (otherwise, you'll run into all kinds of hashing problems)
