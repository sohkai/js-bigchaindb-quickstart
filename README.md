# JavaScript quickstart for BigchainDB

> :bangbang: High chance of :fire: and :rage: ahead if you expect this to be production-ready.

> :bangbang: **ONLY** (and I mean **_only_**) supports BigchainDB Server 0.9

Some naive helpers to get you on your way to making some transactions :boom:, if you'd like to use
[BigchainDB](https://github.com/bigchaindb/bigchaindb) with JavaScript.

Aimed to support usage in browsers or node; if it doesn't, well, I don't know what to say except
it's probably you :smirk:. Use at your own risk :rocket:. At least I can tell you it's ES∞+, so
you'll probably need a babel here and a bundler there (or use [one of the built versions](./dist)),
of which I expect you'll know quite well ([otherwise, go check out js-reactor :wink:](https://github.com/bigchaindb/js-reactor)).

## Getting started

Srs, just read through [index.js](./index.js) and see if you can make any sense of it.

The expected flow for making transactions:

1. Go get yourself some keypairs! Just make a `new Keypair()` (or a whole bunch of them, nobody's
   counting :sunglasses:).
1. Go get yourself a condition! `makeEd25519Condition()` should do the trick :sparkles:.
1. Go wrap that condition as an output (don't worry about the *why*)! `makeOutput()` no sweat
   :muscle:.
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

1. Go get some more outputs (wrapping conditions), maybe based on some new made-up friends (i.e.
   keypairs).
1. Go make a transfer transaction, using the transaction you want to *spend* (i.e. you can fulfill)
   in `makeTransferTransaction()` :v:. *If you're not sure what any of this means (and you're as
   confused as I think you are right now), you might wanna go check out [this](https://docs.bigchaindb.com/projects/server/en/latest/data-models/crypto-conditions.html)
   and [this](https://docs.bigchaindb.com/projects/py-driver/en/latest/usage.html#asset-transfer)
   and [this](https://tools.ietf.org/html/draft-thomas-crypto-conditions-01) first.*
1. Sign that transaction with `signTransaction()`!
1. `POST` to the server, and watch the :dollar:s drop, man.

## Needs for speeds

This implementation plays "safe" by using JS-native (or downgradable) libraries for its
crypto-related functions to keep compatabilities with the browser. If that makes you :unamused: and
you'd rather go :godmode: with some :zap: :zap:, you can try using some of these to go as fast as a
:speedboat: --:surfing_man: :

* [chloride](https://github.com/dominictarr/chloride), or its underlying [sodium](https://github.com/paixaop/node-sodium)
  library
* [node-sha3](https://github.com/phusion/node-sha3) -- **MAKE SURE** to use [steakknife's fork](https://github.com/steakknife/node-sha3)
  if [the FIPS 202 upgrade](https://github.com/phusion/node-sha3/pull/25) hasn't been merged
  (otherwise, you'll run into all kinds of hashing problems)

## :rotating_light: WARNING WARNING WARNING :rotating_light:

> Crypto-conditions

Make sure you keep using a crypto-conditions implementation that implements the older v1 draft (e.g.
[`five-bells-condition@v3.3.1`](https://github.com/interledgerjs/five-bells-condition/releases/tag/v3.3.1)).
BigchainDB Server 0.9 does not implement the newer version of the spec and **WILL** fail if you to
use a newer implementation of crypto-conditions.

> SHA3

Make sure to use a SHA3 implementation that has been upgraded as per [FIPS 202](http://csrc.nist.gov/publications/drafts/fips-202/fips_202_draft.pdf).
Otherwise, the hashes you generate **WILL** be invalid in the eyes of the BigchainDB Server.
